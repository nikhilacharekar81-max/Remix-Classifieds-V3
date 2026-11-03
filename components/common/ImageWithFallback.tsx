'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, 
  Car, 
  Bike, 
  Smartphone, 
  Home, 
  Briefcase, 
  Tag, 
  GraduationCap, 
  Heart, 
  Sparkles,
  Camera,
  Layers,
  ImageOff
} from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  categoryId?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}

const BROKEN_UNSPLASH_REPLACEMENTS: Record<string, string> = {
  '1586191582056-a36a297921c5': '1601584115197-04ecc0da31d7',
  '1580481072645-022f9a6d83d0': '1555041469-a586c61ea9bc',
  '1626225967045-94408422617d': '1576678927484-cc907957088c',
  '1534536281715-e28d7674177d': '1521791136064-7986c2920216',
};

function normalizeImageUrl(rawSrc: string): string {
  if (!rawSrc) return '';
  let normalized = rawSrc;
  for (const [brokenId, validId] of Object.entries(BROKEN_UNSPLASH_REPLACEMENTS)) {
    if (normalized.includes(brokenId)) {
      normalized = normalized.replace(brokenId, validId);
    }
  }
  return normalized;
}

// Map categories to beautiful design styles and icons
const CATEGORY_FALLBACKS: Record<string, { icon: React.ComponentType<any>; bg: string; text: string }> = {
  cat_services: {
    icon: Wrench,
    bg: 'from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/40',
    text: 'text-blue-600 dark:text-blue-400'
  },
  cat_vehicles: {
    icon: Car,
    bg: 'from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  cat_cars: {
    icon: Car,
    bg: 'from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  cat_bikes: {
    icon: Bike,
    bg: 'from-teal-50 to-cyan-100 dark:from-teal-950/40 dark:to-cyan-950/40',
    text: 'text-teal-600 dark:text-teal-400'
  },
  cat_electronics: {
    icon: Smartphone,
    bg: 'from-purple-50 to-fuchsia-100 dark:from-purple-950/40 dark:to-fuchsia-950/40',
    text: 'text-purple-600 dark:text-purple-400'
  },
  cat_mobiles: {
    icon: Smartphone,
    bg: 'from-purple-50 to-fuchsia-100 dark:from-purple-950/40 dark:to-fuchsia-950/40',
    text: 'text-purple-600 dark:text-purple-400'
  },
  cat_real_estate: {
    icon: Home,
    bg: 'from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40',
    text: 'text-amber-600 dark:text-amber-400'
  },
  cat_housing_realestate: {
    icon: Home,
    bg: 'from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40',
    text: 'text-amber-600 dark:text-amber-400'
  },
  cat_jobs: {
    icon: Briefcase,
    bg: 'from-sky-50 to-blue-100 dark:from-sky-950/40 dark:to-blue-950/40',
    text: 'text-sky-600 dark:text-sky-400'
  },
  cat_education: {
    icon: GraduationCap,
    bg: 'from-indigo-50 to-violet-100 dark:from-indigo-950/40 dark:to-violet-950/40',
    text: 'text-indigo-600 dark:text-indigo-400'
  },
  cat_health: {
    icon: Heart,
    bg: 'from-rose-50 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40',
    text: 'text-rose-600 dark:text-rose-400'
  }
};

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  categoryId = 'all',
  className = '',
  style,
  priority = false,
}) => {
  const resolvedSrc = normalizeImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0 && resolvedSrc) {
      setFailedSrc(resolvedSrc);
    }
  }, [resolvedSrc]);

  if (!resolvedSrc || failedSrc === resolvedSrc) {
    // Determine the fallback style
    const fallback = CATEGORY_FALLBACKS[categoryId] || {
      icon: ImageOff,
      bg: 'from-slate-50 to-slate-100 dark:from-slate-900/60 dark:to-slate-950/60',
      text: 'text-slate-400 dark:text-slate-500'
    };

    const IconComponent = fallback.icon;

    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br ${fallback.bg} border border-slate-100 dark:border-slate-800/40 select-none ${className}`}
        style={style}
      >
        <div className={`p-3 rounded-full bg-white dark:bg-slate-900 shadow-xs border border-slate-100/55 dark:border-slate-800/60 ${fallback.text} mb-2`}>
          <IconComponent className="w-6 h-6" strokeWidth={1.8} />
        </div>
        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
          Chillyads
        </span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailedSrc(resolvedSrc)}
      className={className}
      style={style}
    />
  );
};

