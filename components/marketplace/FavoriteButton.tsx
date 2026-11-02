'use client';

import React, { useCallback, useSyncExternalStore } from 'react';
import { Heart } from 'lucide-react';
import { Listing } from '@/lib/types';
import { dispatchPublicToast } from '@/components/common/ChunkErrorRecovery';

export interface FavoriteButtonProps {
  listing: Listing;
  onSaveWatchlist?: (listing: Listing) => void;
  variant?: 'grid' | 'listicle';
}

const WATCHLIST_STORAGE_KEY = 'chilly_saved_watchlist_ids';
const WATCHLIST_EVENT_NAME = 'chilly_watchlist_change';

function subscribeWatchlist(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(WATCHLIST_EVENT_NAME, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(WATCHLIST_EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
}

function getServerSavedSnapshot(): boolean {
  return false;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listing,
  onSaveWatchlist,
  variant = 'grid',
}) => {
  const getClientSavedSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (!raw) return false;
      const ids = JSON.parse(raw) as string[];
      return Array.isArray(ids) && ids.includes(listing.id);
    } catch {
      return false;
    }
  }, [listing.id]);

  const isSaved = useSyncExternalStore(
    subscribeWatchlist,
    getClientSavedSnapshot,
    getServerSavedSnapshot
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    let nextSaved = !isSaved;
    try {
      const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const exists = ids.includes(listing.id);
      const updated = exists ? ids.filter((id) => id !== listing.id) : [...ids, listing.id];
      window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
      nextSaved = !exists;
      window.dispatchEvent(new CustomEvent(WATCHLIST_EVENT_NAME));
    } catch {
      // ignore storage errors
    }

    if (onSaveWatchlist) {
      onSaveWatchlist(listing);
      return;
    }

    dispatchPublicToast({
      type: 'info',
      title: nextSaved ? 'Saved to Watchlist' : 'Removed from Watchlist',
      message: nextSaved
        ? `"${listing.title}" saved to your watchlist.`
        : `"${listing.title}" removed from your watchlist.`,
    });
  };

  if (variant === 'listicle') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSaved}
        className={`relative z-20 p-1.5 rounded-md border border-[#dadce0] transition-colors cursor-pointer ${
          isSaved
            ? 'text-[#ea4335] bg-[#fce8e6]/40 border-[#f6aea9]'
            : 'text-[#5f6368] hover:text-[#ea4335] hover:bg-[#f8f9fa]'
        }`}
        title={isSaved ? 'Saved in Watchlist' : 'Save to Watchlist'}
      >
        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isSaved}
      className={`absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-xs cursor-pointer ${
        isSaved ? 'text-[#ea4335]' : 'text-[#5f6368] hover:text-[#ea4335]'
      }`}
      title={isSaved ? 'Saved in Watchlist' : 'Save to Watchlist'}
    >
      <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
    </button>
  );
};
