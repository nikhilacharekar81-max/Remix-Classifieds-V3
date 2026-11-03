import { db } from '@/src/db/index';
import * as schema from '@/src/db/schema';
import { hashPassword } from '@/lib/auth/password';
import {
  INITIAL_CATEGORIES,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_LOCATIONS,
  INITIAL_USERS,
  INITIAL_ADMINS,
  INITIAL_LISTINGS,
  INITIAL_MODERATION_RULES,
  INITIAL_PACKAGES,
  INITIAL_SETTINGS,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_CMS_PAGES,
} from '@/lib/data/initialData';
import { seedCategoriesWithTenAds } from '@/lib/data/listingsSeeder';

let isDatabaseSeeded = false;
let activeSeedPromise: Promise<void> | null = null;

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function ensureDatabaseSeeded(): Promise<void> {
  if (isDatabaseSeeded) {
    return;
  }

  if (activeSeedPromise) {
    return activeSeedPromise;
  }

  activeSeedPromise = (async () => {
    try {
      const existing = await db
        .select({ id: schema.systemSettings.id })
        .from(schema.systemSettings)
        .limit(1);
      if (existing.length === 0) {
        await seedPostgres();
      }
      isDatabaseSeeded = true;
    } catch (err) {
      isDatabaseSeeded = false;
      console.error('ensureDatabaseSeeded check failed:', err);
    } finally {
      activeSeedPromise = null;
    }
  })();

  return activeSeedPromise;
}

