'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useRouter as useNextRouter, usePathname, useSearchParams } from 'next/navigation';

export interface RouteInfo {
  path: string;
  params: Record<string, string>;
  search: string;
  query: Record<string, string>;
}

export interface NavigationFeedbackState {
  pendingUrl: string | null;
  pendingLinkId: string | null;
}

let activeNextRouter: ReturnType<typeof useNextRouter> | null = null;

export function registerActiveNextRouter(router: ReturnType<typeof useNextRouter> | null) {
  activeNextRouter = router;
}

let navFeedbackState: NavigationFeedbackState = {
  pendingUrl: null,
  pendingLinkId: null,
};
let navSafetyTimer: ReturnType<typeof setTimeout> | null = null;
const navListeners = new Set<() => void>();

function emitNavFeedbackChange() {
  navListeners.forEach((listener) => listener());
}

export function normalizeInternalUrl(rawUrl: string): string {
  if (!rawUrl) return '/';
  let clean = rawUrl.trim();
  if (clean.includes('#')) {
    clean = clean.split('#')[0];
  }
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  const [pathPart, queryPart] = clean.split('?');
  const normalizedPath =
    pathPart && pathPart.length > 1 ? pathPart.replace(/\/+$/, '') : pathPart || '/';
  if (!queryPart) {
    return normalizedPath;
  }
  const params = new URLSearchParams(queryPart);
  params.sort();
  const qs = params.toString();
  return qs ? `${normalizedPath}?${qs}` : normalizedPath;
}

export function getCurrentNormalizedBrowserUrl(): string {
  if (typeof window === 'undefined') return '/';
  return normalizeInternalUrl(window.location.pathname + window.location.search);
}

/**
 * Starts visual navigation feedback for `targetUrl`.
 * Returns `false` if the same navigation is already in progress (to prevent duplicate clicks)
 * or if the browser is already at `targetUrl` with no pending navigation.
 */
export function startNavigationFeedback(targetUrl: string, linkId?: string): boolean {
  if (typeof window === 'undefined') return true;

  const normalizedTarget = normalizeInternalUrl(targetUrl);

  // Prevent duplicate clicks while the exact same navigation is already in progress
  if (navFeedbackState.pendingUrl && navFeedbackState.pendingUrl === normalizedTarget) {
    return false;
  }

  const currentUrl = getCurrentNormalizedBrowserUrl();
  if (!navFeedbackState.pendingUrl && normalizedTarget === currentUrl) {
    return false;
  }

  if (navSafetyTimer) {
    clearTimeout(navSafetyTimer);
  }

  navFeedbackState = {
    pendingUrl: normalizedTarget,
    pendingLinkId: linkId || null,
  };
  emitNavFeedbackChange();

  // Safety fallback so the spinner never stays stuck if navigation is aborted
  navSafetyTimer = setTimeout(() => {
    clearNavigationFeedback();
  }, 10000);

  return true;
}

export function clearNavigationFeedback(): void {
  if (navSafetyTimer) {
    clearTimeout(navSafetyTimer);
    navSafetyTimer = null;
  }
  if (navFeedbackState.pendingUrl !== null || navFeedbackState.pendingLinkId !== null) {
    navFeedbackState = {
      pendingUrl: null,
      pendingLinkId: null,
    };
    emitNavFeedbackChange();
  }
}

function subscribeNavFeedback(listener: () => void) {
  navListeners.add(listener);
  return () => {
    navListeners.delete(listener);
  };
}

function getNavFeedbackSnapshot(): NavigationFeedbackState {
  return navFeedbackState;
}

export function getPendingNavigationUrl(): string | null {
  return navFeedbackState.pendingUrl;
}

const SERVER_NAV_SNAPSHOT: NavigationFeedbackState = {
  pendingUrl: null,
  pendingLinkId: null,
};

function getServerNavFeedbackSnapshot(): NavigationFeedbackState {
  return SERVER_NAV_SNAPSHOT;
}

export function useNavigationFeedback() {
  const state = useSyncExternalStore(
    subscribeNavFeedback,
    getNavFeedbackSnapshot,
    getServerNavFeedbackSnapshot
  );

  const isUrlPending = useCallback(
    (targetUrl: string, linkId?: string) => {
      if (!state.pendingUrl) return false;
      if (linkId && state.pendingLinkId) {
        return state.pendingLinkId === linkId;
      }
      return state.pendingUrl === normalizeInternalUrl(targetUrl);
    },
    [state.pendingUrl, state.pendingLinkId]
  );

  const isSameUrlInProgress = useCallback(
    (targetUrl: string) => {
      if (!state.pendingUrl) return false;
      return state.pendingUrl === normalizeInternalUrl(targetUrl);
    },
    [state.pendingUrl]
  );

  return {
    pendingUrl: state.pendingUrl,
    pendingLinkId: state.pendingLinkId,
    isNavigating: state.pendingUrl !== null,
    isUrlPending,
    isSameUrlInProgress,
    startNavigationFeedback,
    clearNavigationFeedback,
  };
}

