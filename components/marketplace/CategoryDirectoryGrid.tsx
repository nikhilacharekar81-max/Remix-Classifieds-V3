'use client';
import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Car,
  Briefcase,
  Building2,
  Package,
  Users,
  Heart,
  PawPrint,
  Smartphone,
  Tv,
  Armchair,
  Bike,
  Shirt,
  BookOpen,
  Truck,
  Tag,
  Layers,
  Search,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Grid,
  List,
  FolderOpen,
  Filter,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Category } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { useNavigationFeedback } from '@/lib/router/useRouter';
import { buildChillyUrl } from '@/lib/utils/seoAndUrlHelper';
import { NavLink } from '@/components/common/NavLink';

interface CategoryDirectoryGridProps {
  categories: Category[];
  currentCity?: string;
  onSelectCategory?: (categoryId: string) => void;
  onSelectSubcategory?: (categoryId: string, subcategoryId: string) => void;
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  variant?: 'marketplace' | 'admin' | 'standalone';
  className?: string;
}

const ICONS_MAP: Record<string, React.FC<{ className?: string }>> = {
  Wrench,
  Car,
  Briefcase,
  Building2,
  Package,
  Users,
  Heart,
  PawPrint,
  Smartphone,
  Tv,
  Armchair,
  Bike,
  Shirt,
  BookOpen,
  Truck,
  Tag,
  Layers,
};

// Subtle distinct theme colors for Chillyads categories
const CATEGORY_THEMES: Record<string, { bg: string; text: string; badge: string; border: string; hover: string }> = {
  cat_services: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    hover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
  },
  cat_cars: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-800/60',
    hover: 'hover:border-blue-400 dark:hover:border-blue-600',
  },
  cat_bikes: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200',
    border: 'border-cyan-200 dark:border-cyan-800/60',
    hover: 'hover:border-cyan-400 dark:hover:border-cyan-600',
  },
  cat_electronics: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200',
    border: 'border-purple-200 dark:border-purple-800/60',
    hover: 'hover:border-purple-400 dark:hover:border-purple-600',
  },
  cat_mobiles: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    hover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
  },
  cat_comm_vehicles: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200',
    border: 'border-orange-200 dark:border-orange-800/60',
    hover: 'hover:border-orange-400 dark:hover:border-orange-600',
  },
  cat_jobs: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    hover: 'hover:border-indigo-400 dark:hover:border-indigo-600',
  },
  cat_furniture: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-800/60',
    hover: 'hover:border-amber-400 dark:hover:border-amber-600',
  },
  cat_fashion: {
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    text: 'text-pink-700 dark:text-pink-300',
    badge: 'bg-pink-100 dark:bg-pink-900/60 text-pink-800 dark:text-pink-200',
    border: 'border-pink-200 dark:border-pink-800/60',
    hover: 'hover:border-pink-400 dark:hover:border-pink-600',
  },
  cat_books_sports: {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-700 dark:text-teal-300',
    badge: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200',
    border: 'border-teal-200 dark:border-teal-800/60',
    hover: 'hover:border-teal-400 dark:hover:border-teal-600',
  },
  cat_pets: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200',
    border: 'border-rose-200 dark:border-rose-800/60',
    hover: 'hover:border-rose-400 dark:hover:border-rose-600',
  },
};

