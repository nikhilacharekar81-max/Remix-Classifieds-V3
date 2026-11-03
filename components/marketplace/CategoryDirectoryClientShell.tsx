'use client';

import React, { useState, useMemo } from 'react';
import { Search, Grid, List, ChevronRight } from 'lucide-react';
import { NavLink } from '@/components/common/NavLink';

export interface CompactDirectorySubcategory {
  id: string;
  name: string;
  slug: string;
  url: string;
  count: number;
  isSelected: boolean;
}

export interface CompactDirectoryCategoryItem {
  id: string;
  name: string;
  slug: string;
  catUrl: string;
  isSelected: boolean;
  totalSubCount: number;
  headerNode: React.ReactNode;
  defaultSubcategoriesNode: React.ReactNode;
  subcategories: CompactDirectorySubcategory[];
}

export interface CategoryDirectoryClientShellProps {
  items: CompactDirectoryCategoryItem[];
  titleNode: React.ReactNode;
  className?: string;
}

export const CategoryDirectoryClientShell: React.FC<CategoryDirectoryClientShellProps> = ({
  items,
  titleNode,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [viewDensity, setViewDensity] = useState<'standard' | 'compact'>('standard');

  const q = searchQuery.toLowerCase().trim();

  const filteredData = useMemo(() => {
    if (!q) {
      return items.map((item) => ({
        item,
        matchingSubs: item.subcategories,
      }));
    }

    return items
      .map((item) => {
        const matchesCategory =
          item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
        const matchingSubs = item.subcategories.filter(
          (sub) =>
            sub.name.toLowerCase().includes(q) ||
            sub.slug.toLowerCase().includes(q) ||
            matchesCategory
        );
        return {
          item,
          matchingSubs,
          isVisible: matchesCategory || matchingSubs.length > 0,
        };
      })
      .filter((entry) => entry.isVisible);
  }, [items, q]);

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  return (
    <section className={`w-full ${className}`}>
      {/* Directory Top Header Bar */}
      <div className="bg-white rounded-xl border border-[#dadce0] p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {titleNode}

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
                  type="button"
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
                type="button"
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
                type="button"
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
            type="button"
            onClick={() => setSearchQuery('')}
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
          {filteredData.map(({ item, matchingSubs }) => {
            const isExpanded = Boolean(expandedCats[item.id]) || q.length > 0;
            const hasMore = matchingSubs.length > 6 && !q;
            const useServerDefaultSubs = !isExpanded && !q;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border transition-all duration-150 flex flex-col justify-between overflow-hidden group ${
                  item.isSelected
                    ? 'border-[#1dbf73] ring-2 ring-[#1dbf73]/15 shadow-sm'
                    : 'border-[#dadce0] hover:border-[#1dbf73] hover:shadow-md'
                }`}
              >
                <div>
                  {/* Server-Rendered Category Header Card */}
                  {item.headerNode}

                  {/* Subcategories List: Server-Rendered by Default, Dynamic When Expanded or Filtered */}
                  {useServerDefaultSubs ? (
                    item.defaultSubcategoriesNode
                  ) : (
                    <div className="p-3 space-y-0.5">
                      {matchingSubs.length === 0 ? (
                        <p className="text-xs text-[#5f6368] italic py-2 px-1">
                          No subcategories found matching &quot;{searchQuery}&quot;
                        </p>
                      ) : (
                        matchingSubs.map((sub) => (
                          <NavLink
                            key={sub.id}
                            href={sub.url}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer group/item ${
                              sub.isSelected
                                ? 'bg-[#e6f4ea] text-[#137333] font-semibold'
                                : 'text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#1dbf73]'
                            }`}
                          >
                            <span className="truncate">{sub.name}</span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {sub.count > 0 && (
                                <span
                                  className={`text-[11px] font-mono tabular-nums transition-colors ${
                                    sub.isSelected
                                      ? 'text-[#137333] font-bold'
                                      : 'text-[#5f6368] group-hover/item:text-[#1dbf73]'
                                  }`}
                                >
                                  {sub.count.toLocaleString()}
                                </span>
                              )}
                              <ChevronRight
                                className={`w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity ${
                                  sub.isSelected ? 'text-[#137333] opacity-100' : 'text-[#5f6368]'
                                }`}
                              />
                            </div>
                          </NavLink>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Footer action */}
                <div className="px-3.5 py-2.5 border-t border-[#f1f3f4] bg-[#f8f9fa] flex items-center justify-between text-xs">
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="text-[11px] font-semibold text-[#1a73e8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? 'Show Less' : `+ ${matchingSubs.length - 6} more`}
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#5f6368] font-medium tabular-nums">
                      {matchingSubs.length} subcategories
                    </span>
                  )}

                  <NavLink
                    href={item.catUrl}
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
