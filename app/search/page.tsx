import { PublicMarketplacePage } from '@/components/marketplace/PublicMarketplacePage';
import { listingService } from '@/server/services/listing.service';
import {
  getCategoriesWithLiveCounts,
  getCachedLocations,
  getCachedSystemSettings,
} from '@/server/cache/reference-data.cache';
import { INITIAL_CATEGORIES, INITIAL_LOCATIONS } from '@/lib/data/initialData';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams?: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolved = searchParams ? await searchParams : {};
  const q = resolved.q?.trim();
  const city = resolved.city?.trim();
  const pageNum = Math.max(1, Number(resolved.page) || 1);
  const pageSuffix = pageNum > 1 ? ` (Page ${pageNum})` : '';

  const title = q
    ? `Search Results for "${q}"${city ? ` in ${city}` : ''}${pageSuffix} | Classifieds V2`
    : `Search Classified Ads — Cars, Phones, Flats & Jobs${pageSuffix} | Classifieds V2`;
  const description = q
    ? `Browse verified classified ads matching "${q}"${city ? ` in ${city}` : ''}${pageSuffix}. Compare prices and chat directly with sellers.`
    : `Search verified classified ads for cars, mobile phones, real estate, jobs, and local services across India${pageSuffix}.`;

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (city) params.set('city', city);
  if (pageNum > 1) params.set('page', String(pageNum));
  const qs = params.toString();

  return {
    title,
    description,
    alternates: {
      canonical: qs ? `/search?${qs}` : '/search',
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const cleanQuery: Record<string, string> = {};
  for (const [k, v] of Object.entries(resolved)) {
    if (typeof v === 'string') cleanQuery[k] = v;
  }

  let paginated = { items: [] as any[], total: 0, page: 1 };
  let categories = INITIAL_CATEGORIES;
  let locations = INITIAL_LOCATIONS;
  let enablePrivacyChoices = false;

  try {
    const [fetchedPaginated, fetchedCategories, fetchedLocations, fetchedSettings] =
      await Promise.all([
        listingService.getPaginatedPageListings({
          city: cleanQuery.city,
          category: cleanQuery.category,
          subcategory: cleanQuery.subcategory,
          query: cleanQuery,
          pageSize: 50,
        }),
        getCategoriesWithLiveCounts(),
        getCachedLocations(),
        getCachedSystemSettings(),
      ]);
    paginated = fetchedPaginated;
    if (fetchedCategories.length > 0) categories = fetchedCategories;
    if (fetchedLocations.length > 0) locations = fetchedLocations;
    enablePrivacyChoices = Boolean(fetchedSettings?.enablePrivacyChoices);
  } catch (err) {
    console.error('SearchPage listing fetch error:', err);
  }

  return (
    <PublicMarketplacePage
      mode="listings"
      isSearchRoute
      effectiveCity={cleanQuery.city || 'All India'}
      effectiveCategory={cleanQuery.category || 'all'}
      effectiveSubcategory={cleanQuery.subcategory || 'all'}
      effectiveSearch={cleanQuery.q || ''}
      query={cleanQuery}
      categories={categories}
      locations={locations}
      listings={paginated.items}
      totalListings={paginated.total}
      currentPage={paginated.page}
      enablePrivacyChoices={enablePrivacyChoices}
    />
  );
}