export async function seedPostgres() {
  console.log('--- Starting High-Speed Batch PostgreSQL Database Seeding ---');
  const defaultPasswordHash = await hashPassword('Password123!');
  const validCategoryIds = new Set(INITIAL_CATEGORIES.map((c) => c.id));

  const resolveCategoryId = (rawId: string): string => {
    let id = rawId;
    if (id === 'cat_vehicles') id = 'cat_cars';
    if (id === 'cat_buy_and_sell') id = 'cat_electronics';
    if (id === 'cat_pets_animals') id = 'cat_pets';
    if (!validCategoryIds.has(id)) return 'cat_electronics';
    return id;
  };

  // 1. Users & Admins (Batch Insert)
  console.log('Batch seeding users & admins...');
  const usersToInsert = [
    ...INITIAL_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '+91 98000 11111',
      passwordHash: defaultPasswordHash,
      avatarUrl: u.avatar,
      type: u.type,
      status: u.status,
      kycStatus: u.kycStatus,
      emailSubscribed: u.emailSubscribed,
      city: u.location?.city || 'Mumbai',
      state: u.location?.state || 'Maharashtra',
      rating: String(u.rating || 5.0),
      reviewCount: u.reviewCount || 0,
      businessName: u.businessDetails?.companyName || (u as any).businessName || null,
      gstNumber: u.businessDetails?.gstNumber || (u as any).gstNumber || null,
      verifiedBusiness: u.businessDetails?.verifiedBusiness || (u as any).verifiedBusiness || false,
      adminRole: null as string | null,
    })),
    ...INITIAL_ADMINS.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: '+91 98200 11223',
      passwordHash: defaultPasswordHash,
      avatarUrl: a.avatar,
      type: 'business' as const,
      status: 'active' as const,
      kycStatus: 'verified' as const,
      emailSubscribed: true,
      city: 'Mumbai',
      state: 'Maharashtra',
      rating: '4.90',
      reviewCount: 38,
      businessName: 'Chillyads Staff',
      verifiedBusiness: true,
      adminRole: a.role,
    })),
  ];

  for (const batch of chunkArray(usersToInsert, 50)) {
    await db.insert(schema.users).values(batch).onConflictDoNothing();
  }

  // 2. Categories (Batch Insert: Parents first, then Children)
  console.log('Batch seeding categories...');
  const parentCategories = INITIAL_CATEGORIES.filter((c) => !c.parentId);
  const childCategories = INITIAL_CATEGORIES.filter((c) => c.parentId);

  const mapCategory = (c: typeof INITIAL_CATEGORIES[0]) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    parentId: c.parentId || null,
    orderIndex: c.order || (c as any).orderIndex || 0,
    isActive: c.isActive ?? true,
    seoTitle: c.seoTitle || null,
    seoDescription: c.seoDescription || null,
    isPaid: c.isPaid ?? false,
    postingFee: String(c.postingFee || 0),
    freeListingsQuota: c.freeListingsQuota ?? 3,
  });

  for (const batch of chunkArray(parentCategories.map(mapCategory), 50)) {
    await db.insert(schema.categories).values(batch).onConflictDoNothing();
  }
  for (const batch of chunkArray(childCategories.map(mapCategory), 50)) {
    await db.insert(schema.categories).values(batch).onConflictDoNothing();
  }

  // 3. Custom Fields (Batch Insert)
  console.log('Batch seeding custom fields...');
  const customFieldsToInsert = INITIAL_CUSTOM_FIELDS.map((f) => ({
    id: f.id,
    categoryId: resolveCategoryId(f.categoryId),
    name: f.name,
    label: f.label,
    type: f.type,
    options: f.options || [],
    unit: f.unit || null,
    required: f.required ?? false,
    filterable: f.filterable ?? true,
    orderIndex: f.orderIndex || 0,
  }));

  for (const batch of chunkArray(customFieldsToInsert, 50)) {
    await db.insert(schema.categoryCustomFields).values(batch).onConflictDoNothing();
  }

  // 4. Locations (Batch Insert: Parents first, then Children)
  console.log('Batch seeding locations...');
  const rootLocations = INITIAL_LOCATIONS.filter((l) => !l.parentId);
  const childLocations = INITIAL_LOCATIONS.filter((l) => l.parentId);

  const mapLocation = (loc: typeof INITIAL_LOCATIONS[0]) => {
    const anyLoc = loc as any;
    const s = anyLoc.slug || loc.name.toLowerCase().replace(/\s+/g, '-');
    const g = anyLoc.geoId || (loc.id === 'loc_in' ? 'g0' : `g_${loc.id}`);
    return {
      id: loc.id,
      type: loc.type,
      name: loc.name,
      slug: s,
      code: loc.code || null,
      geoId: g,
      parentId: loc.parentId || null,
      latitude: anyLoc.latitude || null,
      longitude: anyLoc.longitude || null,
      popular: loc.popular ?? false,
      orderIndex: anyLoc.orderIndex || anyLoc.order || 0,
    };
  };

  for (const batch of chunkArray(rootLocations.map(mapLocation), 50)) {
    await db.insert(schema.locations).values(batch).onConflictDoNothing();
  }
  for (const batch of chunkArray(childLocations.map(mapLocation), 50)) {
    await db.insert(schema.locations).values(batch).onConflictDoNothing();
  }

  // 5. Listings (Batch Insert)
  console.log('Batch seeding listings...');
  const seeded = seedCategoriesWithTenAds(INITIAL_LISTINGS);

  // Collect and batch insert any missing sellers
  const sellerMap = new Map<string, any>();
  for (const l of seeded) {
    if (!sellerMap.has(l.sellerId)) {
      sellerMap.set(l.sellerId, {
        id: l.sellerId,
        name: l.sellerName,
        email: `${l.sellerId}@chillyads.com`,
        phone: l.sellerPhone || '+91 98000 00000',
        city: l.location?.city || 'Mumbai',
        state: l.location?.state || 'Maharashtra',
      });
    }
  }

  for (const batch of chunkArray(Array.from(sellerMap.values()), 50)) {
    await db.insert(schema.users).values(batch).onConflictDoNothing();
  }

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + 30);

  const listingsToInsert = seeded.map((l) => ({
    id: l.id,
    sellerId: l.sellerId,
    sellerName: l.sellerName,
    sellerPhone: l.sellerPhone || '',
    categoryId: resolveCategoryId(l.categoryId),
    subcategoryId: l.subcategoryId || null,
    title: l.title,
    description: l.description,
    price: String(l.price),
    state: l.location?.state || 'Maharashtra',
    city: l.location?.city || 'Mumbai',
    locality: l.location?.locality || 'Andheri West',
    latitude: l.location?.latitude || 19.076,
    longitude: l.location?.longitude || 72.8777,
    images: l.images || [],
    customAttributes: l.customAttributes || {},
    status: l.status || 'approved',
    isFeatured: l.isFeatured ?? false,
    featuredUntil: l.featuredUntil ? new Date(l.featuredUntil) : null,
    isBoosted: l.isBoosted ?? false,
    boostStatus: l.boostStatus || 'inactive',
    boostViews: l.boostViews || 0,
    boostImpressions: l.boostImpressions || 0,
    boostClicks: l.boostClicks || 0,
    views: l.views || 0,
    likes: l.likes || 0,
    chatsCount: l.chatsCount || 0,
    spamScore: l.spamScore || 0,
    expiresAt: expiresDate,
  }));

  for (const batch of chunkArray(listingsToInsert, 50)) {
    await db.insert(schema.listings).values(batch).onConflictDoNothing();
  }

  // 6. Boost Packages (Batch Insert)
  console.log('Batch seeding boost packages...');
  const packagesToInsert = INITIAL_PACKAGES.map((p) => ({
    id: p.id,
    name: p.name,
    badge: p.badge,
    type: p.type || 'boost',
    durationDays: p.durationDays || 1,
    durationHours: p.durationHours || 24,
    price: String(p.price),
    discountPrice: p.discountPrice ? String(p.discountPrice) : null,
    currency: p.currency || 'INR',
    features: p.features || [],
    isActive: p.isActive ?? true,
    salesCount: p.salesCount || 0,
  }));
  for (const batch of chunkArray(packagesToInsert, 50)) {
    await db.insert(schema.boostPackages).values(batch).onConflictDoNothing();
  }

  // 7. Moderation Rules (Batch Insert)
  console.log('Batch seeding moderation rules...');
  const rulesToInsert = INITIAL_MODERATION_RULES.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    action: r.action,
    keywords: r.keywords || [],
    threshold: r.threshold ? String(r.threshold) : null,
    isActive: r.isActive ?? true,
  }));
  for (const batch of chunkArray(rulesToInsert, 50)) {
    await db.insert(schema.moderationRules).values(batch).onConflictDoNothing();
  }

  // 8. Email Templates (Batch Insert)
  console.log('Batch seeding email templates...');
  const templatesToInsert = INITIAL_EMAIL_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    subject: t.subject,
    bodyHtml: t.bodyHtml,
    bodyText: t.bodyText,
    actionLabel: t.actionLabel,
    actionUrl: t.actionUrl,
    variables: t.variables || [],
    isActive: t.isActive ?? true,
    isSystemDefault: t.isSystemDefault ?? false,
  }));
  for (const batch of chunkArray(templatesToInsert, 50)) {
    await db.insert(schema.emailTemplates).values(batch).onConflictDoNothing();
  }

  // 9. CMS Pages (Batch Insert)
  console.log('Batch seeding CMS pages...');
  const pagesToInsert = INITIAL_CMS_PAGES.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    content: p.content,
    seoTitle: (p as any).seoTitle || p.title,
    seoDescription: (p as any).seoDescription || p.title,
    isActive: p.status === 'published' || ((p as any).isActive ?? true),
  }));
  for (const batch of chunkArray(pagesToInsert, 50)) {
    await db.insert(schema.cmsPages).values(batch).onConflictDoNothing();
  }

  // 10. System Settings
  console.log('Batch seeding system settings...');
  await db.insert(schema.systemSettings).values({
    id: 'primary',
    siteName: INITIAL_SETTINGS.siteName || 'Chillyads',
    defaultCurrency: INITIAL_SETTINGS.defaultCurrency || 'INR',
    currencySymbol: INITIAL_SETTINGS.currencySymbol || '₹',
    timezone: INITIAL_SETTINGS.timezone || 'Asia/Kolkata',
    dateFormat: INITIAL_SETTINGS.dateFormat || 'DD/MM/YYYY',
    listingDurationDays: INITIAL_SETTINGS.listingDurationDays || 30,
    freeListingsLimit: INITIAL_SETTINGS.freeListingsLimit || 3,
    extraListingFee: String(INITIAL_SETTINGS.extraListingFee || 99),
    maxPhotosPerListing: INITIAL_SETTINGS.maxPhotosPerListing || 5,
    autoApproveVerifiedUsers: INITIAL_SETTINGS.autoApproveVerifiedUsers ?? false,
    maintenanceMode: INITIAL_SETTINGS.maintenanceMode ?? false,
    watermarkImages: INITIAL_SETTINGS.watermarkImages ?? false,
    aiSpamFilterEnabled: INITIAL_SETTINGS.aiSpamFilterEnabled ?? true,
    otpLoginEnabled: INITIAL_SETTINGS.otpLoginEnabled ?? true,
    paidFeaturesConfig: INITIAL_SETTINGS.paidFeatures || (INITIAL_SETTINGS as any).paidFeaturesConfig || {},
  }).onConflictDoNothing();

  console.log('--- PostgreSQL Database Seeding Complete ---');
}
