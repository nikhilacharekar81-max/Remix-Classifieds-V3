import React from 'react';
import { Category, Listing, LocationItem } from '@/lib/types';
import { MarketplaceHeader } from './MarketplaceHeader';
import { CategorySubNavbar } from './CategorySubNavbar';
import { MarketplaceHeroBanner } from './MarketplaceHeroBanner';
import { CategoryDirectoryGrid } from './CategoryDirectoryGrid';
import { LatestAdsSection } from './LatestAdsSection';
import { CategoryTreeSidebar } from './CategoryTreeSidebar';
import { PublicListingsCatalogClient } from './PublicListingsCatalogClient';
import { SeoContentBlock } from './SeoContentBlock';
import { getSeoContent } from '@/lib/data/seoContentData';
import { Footer } from '@/components/common/Footer';

export interface PublicMarketplacePageProps {
  mode: 'directory' | 'listings';
  effectiveCity: string;
  effectiveCategory?: string;
  effectiveSubcategory?: string;
  effectiveSearch?: string;
  isSearchRoute?: boolean;
  query?: Record<string, string>;
  categories: Category[];
  locations: LocationItem[];
  listings: Listing[];
  totalListings: number;
  currentPage?: number;
  enablePrivacyChoices?: boolean;
}

const ITEMS_PER_PAGE = 50;

export const PublicMarketplacePage: React.FC<PublicMarketplacePageProps> = ({
  mode,
  effectiveCity,
  effectiveCategory = 'all',
  effectiveSubcategory = 'all',
  effectiveSearch = '',
  isSearchRoute = false,
  query = {},
  categories,
  locations,
  listings,
  totalListings,
  currentPage = 1,
  enablePrivacyChoices = false,
}) => {
  const rootCategories = categories.filter((c) => !c.parentId && c.isActive);

  const totalDirectoryListings =
    totalListings > 0
      ? totalListings
      : rootCategories.reduce((sum, c) => sum + (c.listingCount || 0), 0) || listings.length;

  const seoCategoryName =
    effectiveSubcategory !== 'all'
      ? categories.find((c) => c.id === effectiveSubcategory)?.name || 'Directory'
      : effectiveCategory !== 'all'
      ? categories.find((c) => c.id === effectiveCategory)?.name || 'Directory'
      : 'Classifieds';

  const seoCategoryId =
    effectiveSubcategory !== 'all'
      ? effectiveSubcategory
      : effectiveCategory !== 'all'
      ? effectiveCategory
      : 'home';

  const seoData = getSeoContent(effectiveCity || 'All India', seoCategoryName, seoCategoryId);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124] flex flex-col font-sans overflow-x-hidden">
      <MarketplaceHeader
        effectiveCity={effectiveCity}
        effectiveSearch={effectiveSearch}
        categories={categories}
        locations={locations}
        activeCategoryId={effectiveCategory}
        activeSubcategoryId={effectiveSubcategory}
      />

      <CategorySubNavbar
        currentCity={effectiveCity}
        activeCategoryId={effectiveCategory}
        activeSubcategoryId={effectiveSubcategory}
        categories={categories}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6 w-full">
        {mode === 'directory' ? (
          <div className="space-y-8 animate-in fade-in duration-200">
            <MarketplaceHeroBanner
              effectiveCity={effectiveCity}
              effectiveSearch={effectiveSearch}
              categories={categories}
              totalDirectoryListings={totalDirectoryListings}
              rootCategoriesCount={rootCategories.length}
            />

            <CategoryDirectoryGrid
              categories={categories}
              currentCity={effectiveCity}
              selectedCategoryId={effectiveCategory}
              selectedSubcategoryId={effectiveSubcategory}
            />

            <LatestAdsSection
              latestAds={listings}
              effectiveCity={effectiveCity}
              categories={categories}
            />
          </div>
        ) : (
          <PublicListingsCatalogClient
            effectiveCity={effectiveCity}
            effectiveCategory={effectiveCategory}
            effectiveSubcategory={effectiveSubcategory}
            effectiveSearch={effectiveSearch}
            isSearchRoute={isSearchRoute}
            categories={categories}
            listings={listings}
            totalMatchingListings={totalListings}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            initialQuery={query}
            categorySidebarNode={
              <CategoryTreeSidebar
                categories={categories}
                rootCategories={rootCategories}
                effectiveCity={effectiveCity}
                effectiveCategory={effectiveCategory}
                effectiveSubcategory={effectiveSubcategory}
              />
            }
          />
        )}
      </main>

      <SeoContentBlock
        locationName={effectiveCity || 'All India'}
        categoryName={seoCategoryName}
        categoryId={seoCategoryId}
        seoData={seoData}
      />

      <Footer
        categories={categories}
        enablePrivacyChoices={enablePrivacyChoices}
      />
    </div>
  );
};
