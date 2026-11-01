'use client';
import React, { useState, useEffect } from 'react';
import { NavLink } from '@/components/common/NavLink';
import { useApp } from '@/context/AppContext';
import { Listing } from '@/lib/types';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Eye,
  ShieldCheck,
  Phone,
  MessageCircle,
  Share2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Rocket,
  Send,
  Shield,
  Search,
  User,
  Plus,
  Grid,
  List,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { navigateTo, useNavigationFeedback } from '@/lib/router/useRouter';
import { Footer } from '@/components/common/Footer';
import { buildChillyUrl, findListingById } from '@/lib/utils/seoAndUrlHelper';
import { LocationSelectorInput } from './LocationSelectorInput';
import { BoostAdModal } from './BoostAdModal';
import { ListingMapWidget } from './ListingMapWidget';
import { CategorySubNavbar } from './CategorySubNavbar';
import { MyAccountDropdown } from '@/components/common/MyAccountDropdown';
import { isListingBoosted, formatBoostTimeRemaining } from '@/lib/utils/boostHelper';
import { renderUnclickableDescription } from '@/lib/utils/unclickableLinks';

interface ListingDetailPageProps {
  listingId: string;
  initialListing?: Listing | null;
  initialListings?: Listing[];
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  listingId,
  initialListing,
  initialListings,
}) => {
  const {
    listings,
    categories,
    addToast,
    setSelectedMarketplaceCategory,
    setSelectedMarketplaceSubcategory,
    setSelectedMarketplaceCity,
    marketplaceSearch,
    setMarketplaceSearch,
    selectedMarketplaceCity,
    theme,
    currentUser,
  } = useApp();
  const sourceListings = initialListings && initialListings.length > 0 ? initialListings : listings;
  const listing =
    (initialListing && findListingById([initialListing], listingId)) ||
    findListingById(sourceListings, listingId) ||
    findListingById(listings, listingId) ||
    initialListing ||
    null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [similarAdsLayout, setSimilarAdsLayout] = useState<'grid' | 'listicle'>('grid');
  const { isUrlPending } = useNavigationFeedback();

  useEffect(() => {
    setActiveImageIndex(0);
    setShowPhone(false);
  }, [listingId]);

  // Check if active user is seller of this ad
  const isOwner = !!(listing && currentUser && listing.sellerId === currentUser.id);

  // Interactive Live Chat Simulator
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'seller'; text: string; time: string }>>([
    {
      sender: 'seller',
      text: 'Namaste! Thanks for your interest in this listing. Feel free to ask any questions or schedule an inspection.',
      time: 'Just now',
    },
  ]);
  const [newChatInput, setNewChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Classified Ad Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
          The listing #{listingId} may have been sold, removed, or expired.
        </p>
        <NavLink
          href="/"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Classifieds Home
        </NavLink>
      </div>
    );
  }

  const category = categories.find((c) => c.id === listing.categoryId);
  const subcategory = listing.subcategoryId ? categories.find((c) => c.id === listing.subcategoryId) : null;
  const relatedListings = sourceListings
    .filter((l) => l.id !== listing.id && l.status === 'approved' && (l.categoryId === listing.categoryId || l.subcategoryId === listing.subcategoryId || l.location.city === listing.location.city))
    .slice(0, 4);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatInput.trim()) return;

    const userMsg = newChatInput.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: now }]);
    setNewChatInput('');

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'seller',
          text: `Yes, the ${listing.title} is available in ${listing.location.city}. You are welcome to inspect it!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  const cityUrl = buildChillyUrl({
    city: listing.location.city || 'All India',
    categories,
  });

  const categoryUrl = buildChillyUrl({
    city: listing.location.city || 'All India',
    categoryId: listing.categoryId,
    subcategoryId: 'all',
    categories: categories,
  });

  const subcategoryUrl = subcategory ? buildChillyUrl({
    city: listing.location.city || 'All India',
    categoryId: listing.categoryId,
    subcategoryId: subcategory.id,
    categories: categories,
  }) : '';

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (category) {
      setSelectedMarketplaceCategory(category.id);
      setSelectedMarketplaceSubcategory('all');
      if (listing.location.city) {
        setSelectedMarketplaceCity(listing.location.city);
      }
      navigateTo(categoryUrl);
    }
  };

  const handleSubcategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (category && subcategory) {
      setSelectedMarketplaceCategory(category.id);
      setSelectedMarketplaceSubcategory(subcategory.id);
      if (listing.location.city) {
        setSelectedMarketplaceCity(listing.location.city);
      }
      navigateTo(subcategoryUrl);
    }
  };

  const handleShare = () => {
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    addToast({
      title: 'Link Copied',
      message: 'Classified ad webpage URL copied to your clipboard.',
      type: 'success',
    });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124] pb-20">
      {/* Google Cloud 4-Color Accent Hairline */}
      <div className="h-[3px] w-full flex shrink-0">
        <div className="flex-1 bg-[#4285F4]" />
        <div className="flex-1 bg-[#EA4335]" />
        <div className="flex-1 bg-[#FBBC05]" />
        <div className="flex-1 bg-[#34A853]" />
      </div>

      {/* Main Navigation Header */}
      <header className="bg-white border-b border-[#dadce0] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-5">
            <NavLink
              href="/"
              showSpinner={true}
              className="flex items-baseline font-black text-2xl tracking-tight text-[#202124] cursor-pointer select-none"
            >
              <span>chillyads</span>
              <span className="text-[#1dbf73] text-3xl leading-none">.</span>
            </NavLink>

            {/* Typeable Location Selector */}
            <div className="hidden sm:block">
              <LocationSelectorInput currentCity={listing.location?.city} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl flex">
            <input
              type="text"
              value={marketplaceSearch}
              onChange={(e) => setMarketplaceSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigateTo(`/search?q=${encodeURIComponent(marketplaceSearch)}`);
                }
              }}
              placeholder="What service, vehicle, or property are you looking for today?"
              className="w-full text-xs rounded-l-md border border-r-0 border-[#dadce0] pl-4 pr-4 py-2.5 focus:outline-none focus:border-[#202124] placeholder:text-[#5f6368] font-medium"
            />
            <button
              onClick={() => navigateTo(`/search?q=${encodeURIComponent(marketplaceSearch)}`)}
              className="px-4 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded-r-md flex items-center justify-center transition-colors cursor-pointer"
            >
              {isUrlPending(`/search?q=${encodeURIComponent(marketplaceSearch)}`) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Actions: My Account Dropdown & Post Ad Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <MyAccountDropdown />

            <NavLink
              href="/post"
              className="px-4 py-2 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold rounded-md text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Post a Gig / Ad
            </NavLink>
          </div>
        </div>

        {/* Mobile Location Selector Bar */}
        <div className="sm:hidden px-4 pb-2.5 pt-1">
          <LocationSelectorInput className="w-full" currentCity={listing.location?.city} />
        </div>
      </header>

      {/* OLX Style Horizontal Category Sub-Navbar with "ALL CATEGORIES" dropdown */}
      <CategorySubNavbar
        currentCity={listing.location?.city}
        activeCategoryId={listing.categoryId}
        activeSubcategoryId={listing.subcategoryId}
      />

      {/* Top Breadcrumb Bar - OLX Style */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-slate-200 listing-breadcrumb text-slate-500">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="flex items-center gap-2">
            <NavLink
              href="/"
              className="hover:text-blue-600 font-medium flex items-center gap-1 shrink-0"
            >
              Home
            </NavLink>
            {listing.location?.city && (
              <>
                <span className="text-slate-300">/</span>
                <NavLink
                  href={cityUrl}
                  className="hover:text-blue-600 font-medium transition-colors cursor-pointer shrink-0"
                >
                  {listing.location.city}
                </NavLink>
              </>
            )}
            <span className="text-slate-300">/</span>
            {category && (
              <>
                <NavLink
                  href={categoryUrl}
                  className="hover:text-blue-600 font-medium transition-colors cursor-pointer shrink-0"
                >
                  {category.name}
                </NavLink>
                <span className="text-slate-300">/</span>
              </>
            )}
            {subcategory && (
              <>
                <NavLink
                  href={subcategoryUrl}
                  className="hover:text-blue-600 font-medium transition-colors cursor-pointer shrink-0"
                >
                  {subcategory.name}
                </NavLink>
                <span className="text-slate-300">/</span>
              </>
            )}
            <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
              {listing.title} {listing.location.locality ? `in ${listing.location.locality}` : ''} {listing.location.city ? `, ${listing.location.city}` : ''}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-400 shrink-0 pl-4">
            <span>AD ID: #{listing.id}</span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-blue-600 cursor-pointer text-slate-600 font-semibold"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <article itemScope itemType="https://schema.org/Product" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hidden metadata for search engine indexing */}
          <meta itemProp="name" content={listing.title} />
          <meta itemProp="description" content={listing.description} />
          <meta itemProp="image" content={listing.images[0]} />
          <div itemProp="offers" itemScope itemType="https://schema.org/Offer" className="hidden">
            <meta itemProp="price" content={String(listing.price)} />
            <meta itemProp="priceCurrency" content="INR" />
            <meta itemProp="availability" content={listing.status === 'sold' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'} />
            <meta itemProp="itemCondition" content="https://schema.org/UsedCondition" />
          </div>

          {/* Main Left Column (7 cols): Images & Full Specs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Gallery Viewer */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="relative bg-slate-950 h-80 sm:h-96 flex items-center justify-center">
                <ImageWithFallback
                  src={listing.images[activeImageIndex] || listing.images[0]}
                  alt={listing.title}
                  categoryId={listing.categoryId}
                  className="w-full h-full object-contain"
                />

                {listing.isFeatured && (
                  <div className="absolute top-4 left-4 bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider shadow flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Featured Ad
                  </div>
                )}

                {listing.images.length > 1 && (
                  <div className="absolute bottom-3 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    {activeImageIndex + 1} / {listing.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {listing.images.length > 1 && (
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 overflow-x-auto">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-400' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <ImageWithFallback src={img} alt="Thumb" categoryId={listing.categoryId} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Custom Specifications & Attributes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100">
                Specifications & Dynamic Attributes
              </h3>

              {listing.customAttributes && Object.keys(listing.customAttributes).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(listing.customAttributes).map(([key, val]) => (
                    <div key={key} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No custom category attributes specified for this listing.</p>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Description
                </h3>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  🔒 Links are unclickable for anti-spam safety
                </span>
              </div>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {renderUnclickableDescription(listing.description)}
              </div>
            </div>

            {/* Location & Map Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Location</span>
                <span className="text-xs font-normal text-slate-400">
                  {listing.location.city}, {listing.location.state}
                </span>
              </h3>
              <div className="flex items-center gap-3 text-slate-700 text-sm">
                <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
                <span>
                  {listing.location.locality ? `${listing.location.locality}, ` : ''}
                  {listing.location.city}, {listing.location.state}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Price, Seller & Interactive Chat */}
          <div className="lg:col-span-5 space-y-6">
            {/* Owner Management Controls & Boost Promotion */}
            {isOwner && (
              <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    You Own This Ad
                  </span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">Seller Dashboard</span>
                </div>

                {isListingBoosted(listing) ? (
                  <div className="p-3.5 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 rounded-xl text-xs space-y-1.5">
                    <div className="font-extrabold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <Rocket className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                      <span>Boost Active • Top Category Placement</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Package: <span className="font-semibold text-slate-700 dark:text-slate-300">{listing.boostPackageName || 'Top Boost'}</span> • Expires in <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatBoostTimeRemaining(listing.boostExpiresAt)}</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                      Elevate your ad to the top of category feeds to get up to 8x more verified buyer views and chat inquiries.
                    </p>
                    <button
                      onClick={() => setIsBoostModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Rocket className="w-4 h-4 text-amber-300" />
                      <span>Boost Your Ad to Top</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Fiverr-Style Contiguous Gig Price & Summary Card */}
            <div className="bg-white rounded-xl border border-[#dadce0] overflow-hidden shadow-2xs">
              <div className="px-6 py-3 bg-[#f8f9fa] border-b border-[#dadce0] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1dbf73]">
                  Standard Offer
                </span>
                <span className="text-[11px] font-medium text-[#5f6368] font-mono tabular-nums">
                  ID #{listing.id}
                </span>
              </div>

              <div className="p-6 space-y-4">
                {isListingBoosted(listing) && (
                  <div className="p-2.5 bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] rounded-lg flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <Rocket className="w-4 h-4" />
                      <span>Boosted Placement</span>
                    </div>
                    <span className="text-[10px] font-mono tabular-nums">
                      {formatBoostTimeRemaining(listing.boostExpiresAt)} left
                    </span>
                  </div>
                )}

                <div>
                  <div className="text-3xl font-extrabold font-mono tabular-nums text-[#202124] flex items-baseline gap-1.5">
                    <span>₹{listing.price.toLocaleString('en-IN')}</span>
                    {(listing.subcategoryId === 'sub_house_apt_rent' || 
                      listing.subcategoryId === 'sub_house_shops_rent' || 
                      listing.subcategoryId === 'sub_house_pg_guest' ||
                      listing.title.toLowerCase().includes('for rent') ||
                      listing.title.toLowerCase().includes('rental')
                    ) && (
                      <span className="text-sm font-semibold text-[#5f6368] font-sans">/ month</span>
                    )}
                  </div>
                  <h1 className="text-base font-bold text-[#202124] mt-2 leading-snug">
                    {listing.title}
                  </h1>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#f1f3f4] text-xs text-[#5f6368]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#5f6368]" />
                    <span>{listing.location.locality || listing.location.city}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#5f6368]" />
                      {listing.createdAt.split(' ')[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#5f6368]" />
                      {listing.views} views
                    </span>
                  </div>
                </div>

                {/* Call & Reveal Phone Button inside Contiguous Package Box */}
                <div className="pt-1">
                  {showPhone ? (
                    <div className="p-3 bg-[#e6f4ea] border border-[#ceead6] rounded-lg flex items-center justify-between text-[#137333] font-bold text-sm font-mono tabular-nums">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#137333]" />
                        <span>{listing.sellerPhone}</span>
                      </div>
                      <span className="text-[11px] font-sans font-semibold text-[#137333]">
                        Verified Seller
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPhone(true)}
                      className="w-full py-3 px-4 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold rounded-md flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Continue &amp; Reveal Phone</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fiverr Seller Profile Card */}
            <div className="bg-white rounded-xl border border-[#dadce0] p-6 shadow-2xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
                About The Seller
              </h4>

              <div className="flex items-center gap-3.5">
                {listing.sellerAvatar ? (
                  <img
                    src={listing.sellerAvatar}
                    alt={listing.sellerName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border border-[#dadce0] shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#e6f4ea] text-[#137333] font-bold text-lg flex items-center justify-center border border-[#ceead6] shrink-0">
                    {(listing.sellerName || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#202124] text-base flex items-center gap-1.5">
                    <span className="truncate">{listing.sellerName}</span>
                    <span title="Verified KYC Account">
                      <ShieldCheck className="w-4 h-4 text-[#1dbf73]" />
                    </span>
                  </div>
                  <div className="text-xs text-[#5f6368] flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1dbf73]" /> Government KYC Verified
                  </div>
                  <div className="text-[11px] text-[#5f6368] mt-0.5">
                    Avg. response time: <strong className="text-[#202124]">&lt; 1 hour</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Live Chat with Seller */}
            <div className="bg-white rounded-xl border border-[#dadce0] overflow-hidden shadow-2xs">
              <div className="bg-[#f8f9fa] border-b border-[#dadce0] text-[#202124] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#1dbf73]" />
                  <span className="font-bold text-xs">Message {listing.sellerName}</span>
                </div>
                <span className="text-[11px] text-[#137333] font-semibold">
                  Available
                </span>
              </div>

              <div className="p-4 bg-white space-y-3 h-64 overflow-y-auto text-xs">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl ${
                        msg.sender === 'user'
                          ? 'bg-[#1dbf73] text-white rounded-br-none'
                          : 'bg-[#f8f9fa] text-[#202124] border border-[#dadce0] rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-[#5f6368] mt-0.5 px-1 font-mono tabular-nums">{msg.time}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1 text-[#5f6368] italic text-[11px]">
                    <span>Seller is typing...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-[#f8f9fa] border-t border-[#dadce0] flex gap-2">
                <input
                  type="text"
                  value={newChatInput}
                  onChange={(e) => setNewChatInput(e.target.value)}
                  placeholder="Ask a question or propose an offer..."
                  className="flex-1 text-xs bg-white border border-[#dadce0] rounded-md px-3 py-2 focus:border-[#202124] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newChatInput.trim()}
                  className="px-3.5 py-2 bg-[#1dbf73] hover:bg-[#19a463] disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Google Maps Location Widget (OLX Style) */}
            <ListingMapWidget
              cityName={listing.location.city}
              locality={listing.location.locality}
              state={listing.location.state}
              title={listing.title}
              priceFormatted={`₹${listing.price.toLocaleString('en-IN')}`}
            />

            {/* Buyer Safety Tips Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-amber-900 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Safety Tips for Indian Buyers
              </div>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-amber-800/90 leading-relaxed">
                <li>Meet in person in a safe, public daytime location.</li>
                <li>Never transfer advance token money via UPI or QR code.</li>
                <li>Verify vehicle registration/RC or electronic bills before payment.</li>
              </ul>
            </div>
          </div>
        </article>

        {/* Similar / Related Listings Section */}
        {relatedListings.length > 0 && (
          <div className="mt-12 pt-8 border-t border-[#dadce0]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#202124]">
                  Similar Classifieds in {listing.location.city}
                </h2>
                <p className="text-xs text-[#5f6368]">
                  Related listings in the same category or city
                </p>
              </div>

              {/* Grid / Listicle Toggle for Similar Ads */}
              <div className="flex items-center border border-[#dadce0] rounded-lg p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setSimilarAdsLayout('grid')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    similarAdsLayout === 'grid'
                      ? 'bg-[#e6f4ea] text-[#137333]'
                      : 'text-[#5f6368] hover:text-[#202124]'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimilarAdsLayout('listicle')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    similarAdsLayout === 'listicle'
                      ? 'bg-[#e6f4ea] text-[#137333]'
                      : 'text-[#5f6368] hover:text-[#202124]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Listicle</span>
                </button>
              </div>
            </div>

            {similarAdsLayout === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {relatedListings.map((item) => {
                  const itemUrl = buildChillyUrl({ listing: item, categories });
                  const sellerInitial = (item.sellerName || 'S').charAt(0).toUpperCase();
                  const isItemPending = isUrlPending(itemUrl);
                  return (
                    <NavLink
                      key={item.id}
                      href={itemUrl}
                      showSpinner={false}
                      className="bg-white rounded-xl border border-[#dadce0] hover:border-[#1dbf73] overflow-hidden shadow-2xs hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
                    >
                      <div className="relative aspect-[4/3] bg-[#f1f3f4] overflow-hidden">
                        <ImageWithFallback
                          src={item.images[0]}
                          alt={item.title}
                          categoryId={item.categoryId}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-4 h-4 rounded-full bg-[#e6f4ea] text-[#137333] font-bold text-[9px] flex items-center justify-center shrink-0">
                                {sellerInitial}
                              </div>
                              <span className="text-[11px] font-semibold text-[#202124] truncate">
                                {item.sellerName || 'Verified Seller'}
                              </span>
                            </div>
                            {isItemPending && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1dbf73] shrink-0" />
                            )}
                          </div>
                          <h4 className="font-medium text-xs text-[#202124] group-hover:text-[#1dbf73] line-clamp-2 leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-[#5f6368] truncate">
                            {item.location.locality ? `${item.location.locality}, ` : ''}{item.location.city}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[#f1f3f4] flex items-baseline justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368]">Price</span>
                          <span className="text-sm font-bold font-mono tabular-nums text-[#202124]">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {relatedListings.map((item, idx) => {
                  const itemUrl = buildChillyUrl({ listing: item, categories });
                  const sellerInitial = (item.sellerName || 'S').charAt(0).toUpperCase();
                  const isItemPending = isUrlPending(itemUrl);
                  return (
                    <NavLink
                      key={item.id}
                      href={itemUrl}
                      showSpinner={false}
                      className="bg-white rounded-xl border border-[#dadce0] hover:border-[#1dbf73] p-3.5 sm:p-4 shadow-2xs hover:shadow-md cursor-pointer transition-all group flex flex-col sm:flex-row items-start sm:items-center gap-4"
                    >
                      <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[#f8f9fa] border border-[#dadce0] text-[#5f6368] group-hover:border-[#1dbf73] group-hover:text-[#1dbf73] font-mono text-xs font-bold tabular-nums items-center justify-center shrink-0 transition-colors">
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      <div className="relative w-full sm:w-44 h-40 sm:h-28 rounded-lg bg-[#f1f3f4] overflow-hidden shrink-0">
                        <ImageWithFallback
                          src={item.images[0]}
                          alt={item.title}
                          categoryId={item.categoryId}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5f6368]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-[#e6f4ea] text-[#137333] font-bold text-[9px] flex items-center justify-center">
                              {sellerInitial}
                            </div>
                            <span className="font-semibold text-[#202124]">{item.sellerName || 'Verified Seller'}</span>
                          </div>
                          <span>·</span>
                          <span>{item.location.locality ? `${item.location.locality}, ` : ''}{item.location.city}</span>
                          <span>·</span>
                          <span>{item.createdAt.split(' ')[0]}</span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-[#202124] group-hover:text-[#1dbf73] transition-colors line-clamp-1">
                          {item.title}
                        </h4>

                        <p className="text-xs text-[#5f6368] line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="w-full sm:w-auto sm:pl-4 sm:border-l border-[#f1f3f4] flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                        <div className="sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368] block">Price</span>
                          <span className="text-base sm:text-lg font-extrabold font-mono tabular-nums text-[#202124]">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="px-3 py-1.5 rounded-md bg-[#f8f9fa] group-hover:bg-[#1dbf73] text-[#202124] group-hover:text-white border border-[#dadce0] group-hover:border-[#1dbf73] text-xs font-semibold transition-colors flex items-center gap-1">
                          <span>View Ad</span>
                          {isItemPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Boost Your Ad Modal */}
      {listing && (
        <BoostAdModal
          listing={listing}
          isOpen={isBoostModalOpen}
          onClose={() => setIsBoostModalOpen(false)}
          onBoostSuccess={() => setIsBoostModalOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
};
