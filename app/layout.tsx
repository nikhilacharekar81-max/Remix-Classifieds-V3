import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ChunkErrorRecovery } from '@/components/common/ChunkErrorRecovery';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.chillyads.in'),
  title: 'Chillyads — Leading Verified Marketplace & Classifieds',
  description:
    'Buy, sell, and discover Cars, Mobiles, Real Estate, Electronics, Jobs, and Local Services with verified sellers, instant chat, and ad boost priority.',
  openGraph: {
    title: 'Classifieds V2 — Leading Verified Marketplace & Classifieds',
    description:
      'Buy, sell, and discover Cars, Mobiles, Real Estate, Electronics, Jobs, and Local Services with verified sellers.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Classifieds V2 — Leading Verified Marketplace & Classifieds',
    description:
      'Buy, sell, and discover Cars, Mobiles, Real Estate, Electronics, Jobs, and Local Services with verified sellers.',
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-[#f8f9fa] dark:bg-slate-950 text-[#202124] dark:text-slate-100 antialiased font-sans selection:bg-[#1dbf73] selection:text-white"
        suppressHydrationWarning
      >
        <ChunkErrorRecovery />
        {children}
      </body>
    </html>
  );
}



