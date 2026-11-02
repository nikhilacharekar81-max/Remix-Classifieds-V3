'use client';

import React from 'react';
import { Grid, List } from 'lucide-react';
import { Listing, Category } from '@/lib/types';
import { ListingGridCard } from './ListingGridCard';
import { ListingListicleCard } from './ListingListicleCard';

export interface LatestAdsSectionProps {
  latestAds: Listing[];
  effectiveCity: string;
  categories: Category[];
  latestAdsLayout: 'grid' | 'listicle';
  onChangeLayout: (layout: 'grid' | 'listicle') => void;
  getCategoryName: (catId?: string, subId?: string) => string;
}

export const LatestAdsSection: React.FC<LatestAdsSectionProps> = ({
  latestAds,
  effectiveCity,
  categories,
  latestAdsLayout,
  onChangeLayout,
  getCategoryName,
}) => {
  const isSpecificCity =
    effectiveCity !== 'All India' && effectiveCity !== 'All Cities';

  return (
    <div className="space-y-4 pt-4 border-t border-[#dadce0]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold tracking-tight text-[#202124] flex items-center gap-2">
            <span>
              Recently Published Gigs &amp; Classifieds{' '}
              {isSpecificCity && `in ${effectiveCity}`}
            </span>
          </h2>
          <p className="text-xs text-[#5f6368]">
            Verified listings from local sellers and service providers
          </p>
        </div>

        {/* Grid / Listicle View Toggle for Latest Ads */}
        <div className="flex items-center border border-[#dadce0] rounded-lg p-0.5 bg-white">
          <button
            type="button"
            onClick={() => onChangeLayout('grid')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              latestAdsLayout === 'grid'
                ? 'bg-[#e6f4ea] text-[#137333]'
                : 'text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeLayout('listicle')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              latestAdsLayout === 'listicle'
                ? 'bg-[#e6f4ea] text-[#137333]'
                : 'text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Listicle</span>
          </button>
        </div>
      </div>

      {latestAds.length === 0 ? (
        <div className="bg-white border border-[#dadce0] rounded-xl p-8 text-center text-[#5f6368]">
          <p className="text-xs font-semibold">No active ads posted in this city yet.</p>
        </div>
      ) : latestAdsLayout === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {latestAds.map((listing) => (
            <ListingGridCard
              key={listing.id}
              listing={listing}
              categories={categories}
              subName={getCategoryName(listing.categoryId, listing.subcategoryId)}
              variant="latest"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {latestAds.map((listing, idx) => (
            <ListingListicleCard
              key={listing.id}
              listing={listing}
              rankNumber={idx + 1}
              categories={categories}
              subName={getCategoryName(listing.categoryId, listing.subcategoryId)}
              variant="latest"
            />
          ))}
        </div>
      )}
    </div>
  );
};
