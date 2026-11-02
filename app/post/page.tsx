import { AppClientRouter } from '@/components/AppClientRouter';
import { getInitialServerDataForAppRouter } from '@/server/services/initialServerData';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Post Free Classified Ad | Classifieds V2',
  description: 'Sell second-hand goods, cars, mobile phones, or post property listings in India.',
};

export default async function PostPage() {
  const initialServerData = await getInitialServerDataForAppRouter();
  return <AppClientRouter initialPath="/post" initialServerData={initialServerData} />;
}
