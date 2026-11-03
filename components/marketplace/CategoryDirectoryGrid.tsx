import React from 'react';
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
  ArrowUpRight,
  Grid,
} from 'lucide-react';
import { Category } from '@/lib/types';
import { buildChillyUrl } from '@/lib/utils/seoAndUrlHelper';
import { NavLink } from '@/components/common/NavLink';
import {
  CategoryDirectoryClientShell,
  CompactDirectoryCategoryItem,
} from './CategoryDirectoryClientShell';

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

export const CategoryDirectoryGrid: React.FC<CategoryDirectoryGridProps> = ({
  categories,
  currentCity = 'All India',
  selectedCategoryId,
  selectedSubcategoryId,
  className = '',
}) => {
  const rootCategories = categories
    .filter((c) => !c.parentId && c.isActive)
    .sort((a, b) => a.order - b.order);

  let totalAllSubs = 0;

  const items: CompactDirectoryCategoryItem[] = rootCategories.map((cat) => {
    const subs = categories
      .filter((c) => c.parentId === cat.id && c.isActive)
      .sort((a, b) => a.order - b.order);

    totalAllSubs += subs.length;

    const IconComp = ICONS_MAP[cat.icon] || Layers;
    const totalLiveAds = cat.listingCount || 0;
    const catUrl = buildChillyUrl({
      city: currentCity,
      categoryId: cat.id,
      subcategoryId: 'all',
      categories,
    });

    const compactSubs = subs.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      url: buildChillyUrl({
        city: currentCity,
        categoryId: cat.id,
        subcategoryId: sub.id,
        categories,
      }),
      count: sub.listingCount || 0,
      isSelected: selectedSubcategoryId === sub.id,
    }));

    const initialVisibleSubs = compactSubs.slice(0, 6);

    const headerNode = (
      <NavLink
        href={catUrl}
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
              {subs.length} verticals ·{' '}
              <span className="text-[#202124] font-semibold">
                {totalLiveAds.toLocaleString()}
              </span>{' '}
              active
            </p>
          </div>
        </div>

        <span
          className="w-7 h-7 rounded-md bg-[#f8f9fa] text-[#5f6368] group-hover:text-[#1dbf73] group-hover:bg-[#e6f4ea] flex items-center justify-center transition-colors shrink-0"
          title={`Browse all in ${cat.name}`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </NavLink>
    );

    const defaultSubcategoriesNode = (
      <div className="p-3 space-y-0.5">
        {initialVisibleSubs.map((sub) => (
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
              <span
                aria-hidden="true"
                className={`text-xs leading-none opacity-0 group-hover/item:opacity-100 transition-opacity ${
                  sub.isSelected ? 'text-[#137333] opacity-100' : 'text-[#5f6368]'
                }`}
              >
                ›
              </span>
            </div>
          </NavLink>
        ))}
      </div>
    );

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      catUrl,
      isSelected: selectedCategoryId === cat.id,
      totalSubCount: subs.length,
      headerNode,
      defaultSubcategoriesNode,
      subcategories: compactSubs,
    };
  });

  const titleNode = (
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
        Select a category or specialized vertical across{' '}
        {currentCity && currentCity !== 'All India' ? currentCity : 'India'}
      </p>
    </div>
  );

  return (
    <CategoryDirectoryClientShell
      items={items}
      titleNode={titleNode}
      className={className}
    />
  );
};
