'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const AdminSidebar = dynamic(() =>
  import('@/components/admin/AdminSidebar').then((m) => m.AdminSidebar)
);
const AdminHeader = dynamic(() =>
  import('@/components/admin/AdminHeader').then((m) => m.AdminHeader)
);
const DashboardModule = dynamic(() =>
  import('@/components/admin/modules/DashboardModule').then((m) => m.DashboardModule)
);
const ListingsModule = dynamic(() =>
  import('@/components/admin/modules/ListingsModule').then((m) => m.ListingsModule)
);
const CategoriesModule = dynamic(() =>
  import('@/components/admin/modules/CategoriesModule').then((m) => m.CategoriesModule)
);
const AttributesModule = dynamic(() =>
  import('@/components/admin/modules/AttributesModule').then((m) => m.AttributesModule)
);
const UsersModule = dynamic(() =>
  import('@/components/admin/modules/UsersModule').then((m) => m.UsersModule)
);
const ModerationModule = dynamic(() =>
  import('@/components/admin/modules/ModerationModule').then((m) => m.ModerationModule)
);
const CommerceModule = dynamic(() =>
  import('@/components/admin/modules/CommerceModule').then((m) => m.CommerceModule)
);
const LocationsModule = dynamic(() =>
  import('@/components/admin/modules/LocationsModule').then((m) => m.LocationsModule)
);
const AdvertisingModule = dynamic(() =>
  import('@/components/admin/modules/AdvertisingModule').then((m) => m.AdvertisingModule)
);
const CommunicationModule = dynamic(() =>
  import('@/components/admin/modules/CommunicationModule').then((m) => m.CommunicationModule)
);
const CmsSeoModule = dynamic(() =>
  import('@/components/admin/modules/CmsSeoModule').then((m) => m.CmsSeoModule)
);
const AnalyticsModule = dynamic(() =>
  import('@/components/admin/modules/AnalyticsModule').then((m) => m.AnalyticsModule)
);
const AdminSettingsModule = dynamic(() =>
  import('@/components/admin/modules/AdminSettingsModule').then((m) => m.AdminSettingsModule)
);
const EmailManagementModule = dynamic(() =>
  import('@/components/admin/modules/EmailManagementModule').then((m) => m.EmailManagementModule)
);
const PaidFeaturesModule = dynamic(() =>
  import('@/components/admin/modules/PaidFeaturesModule').then((m) => m.PaidFeaturesModule)
);
const GlobalSearchPage = dynamic(() =>
  import('@/components/admin/pages/GlobalSearchPage').then((m) => m.GlobalSearchPage)
);
const KycVerificationPage = dynamic(() =>
  import('@/components/admin/pages/KycVerificationPage').then((m) => m.KycVerificationPage)
);

function renderAdminModule(path: string, activeSidebarTab: string) {
  if (path.startsWith('/admin/users/kyc/')) {
    const userId = path.split('/')[4];
    return <KycVerificationPage userId={userId} />;
  }

  if (path === '/admin/search' || path.startsWith('/admin/search')) {
    return <GlobalSearchPage />;
  }

  const sub = path.replace(/^\/admin\/?/, '') || activeSidebarTab || 'dashboard';

  if (sub.startsWith('marketplace/categories')) {
    return <CategoriesModule />;
  }
  if (sub.startsWith('marketplace/attributes')) {
    return <AttributesModule />;
  }
  if (sub.startsWith('commerce/packages')) {
    return <CommerceModule />;
  }
  if (sub.startsWith('moderation/rules')) {
    return <ModerationModule />;
  }
  if (sub.startsWith('email/')) {
    const tab = sub.replace('email/', '') as any;
    return <EmailManagementModule initialTab={tab || 'dashboard'} />;
  }

  switch (sub) {
    case 'dashboard':
      return <DashboardModule />;

    case 'email':
    case 'email/dashboard':
      return <EmailManagementModule initialTab="dashboard" />;
    case 'email/send':
      return <EmailManagementModule initialTab="send" />;
    case 'email/campaigns':
      return <EmailManagementModule initialTab="campaigns" />;
    case 'email/templates':
      return <EmailManagementModule initialTab="templates" />;
    case 'email/settings':
      return <EmailManagementModule initialTab="settings" />;
    case 'email/logs':
      return <EmailManagementModule initialTab="logs" />;

    case 'marketplace/listings':
      return <ListingsModule initialStatusFilter="all" />;
    case 'marketplace/pending':
      return <ListingsModule initialStatusFilter="pending" />;
    case 'marketplace/expired':
      return <ListingsModule initialStatusFilter="expired" />;
    case 'marketplace/featured':
      return <ListingsModule initialStatusFilter="all" />;
    case 'marketplace/locations':
      return <LocationsModule />;

    case 'users/all':
      return <UsersModule initialTab="all" />;
    case 'users/regular':
      return <UsersModule initialTab="users" />;
    case 'users/businesses':
      return <UsersModule initialTab="businesses" />;
    case 'users/verification':
      return <UsersModule initialTab="verification" />;
    case 'users/banned':
      return <UsersModule initialTab="banned" />;

    case 'moderation/reports':
    case 'moderation/spam':
    case 'moderation/fraud':
    case 'moderation/rules':
    case 'moderation/reviews':
      return <ModerationModule />;

    case 'paid-features':
      return <PaidFeaturesModule />;

    case 'commerce/orders':
    case 'commerce/transactions':
    case 'commerce/subscriptions':
    case 'commerce/packages':
    case 'commerce/coupons':
    case 'commerce/refunds':
    case 'commerce/taxes':
      return <CommerceModule />;

    case 'advertising/campaigns':
    case 'advertising/banners':
    case 'advertising/sponsored':
    case 'advertising/advertisers':
      return <AdvertisingModule />;

    case 'communication/messages':
    case 'communication/email':
    case 'communication/sms':
    case 'communication/push':
    case 'communication/templates':
      return <CommunicationModule />;

    case 'cms/pages':
    case 'cms/blog':
    case 'cms/faq':
    case 'cms/media':
    case 'cms/menus':
    case 'seo/metadata':
    case 'seo/redirects':
    case 'seo/sitemap':
    case 'seo/templates':
      return <CmsSeoModule />;

    case 'analytics/marketplace':
    case 'analytics/users':
    case 'analytics/listings':
    case 'analytics/revenue':
    case 'analytics/reports':
      return <AnalyticsModule />;

    case 'admin/users':
    case 'admin/roles':
    case 'admin/logs':
    case 'admin/settings':
    case 'admin/gateways':
    case 'admin/integrations':
      return <AdminSettingsModule />;

    default:
      return <DashboardModule />;
  }
}

export interface AdminWorkspaceRouterProps {
  path: string;
  activeSidebarTab: string;
  theme: 'light' | 'dark';
}

export const AdminWorkspaceRouter: React.FC<AdminWorkspaceRouterProps> = ({
  path,
  activeSidebarTab,
  theme,
}) => {
  return (
    <div
      className={`min-h-screen bg-slate-100 dark:bg-slate-950 flex transition-colors ${
        theme === 'dark' ? 'dark' : ''
      }`}
    >
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden h-screen">
        <AdminHeader />
        <main className="flex-1 pb-16">{renderAdminModule(path, activeSidebarTab)}</main>
      </div>
    </div>
  );
};
