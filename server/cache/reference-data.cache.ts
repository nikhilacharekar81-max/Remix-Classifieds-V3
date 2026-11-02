import { cache } from 'react';
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { categoryRepository } from '@/server/repositories/category.repository';
import { locationRepository } from '@/server/repositories/location.repository';
import { adminRepository } from '@/server/repositories/admin.repository';
import { db, withDbRetry } from '@/src/db/index';
import { cacheInvalidationOutbox } from '@/src/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import type { Category, LocationItem, SystemSettings } from '@/lib/types';

export const REFERENCE_CACHE_TAGS = {
  CATEGORIES: 'marketplace-categories',
  SUBCATEGORIES: 'marketplace-subcategories',
  NAVIGATION: 'marketplace-navigation',
  LOCATIONS: 'marketplace-locations',
  SETTINGS: 'marketplace-settings',
  LISTING_COUNTS: 'marketplace-live-counts',
} as const;

/**
 * Tracks tags whose last invalidation attempt failed so subsequent reads
 * bypass potentially stale Data Cache entries and attempt self-healing.
 */
const failedInvalidationTags = new Set<string>();

function tryHealInvalidationTag(tag: string): void {
  if (!failedInvalidationTags.has(tag)) return;
  try {
    revalidateTag(tag);
    failedInvalidationTags.delete(tag);
  } catch (err) {
    console.error(`[ReferenceCache] Deferred revalidation retry failed for tag "${tag}":`, err);
  }
}

/**
 * Records or completes a durable cache invalidation entry in PostgreSQL.
 * Deduplicated per tag so entries do not grow unbounded.
 */
export async function recordDurableInvalidation(tag: string, success: boolean, errMessage?: string): Promise<void> {
  try {
    const now = new Date();
    const id = `outbox_${tag}`;

    await withDbRetry(() => {
      if (success) {
        return db
          .insert(cacheInvalidationOutbox)
          .values({
            id,
            tag,
            status: 'completed',
            attempts: 1,
            lastError: null,
            nextRetryAt: now,
            completedAt: now,
          })
          .onConflictDoUpdate({
            target: cacheInvalidationOutbox.tag,
            set: {
              status: 'completed',
              lastError: null,
              completedAt: now,
            },
          });
      } else {
        return db
          .insert(cacheInvalidationOutbox)
          .values({
            id,
            tag,
            status: 'pending',
            attempts: 1,
            lastError: errMessage || 'Failed to revalidate cache tag',
            nextRetryAt: new Date(Date.now() + 30000),
          })
          .onConflictDoUpdate({
            target: cacheInvalidationOutbox.tag,
            set: {
              status: 'pending',
              attempts: sql`${cacheInvalidationOutbox.attempts} + 1`,
              lastError: errMessage || 'Failed to revalidate cache tag',
              nextRetryAt: new Date(Date.now() + 30000),
            },
          });
      }
    });
  } catch (dbErr) {
    console.error(`[ReferenceCache] Failed to record durable outbox entry for tag "${tag}":`, dbErr);
  }
}

/**
 * Processes any pending cache invalidations in PostgreSQL outbox that failed previously.
 * Safe for concurrent server workers using optimistic status locking.
 */
export async function processPendingInvalidations(): Promise<void> {
  try {
    const now = new Date();
    const pending = await withDbRetry(() =>
      db
        .select()
        .from(cacheInvalidationOutbox)
        .where(and(eq(cacheInvalidationOutbox.status, 'pending'), lte(cacheInvalidationOutbox.nextRetryAt, now)))
        .limit(5)
    );

    for (const entry of pending) {
      // Atomic lock: update status to 'processing' so concurrent workers do not duplicate work
      const lockResult = await withDbRetry(() =>
        db
          .update(cacheInvalidationOutbox)
          .set({ status: 'processing' })
          .where(and(eq(cacheInvalidationOutbox.id, entry.id), eq(cacheInvalidationOutbox.status, 'pending')))
          .returning({ id: cacheInvalidationOutbox.id })
      );

      if (lockResult.length === 0) continue; // Another worker claimed it

      try {
        revalidateTag(entry.tag);
        failedInvalidationTags.delete(entry.tag);
        await withDbRetry(() =>
          db
            .update(cacheInvalidationOutbox)
            .set({
              status: 'completed',
              lastError: null,
              completedAt: new Date(),
            })
            .where(eq(cacheInvalidationOutbox.id, entry.id))
        );
      } catch (err: any) {
        const nextAttempts = entry.attempts + 1;
        const backoffMs = Math.min(300000, Math.pow(2, Math.min(nextAttempts, 6)) * 5000);
        failedInvalidationTags.add(entry.tag);
        await withDbRetry(() =>
          db
            .update(cacheInvalidationOutbox)
            .set({
              status: 'pending',
              attempts: nextAttempts,
              lastError: String(err?.message || err),
              nextRetryAt: new Date(Date.now() + backoffMs),
            })
            .where(eq(cacheInvalidationOutbox.id, entry.id))
        );
      }
    }
  } catch (err) {
    console.error('[ReferenceCache] Failed to process pending invalidation outbox:', err);
  }
}

