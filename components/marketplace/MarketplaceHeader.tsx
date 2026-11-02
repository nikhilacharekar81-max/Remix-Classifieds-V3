'use client';

import React, { useState } from 'react';
import { Menu, Search, Plus, Loader2, X, FolderTree, User, Shield, Tag } from 'lucide-react';
import { NavLink } from '@/components/common/NavLink';
import { LocationSelectorInput } from './LocationSelectorInput';
import { MyAccountDropdown } from '@/components/common/MyAccountDropdown';
import { navigateTo, useNavigationFeedback } from '@/lib/router/useRouter';
import { Category, LocationItem } from '@/lib/types';
import { buildChillyUrl } from '@/lib/utils/seoAndUrlHelper';
import { ICONS_MAP } from './categoryIcons';

export interface MarketplaceHeaderProps {
  effectiveCity: string;
  effectiveSearch?: string;
  onSearchChange?: (q: string) => void;
  onOpenMobileMenu?: () => void;
  categories?: Category[];
  locations?: LocationItem[];
  activeCategoryId?: string;
  activeSubcategoryId?: string;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  effectiveCity,
  effectiveSearch = '',
  onSearchChange,
  onOpenMobileMenu,
  categories,
  locations,
  activeCategoryId,
  activeSubcategoryId,
}) => {
  const [localSearch, setLocalSearch] = useState(effectiveSearch);
  const [localMobileDrawerOpen, setLocalMobileDrawerOpen] = useState(false);

  const currentSearch = onSearchChange ? effectiveSearch : localSearch;
  const handleSearchChange = (q: string) => {
    if (onSearchChange) {
      onSearchChange(q);
    } else {
      setLocalSearch(q);
    }
  };

  const { isUrlPending } = useNavigationFeedback();
  const searchTargetUrl = `/search?q=${encodeURIComponent(currentSearch)}`;
  const isSearchPending = isUrlPending(searchTargetUrl);

  const rootCategories = (categories || []).filter((c) => !c.parentId && c.isActive);

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
              <button
                onClick={() => {
                  if (onOpenMobileMenu) {
                    onOpenMobileMenu();
                  } else {
                    setLocalMobileDrawerOpen(true);
                  }
                }}
                className="sm:hidden p-2 text-[#3c4043] hover:bg-[#f1f3f4] rounded-md transition-colors cursor-pointer"
                title="Open Chillyads Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <NavLink
                href="/"
                className="flex items-baseline font-black text-2xl tracking-tight text-[#202124] cursor-pointer select-none"
              >
                <span>chillyads</span>
                <span className="text-[#1dbf73] text-3xl leading-none">.</span>
              </NavLink>

              {/* Typeable Location Selector (Desktop) */}
              <div className="hidden sm:block">
                <LocationSelectorInput
                  currentCity={effectiveCity}
                  categories={categories}
                  locations={locations}
                  currentCategoryId={activeCategoryId}
                  currentSubcategoryId={activeSubcategoryId}
                />
              </div>
            </div>

            {/* Search Bar (Desktop View) */}
            <div className="hidden sm:flex flex-1 max-w-xl relative">
              <input
                type="text"
                value={currentSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
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
              value={currentSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
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
          <LocationSelectorInput
            className="w-full"
            currentCity={effectiveCity}
            categories={categories}
            locations={locations}
            currentCategoryId={activeCategoryId}
            currentSubcategoryId={activeSubcategoryId}
          />
        </div>
      </header>

      {/* Lightweight Mobile Navigation Drawer for Server-First Public Pages */}
      {!onOpenMobileMenu && localMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setLocalMobileDrawerOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl tracking-tighter">
                  chillyads
                </div>
                <div>
                  <h3 className="text-sm font-bold">Welcome to Chillyads</h3>
                  <p className="text-[11px] text-slate-400">India’s Marketplace</p>
                </div>
              </div>
              <button
                onClick={() => setLocalMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1">
                <NavLink
                  href="/"
                  onClick={() => setLocalMobileDrawerOpen(false)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  <span>All Categories Directory</span>
                </NavLink>

                <NavLink
                  href="/post"
                  onClick={() => setLocalMobileDrawerOpen(false)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-3 transition-colors cursor-pointer border border-amber-200"
                >
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>Post Free Ad (+ SELL)</span>
                </NavLink>

                <NavLink
                  href="/my-account"
                  onClick={() => setLocalMobileDrawerOpen(false)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>My Account &amp; Saved Ads</span>
                </NavLink>

                <NavLink
                  href="/admin/dashboard"
                  onClick={() => setLocalMobileDrawerOpen(false)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Admin Panel &amp; Moderation</span>
                </NavLink>
              </div>

              {rootCategories.length > 0 && (
                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                    Browse Categories
                  </h4>
                  <div className="space-y-1">
                    {rootCategories.map((cat) => {
                      const IconComponent = ICONS_MAP[cat.icon || 'Tag'] || Tag;
                      const targetUrl = buildChillyUrl({
                        city: effectiveCity,
                        categoryId: cat.id,
                        subcategoryId: 'all',
                        categories: categories || [],
                      });
                      return (
                        <NavLink
                          key={cat.id}
                          href={targetUrl}
                          onClick={() => setLocalMobileDrawerOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <span>{cat.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
              <p className="text-[11px] text-slate-500 font-medium">
                Chillyads Classifieds India • v2.5
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
