'use client';

import React, { useId, useState, useEffect } from 'react';
import Link, { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  getPendingNavigationUrl,
  normalizeInternalUrl,
  startNavigationFeedback,
} from '@/lib/router/useRouter';

export interface NavLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>,
    LinkProps {
  children: React.ReactNode;
  showSpinner?: boolean;
  spinnerClassName?: string;
}

export const NavLink: React.FC<NavLinkProps> = ({
  href,
  onClick,
  className = '',
  children,
  showSpinner = true,
  spinnerClassName = 'w-3 h-3 animate-spin shrink-0 opacity-80 inline-block ml-1.5 align-middle',
  ...rest
}) => {
  const linkId = useId();
  const pathname = usePathname();
  const [pendingForPath, setPendingForPath] = useState<string | null>(null);
  const hrefString = typeof href === 'string' ? href : href.pathname || '/';
  const isThisLinkPending = pendingForPath !== null && pendingForPath === pathname;

  useEffect(() => {
    if (!isThisLinkPending) return;
    const timer = setTimeout(() => {
      setPendingForPath(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [isThisLinkPending]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Preserve standard browser behavior for new-tab / modifier clicks
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0 ||
      rest.target === '_blank'
    ) {
      onClick?.(e);
      return;
    }

    const normalizedTarget = normalizeInternalUrl(hrefString);
    const currentPending = getPendingNavigationUrl();

    // Prevent duplicate clicks while the same navigation is already in progress
    if (currentPending && currentPending === normalizedTarget) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    onClick?.(e);

    if (!e.defaultPrevented) {
      const started = startNavigationFeedback(hrefString, linkId);
      if (!started) {
        // Already at this exact URL with no pending navigation
        e.preventDefault();
      } else if (showSpinner) {
        setPendingForPath(pathname);
      }
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={isThisLinkPending || undefined}
      className={`${className} ${isThisLinkPending ? 'pointer-events-none' : ''}`}
      {...rest}
    >
      {children}
      {showSpinner && isThisLinkPending && (
        <Loader2 className={spinnerClassName} aria-label="Loading" />
      )}
    </Link>
  );
};

