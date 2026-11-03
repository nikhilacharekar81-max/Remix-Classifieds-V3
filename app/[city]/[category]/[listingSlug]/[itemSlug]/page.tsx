import type { Metadata } from 'next';
import {
  listingService,
  getCachedPublicListingById,
  isListingPubliclyAccessible,
} from '@/server/services/listing.service';
import {
  getCategoriesWithLiveCounts,
  getCachedLocations,
  getCachedSystemSettings,
} from '@/server/cache/reference-data.cache';
import { stripChillySuffixes, serializeJsonLd } from '@/lib/utils/seoAndUrlHelper';
import { PublicListingDetailPage } from '@/components/marketplace/PublicListingDetailPage';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface FourSegmentListingPageProps {
  params: Promise<{
    city: string;
    category: string;
    listingSlug: string;
    itemSlug: string;
  }>;
}

export async function generateMetadata({ params }: FourSegmentListingPageProps): Promise<Metadata> {
  const { city, category, listingSlug, itemSlug } = await params;
  const { itemId } = stripChillySuffixes(itemSlug);

  const listing = itemId ? await getCachedPublicListingById(itemId) : null;
  if (!isListingPubliclyAccessible(listing)) {
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
      canonical: `/${city}/${category}/${listingSlug}/${itemSlug}`,
    },
  };
}

export default async function FourSegmentListingPage({ params }: FourSegmentListingPageProps) {
  const { itemSlug } = await params;
  const { itemId } = stripChillySuffixes(itemSlug);

  if (!itemId) {
    notFound();
  }

  const [listing, categories, locations, settings] = await Promise.all([
    getCachedPublicListingById(itemId),
    getCategoriesWithLiveCounts(),
    getCachedLocations(),
    getCachedSystemSettings(),
  ]);

  if (!isListingPubliclyAccessible(listing)) {
    notFound();
  }

  const relatedItems = await listingService.getCachedRelatedListings(
    listing.categoryId,
    listing.id,
    4
  );

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
        relatedListings={relatedItems}
        categories={categories}
        locations={locations}
        enablePrivacyChoices={Boolean(settings?.enablePrivacyChoices)}
      />
    </>
  );
}
