import { AppClientRouter } from '@/components/AppClientRouter';
import { getInitialServerDataForAppRouter } from '@/server/services/initialServerData';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Account & Ads Management | Classifieds V2',
  description: 'Manage your active listings, saved favorites, invoices, buyer messages, and KYC verification.',
};

export default async function MyAccountPage() {
  const initialServerData = await getInitialServerDataForAppRouter();
  return <AppClientRouter initialPath="/my-account" initialServerData={initialServerData} />;
}
