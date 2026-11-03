import React from 'react';
import { Listing, Category } from '@/lib/types';
import { LatestAdsToggleWrapper, LatestAdItemWithSubName } from './LatestAdsToggleWrapper';

export interface LatestAdsSectionProps {
  latestAds: Listing[];
  effectiveCity: string;
  categories: Category[];
  latestAdsLayout?: 'grid' | 'listicle';
  onChangeLayout?: (layout: 'grid' | 'listicle') => void;
  getCategoryName?: (catId?: string, subId?: string) => string;
}

export const LatestAdsSection: React.FC<LatestAdsSectionProps> = ({
  latestAds,
  effectiveCity,
  categories,
  latestAdsLayout,
  onChangeLayout,
  getCategoryName,
}) => {
  const resolveSubName = (catId?: string, subId?: string): string => {
    if (getCategoryName) {
      return getCategoryName(catId, subId);
    }
    if (subId) {
      const sub = categories.find((c) => c.id === subId);
      if (sub) return sub.name;
    }
    if (catId) {
      const cat = categories.find((c) => c.id === catId);
      if (cat) return cat.name;
    }
    return '';
  };

  const isSpecificCity =
    effectiveCity !== 'All India' && effectiveCity !== 'All Cities';

  const titleNode = (
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
  );

  if (latestAds.length === 0) {
    return (
      <div className="space-y-4 pt-4 border-t border-[#dadce0]">
        {titleNode}
        <div className="bg-white border border-[#dadce0] rounded-xl p-8 text-center text-[#5f6368]">
          <p className="text-xs font-semibold">No active ads posted in this city yet.</p>
        </div>
      </div>
    );
  }

  const items: LatestAdItemWithSubName[] = latestAds.map((listing) => ({
    listing,
    subName: resolveSubName(listing.categoryId, listing.subcategoryId),
  }));

  const referencedIds = new Set<string>();
  for (const listing of latestAds) {
    if (listing.categoryId) referencedIds.add(listing.categoryId);
    if (listing.subcategoryId) referencedIds.add(listing.subcategoryId);
  }
  const referencedCategories = categories.filter((c) => referencedIds.has(c.id));

  return (
    <LatestAdsToggleWrapper
      title={titleNode}
      items={items}
      categories={referencedCategories}
      latestAdsLayout={latestAdsLayout}
      onChangeLayout={onChangeLayout}
    />
  );
};
