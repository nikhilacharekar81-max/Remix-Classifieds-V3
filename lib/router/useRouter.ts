'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter as useNextRouter, usePathname } from 'next/navigation';

export interface RouteInfo {
  path: string;
  params: Record<string, string>;
  search: string;
  query: Record<string, string>;
}

let activeNextRouter: ReturnType<typeof useNextRouter> | null = null;

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

export function navigateTo(targetUrl: string) {
  if (typeof window === 'undefined') return;

  let cleanUrl = targetUrl;
  if (cleanUrl.startsWith('#')) {
    cleanUrl = cleanUrl.replace(/^#\/?/, '/');
  }
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = '/' + cleanUrl;
  }

  const isAdminInternal =
    window.location.pathname.startsWith('/admin') && cleanUrl.startsWith('/admin');
  if (isAdminInternal) {
    const currentFull = window.location.pathname + window.location.search;
    if (currentFull !== cleanUrl) {
      window.history.pushState({}, '', cleanUrl);
    }
    window.dispatchEvent(new PopStateEvent('popstate'));
    return;
  }

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      setClientLocation(window.location.pathname + window.location.search);
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
    (url: string) => {
      let cleanUrl = url;
      if (cleanUrl.startsWith('#')) {
        cleanUrl = cleanUrl.replace(/^#\/?/, '/');
      }
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = '/' + cleanUrl;
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
        return;
      }

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

