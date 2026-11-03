import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getCachedCategoryHierarchy,
  getCategoriesWithLiveCounts,
  getCachedLocations,
  getCachedSystemSettings,
} from '@/server/cache/reference-data.cache';
import { listingService } from '@/server/services/listing.service';
import nextDynamic from 'next/dynamic';
import { getInitialServerDataForAppRouter } from '@/server/services/initialServerData';
import { PublicMarketplacePage } from '@/components/marketplace/PublicMarketplacePage';

const AppClientRouter = nextDynamic(() =>
  import('@/components/AppClientRouter').then((m) => m.AppClientRouter)
);
import {
  stripChillySuffixes,
  unslugifyCity,
  unslugifyCategory,
  serializeJsonLd,
} from '@/lib/utils/seoAndUrlHelper';

export const dynamic = 'force-dynamic';

interface CategoryCityPageProps {
  params: Promise<{ city: string; category: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

const getCategoryCityContext = cache(async (cityParam: string, categoryParam: string) => {
  const { cleanSlug: cleanCitySlug } = stripChillySuffixes(cityParam);
  const { cleanSlug: cleanCatSlug } = stripChillySuffixes(categoryParam);

  const [locations, hierarchy] = await Promise.all([
    getCachedLocations(),
    getCachedCategoryHierarchy(),
  ]);

  const loc =
    locations.find((l) => l.slug === cleanCitySlug || l.slug === cityParam) ?? null;
  const firstCat =
    hierarchy.find((c) => c.slug === cleanCitySlug || c.slug === cityParam) ?? null;
  const secondCat =
    hierarchy.find((c) => c.slug === cleanCatSlug || c.slug === categoryParam) ?? null;

  const resolvedFirstCat = firstCat || unslugifyCategory(cityParam, hierarchy).categoryObj;
  const resolvedSecondCat =
    secondCat || unslugifyCategory(categoryParam, hierarchy).categoryObj;

  return {
    cleanCitySlug,
    cleanCatSlug,
    locations,
    loc,
    firstCat,
    resolvedFirstCat,
    resolvedSecondCat,
  };
});

export async function generateMetadata({
  params,
  searchParams,
}: CategoryCityPageProps): Promise<Metadata> {
  const { city, category } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const pageNum = Math.max(1, Number(resolvedSearch.page) || 1);
  const pageSuffix = pageNum > 1 ? ` (Page ${pageNum})` : '';
  const canonicalUrl =
    pageNum > 1 ? `/${city}/${category}?page=${pageNum}` : `/${city}/${category}`;

  const { cleanCatSlug, locations, loc, firstCat, resolvedSecondCat } =
    await getCategoryCityContext(city, category);

  if (!loc && firstCat && resolvedSecondCat) {
    const title = `${resolvedSecondCat.name} (${firstCat.name}) in India${pageSuffix} — Buy, Sell & Best Deals | Classifieds V2`;
    const description = `Explore verified ${resolvedSecondCat.name} classified ads under ${firstCat.name} across India${pageSuffix}. Compare prices, inspect photos, and chat with verified sellers directly.`;
    return {
      title,
      description,
      openGraph: { title, description, type: 'website' },
      twitter: { card: 'summary_large_image', title, description },
      alternates: { canonical: canonicalUrl },
    };
  }

  const cityName = loc ? loc.name : unslugifyCity(city, locations).cityName;
  const categoryName = resolvedSecondCat
    ? resolvedSecondCat.name
    : cleanCatSlug.charAt(0).toUpperCase() + cleanCatSlug.slice(1);

  const title = `${categoryName} in ${cityName}${pageSuffix} — Buy, Sell & Best Deals | Classifieds V2`;
  const description = `Explore ${categoryName} for sale and services in ${cityName}${pageSuffix}. Compare prices, inspect photos, and chat with verified sellers directly.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function CategoryCityPage({
  params,
  searchParams,
}: CategoryCityPageProps) {
  const { city, category } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const cleanQuery: Record<string, string> = {};
  for (const [k, v] of Object.entries(resolvedSearch)) {
    if (typeof v === 'string') cleanQuery[k] = v;
  }

  const {
    cleanCitySlug,
    cleanCatSlug,
    locations,
    loc,
    resolvedFirstCat,
    resolvedSecondCat,
  } = await getCategoryCityContext(city, category);

  // Case 1: 2-segment All-India ParentCategory + Subcategory route (e.g. /services/home-services-repairs, /bikes/motorcycles)
  if (!loc && resolvedFirstCat && resolvedSecondCat) {
    const [allCategories, settings, paginated] = await Promise.all([
      getCategoriesWithLiveCounts(),
      getCachedSystemSettings(),
      listingService.getPaginatedPageListings({
        category: resolvedFirstCat.id,
        subcategory: resolvedSecondCat.id,
        query: cleanQuery,
        pageSize: 50,
      }),
    ]);

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://chillyads.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: resolvedFirstCat.name,
          item: `https://chillyads.com/${city}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: resolvedSecondCat.name,
          item: `https://chillyads.com/${city}/${category}`,
        },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        />
        <PublicMarketplacePage
          mode="listings"
          effectiveCity="All India"
          effectiveCategory={resolvedFirstCat.id}
          effectiveSubcategory={resolvedSecondCat.id}
          query={cleanQuery}
          categories={allCategories}
          locations={locations}
          listings={paginated.items}
          totalListings={paginated.total}
          currentPage={paginated.page}
          enablePrivacyChoices={Boolean(settings?.enablePrivacyChoices)}
        />
      </>
    );
  }

  // Case 2: /{city}/post or /{city}/sell (Interactive Post Ad flow)
  if (
    (loc || cleanCitySlug === 'all-india') &&
    (cleanCatSlug === 'post' || cleanCatSlug === 'sell')
  ) {
    const initialServerData = await getInitialServerDataForAppRouter();
    return (
      <AppClientRouter
        initialPath={`/${city}/${category}`}
        initialQuery={cleanQuery}
        initialServerData={initialServerData}
      />
    );
  }

  const isSpecialCity =
    cleanCitySlug === 'all-india' || cleanCitySlug === 'india' || cleanCitySlug === 'all';
  const isSpecialCategory = cleanCatSlug === 'all';
  if ((!loc && !isSpecialCity) || (!resolvedSecondCat && !isSpecialCategory)) {
    notFound();
  }

  const cityName = loc ? loc.name : unslugifyCity(city, locations).cityName;
  const categoryName = resolvedSecondCat
    ? resolvedSecondCat.name
    : cleanCatSlug.charAt(0).toUpperCase() + cleanCatSlug.slice(1);

  const parentCatId = resolvedSecondCat
    ? resolvedSecondCat.parentId || resolvedSecondCat.id
    : undefined;
  const subCatId =
    resolvedSecondCat && resolvedSecondCat.parentId ? resolvedSecondCat.id : undefined;

  const [allCategories, settings, paginated] = await Promise.all([
    getCategoriesWithLiveCounts(),
    getCachedSystemSettings(),
    listingService.getPaginatedPageListings({
      city: loc ? loc.name : undefined,
      category: parentCatId,
      subcategory: subCatId,
      query: cleanQuery,
      pageSize: 50,
    }),
  ]);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://chillyads.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: cityName,
        item: `https://chillyads.com/${city}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: `https://chillyads.com/${city}/${category}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <PublicMarketplacePage
        mode="listings"
        effectiveCity={cityName}
        effectiveCategory={parentCatId || 'all'}
        effectiveSubcategory={subCatId || 'all'}
        query={cleanQuery}
        categories={allCategories}
        locations={locations}
        listings={paginated.items}
        totalListings={paginated.total}
        currentPage={paginated.page}
        enablePrivacyChoices={Boolean(settings?.enablePrivacyChoices)}
      />
    </>
  );
}