export function parsePath(rawPathAndSearch?: string): { path: string; query: Record<string, string> } {
  let raw = rawPathAndSearch;
  if (!raw) {
    if (typeof window !== 'undefined') {
      raw = window.location.pathname + window.location.search;
    } else {
      raw = '/';
    }
  }
  if (raw.includes('#')) {
    raw = raw.split('#')[0];
  }
  if (!raw.startsWith('/')) {
    raw = '/' + raw;
  }

  const [pathPart, queryPart] = raw.split('?');
  const query: Record<string, string> = {};

  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((val, key) => {
      query[key] = val;
    });
  }

  return { path: pathPart || '/', query };
}

export function navigateTo(targetUrl: string, linkId?: string) {
  if (typeof window === 'undefined') return;

  let cleanUrl = targetUrl;
  if (cleanUrl.startsWith('#')) {
    cleanUrl = cleanUrl.replace(/^#\/?/, '/');
  }
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = '/' + cleanUrl;
  }

  const normalizedTarget = normalizeInternalUrl(cleanUrl);

  // Prevent duplicate navigation while the same target URL is already loading
  if (navFeedbackState.pendingUrl && navFeedbackState.pendingUrl === normalizedTarget) {
    return;
  }

  const isAdminInternal =
    window.location.pathname.startsWith('/admin') && cleanUrl.startsWith('/admin');
  if (isAdminInternal) {
    const currentFull = window.location.pathname + window.location.search;
    if (currentFull !== cleanUrl) {
      window.history.pushState({}, '', cleanUrl);
    }
    window.dispatchEvent(new PopStateEvent('popstate'));
    clearNavigationFeedback();
    return;
  }

  const currentUrl = getCurrentNormalizedBrowserUrl();
  if (!navFeedbackState.pendingUrl && normalizedTarget === currentUrl) {
    return;
  }

  startNavigationFeedback(cleanUrl, linkId);

  if (activeNextRouter) {
    activeNextRouter.push(cleanUrl);
  } else {
    window.location.href = cleanUrl;
  }
}

export function useRouter(initialPath?: string, initialQuery?: Record<string, string>) {
  const nextRouter = useNextRouter();
  const nextPathname = usePathname();

  useEffect(() => {
    activeNextRouter = nextRouter;
  }, [nextRouter]);

  const [clientLocation, setClientLocation] = useState<string | null>(null);

  const initialQueryKey = useMemo(() => {
    if (!initialQuery) return '';
    const params = new URLSearchParams();
    Object.entries(initialQuery)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([k, v]) => {
        if (v !== undefined) params.set(k, v);
      });
    return params.toString();
  }, [initialQuery]);

  // Clear pending navigation spinner as soon as Next.js commits the route / query update
  useEffect(() => {
    clearNavigationFeedback();
  }, [nextPathname, initialPath, initialQueryKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      setClientLocation(window.location.pathname + window.location.search);
      clearNavigationFeedback();
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [nextPathname, initialPath]);

  const basePath = initialPath || nextPathname || '/';
  const isAdminRoute = basePath.startsWith('/admin');

  const { path, query } = useMemo(() => {
    if (isAdminRoute && clientLocation && clientLocation.startsWith('/admin')) {
      return parsePath(clientLocation);
    }

    const resolvedPath = parsePath(basePath).path;
    if (initialQuery !== undefined) {
      return { path: resolvedPath, query: initialQuery };
    }

    if (clientLocation) {
      const parsedClient = parsePath(clientLocation);
      if (parsedClient.path === resolvedPath) {
        return { path: resolvedPath, query: parsedClient.query };
      }
    }

    return parsePath(basePath);
  }, [isAdminRoute, clientLocation, basePath, initialQuery]);

  const navigate = useCallback(
    (url: string, linkId?: string) => {
      let cleanUrl = url;
      if (cleanUrl.startsWith('#')) {
        cleanUrl = cleanUrl.replace(/^#\/?/, '/');
      }
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = '/' + cleanUrl;
      }

      const normalizedTarget = normalizeInternalUrl(cleanUrl);
      if (navFeedbackState.pendingUrl && navFeedbackState.pendingUrl === normalizedTarget) {
        return;
      }

      if (
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/admin') &&
        cleanUrl.startsWith('/admin')
      ) {
        const currentFull = window.location.pathname + window.location.search;
        if (currentFull !== cleanUrl) {
          window.history.pushState({}, '', cleanUrl);
        }
        window.dispatchEvent(new PopStateEvent('popstate'));
        clearNavigationFeedback();
        return;
      }

      startNavigationFeedback(cleanUrl, linkId);
      nextRouter.push(cleanUrl);
    },
    [nextRouter]
  );

  return {
    path,
    query,
    navigate,
    navigateTo,
  };
}


