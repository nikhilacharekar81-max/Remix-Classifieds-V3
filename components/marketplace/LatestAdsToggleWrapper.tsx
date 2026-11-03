'use client';

import React, { useState } from 'react';
import { Grid, List } from 'lucide-react';

export interface LatestAdsToggleWrapperProps {
  title: React.ReactNode;
  gridContent: React.ReactNode;
  listicleContent: React.ReactNode;
}

export const LatestAdsToggleWrapper: React.FC<LatestAdsToggleWrapperProps> = ({
  title,
  gridContent,
  listicleContent,
}) => {
  const [layout, setLayout] = useState<'grid' | 'listicle'>('grid');

  return (
    <div className="space-y-4 pt-4 border-t border-[#dadce0]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title}
        {/* Grid / Listicle View Toggle */}
        <div className="flex items-center border border-[#dadce0] rounded-lg p-0.5 bg-white">
          <button
            type="button"
            onClick={() => setLayout('grid')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              layout === 'grid'
                ? 'bg-[#e6f4ea] text-[#137333]'
                : 'text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setLayout('listicle')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              layout === 'listicle'
                ? 'bg-[#e6f4ea] text-[#137333]'
                : 'text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Listicle</span>
          </button>
        </div>
      </div>

      <div className={layout === 'grid' ? 'block' : 'hidden'}>
        {gridContent}
      </div>
      <div className={layout === 'listicle' ? 'block' : 'hidden'}>
        {listicleContent}
      </div>
    </div>
  );
};