const fetchCachedCategoryHierarchyInternal = unstable_cache(
  async (): Promise<Category[]> => {
    return categoryRepository.findAllHierarchy();
  },
  ['marketplace-reference-category-hierarchy-v1'],
  {
    tags: [
      REFERENCE_CACHE_TAGS.CATEGORIES,
      REFERENCE_CACHE_TAGS.SUBCATEGORIES,
      REFERENCE_CACHE_TAGS.NAVIGATION,
    ],
    revalidate: false,
  }
);

const fetchCachedLocationsInternal = unstable_cache(
  async (): Promise<LocationItem[]> => {
    return locationRepository.findAllDirect();
  },
  ['marketplace-reference-locations-v1'],
  {
    tags: [REFERENCE_CACHE_TAGS.LOCATIONS, REFERENCE_CACHE_TAGS.NAVIGATION],
    revalidate: false,
  }
);

const fetchCachedSystemSettingsInternal = unstable_cache(
  async (): Promise<SystemSettings> => {
    return adminRepository.getSystemSettingsDirect();
  },
  ['marketplace-reference-system-settings-v1'],
  {
    tags: [REFERENCE_CACHE_TAGS.SETTINGS],
    revalidate: false,
  }
);

const fetchCachedLiveListingCountsInternal = unstable_cache(
  async (): Promise<{ parentCountMap: Record<string, number>; subCountMap: Record<string, number> }> => {
    return categoryRepository.findLiveListingCounts();
  },
  ['marketplace-reference-live-listing-counts-v1'],
  {
    tags: [REFERENCE_CACHE_TAGS.LISTING_COUNTS],
    revalidate: 300, // 5 minutes bounded freshness fallback for natural listing expirations
  }
);

/**
 * Returns the cached category + subcategory hierarchy (without dynamic listing counts).
 * Deduplicated per-request via React `cache()` and shared across requests via Next.js `unstable_cache`.
 */
export const getCachedCategoryHierarchy = cache(async (): Promise<Category[]> => {
  if (
    failedInvalidationTags.has(REFERENCE_CACHE_TAGS.CATEGORIES) ||
    failedInvalidationTags.has(REFERENCE_CACHE_TAGS.SUBCATEGORIES) ||
    failedInvalidationTags.has(REFERENCE_CACHE_TAGS.NAVIGATION)
  ) {
    tryHealInvalidationTag(REFERENCE_CACHE_TAGS.CATEGORIES);
    tryHealInvalidationTag(REFERENCE_CACHE_TAGS.SUBCATEGORIES);
    tryHealInvalidationTag(REFERENCE_CACHE_TAGS.NAVIGATION);
    return categoryRepository.findAllHierarchy();
  }
  return fetchCachedCategoryHierarchyInternal();
});

/**
 * Returns cached live listing counts per category and subcategory.
 * Deduplicated per-request via React `cache()` and shared across requests via Next.js `unstable_cache`.
 */
export const getCachedLiveListingCounts = cache(async () => {
  // Fire background check for durable outbox entries from prior workers/restarts
  processPendingInvalidations().catch(() => {});

  if (failedInvalidationTags.has(REFERENCE_CACHE_TAGS.LISTING_COUNTS)) {
    tryHealInvalidationTag(REFERENCE_CACHE_TAGS.LISTING_COUNTS);
    return categoryRepository.findLiveListingCounts();
  }
  return fetchCachedLiveListingCountsInternal();
});

export const getCategoriesWithLiveCounts = cache(async (): Promise<Category[]> => {
  try {
    const [hierarchy, counts] = await Promise.all([
      getCachedCategoryHierarchy(),
      getCachedLiveListingCounts(),
    ]);

    const parentCountMap = counts?.parentCountMap || {};
    const subCountMap = counts?.subCountMap || {};

    // Calculate sum of child subcategory counts for each parent category
    const childrenSumMap: Record<string, number> = {};
    for (const cat of hierarchy) {
      if (cat.parentId) {
        const subCount = subCountMap[cat.id] || 0;
        childrenSumMap[cat.parentId] = (childrenSumMap[cat.parentId] || 0) + subCount;
      }
    }

    return hierarchy.map((cat) => {
      if (cat.parentId) {
        return {
          ...cat,
          listingCount: subCountMap[cat.id] || 0,
        };
      }
      const directCount = parentCountMap[cat.id] || 0;
      const childrenSum = childrenSumMap[cat.id] || 0;
      return {
        ...cat,
        listingCount: Math.max(directCount, childrenSum),
      };
    });
  } catch (error) {
    console.error('[ReferenceCache] getCategoriesWithLiveCounts error:', error);
    return getCachedCategoryHierarchy();
  }
});

