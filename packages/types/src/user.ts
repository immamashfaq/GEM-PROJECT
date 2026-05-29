// =============================================================================
// User Types
// =============================================================================

export type UserRole = 'GUEST' | 'BUYER' | 'SELLER' | 'VERIFIED_SELLER' | 'ADMIN' | 'SUPER_ADMIN';

export type KycStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_MORE_INFO';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  businessName: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  website: string | null;
  kycStatus: KycStatus;
  isVerified: boolean;
  verifiedAt: string | null;
  averageRating: number | null;
  totalReviews: number;
  completedSales: number;
  responseRatePercent: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProfileWithUser extends SellerProfile {
  user: PublicUser;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser extends User {
  sellerProfile?: SellerProfile | null;
}