export const CategoryDirectoryGrid: React.FC<CategoryDirectoryGridProps> = ({
  categories,
  currentCity = 'All India',
  onSelectCategory,
  onSelectSubcategory,
  selectedCategoryId,
  selectedSubcategoryId,
  variant = 'marketplace',
  className = '',
}) => {
  const { listings } = useApp();
  const { isUrlPending } = useNavigationFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [activeTabFilter, setActiveTabFilter] = useState<string>('all');
  const [viewDensity, setViewDensity] = useState<'standard' | 'compact'>('standard');

  // Root categories
  const rootCategories = useMemo(() => {
    return categories
      .filter((c) => !c.parentId && c.isActive)
      .sort((a, b) => a.order - b.order);
  }, [categories]);

  // Subcategories mapping by parentId
  const subcategoriesByParent = useMemo(() => {
    const map: Record<string, Category[]> = {};
    rootCategories.forEach((root) => {
      map[root.id] = categories
        .filter((c) => c.parentId === root.id && c.isActive)
        .sort((a, b) => a.order - b.order);
    });
    return map;
  }, [categories, rootCategories]);

  // Real-time count of active listings per category and subcategory
  const listingCounts = useMemo(() => {
    const subMap: Record<string, number> = {};
    const parentMap: Record<string, number> = {};

    listings.forEach((lst) => {
      if (lst.status === 'approved') {
        parentMap[lst.categoryId] = (parentMap[lst.categoryId] || 0) + 1;
        if (lst.subcategoryId) {
          subMap[lst.subcategoryId] = (subMap[lst.subcategoryId] || 0) + 1;
        }
      }
    });

    return { subMap, parentMap };
  }, [listings]);

  // Filter categories and subcategories based on search query and active quick filter
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return rootCategories
      .filter((cat) => {
        if (activeTabFilter !== 'all' && cat.id !== activeTabFilter) {
          return false;
        }
        return true;
      })
      .map((cat) => {
        const subs = subcategoriesByParent[cat.id] || [];
        const matchesCategory = cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);

        const matchingSubs = q
          ? subs.filter(
              (sub) =>
                sub.name.toLowerCase().includes(q) ||
                sub.slug.toLowerCase().includes(q) ||
                matchesCategory
            )
          : subs;

        const isVisible = matchesCategory || matchingSubs.length > 0;

        return {
          category: cat,
          subcategories: matchingSubs,
          totalSubCount: subs.length,
          isVisible,
        };
      })
      .filter((item) => item.isVisible);
  }, [rootCategories, subcategoriesByParent, searchQuery, activeTabFilter]);

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComp = ICONS_MAP[iconName] || Layers;
    return IconComp;
  };

  const totalAllSubs = Object.values(subcategoriesByParent).reduce((acc, subs) => acc + subs.length, 0);

  return (
    <section className={`w-full ${className}`}>
      {/* Directory Top Header Bar */}
      <div className="bg-white rounded-xl border border-[#dadce0] p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="p-1.5 rounded-lg bg-[#e6f4ea] text-[#137333]">
                <Grid className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#202124] tracking-tight">
                Explore Marketplace Categories
              </h2>
              <span className="text-xs text-[#5f6368] font-medium tabular-nums">
                · {rootCategories.length} categories · {totalAllSubs} services &amp; verticals
              </span>
            </div>
            <p className="text-xs text-[#5f6368]">
              Select a category or specialized vertical across {currentCity && currentCity !== 'All India' ? currentCity : 'India'}
            </p>
          </div>

          {/* Directory Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#5f6368] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter services or categories (e.g. cars, flats, tutor)..."
                className="w-full text-xs rounded-lg border border-[#dadce0] bg-[#f8f9fa] focus:bg-white pl-8 pr-3 py-2 text-[#202124] placeholder:text-[#5f6368] focus:outline-none focus:border-[#1dbf73] focus:ring-2 focus:ring-[#1dbf73]/15 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#5f6368] hover:text-[#202124] font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Density Toggle */}
            <div className="flex items-center border border-[#dadce0] rounded-lg p-0.5 bg-[#f8f9fa]">
              <button
                onClick={() => setViewDensity('standard')}
                title="Standard Directory View"
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewDensity === 'standard'
                    ? 'bg-white text-[#202124] shadow-2xs border border-[#dadce0]/60'
                    : 'text-[#5f6368] hover:text-[#202124]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Cards</span>
              </button>
              <button
                onClick={() => setViewDensity('compact')}
                title="Compact Directory View"
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewDensity === 'compact'
                    ? 'bg-white text-[#202124] shadow-2xs border border-[#dadce0]/60'
                    : 'text-[#5f6368] hover:text-[#202124]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Compact</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid of Categories & Subcategories */}
      {filteredData.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#dadce0] p-10 text-center space-y-2">
          <Search className="w-8 h-8 text-[#5f6368] mx-auto" />
          <h3 className="font-bold text-[#202124]">No Matching Categories</h3>
          <p className="text-xs text-[#5f6368]">
            No category or subcategory matched &quot;{searchQuery}&quot;. Try a broader search term.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTabFilter('all');
            }}
            className="px-3.5 py-1.5 bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-[#dadce0] text-xs font-semibold rounded-md text-[#202124] cursor-pointer transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            viewDensity === 'compact'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
          }`}
        >
          {filteredData.map(({ category: cat, subcategories: subs, totalSubCount }) => {
            const isCatSelected = selectedCategoryId === cat.id;
            const IconComp = getCategoryIcon(cat.icon);
            const isExpanded = expandedCats[cat.id] || searchQuery.length > 0;
            const visibleSubs = isExpanded ? subs : subs.slice(0, 6);
            const hasMore = subs.length > 6 && !searchQuery;
            const totalLiveAds = (cat.listingCount && cat.listingCount > 0)
              ? cat.listingCount
              : (listingCounts.parentMap[cat.id] || 0);
            const catUrl = buildChillyUrl({
              city: currentCity,
              categoryId: cat.id,
              subcategoryId: 'all',
              categories,
            });
            const isCatPending = isUrlPending(catUrl);

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-xl border transition-all duration-150 flex flex-col justify-between overflow-hidden group ${
                  isCatSelected
                    ? 'border-[#1dbf73] ring-2 ring-[#1dbf73]/15 shadow-sm'
                    : 'border-[#dadce0] hover:border-[#1dbf73] hover:shadow-md'
                }`}
              >
                <div>
                  {/* Category Header Card (Fiverr + Cloud Service Tile) */}
                  <NavLink
                    href={catUrl}
                    showSpinner={false}
                    className="p-4 border-b border-[#f1f3f4] bg-white hover:bg-[#f8f9fa] cursor-pointer transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#f8f9fa] group-hover:bg-[#e6f4ea] flex items-center justify-center shrink-0 border border-[#dadce0] group-hover:border-[#1dbf73]/40 transition-colors">
                        <IconComp className="w-5 h-5 text-[#3c4043] group-hover:text-[#1dbf73] transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-[#202124] truncate tracking-tight group-hover:text-[#1dbf73] transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-[11px] text-[#5f6368] font-medium tabular-nums truncate mt-0.5">
                          {totalSubCount} verticals · <span className="text-[#202124] font-semibold">{totalLiveAds.toLocaleString()}</span> active
                        </p>
                      </div>
                    </div>

                    <span
                      className="w-7 h-7 rounded-md bg-[#f8f9fa] text-[#5f6368] group-hover:text-[#1dbf73] group-hover:bg-[#e6f4ea] flex items-center justify-center transition-colors shrink-0"
                      title={`Browse all in ${cat.name}`}
                    >
                      {isCatPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1dbf73]" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </NavLink>

                  {/* Subcategories List */}
                  <div className="p-3 space-y-0.5">
                    {visibleSubs.length === 0 ? (
                      <p className="text-xs text-[#5f6368] italic py-2 px-1">
                        No subcategories found matching &quot;{searchQuery}&quot;
                      </p>
                    ) : (
                      visibleSubs.map((sub) => {
                        const isSubSelected = selectedSubcategoryId === sub.id;
                        const subAds = (sub.listingCount && sub.listingCount > 0)
                          ? sub.listingCount
                          : (listingCounts.subMap[sub.id] || 0);
                        const subUrl = buildChillyUrl({
                          city: currentCity,
                          categoryId: cat.id,
                          subcategoryId: sub.id,
                          categories,
                        });
                        const isSubPending = isUrlPending(subUrl);

                        return (
                          <NavLink
                            key={sub.id}
                            href={subUrl}
                            showSpinner={false}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer group/item ${
                              isSubSelected
                                ? 'bg-[#e6f4ea] text-[#137333] font-semibold'
                                : 'text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#1dbf73]'
                            }`}
                          >
                            <span className="truncate">{sub.name}</span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {subAds > 0 && (
                                <span
                                  className={`text-[11px] font-mono tabular-nums transition-colors ${
                                    isSubSelected
                                      ? 'text-[#137333] font-bold'
                                      : 'text-[#5f6368] group-hover/item:text-[#1dbf73]'
                                  }`}
                                >
                                  {subAds.toLocaleString()}
                                </span>
                              )}
                              {isSubPending ? (
                                <Loader2 className="w-3 h-3 animate-spin text-[#1dbf73]" />
                              ) : (
                                <ChevronRight
                                  className={`w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity ${
                                    isSubSelected ? 'text-[#137333] opacity-100' : 'text-[#5f6368]'
                                  }`}
                                />
                              )}
                            </div>
                          </NavLink>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer action */}
                <div className="px-3.5 py-2.5 border-t border-[#f1f3f4] bg-[#f8f9fa] flex items-center justify-between text-xs">
                  {hasMore ? (
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="text-[11px] font-semibold text-[#1a73e8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? 'Show Less' : `+ ${subs.length - 6} more`}
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#5f6368] font-medium tabular-nums">
                      {subs.length} subcategories
                    </span>
                  )}

                  <NavLink
                    href={catUrl}
                    className="text-[11px] font-semibold text-[#3c4043] hover:text-[#1dbf73] flex items-center gap-0.5 cursor-pointer ml-auto"
                  >
                    <span>Explore</span>
                    <ChevronRight className="w-3 h-3" />
                  </NavLink>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