/**
 * Returns cached marketplace locations.
 * Deduplicated per-request via React `cache()` and shared across requests via Next.js `unstable_cache`.
 */
export const getCachedLocations = cache(async (): Promise<LocationItem[]> => {
  if (
    failedInvalidationTags.has(REFERENCE_CACHE_TAGS.LOCATIONS) ||
    failedInvalidationTags.has(REFERENCE_CACHE_TAGS.NAVIGATION)
  ) {
    tryHealInvalidationTag(REFERENCE_CACHE_TAGS.LOCATIONS);
    tryHealInvalidationTag(REFERENCE_CACHE_TAGS.NAVIGATION);
    return locationRepository.findAllDirect();
  }
  return fetchCachedLocationsInternal();
});

/**
 * Returns cached system settings used by the root layout, header, and footer.
 * Deduplicated per-request via React `cache()` and shared across requests via Next.js `unstable_cache`.
 */
export const getCachedSystemSettings = cache(async (): Promise<SystemSettings> => {
  if (failedInvalidationTags.has(REFERENCE_CACHE_TAGS.SETTINGS)) {
    tryHealInvalidationTag(REFERENCE_CACHE_TAGS.SETTINGS);
    return adminRepository.getSystemSettingsDirect();
  }
  return fetchCachedSystemSettingsInternal();
});

/**
 * Invalidates cached category, subcategory, and navigation reference data.
 * Must only be called AFTER the database create/update/delete operation has succeeded.
 */
export function invalidateCategoryReferenceCache(): void {
  const tagsToInvalidate = [
    REFERENCE_CACHE_TAGS.CATEGORIES,
    REFERENCE_CACHE_TAGS.SUBCATEGORIES,
    REFERENCE_CACHE_TAGS.NAVIGATION,
  ];

  for (const tag of tagsToInvalidate) {
    try {
      revalidateTag(tag);
      failedInvalidationTags.delete(tag);
    } catch (error) {
      console.error(`[ReferenceCache] Failed to revalidate tag "${tag}":`, error);
      failedInvalidationTags.add(tag);
    }
  }

  try {
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('[ReferenceCache] Failed to revalidate root layout path after category mutation:', error);
  }
}

/**
 * Invalidates cached location and navigation reference data.
 * Must only be called AFTER the database create/update/delete operation has succeeded.
 */
export function invalidateLocationReferenceCache(): void {
  const tagsToInvalidate = [
    REFERENCE_CACHE_TAGS.LOCATIONS,
    REFERENCE_CACHE_TAGS.NAVIGATION,
  ];

  for (const tag of tagsToInvalidate) {
    try {
      revalidateTag(tag);
      failedInvalidationTags.delete(tag);
    } catch (error) {
      console.error(`[ReferenceCache] Failed to revalidate tag "${tag}":`, error);
      failedInvalidationTags.add(tag);
    }
  }

  try {
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('[ReferenceCache] Failed to revalidate root layout path after location mutation:', error);
  }
}

/**
 * Invalidates cached system settings reference data.
 * Must only be called AFTER the database update operation has succeeded.
 */
export function invalidateSettingsReferenceCache(): void {
  try {
    revalidateTag(REFERENCE_CACHE_TAGS.SETTINGS);
    failedInvalidationTags.delete(REFERENCE_CACHE_TAGS.SETTINGS);
  } catch (error) {
    console.error(`[ReferenceCache] Failed to revalidate tag "${REFERENCE_CACHE_TAGS.SETTINGS}":`, error);
    failedInvalidationTags.add(REFERENCE_CACHE_TAGS.SETTINGS);
  }

  try {
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('[ReferenceCache] Failed to revalidate root layout path after settings mutation:', error);
  }
}

/**
 * Invalidates cached live listing counts data and records durable status in PostgreSQL outbox.
 * Must be called whenever listings are created, updated, status-changed, or deleted.
 */
export async function invalidateLiveListingCountsCache(): Promise<void> {
  let success = false;
  let errStr: string | undefined = undefined;

  try {
    revalidateTag(REFERENCE_CACHE_TAGS.LISTING_COUNTS);
    failedInvalidationTags.delete(REFERENCE_CACHE_TAGS.LISTING_COUNTS);
    success = true;
  } catch (error: any) {
    console.error(`[ReferenceCache] Failed to revalidate tag "${REFERENCE_CACHE_TAGS.LISTING_COUNTS}":`, error);
    failedInvalidationTags.add(REFERENCE_CACHE_TAGS.LISTING_COUNTS);
    errStr = String(error?.message || error);
  }

  try {
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('[ReferenceCache] Failed to revalidate root layout path after listing count mutation:', error);
  }

  try {
    await recordDurableInvalidation(REFERENCE_CACHE_TAGS.LISTING_COUNTS, success, errStr);
  } catch (outboxErr) {
    console.error('[ReferenceCache] Error recording outbox invalidation:', outboxErr);
  }
}

