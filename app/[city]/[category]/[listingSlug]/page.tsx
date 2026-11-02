import { cache } from 'react';
import type { Metadata } from 'next';
import { listingRepository } from '@/server/repositories/listing.repository';
import { listingService } from '@/server/services/listing.service';
import {
  getCategoriesWithLiveCounts,
  getCachedLocations,
  getCachedSystemSettings,
} from '@/server/cache/reference-data.cache';
import {
  stripChillySuffixes,
  unslugifyCity,
  unslugifyCategory,
  serializeJsonLd,
} from '@/lib/utils/seoAndUrlHelper';
import { PublicMarketplacePage } from '@/components/marketplace/PublicMarketplacePage';
import { PublicListingDetailPage } from '@/components/marketplace/PublicListingDetailPage';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ListingOrSubcategoryPageProps {
  params: Promise<{ city: string; category: string; listingSlug: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

const getListingById = cache(async (id: string) => {
  return listingRepository.findById(id);
});

const getSubcategoryContext = cache(async (cityParam: string, listingSlugParam: string) => {
  const { cleanSlug: cleanCitySlug } = stripChillySuffixes(cityParam);
  const { cleanSlug: cleanThirdSlug } = stripChillySuffixes(listingSlugParam);

  const [categories, locations, settings] = await Promise.all([
    getCategoriesWithLiveCounts(),
    getCachedLocations(),
    getCachedSystemSettings(),
  ]);

  const loc =
    locations.find((l) => l.slug === cleanCitySlug || l.slug === cityParam) ?? null;
  const cityName = loc ? loc.name : unslugifyCity(cityParam, locations).cityName;

  const matchedSubCat =
    categories.find((c) => c.slug === cleanThirdSlug || c.slug === listingSlugParam) ||
    unslugifyCategory(listingSlugParam, categories).categoryObj;

  const parentCat = matchedSubCat
    ? categories.find((c) => c.id === matchedSubCat.parentId)
    : undefined;

  return {
    categories,
    locations,
    settings,
    loc,
    cityName,
    matchedSubCat,
    parentCat,
  };
});

export async function generateMetadata({
  params,
  searchParams,
}: ListingOrSubcategoryPageProps): Promise<Metadata> {
  const { city, category, listingSlug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const { itemId } = stripChillySuffixes(listingSlug);

  if (itemId) {
    const listing = await getListingById(itemId);
    if (!listing || listing.status !== 'approved') {
      return {
        title: 'Listing Not Found | Classifieds V2',
        description: 'The requested classified ad could not be found or has expired.',
      };
    }

    const title = `${listing.title} — ₹${listing.price.toLocaleString('en-IN')} in ${listing.location.city} | Classifieds V2`;
    const description = `${listing.title}. Price: ₹${listing.price.toLocaleString('en-IN')}. Located in ${listing.location.locality}, ${listing.location.city}. ${listing.description.slice(0, 150)}...`;
    const imageUrl =
      listing.images?.[0] ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: listing.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: `/${city}/${category}/${listingSlug}`,
      },
    };
  }

  const pageNum = Math.max(1, Number(resolvedSearch.page) || 1);
  const pageSuffix = pageNum > 1 ? ` (Page ${pageNum})` : '';
  const canonicalUrl =
    pageNum > 1
      ? `/${city}/${category}/${listingSlug}?page=${pageNum}`
      : `/${city}/${category}/${listingSlug}`;

  const { cityName, matchedSubCat } = await getSubcategoryContext(city, listingSlug);

  if (matchedSubCat) {
    const title = `${matchedSubCat.name} in ${cityName}${pageSuffix} — Buy, Sell & Verified Ads | Classifieds V2`;
    const description = `Browse verified ${matchedSubCat.name} classified ads in ${cityName}${pageSuffix}. Compare prices, view real photos, and contact local sellers directly.`;

    return {
      title,
      description,
      openGraph: { title, description, type: 'website' },
      twitter: { card: 'summary_large_image', title, description },
      alternates: { canonical: canonicalUrl },
    };
  }

  return {
    title: 'Page Not Found | Classifieds V2',
    description: 'The requested page could not be found.',
  };
}

export default async function ListingHierarchicalPage({
  params,
  searchParams,
}: ListingOrSubcategoryPageProps) {
  const { city, category, listingSlug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const cleanQuery: Record<string, string> = {};
  for (const [k, v] of Object.entries(resolvedSearch)) {
    if (typeof v === 'string') cleanQuery[k] = v;
  }

  const { itemId } = stripChillySuffixes(listingSlug);

  if (itemId) {
    const [listing, categories, locations, settings] = await Promise.all([
      getListingById(itemId),
      getCategoriesWithLiveCounts(),
      getCachedLocations(),
      getCachedSystemSettings(),
    ]);

    if (!listing || listing.status !== 'approved') {
      notFound();
    }

    const relatedResult = await listingRepository.findMarketplaceListings({
      status: 'approved',
      category: listing.categoryId,
      limit: 5,
      offset: 0,
    });

    const jsonLd = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: listing.title,
      image: listing.images,
      description: listing.description,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: listing.price,
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/UsedCondition',
        seller: {
          '@type': 'Person',
          name: listing.sellerName,
        },
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
        <PublicListingDetailPage
          listing={listing}
          relatedListings={relatedResult.items}
          categories={categories}
          locations={locations}
          enablePrivacyChoices={Boolean(settings?.enablePrivacyChoices)}
        />
      </>
    );
  }

  const { categories, locations, settings, cityName, matchedSubCat, parentCat } =
    await getSubcategoryContext(city, listingSlug);

  if (!matchedSubCat) {
    notFound();
  }

  const paginated = await listingService.getPaginatedPageListings({
    city: cityName !== 'All India' ? cityName : undefined,
    category: matchedSubCat.parentId || matchedSubCat.id,
    subcategory: matchedSubCat.parentId ? matchedSubCat.id : undefined,
    query: cleanQuery,
    pageSize: 50,
  });

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
      ...(parentCat
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: parentCat.name,
              item: `https://chillyads.com/${city}/${category}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: parentCat ? 4 : 3,
        name: matchedSubCat.name,
        item: `https://chillyads.com/${city}/${category}/${listingSlug}`,
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
        effectiveCategory={matchedSubCat.parentId || matchedSubCat.id}
        effectiveSubcategory={matchedSubCat.parentId ? matchedSubCat.id : 'all'}
        query={cleanQuery}
        categories={categories}
        locations={locations}
        listings={paginated.items}
        totalListings={paginated.total}
        currentPage={paginated.page}
        enablePrivacyChoices={Boolean(settings?.enablePrivacyChoices)}
      />
    </>
  );
}
