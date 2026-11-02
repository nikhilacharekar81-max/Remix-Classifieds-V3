'use client';

import React, { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useApp, AppProvider, InitialServerData, useAppOptional } from '@/context/AppContext';
import { MarketplaceView } from '@/components/marketplace/MarketplaceView';
import { GlobalOverlays } from '@/components/common/GlobalOverlays';
import { useRouter } from '@/lib/router/useRouter';
import { parseChillyPath, updateSeoAndCanonical, findListingById } from '@/lib/utils/seoAndUrlHelper';
import { Listing } from '@/lib/types';

const ListingDetailPage = dynamic(() =>
  import('@/components/marketplace/ListingDetailPage').then((m) => m.ListingDetailPage)
);
const PostAdPage = dynamic(() =>
  import('@/components/marketplace/PostAdPage').then((m) => m.PostAdPage)
);
const UserPanelPage = dynamic(() =>
  import('@/components/user/UserPanelPage').then((m) => m.UserPanelPage)
);
const AdminWorkspaceRouter = dynamic(() =>
  import('@/components/admin/AdminWorkspaceRouter').then((m) => m.AdminWorkspaceRouter)
);

export interface AppClientRouterProps {
  initialPath?: string;
  initialQuery?: Record<string, string>;
  initialListing?: Listing | null;
  initialListings?: Listing[];
  initialTotalListings?: number;
  initialPage?: number;
  initialServerData?: InitialServerData;
}

function AppClientRouterInner({
  initialPath,
  initialQuery,
  initialListing,
  initialListings,
  initialTotalListings,
  initialPage,
}: AppClientRouterProps) {
  const {
    activeSidebarTab,
    setActiveSidebarTab,
    theme,
    locations,
    categories,
    listings,
    settings,
    selectedMarketplaceCity,
    setSelectedMarketplaceCity,
    selectedMarketplaceCategory,
    setSelectedMarketplaceCategory,
    selectedMarketplaceSubcategory,
    setSelectedMarketplaceSubcategory,
    marketplaceSearch,
    setMarketplaceSearch,
  } = useApp();
  const { path, query } = useRouter(initialPath, initialQuery);

  const parsedRoute = useMemo(() => {
    return parseChillyPath(path, locations, categories);
  }, [path, locations, categories]);

  useEffect(() => {
    if (parsedRoute.city && parsedRoute.city !== selectedMarketplaceCity) {
      setSelectedMarketplaceCity(parsedRoute.city);
    }

    if (parsedRoute.routeType !== 'admin') {
      if (parsedRoute.categoryId !== selectedMarketplaceCategory) {
        setSelectedMarketplaceCategory(parsedRoute.categoryId);
      }
      if (parsedRoute.subcategoryId !== selectedMarketplaceSubcategory) {
        setSelectedMarketplaceSubcategory(parsedRoute.subcategoryId);
      }
    }

    if (query.q !== undefined && query.q !== marketplaceSearch) {
      setMarketplaceSearch(query.q);
    }

    const activeListing = parsedRoute.listingId
      ? findListingById(initialListings || listings, parsedRoute.listingId) || initialListing || null
      : null;

    updateSeoAndCanonical(parsedRoute, {
      listing: activeListing,
      categories,
      siteName: settings?.siteName || 'Chillyads',
    });
  }, [
    parsedRoute,
    query.q,
    listings,
    initialListings,
    initialListing,
    categories,
    settings,
    selectedMarketplaceCity,
    selectedMarketplaceCategory,
    selectedMarketplaceSubcategory,
    marketplaceSearch,
    setSelectedMarketplaceCity,
    setSelectedMarketplaceCategory,
    setSelectedMarketplaceSubcategory,
    setMarketplaceSearch,
  ]);

  useEffect(() => {
    if (path.startsWith('/admin')) {
      const sub = path.replace(/^\/admin\/?/, '');
      if (
        sub &&
        !sub.startsWith('users/kyc') &&
        !sub.startsWith('search') &&
        !sub.startsWith('laravel')
      ) {
        const parts = sub.split('/');
        let targetTab = sub;
        if (parts.length >= 3 && (parts[2] === 'new' || parts[2] === 'edit')) {
          targetTab = `${parts[0]}/${parts[1]}`;
        }
        if (targetTab && targetTab !== activeSidebarTab) {
          setActiveSidebarTab(targetTab);
        }
      }
    }
  }, [path, activeSidebarTab, setActiveSidebarTab]);

  // Route: Listing Detail View (/ad/:id or /item/:id or /mumbai/cars/used-cars/...)
  if (parsedRoute.routeType === 'listing' && parsedRoute.listingId) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <ListingDetailPage
          listingId={parsedRoute.listingId}
          initialListing={initialListing}
          initialListings={initialListings}
        />
        <GlobalOverlays />
      </div>
    );
  }

  // Route: User Panel & Account Management (/my-account or /my-ads)
  if (parsedRoute.routeType === 'user-panel') {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <UserPanelPage />
        <GlobalOverlays />
      </div>
    );
  }

  // Route: Post Ad / Sell Page (/post or /sell)
  if (parsedRoute.routeType === 'post') {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <PostAdPage />
        <GlobalOverlays />
      </div>
    );
  }

  // Route: Admin Section (/admin/*)
  if (parsedRoute.routeType === 'admin') {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <AdminWorkspaceRouter
          path={path}
          activeSidebarTab={activeSidebarTab}
          theme={theme}
        />
        <GlobalOverlays />
      </div>
    );
  }

  // Default Route: Public Marketplace / Home / City / Category / Search
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <MarketplaceView
        initialRoute={parsedRoute}
        initialQuery={query}
        initialListings={initialListings}
        initialTotalListings={initialTotalListings}
        initialPage={initialPage}
      />
      <GlobalOverlays />
    </div>
  );
}

export function AppClientRouter(props: AppClientRouterProps = {}) {
  const existingContext = useAppOptional();
  if (!existingContext) {
    return (
      <AppProvider initialServerData={props.initialServerData}>
        <AppClientRouterInner {...props} />
      </AppProvider>
    );
  }
  return <AppClientRouterInner {...props} />;
}
