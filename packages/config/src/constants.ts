// =============================================================================
// Application-wide constants
// =============================================================================

export const APP_NAME = 'Gem Project';
export const APP_DESCRIPTION = 'Sri Lanka\'s Premium Gemstone Marketplace';
export const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
export const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:4000';

// Authentication
export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '30d';
export const JWT_ACCESS_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
export const JWT_REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Uploads
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_VIDEO_SIZE_MB = 100;
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
export const MAX_KYC_DOC_SIZE_MB = 15;
export const MAX_KYC_DOC_SIZE_BYTES = MAX_KYC_DOC_SIZE_MB * 1024 * 1024;
export const MAX_LISTING_IMAGES = 10;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
export const ALLOWED_DOC_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

// Marketplace
export const MIN_BID_INCREMENT_DEFAULT = 100; // LKR
export const AUCTION_ANTI_SNIPE_MINUTES = 5;
export const OFFER_EXPIRY_HOURS = 48;
export const FEATURED_LISTING_LIMIT = 8;

// Rate limits (requests per window)
export const RATE_LIMIT_LOGIN = { max: 5, timeWindow: '15m' };
export const RATE_LIMIT_REGISTER = { max: 3, timeWindow: '1h' };
export const RATE_LIMIT_BID = { max: 30, timeWindow: '1m' };
export const RATE_LIMIT_OFFER = { max: 10, timeWindow: '1m' };
export const RATE_LIMIT_UPLOAD = { max: 20, timeWindow: '1h' };
export const RATE_LIMIT_GENERAL = { max: 100, timeWindow: '1m' };

// Currencies
export const SUPPORTED_CURRENCIES = ['LKR', 'USD'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Gem categories (seed data reference)
export const DEFAULT_GEM_CATEGORIES = [
  'Blue Sapphire',
  'Star Sapphire',
  'Ruby',
  'Alexandrite',
  'Cat\'s Eye Chrysoberyl',
  'Yellow Sapphire',
  'Pink Sapphire',
  'Spinel',
  'Tourmaline',
  'Aquamarine',
  'Emerald',
  'Garnet',
  'Zircon',
  'Moonstone',
  'Amethyst',
  'Topaz',
  'Peridot',
  'Other',
] as const;

export const ORIGIN_COUNTRIES = [
  'Sri Lanka',
  'Myanmar',
  'Madagascar',
  'Colombia',
  'India',
  'Thailand',
  'Cambodia',
  'Tanzania',
  'Kenya',
  'Brazil',
  'Australia',
  'Russia',
  'Vietnam',
  'Zambia',
  'Mozambique',
  'Afghanistan',
  'Other',
] as const;

export const SRI_LANKA_REGIONS = [
  'Ratnapura',
  'Eheliyagoda',
  'Balangoda',
  'Kuruwita',
  'Elahera',
  'Matale',
  'Kandy',
  'Galle',
  'Other',
] as const;

export const GEM_TREATMENTS = [
  'None (Unheated)',
  'Heated',
  'Fracture Filled',
  'Beryllium Treated',
  'Glass Filled',
  'Oiling/Resin',
  'Irradiated',
  'Surface Coating',
  'Unknown',
] as const;

export const CERT_LABS = [
  'GIA',
  'AGL',
  'Gübelin',
  'SSEF',
  'IGI',
  'HRD',
  'GRS',
  'Lotus Gemology',
  'NGTC',
  'National Gem & Jewellery Authority (NGJA)',
  'Other',
] as const;

// Redis key prefixes
export const REDIS_KEYS = {
  AUCTION_STATE: (id: string) => `auction:state:${id}`,
  AUCTION_BIDS: (id: string) => `auction:bids:${id}`,
  USER_SESSION: (id: string) => `session:${id}`,
  RATE_LIMIT: (key: string) => `rate_limit:${key}`,
  SEARCH_CACHE: (hash: string) => `search:${hash}`,
} as const;
