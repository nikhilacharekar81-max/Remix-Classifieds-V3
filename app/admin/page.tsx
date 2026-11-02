import { AppClientRouter } from '@/components/AppClientRouter';
import { getInitialServerDataForAppRouter } from '@/server/services/initialServerData';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Suite & Control Center | Classifieds V2',
  description: 'Manage listings, moderation, categories, users, boost monetization, and email campaigns.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRootPage() {
  const initialServerData = await getInitialServerDataForAppRouter();
  return <AppClientRouter initialPath="/admin" initialServerData={initialServerData} />;
}
