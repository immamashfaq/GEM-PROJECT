// =============================================================================
// Listing Types
// =============================================================================

export type ListingType = 'FIXED_PRICE' | 'NEGOTIABLE' | 'TIMED_AUCTION' | 'LIVE_AUCTION';

export type ListingStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'SOLD'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'DELETED';

export type NaturalStatus = 'NATURAL' | 'SYNTHETIC' | 'LAB_GROWN';
export type MountedStatus = 'LOOSE' | 'MOUNTED';
export type Currency = 'LKR' | 'USD';

export interface GemCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  listingCount?: number;
}

export interface GemTreatment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface ListingMedia {
  id: string;
  listingId: string;
  url: string;
  publicId: string;
  mediaType: 'IMAGE' | 'VIDEO';
  isThumbnail: boolean;
  sortOrder: number;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface GemCertificate {
  id: string;
  listingId: string;
  labName: string;
  certificateNumber: string | null;
  verificationUrl: string | null;
  fileUrl: string | null;
  issuedAt: string | null;
  createdAt: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  slug: string;

  // Gem attributes
  gemType: string;
  variety: string | null;
  originCountry: string | null;
  originRegion: string | null;
  caratWeight: number | null;
  color: string | null;
  clarity: string | null;
  cut: string | null;
  shape: string | null;
  dimensionsMm: string | null;
  treatment: string | null;
  isHeatTreated: boolean | null;
  transparency: string | null;
  refractiveIndex: number | null;
  specificGravity: number | null;
  hardness: number | null;
  isCertified: boolean;
  naturalStatus: NaturalStatus;
  mountedStatus: MountedStatus;

  // Pricing
  currency: Currency;
  listingType: ListingType;
  fixedPrice: number | null;
  negotiablePrice: number | null;
  minAcceptableOffer: number | null;
  auctionStartPrice: number | null;
  reservePrice: number | null;
  minBidIncrement: number | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  autoExtend: boolean;

  // Stats
  viewCount: number;
  watchCount: number;
  favoriteCount: number;

  // Status
  status: ListingStatus;
  isFeatured: boolean;
  isPromoted: boolean;
  adminNotes: string | null;

  // Timestamps
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations (optional, included in detail view)
  seller?: import('./user.js').PublicUser;
  sellerProfile?: import('./user.js').SellerProfile;
  category?: GemCategory;
  media?: ListingMedia[];
  certificate?: GemCertificate | null;
  isWatched?: boolean;
}

export interface ListingSummary {
  id: string;
  title: string;
  slug: string;
  gemType: string;
  caratWeight: number | null;
  color: string | null;
  clarity: string | null;
  listingType: ListingType;
  currency: Currency;
  fixedPrice: number | null;
  auctionStartPrice: number | null;
  auctionEndsAt: string | null;
  status: ListingStatus;
  isCertified: boolean;
  naturalStatus: NaturalStatus;
  viewCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  thumbnail: string | null;
  isWatched?: boolean;
  treatment?: string | null;
  variety?: string | null;
  seller?: import('./user.js').PublicUser;
  sellerProfile?: Pick<
    import('./user.js').SellerProfile,
    'id' | 'isVerified' | 'averageRating' | 'completedSales'
  >;
  createdAt: string;
  publishedAt: string | null;
}

export interface SearchFilters {
  q?: string;
  gemType?: string;
  variety?: string;
  categoryId?: string;
  color?: string;
  clarity?: string;
  cut?: string;
  shape?: string;
  caratMin?: number;
  caratMax?: number;
  priceMin?: number;
  priceMax?: number;
  currency?: Currency;
  treatment?: string;
  certifiedOnly?: boolean;
  labName?: string;
  originCountry?: string;
  naturalStatus?: NaturalStatus;
  listingType?: ListingType;
  verifiedSellersOnly?: boolean;
  isFeatured?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: ListingSortBy;
}

export type ListingSortBy =
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'ending_soon'
  | 'most_viewed'
  | 'carat_desc'
  | 'carat_asc';

export interface SearchFacets {
  gemTypes: Array<{ value: string; count: number }>;
  colors: Array<{ value: string; count: number }>;
  origins: Array<{ value: string; count: number }>;
  listingTypes: Array<{ value: ListingType; count: number }>;
  priceRange: { min: number; max: number };
  caratRange: { min: number; max: number };
}
