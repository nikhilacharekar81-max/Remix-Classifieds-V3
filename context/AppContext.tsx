'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AdminUser,
  UserAccount,
  Listing,
  Category,
  CustomFieldDefinition,
  LocationItem,
  ReportItem,
  ModerationRule,
  PromotionalPackage,
  OrderTransaction,
  AuditLog,
  ToastMessage,
  SystemSettings,
  Role,
  UserGeoLocation,
  EmailLog,
  EmailSettings,
  EmailTemplate,
  NewsletterCampaign,
  EmailSmtpConfig,
  NewsletterAudienceFilter,
  CmsPage,
} from '@/lib/types';
import {
  INITIAL_CATEGORIES,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_LOCATIONS,
  INITIAL_USERS,
  INITIAL_LISTINGS,
  INITIAL_REPORTS,
  INITIAL_MODERATION_RULES,
  INITIAL_PACKAGES,
  INITIAL_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
  INITIAL_EMAIL_LOGS,
  INITIAL_EMAIL_SETTINGS,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_NEWSLETTERS,
  INITIAL_CMS_PAGES,
} from '@/lib/data/initialData';
import { seedCategoriesWithTenAds } from '@/lib/data/listingsSeeder';
import { isListingBoosted } from '@/lib/utils/boostHelper';
import { useEmailAndNewsletterActions } from './hooks/useEmailAndNewsletterActions';
import { useListingActions } from './hooks/useListingActions';
import { useAdminAndTaxonomyActions } from './hooks/useAdminAndTaxonomyActions';

interface AppContextType {
  // Navigation & Mode
  viewMode: 'admin' | 'marketplace';
  setViewMode: (mode: 'admin' | 'marketplace') => void;
  activeSidebarTab: string;
  setActiveSidebarTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  // Current logged in admin & permissions
  currentAdmin: AdminUser | null;
  switchAdminRole: (role: Role) => void;
  impersonatedUser: UserAccount | null;
  impersonateUser: (user: UserAccount) => void;
  exitImpersonation: () => void;
  currentUser: UserAccount;
  authUser: UserAccount | null;
  setAuthUser: (user: UserAccount | null) => void;
  setCurrentUserId: (id: string) => void;

