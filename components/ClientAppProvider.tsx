'use client';

import React, { useEffect } from 'react';
import { AppProvider, InitialServerData } from '@/context/AppContext';
import { AppClientRouter } from '@/components/AppClientRouter';
import { clearNavigationFeedback, getPendingNavigationUrl } from '@/lib/router/useRouter';

// Ensure AppClientRouter and core marketplace views are part of the root layout client bundle
// so navigating to dynamic routes (/app/[city]/page, etc.) does not require downloading a separate multi-MB chunk.
const PRELOADED_ROUTER_REF = AppClientRouter;

const CHUNK_RECOVERY_STORAGE_KEY = '__fivepa_chunk_recovery_ts';
const CHUNK_RECOVERY_COOLDOWN_MS = 15000;

export function isChunkLoadFailure(errorOrMessage: unknown): boolean {
  if (!errorOrMessage) return false;
  const name =
    typeof errorOrMessage === 'object' && errorOrMessage !== null && 'name' in errorOrMessage
      ? String((errorOrMessage as { name?: unknown }).name)
      : '';
  const message =
    typeof errorOrMessage === 'string'
      ? errorOrMessage
      : typeof errorOrMessage === 'object' && errorOrMessage !== null && 'message' in errorOrMessage
        ? String((errorOrMessage as { message?: unknown }).message)
        : String(errorOrMessage);

  return (
    name === 'ChunkLoadError' ||
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\w[\]%./-]+ failed/i.test(message) ||
    /Loading CSS chunk [\w[\]%./-]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

export function attemptChunkErrorRecovery(explicitTargetUrl?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const targetUrl =
      explicitTargetUrl ||
      getPendingNavigationUrl() ||
      window.location.pathname + window.location.search;
    const now = Date.now();
    const rawState = window.sessionStorage.getItem(CHUNK_RECOVERY_STORAGE_KEY);
    if (rawState) {
      const parsed = JSON.parse(rawState) as { ts?: number; url?: string };
      if (
        parsed &&
        typeof parsed.ts === 'number' &&
        now - parsed.ts < CHUNK_RECOVERY_COOLDOWN_MS &&
        parsed.url === targetUrl
      ) {
        return false;
      }
    }
    window.sessionStorage.setItem(
      CHUNK_RECOVERY_STORAGE_KEY,
      JSON.stringify({ ts: now, url: targetUrl })
    );
    clearNavigationFeedback();
    window.location.assign(targetUrl);
    return true;
  } catch {
    return false;
  }
}

export function ClientAppProvider({
  children,
  initialServerData,
}: {
  children: React.ReactNode;
  initialServerData?: InitialServerData;
}) {
  useEffect(() => {
    if (!PRELOADED_ROUTER_REF) return;

    const handleWindowError = (event: ErrorEvent) => {
      if (isChunkLoadFailure(event.error) || isChunkLoadFailure(event.message)) {
        event.preventDefault?.();
        attemptChunkErrorRecovery();
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        target.tagName === 'SCRIPT' &&
        typeof (target as HTMLScriptElement).src === 'string' &&
        (target as HTMLScriptElement).src.includes('/_next/static/chunks/')
      ) {
        event.preventDefault?.();
        attemptChunkErrorRecovery();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadFailure(event.reason)) {
        event.preventDefault?.();
        attemptChunkErrorRecovery();
      }
    };

    window.addEventListener('error', handleWindowError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleWindowError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <AppProvider initialServerData={initialServerData}>{children}</AppProvider>;
}


