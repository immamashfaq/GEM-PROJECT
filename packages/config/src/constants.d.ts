export declare const APP_NAME = "Gem Project";
export declare const APP_DESCRIPTION = "Sri Lanka's Premium Gemstone Marketplace";
export declare const APP_URL: string;
export declare const API_URL: string;
export declare const JWT_ACCESS_EXPIRY = "15m";
export declare const JWT_REFRESH_EXPIRY = "30d";
export declare const JWT_ACCESS_EXPIRY_MS: number;
export declare const JWT_REFRESH_EXPIRY_MS: number;
export declare const DEFAULT_PAGE_SIZE = 20;
export declare const MAX_PAGE_SIZE = 100;
export declare const MAX_IMAGE_SIZE_MB = 10;
export declare const MAX_IMAGE_SIZE_BYTES: number;
export declare const MAX_VIDEO_SIZE_MB = 100;
export declare const MAX_VIDEO_SIZE_BYTES: number;
export declare const MAX_KYC_DOC_SIZE_MB = 15;
export declare const MAX_KYC_DOC_SIZE_BYTES: number;
export declare const MAX_LISTING_IMAGES = 10;
export declare const ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp"];
export declare const ALLOWED_VIDEO_TYPES: readonly ["video/mp4", "video/quicktime", "video/webm"];
export declare const ALLOWED_DOC_TYPES: readonly ["image/jpeg", "image/png", "application/pdf"];
export declare const MIN_BID_INCREMENT_DEFAULT = 100;
export declare const AUCTION_ANTI_SNIPE_MINUTES = 5;
export declare const OFFER_EXPIRY_HOURS = 48;
export declare const FEATURED_LISTING_LIMIT = 8;
export declare const RATE_LIMIT_LOGIN: {
    max: number;
    timeWindow: string;
};
export declare const RATE_LIMIT_REGISTER: {
    max: number;
    timeWindow: string;
};
export declare const RATE_LIMIT_BID: {
    max: number;
    timeWindow: string;
};
export declare const RATE_LIMIT_OFFER: {
    max: number;
    timeWindow: string;
};
export declare const RATE_LIMIT_UPLOAD: {
    max: number;
    timeWindow: string;
};
export declare const RATE_LIMIT_GENERAL: {
    max: number;
    timeWindow: string;
};
export declare const SUPPORTED_CURRENCIES: readonly ["LKR", "USD"];
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];
export declare const DEFAULT_GEM_CATEGORIES: readonly ["Blue Sapphire", "Star Sapphire", "Ruby", "Alexandrite", "Cat's Eye Chrysoberyl", "Yellow Sapphire", "Pink Sapphire", "Spinel", "Tourmaline", "Aquamarine", "Emerald", "Garnet", "Zircon", "Moonstone", "Amethyst", "Topaz", "Peridot", "Other"];
export declare const ORIGIN_COUNTRIES: readonly ["Sri Lanka", "Myanmar", "Madagascar", "Colombia", "India", "Thailand", "Cambodia", "Tanzania", "Kenya", "Brazil", "Australia", "Russia", "Vietnam", "Zambia", "Mozambique", "Afghanistan", "Other"];
export declare const SRI_LANKA_REGIONS: readonly ["Ratnapura", "Eheliyagoda", "Balangoda", "Kuruwita", "Elahera", "Matale", "Kandy", "Galle", "Other"];
export declare const GEM_TREATMENTS: readonly ["None (Unheated)", "Heated", "Fracture Filled", "Beryllium Treated", "Glass Filled", "Oiling/Resin", "Irradiated", "Surface Coating", "Unknown"];
export declare const CERT_LABS: readonly ["GIA", "AGL", "Gübelin", "SSEF", "IGI", "HRD", "GRS", "Lotus Gemology", "NGTC", "National Gem & Jewellery Authority (NGJA)", "Other"];
export declare const REDIS_KEYS: {
    readonly AUCTION_STATE: (id: string) => string;
    readonly AUCTION_BIDS: (id: string) => string;
    readonly USER_SESSION: (id: string) => string;
    readonly RATE_LIMIT: (key: string) => string;
    readonly SEARCH_CACHE: (hash: string) => string;
};
//# sourceMappingURL=constants.d.ts.map