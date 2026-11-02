'use client';

import { useEffect } from 'react';
import {
  attemptChunkErrorRecovery,
  isChunkLoadFailure,
} from '@/components/ClientAppProvider';
import { clearNavigationFeedback, getPendingNavigationUrl } from '@/lib/router/useRouter';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError = isChunkLoadFailure(error);

  useEffect(() => {
    clearNavigationFeedback();
    if (isChunkError) {
      attemptChunkErrorRecovery();
    }
  }, [error, isChunkError]);

  const handleRetry = () => {
    clearNavigationFeedback();
    if (isChunkError && typeof window !== 'undefined') {
      const targetUrl =
        getPendingNavigationUrl() || window.location.pathname + window.location.search;
      window.location.assign(targetUrl);
      return;
    }
    reset();
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-white">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">
            {isChunkError ? 'Updating page resources…' : 'Something went wrong'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isChunkError
              ? 'A new version of this page is available. Reloading automatically…'
              : 'An unexpected error occurred while loading this page.'}
          </p>
          <button
            onClick={handleRetry}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            {isChunkError ? 'Reload page' : 'Try again'}
          </button>
        </div>
      </body>
    </html>
  );
}

