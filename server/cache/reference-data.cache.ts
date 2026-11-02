import { cache } from 'react';
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { categoryRepository } from '@/server/repositories/category.repository';
import { locationRepository } from '@/server/repositories/location.repository';
import { adminRepository } from '@/server/repositories/admin.repository';
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
    revalidate: false,
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
  if (failedInvalidationTags.has(REFERENCE_CACHE_TAGS.LISTING_COUNTS)) {
    tryHealInvalidationTag(REFERENCE_CACHE_TAGS.LISTING_COUNTS);
    return categoryRepository.findLiveListingCounts();
  }
  return fetchCachedLiveListingCountsInternal();
});

/**
 * Combines the cached static category/subcategory hierarchy with cached, tag-invalidatable
 * listing counts from PostgreSQL. Deduplicated within a single request via React `cache()`.
 */
export const getCategoriesWithLiveCounts = cache(async (): Promise<Category[]> => {
  const [hierarchy, { parentCountMap, subCountMap }] = await Promise.all([
    getCachedCategoryHierarchy(),
    getCachedLiveListingCounts(),
  ]);

  return hierarchy.map((cat) => ({
    ...cat,
    listingCount: cat.parentId
      ? (subCountMap[cat.id] || 0)
      : (parentCountMap[cat.id] || 0),
  }));
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
 * Invalidates cached live listing counts data.
 * Must be called whenever listings are created, updated, status-changed, or deleted.
 */
export function invalidateLiveListingCountsCache(): void {
  try {
    revalidateTag(REFERENCE_CACHE_TAGS.LISTING_COUNTS);
    failedInvalidationTags.delete(REFERENCE_CACHE_TAGS.LISTING_COUNTS);
  } catch (error) {
    console.error(`[ReferenceCache] Failed to revalidate tag "${REFERENCE_CACHE_TAGS.LISTING_COUNTS}":`, error);
    failedInvalidationTags.add(REFERENCE_CACHE_TAGS.LISTING_COUNTS);
  }

  try {
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('[ReferenceCache] Failed to revalidate root layout path after listing count mutation:', error);
  }
}

