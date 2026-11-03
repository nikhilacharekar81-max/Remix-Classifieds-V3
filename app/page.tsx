import { PublicMarketplacePage } from '@/components/marketplace/PublicMarketplacePage';
import { listingService } from '@/server/services/listing.service';
import {
  getCategoriesWithLiveCounts,
  getCachedLocations,
  getCachedSystemSettings,
} from '@/server/cache/reference-data.cache';
import { ensureDatabaseSeeded, isDatabaseInitialized } from '@/server/seed-postgres';
import { serializeJsonLd } from '@/lib/utils/seoAndUrlHelper';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Classifieds V2 — India's Leading Community Marketplace",
  description:
    'Free classified ads in India. Buy and sell used cars, mobile phones, apartments for rent, electronics, jobs, furniture, and local services.',
  alternates: {
    canonical: 'https://chillyads.com/',
  },
  openGraph: {
    title: 'Classifieds V2 — Free Classified Ads in India',
    description:
      'Buy and sell second-hand cars, phones, flats, jobs, and home services directly from verified owners.',
    url: 'https://chillyads.com/',
    type: 'website',
  },
};

export default async function HomePage() {
  if (!isDatabaseInitialized()) {
    await ensureDatabaseSeeded();
  }

  // Essential reference data must come from initialized PostgreSQL and must not fall back to
  // static in-memory constants that would disguise an uninitialized or broken database.
  const [categories, locations] = await Promise.all([
    getCategoriesWithLiveCounts(),
    getCachedLocations(),
  ]);

  if (categories.length === 0 || locations.length === 0) {
    throw new Error('Essential marketplace categories or locations are missing after initialization.');
  }

  // Non-essential/dynamic homepage data preserves graceful fallback only after essential initialization succeeded.
  const [latestItems, fetchedSettings] = await Promise.all([
    listingService.getCachedLatestListings('All India', 10).catch((err) => {
      console.error('HomePage latest listings fetch error:', err);
      return [];
    }),
    getCachedSystemSettings().catch((err) => {
      console.error('HomePage system settings fetch error:', err);
      return null;
    }),
  ]);

  const enablePrivacyChoices = Boolean(fetchedSettings?.enablePrivacyChoices);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Chillyads',
        url: 'https://chillyads.com/',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://chillyads.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        name: 'Chillyads India Pvt Ltd',
        url: 'https://chillyads.com/',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PublicMarketplacePage
        mode="directory"
        effectiveCity="All India"
        categories={categories}
        locations={locations}
        listings={latestItems}
        totalListings={0}
        enablePrivacyChoices={enablePrivacyChoices}
      />
    </>
  );
}