  // Data Collections
  listings: Listing[];
  categories: Category[];
  customFields: CustomFieldDefinition[];
  locations: LocationItem[];
  users: UserAccount[];
  reports: ReportItem[];
  rules: ModerationRule[];
  packages: PromotionalPackage[];
  transactions: OrderTransaction[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  toasts: ToastMessage[];

  // Listing Operations
  approveListing: (id: string) => void;
  rejectListing: (id: string, reason: string) => void;
  featureListing: (id: string, isFeatured: boolean) => void;
  markAsSold: (id: string) => void;
  deleteListing: (id: string) => void;
  updateListing: (listing: Listing) => boolean;
  restoreListing: (id: string) => void;
  extendExpiration: (id: string, days?: number) => void;
  renewListing: (id: string, days?: number, isFree?: boolean) => void;
  bulkRenewListings: (ids: string[], days?: number) => void;
  markListingAsExpired: (id: string) => void;
  sendAdExpiredEmail: (listingId: string) => void;
  addListing: (listing: Omit<Listing, 'id' | 'createdAt' | 'views' | 'likes' | 'chatsCount'>) => Promise<Listing | null>;
  checkDuplicateTitle: (
    title: string,
    sellerId: string,
    excludeListingId?: string
  ) => Promise<{ isDuplicate: boolean; message?: string; conflictingListingId?: string }>;
  bulkApproveListings: (ids: string[]) => void;
  bulkRejectListings: (ids: string[], reason: string) => void;
  bulkDeleteListings: (ids: string[]) => void;

  // Email System, Newsletters & Logs
  emailLogs: EmailLog[];
  emailSettings: EmailSettings;
  emailTemplates: EmailTemplate[];
  newsletters: NewsletterCampaign[];
  sendEmail: (emailData: Omit<EmailLog, 'id' | 'sentAt' | 'status'>) => void;
  sendBatchEmails: (emails: Omit<EmailLog, 'id' | 'sentAt' | 'status'>[]) => Promise<number>;
  updateEmailSettings: (newSettings: Partial<EmailSettings>) => void;
  addEmailTemplate: (template: Omit<EmailTemplate, 'id' | 'lastUpdated'>) => EmailTemplate;
  updateEmailTemplate: (template: EmailTemplate) => void;
  deleteEmailTemplate: (id: string) => void;
  resetEmailTemplates: () => void;
  createNewsletterCampaign: (campaign: Omit<NewsletterCampaign, 'id' | 'createdAt' | 'sentCount'>) => NewsletterCampaign;
  sendNewsletterCampaign: (campaignId: string) => Promise<{ success: boolean; recipientCount: number; message: string }>;
  deleteNewsletterCampaign: (id: string) => void;
  testSmtpConnection: (config?: EmailSmtpConfig) => Promise<{ success: boolean; message: string; latencyMs: number }>;
  unsubscribeEmail: (email: string) => boolean;
  filterAudienceUsers: (filter: NewsletterAudienceFilter | string, customState?: string, customCity?: string) => UserAccount[];
  registerUser: (userData: Partial<UserAccount>) => UserAccount;

  // Category & Attributes Operations
  addCategory: (category: Omit<Category, 'id' | 'listingCount'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  toggleCategoryStatus: (id: string) => void;
  addCustomField: (field: Omit<CustomFieldDefinition, 'id'>) => void;
  updateCustomField: (field: CustomFieldDefinition) => void;
  deleteCustomField: (id: string) => void;

  // Location Operations
  addLocation: (location: Omit<LocationItem, 'id' | 'listingCount'>) => void;
  updateLocation: (location: LocationItem) => void;
  deleteLocation: (id: string) => void;
  toggleLocationPopular: (id: string) => void;

  // User Operations
  verifyUserKyc: (userId: string, status: 'verified' | 'rejected') => void;
  updateUser: (user: UserAccount) => void;
  banUser: (userId: string, reason: string) => void;
  unbanUser: (userId: string) => void;

  // Moderation
  actionReport: (reportId: string, actionNote: string, actionType: 'actioned' | 'dismissed') => void;
  addModerationRule: (rule: Omit<ModerationRule, 'id'>) => void;
  toggleModerationRule: (id: string) => void;

  // Commerce
  addPackage: (pkg: Omit<PromotionalPackage, 'id' | 'salesCount'>) => void;
  updatePackage: (pkg: PromotionalPackage) => void;
  togglePackageStatus: (id: string) => void;
  boostListing: (
    listingId: string,
    packageId: string,
    paymentMethod?: 'upi' | 'card' | 'netbanking'
  ) => Promise<{ success: boolean; message: string; listing?: Listing; transaction?: OrderTransaction }>;
  isListingBoosted: (listing: Partial<Listing> | null | undefined) => boolean;
  cleanupExpiredBoosts: () => void;

  // Settings & System
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetAllCounters: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  recordAuditLog: (action: string, module: string, targetId: string, targetSummary: string, details: string) => void;

  // CMS Pages & Footer Links
  cmsPages: CmsPage[];
  updateCmsPage: (page: CmsPage) => void;
  addCmsPage: (page: Omit<CmsPage, 'id' | 'updatedAt'>) => void;
  deleteCmsPage: (id: string) => void;
  activeCmsPageSlug: string | null;
  openCmsPageModal: (slug: string) => void;
  closeCmsPageModal: () => void;
  reportModalConfig: { open: boolean; type?: 'ad' | 'user'; targetId?: string; targetTitle?: string } | null;
  openReportModal: (type?: 'ad' | 'user', targetId?: string, targetTitle?: string) => void;
  closeReportModal: () => void;
  submitReport: (report: { targetType: 'listing' | 'user'; targetId: string; targetTitle: string; reason: string; comments: string }) => void;

  // Regulatory & Compliance Modals State
  isCmpModalOpen: boolean;
  openCmpModal: () => void;
  closeCmpModal: () => void;
  isUsPrivacyModalOpen: boolean;
  openUsPrivacyModal: () => void;
  closeUsPrivacyModal: () => void;
  isEeatModalOpen: boolean;
  openEeatModal: () => void;
  closeEeatModal: () => void;

  // Marketplace interaction state
  selectedMarketplaceCity: string;
  setSelectedMarketplaceCity: (city: string) => void;
  selectedMarketplaceCategory: string;
  setSelectedMarketplaceCategory: (catId: string) => void;
  selectedMarketplaceSubcategory: string;
  setSelectedMarketplaceSubcategory: (subId: string) => void;
  marketplaceSearch: string;
  setMarketplaceSearch: (q: string) => void;
  activeViewingListing: Listing | null;
  setActiveViewingListing: (listing: Listing | null) => void;
  isPostAdOpen: boolean;
  setIsPostAdOpen: (open: boolean) => void;
  userLocation: UserGeoLocation | null;
  setUserLocation: (loc: UserGeoLocation | null) => void;
  fetchGpsLocation: () => void;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export interface InitialServerData {
  listings?: Listing[];
  categories?: Category[];
  locations?: LocationItem[];
  settings?: SystemSettings;
  cmsPages?: CmsPage[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode; initialServerData?: InitialServerData }> = ({
  children,
  initialServerData,
}) => {
  // Navigation & Mode
  const [viewMode, setViewMode] = useState<'admin' | 'marketplace'>('admin');
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [globalSearchOpen, setGlobalSearchOpen] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Admin and Auth
  const [authUser, setAuthUser] = useState<UserAccount | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<UserAccount | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type');
        if (!ct || !ct.includes('application/json')) return null;
        return res.json().catch(() => null);
      })
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setAuthUser(data.user);
          setActiveUserId(data.user.id);
          if (data.isAdmin || data.isModerator) {
            setCurrentAdmin({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              avatar: data.user.avatar || 'https://picsum.photos/seed/admin/100/100',
              role: data.adminRole || (data.isAdmin ? 'super_admin' : 'moderator'),
              twoFactorEnabled: false,
              lastLogin: 'Just now',
              ipAddress: '127.0.0.1',
              status: 'active',
            });
          } else {
            setCurrentAdmin(null);
          }
        } else {
          setAuthUser(null);
          setCurrentAdmin(null);
          setActiveUserId(null);
        }
      })
      .catch(() => {
        setAuthUser(null);
        setCurrentAdmin(null);
        setActiveUserId(null);
      });
  }, []);

  // Collections (initialized from server-fetched PostgreSQL data during SSR when provided)
  const [listings, setListings] = useState<Listing[]>(() => initialServerData?.listings || []);
  const [categories, setCategories] = useState<Category[]>(() => {
    if (
      initialServerData?.categories &&
      initialServerData.categories.length > 0 &&
      initialServerData.categories.some((c) => (c.listingCount || 0) > 0)
    ) {
      return initialServerData.categories;
    }
    const baseCats =
      initialServerData?.categories && initialServerData.categories.length > 0
        ? initialServerData.categories
        : INITIAL_CATEGORIES;
    const seededAds = seedCategoriesWithTenAds(INITIAL_LISTINGS);
    const parentCounts: Record<string, number> = {};
    const subCounts: Record<string, number> = {};
    for (const ad of seededAds) {
      if (ad.status === 'approved') {
        parentCounts[ad.categoryId] = (parentCounts[ad.categoryId] || 0) + 1;
        if (ad.subcategoryId) {
          subCounts[ad.subcategoryId] = (subCounts[ad.subcategoryId] || 0) + 1;
        }
      }
    }
    return baseCats.map((c) => ({
      ...c,
      listingCount: c.parentId ? subCounts[c.id] || 0 : parentCounts[c.id] || 0,
    }));
  });
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(INITIAL_CUSTOM_FIELDS);
  const [locations, setLocations] = useState<LocationItem[]>(() =>
    initialServerData?.locations && initialServerData.locations.length > 0
      ? initialServerData.locations
      : INITIAL_LOCATIONS
  );
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [rules, setRules] = useState<ModerationRule[]>(INITIAL_MODERATION_RULES);
  const [packages, setPackages] = useState<PromotionalPackage[]>(INITIAL_PACKAGES);
  const [transactions, setTransactions] = useState<OrderTransaction[]>(INITIAL_TRANSACTIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [settings, setSettings] = useState<SystemSettings>(() =>
    initialServerData?.settings ? { ...INITIAL_SETTINGS, ...initialServerData.settings } : INITIAL_SETTINGS
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(INITIAL_EMAIL_LOGS);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(INITIAL_EMAIL_SETTINGS);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(INITIAL_EMAIL_TEMPLATES);
  const [newsletters, setNewsletters] = useState<NewsletterCampaign[]>(INITIAL_NEWSLETTERS);

  // Sync server-provided reference data when root layout revalidates
  useEffect(() => {
    if (
      initialServerData?.categories &&
      initialServerData.categories.length > 0 &&
      initialServerData.categories.some((c) => (c.listingCount || 0) > 0)
    ) {
      setCategories(initialServerData.categories);
    }
  }, [initialServerData?.categories]);

  useEffect(() => {
    if (initialServerData?.locations && initialServerData.locations.length > 0) {
      setLocations(initialServerData.locations);
    }
  }, [initialServerData?.locations]);

  useEffect(() => {
    if (initialServerData?.settings) {
      setSettings((prev) => ({ ...prev, ...initialServerData.settings }));
    }
  }, [initialServerData?.settings]);

  // CMS Pages & Footer Modal State
  const [cmsPages, setCmsPages] = useState<CmsPage[]>(() =>
    initialServerData?.cmsPages && initialServerData.cmsPages.length > 0
      ? initialServerData.cmsPages
      : INITIAL_CMS_PAGES
  );
  const [activeCmsPageSlug, setActiveCmsPageSlug] = useState<string | null>(null);
  const [reportModalConfig, setReportModalConfig] = useState<{
    open: boolean;
    type?: 'ad' | 'user';
    targetId?: string;
    targetTitle?: string;
  } | null>(null);

  // Regulatory & Compliance Modals State
  const [isCmpModalOpen, setIsCmpModalOpen] = useState(false);
  const [isUsPrivacyModalOpen, setIsUsPrivacyModalOpen] = useState(false);
  const [isEeatModalOpen, setIsEeatModalOpen] = useState(false);

  const openCmpModal = () => setIsCmpModalOpen(true);
  const closeCmpModal = () => setIsCmpModalOpen(false);
  const openUsPrivacyModal = () => setIsUsPrivacyModalOpen(true);
  const closeUsPrivacyModal = () => setIsUsPrivacyModalOpen(false);
  const openEeatModal = () => setIsEeatModalOpen(true);
  const closeEeatModal = () => setIsEeatModalOpen(false);

  useEffect(() => {
    const handleOpenCmp = () => setIsCmpModalOpen(true);
    window.addEventListener('open_cmp_modal', handleOpenCmp);
    return () => {
      window.removeEventListener('open_cmp_modal', handleOpenCmp);
    };
  }, []);

  const openCmsPageModal = (slug: string) => setActiveCmsPageSlug(slug);
  const closeCmsPageModal = () => setActiveCmsPageSlug(null);

  const openReportModal = (type: 'ad' | 'user' = 'ad', targetId?: string, targetTitle?: string) => {
    setReportModalConfig({ open: true, type, targetId, targetTitle });
  };
  const closeReportModal = () => setReportModalConfig(null);

  // Marketplace filter states
  const [selectedMarketplaceCity, setSelectedMarketplaceCity] = useState<string>('All India');
  const [selectedMarketplaceCategory, setSelectedMarketplaceCategory] = useState<string>('all');
  const [selectedMarketplaceSubcategory, setSelectedMarketplaceSubcategory] = useState<string>('all');
  const [marketplaceSearch, setMarketplaceSearch] = useState<string>('');
  const [activeViewingListing, setActiveViewingListing] = useState<Listing | null>(null);
  const [isPostAdOpen, setIsPostAdOpen] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<UserGeoLocation | null>({
    latitude: 19.0596,
    longitude: 72.8295,
    city: 'Mumbai',
    area: 'Bandra West',
    radiusKm: 25,
  });

  // Toast manager
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const currentUser =
    impersonatedUser || authUser || (activeUserId ? users.find((u) => u.id === activeUserId) : null) || users[0];

  // Audit Logger
  const recordAuditLog = (
    action: string,
    module: string,
    targetId: string,
    targetSummary: string,
    details: string
  ) => {
    const newLog: AuditLog = {
      id: 'aud_' + Date.now(),
      adminId: currentAdmin?.id || currentUser?.id || 'system',
      adminName: currentAdmin?.name || currentUser?.name || 'System User',
      action,
      module,
      targetId,
      targetSummary,
      details,
      ipAddress: currentAdmin?.ipAddress ? currentAdmin.ipAddress.split(' ')[0] : 'unknown',
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const fetchGpsLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setUserLocation({
            latitude: lat,
            longitude: lon,
            city: 'Mumbai',
            area: 'Current GPS Location',
            radiusKm: 25,
          });
          setSelectedMarketplaceCity('Mumbai');
          addToast({
            type: 'success',
            title: '📍 Location Acquired',
            message: `GPS Coordinates: ${lat.toFixed(2)}, ${lon.toFixed(2)}`,
          });
        },
        () => {
          addToast({
            type: 'warning',
            title: 'GPS Unavailable',
            message: 'Using default location: Bandra West, Mumbai',
          });
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      addToast({ type: 'error', title: 'Not Supported', message: 'Geolocation is not supported by this browser' });
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const refreshData = async () => {
    try {
      const res = await fetch('/api/bootstrap', { cache: 'no-store' });
      if (res.ok) {
        const ct = res.headers.get('content-type');
        if (!ct || !ct.includes('application/json')) return;
        const data = await res.json().catch(() => null);
        if (!data) return;
        if (Array.isArray(data.listings)) {
          setListings(data.listings);
        }
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
        if (Array.isArray(data.locations) && data.locations.length > 0) {
          setLocations(data.locations);
        }
        if (Array.isArray(data.cmsPages)) {
          setCmsPages(data.cmsPages);
        }
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
        if (data.currentUser) {
          setActiveUserId(data.currentUser.id);
        }
      }
    } catch (err) {
      console.error('Failed to sync bootstrap data with backend:', err);
    }
  };

  useEffect(() => {
    const hasServerCategoryCounts = Boolean(
      initialServerData?.categories?.some((c) => (c.listingCount || 0) > 0)
    );
    if (initialServerData && hasServerCategoryCounts) {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
      const needsFullCatalogue =
        pathname.startsWith('/admin') ||
        pathname.startsWith('/my-account') ||
        pathname.startsWith('/my-ads');
      if (!needsFullCatalogue) {
        return;
      }
    }
    refreshData();
  }, [initialServerData]);

  const switchAdminRole = (role: Role) => {
    console.warn('switchAdminRole is a demo capability and does not affect server-side permissions.');
    addToast({
      type: 'info',
      title: `Role Switch Simulated (${role})`,
      message: 'This is a demo capability. Server-side permissions remain unchanged.',
    });
  };

  const impersonateUser = (user: UserAccount) => {
    setImpersonatedUser(user);
    setViewMode('marketplace');
    recordAuditLog(
      'IMPERSONATE_USER',
      'Users / Impersonation',
      user.id,
      user.name,
      `Admin ${currentAdmin?.name || 'System'} started impersonation session for audit`
    );
    addToast({
      type: 'warning',
      title: `Impersonating ${user.name}`,
      message: 'You are now viewing the marketplace as this user. Actions will be logged in audit trail.',
    });
  };

  const exitImpersonation = () => {
    if (impersonatedUser) {
      recordAuditLog(
        'EXIT_IMPERSONATION',
        'Users / Impersonation',
        impersonatedUser.id,
        impersonatedUser.name,
        `Admin ${currentAdmin?.name || 'System'} ended impersonation session`
      );
    }
    setImpersonatedUser(null);
    setViewMode('admin');
    addToast({
      type: 'info',
      title: 'Exited Impersonation',
      message: 'Returned safely to the Admin Control Panel.',
    });
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthUser(null);
      setCurrentAdmin(null);
      setActiveUserId(null);
      addToast({ type: 'info', title: 'Signed Out', message: 'You have been signed out.' });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const emailActions = useEmailAndNewsletterActions({
    users,
    setUsers,
    listings,
    emailSettings,
    setEmailSettings,
    emailTemplates,
    setEmailTemplates,
    newsletters,
    setNewsletters,
    setEmailLogs,
    addToast,
    recordAuditLog,
  });

  const listingActions = useListingActions({
    listings,
    setListings,
    users,
    currentUser,
    packages,
    setPackages,
    setTransactions,
    sendEmail: emailActions.sendEmail,
    addToast,
    recordAuditLog,
  });

  const adminActions = useAdminAndTaxonomyActions({
    categories,
    setCategories,
    customFields,
    setCustomFields,
    locations,
    setLocations,
    users,
    setUsers,
    currentUser,
    setListings,
    setReports,
    rules,
    setRules,
    packages,
    setPackages,
    setSettings,
    cmsPages,
    setCmsPages,
    setReportModalConfig,
    addToast,
    recordAuditLog,
  });

  // Periodic automatic cleanup of expired boosts
  useEffect(() => {
    listingActions.cleanupExpiredBoosts();
    const interval = setInterval(() => {
      listingActions.cleanupExpiredBoosts();
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        viewMode,
        setViewMode,
        activeSidebarTab,
        setActiveSidebarTab,
        theme,
        toggleTheme,
        globalSearchOpen,
        setGlobalSearchOpen,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        currentAdmin,
        switchAdminRole,
        impersonatedUser,
        impersonateUser,
        exitImpersonation,
        currentUser,
        authUser,
        setAuthUser,
        setCurrentUserId: setActiveUserId,
        listings,
        categories,
        customFields,
        locations,
        users,
        reports,
        rules,
        packages,
        transactions,
        auditLogs,
        settings,
        toasts,
        ...listingActions,
        emailLogs,
        emailSettings,
        emailTemplates,
        newsletters,
        ...emailActions,
        ...adminActions,
        isListingBoosted,
        addToast,
        removeToast,
        recordAuditLog,
        selectedMarketplaceCity,
        setSelectedMarketplaceCity,
        selectedMarketplaceCategory,
        setSelectedMarketplaceCategory,
        selectedMarketplaceSubcategory,
        setSelectedMarketplaceSubcategory,
        marketplaceSearch,
        setMarketplaceSearch,
        activeViewingListing,
        setActiveViewingListing,
        isPostAdOpen,
        setIsPostAdOpen,
        userLocation,
        setUserLocation,
        fetchGpsLocation,
        signOut,
        cmsPages,
        activeCmsPageSlug,
        openCmsPageModal,
        closeCmsPageModal,
        reportModalConfig,
        openReportModal,
        closeReportModal,
        isCmpModalOpen,
        openCmpModal,
        closeCmpModal,
        isUsPrivacyModalOpen,
        openUsPrivacyModal,
        closeUsPrivacyModal,
        isEeatModalOpen,
        openEeatModal,
        closeEeatModal,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppOptional = () => {
  return useContext(AppContext);
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
