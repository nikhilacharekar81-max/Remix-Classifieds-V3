'use client';

import React from 'react';
import { Menu, Search, Plus, Loader2 } from 'lucide-react';
import { NavLink } from '@/components/common/NavLink';
import { LocationSelectorInput } from './LocationSelectorInput';
import { MyAccountDropdown } from '@/components/common/MyAccountDropdown';
import { navigateTo, useNavigationFeedback } from '@/lib/router/useRouter';

export interface MarketplaceHeaderProps {
  effectiveCity: string;
  effectiveSearch: string;
  onSearchChange: (q: string) => void;
  onOpenMobileMenu?: () => void;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  effectiveCity,
  effectiveSearch,
  onSearchChange,
  onOpenMobileMenu,
}) => {
  const { isUrlPending } = useNavigationFeedback();
  const searchTargetUrl = `/search?q=${encodeURIComponent(effectiveSearch)}`;
  const isSearchPending = isUrlPending(searchTargetUrl);

  return (
    <>
      {/* Google Cloud 4-Color Accent Hairline */}
      <div className="h-[3px] w-full flex shrink-0">
        <div className="flex-1 bg-[#4285F4]" />
        <div className="flex-1 bg-[#EA4335]" />
        <div className="flex-1 bg-[#FBBC05]" />
        <div className="flex-1 bg-[#34A853]" />
      </div>

      {/* Main Navigation Header */}
      <header className="bg-white border-b border-[#dadce0] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Desktop & Top Mobile Bar */}
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Mobile Menu Toggle */}
            <div className="flex items-center gap-4">
              {onOpenMobileMenu && (
                <button
                  onClick={onOpenMobileMenu}
                  className="sm:hidden p-2 text-[#3c4043] hover:bg-[#f1f3f4] rounded-md transition-colors cursor-pointer"
                  title="Open Chillyads Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <NavLink
                href="/"
                className="flex items-baseline font-black text-2xl tracking-tight text-[#202124] cursor-pointer select-none"
              >
                <span>chillyads</span>
                <span className="text-[#1dbf73] text-3xl leading-none">.</span>
              </NavLink>

              {/* Typeable Location Selector (Desktop) */}
              <div className="hidden sm:block">
                <LocationSelectorInput currentCity={effectiveCity} />
              </div>
            </div>

            {/* Search Bar (Desktop View) */}
            <div className="hidden sm:flex flex-1 max-w-xl relative">
              <input
                type="text"
                value={effectiveSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigateTo(searchTargetUrl);
                  }
                }}
                placeholder="What service, vehicle, or property are you looking for today?"
                className="w-full text-xs rounded-l-md border border-r-0 border-[#dadce0] pl-4 pr-4 py-2.5 focus:outline-none focus:border-[#202124] placeholder:text-[#5f6368] font-medium text-[#202124]"
              />
              <button
                onClick={() => navigateTo(searchTargetUrl)}
                className="px-4 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-r-md flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Search Marketplace"
              >
                {isSearchPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Actions: My Account Dropdown & Post Ad CTA */}
            <div className="flex items-center gap-2 sm:gap-3">
              <MyAccountDropdown />

              <NavLink
                href="/post"
                className="px-4 py-2 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold rounded-md text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Post a Gig / Ad</span>
              </NavLink>
            </div>
          </div>

          {/* Mobile Search Box (Below Logo & Top Bar on Mobile View) */}
          <div className="sm:hidden mt-3 flex">
            <input
              type="text"
              value={effectiveSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigateTo(searchTargetUrl);
                }
              }}
              placeholder="Find services, cars, mobiles, properties..."
              className="w-full text-xs rounded-l-md border border-r-0 border-[#dadce0] pl-3.5 pr-3 py-2.5 focus:outline-none placeholder:text-[#5f6368] font-medium bg-[#f8f9fa]"
            />
            <button
              onClick={() => navigateTo(searchTargetUrl)}
              className="px-4 bg-[#1dbf73] text-white rounded-r-md flex items-center justify-center hover:bg-[#19a463] transition-colors cursor-pointer"
            >
              {isSearchPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Location Selector Bar */}
        <div className="sm:hidden px-4 pb-2.5 pt-1 border-t border-[#f1f3f4]">
          <LocationSelectorInput className="w-full" currentCity={effectiveCity} />
        </div>
      </header>
    </>
  );
};
