import type { PrismaClient, Prisma } from '@prisma/client';
import type { CreateListingInput, UpdateListingInput } from '@gem/validators';
import type { AuthenticatedUser } from '../middleware/authenticate.js';
import { generateListingSlug } from '../lib/utils.js';
import { getPaginationParams, buildPaginationMeta } from '../lib/pagination.js';

// Shared select for listing summary (list views)
const LISTING_SUMMARY_SELECT = {
  id: true,
  title: true,
  slug: true,
  gemType: true,
  variety: true,
  caratWeight: true,
  color: true,
  clarity: true,
  shape: true,
  listingType: true,
  currency: true,
  fixedPrice: true,
  negotiablePrice: true,
  auctionStartPrice: true,
  auctionEndsAt: true,
  status: true,
  isCertified: true,
  naturalStatus: true,
  treatment: true,
  viewCount: true,
  favoriteCount: true,
  watchCount: true,
  isFeatured: true,
  isPromoted: true,
  originCountry: true,
  publishedAt: true,
  createdAt: true,
  seller: {
    select: {
      id: true,
      username: true,
      fullName: true,
      avatarUrl: true,
      sellerProfile: {
        select: {
          id: true,
          isVerified: true,
          averageRating: true,
          completedSales: true,
        },
      },
    },
  },
  media: {
    where: { isThumbnail: true },
    select: { url: true },
    take: 1,
  },
} satisfies Prisma.ListingSelect;

export class ListingService {
  constructor(private readonly prisma: PrismaClient) {}

  async getCategories() {
    return this.prisma.gemCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        iconUrl: true,
        _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
      },
    });
  }

  async getListings(
    query: {
      page: number;
      pageSize: number;
      categoryId?: string;
      isFeatured?: boolean;
      listingType?: string;
      sortBy?: string;
    },
    userId?: string,
  ) {
    const { skip, take, page, pageSize } = getPaginationParams(query);

    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
      ...(query.listingType && { listingType: query.listingType as any }),
    };

    const orderBy = this.buildOrderBy(query.sortBy);

    const [listings, totalCount] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy,
        select: LISTING_SUMMARY_SELECT,
      }),
      this.prisma.listing.count({ where }),
    ]);

    // Attach watchlist status for authenticated users
    let watchedIds = new Set<string>();
    if (userId) {
      const watched = await this.prisma.watchlist.findMany({
        where: { userId, listingId: { in: listings.map((l) => l.id) } },
        select: { listingId: true },
      });
      watchedIds = new Set(watched.map((w) => w.listingId));
    }

    const data = listings.map((l) => ({
      ...l,
      caratWeight: l.caratWeight ? Number(l.caratWeight) : null,
      fixedPrice: l.fixedPrice ? Number(l.fixedPrice) : null,
      negotiablePrice: l.negotiablePrice ? Number(l.negotiablePrice) : null,
      auctionStartPrice: l.auctionStartPrice ? Number(l.auctionStartPrice) : null,
      sellerProfile: l.seller.sellerProfile
        ? {
            ...l.seller.sellerProfile,
            averageRating: l.seller.sellerProfile.averageRating ? Number(l.seller.sellerProfile.averageRating) : null,
          }
        : null,
      thumbnail: l.media[0]?.url ?? null,
      isWatched: watchedIds.has(l.id),
    }));

    return {
      data,
      pagination: buildPaginationMeta(totalCount, page, pageSize),
    };
  }

  async getListingById(id: string, userId?: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id,
        status: { in: ['ACTIVE', 'DRAFT'] },
        deletedAt: null,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            createdAt: true,
            sellerProfile: {
              select: {
                id: true,
                businessName: true,
                bio: true,
                location: true,
                isVerified: true,
                averageRating: true,
                totalReviews: true,
                completedSales: true,
                responseRatePercent: true,
              },
            },
          },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        media: {
          orderBy: { sortOrder: 'asc' },
        },
        certificate: true,
        auction: {
          select: {
            id: true,
            status: true,
            currentPrice: true,
            startsAt: true,
            endsAt: true,
            totalBids: true,
          },
        },
      },
    });

    if (!listing) return null;

    let isWatched = false;
    if (userId) {
      const watched = await this.prisma.watchlist.findUnique({
        where: { userId_listingId: { userId, listingId: id } },
      });
      isWatched = !!watched;
    }

    return {
      ...listing,
      caratWeight: listing.caratWeight ? Number(listing.caratWeight) : null,
      fixedPrice: listing.fixedPrice ? Number(listing.fixedPrice) : null,
      negotiablePrice: listing.negotiablePrice ? Number(listing.negotiablePrice) : null,
      auctionStartPrice: listing.auctionStartPrice ? Number(listing.auctionStartPrice) : null,
      reservePrice: listing.reservePrice ? Number(listing.reservePrice) : null,
      minBidIncrement: listing.minBidIncrement ? Number(listing.minBidIncrement) : null,
      sellerProfile: listing.seller.sellerProfile
        ? {
            ...listing.seller.sellerProfile,
            averageRating: listing.seller.sellerProfile.averageRating ? Number(listing.seller.sellerProfile.averageRating) : null,
            responseRatePercent: listing.seller.sellerProfile.responseRatePercent
              ? Number(listing.seller.sellerProfile.responseRatePercent)
              : null,
          }
        : null,
      auction: listing.auction
        ? { ...listing.auction, currentPrice: listing.auction.currentPrice ? Number(listing.auction.currentPrice) : null }
        : null,
      isWatched,
    };
  }

  async createListing(sellerId: string, input: CreateListingInput) {
    const slug = generateListingSlug(input.title);

    // Ensure seller has a SellerProfile
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId: sellerId },
    });

    if (!profile) {
      // Auto-create profile for sellers on first listing
      await this.prisma.sellerProfile.create({
        data: { userId: sellerId },
      });
    }

    const listing = await this.prisma.listing.create({
      data: {
        sellerId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        slug,
        gemType: input.gemType,
        variety: input.variety,
        originCountry: input.originCountry,
        originRegion: input.originRegion,
        caratWeight: input.caratWeight,
        color: input.color,
        clarity: input.clarity,
        cut: input.cut,
        shape: input.shape,
        dimensionsMm: input.dimensionsMm,
        treatment: input.treatment,
        isHeatTreated: input.isHeatTreated,
        transparency: input.transparency,
        refractiveIndex: input.refractiveIndex,
        specificGravity: input.specificGravity,
        hardness: input.hardness,
        isCertified: input.isCertified ?? false,
        naturalStatus: input.naturalStatus ?? 'NATURAL',
        mountedStatus: input.mountedStatus ?? 'LOOSE',
        currency: input.currency ?? 'LKR',
        listingType: input.listingType,
        fixedPrice: input.fixedPrice,
        negotiablePrice: input.negotiablePrice,
        minAcceptableOffer: input.minAcceptableOffer,
        auctionStartPrice: input.auctionStartPrice,
        reservePrice: input.reservePrice,
        minBidIncrement: input.minBidIncrement,
        auctionStartsAt: input.auctionStartsAt ? new Date(input.auctionStartsAt) : null,
        auctionEndsAt: input.auctionEndsAt ? new Date(input.auctionEndsAt) : null,
        autoExtend: input.autoExtend ?? true,
        status: 'DRAFT',
      },
    });

    return listing;
  }

  async updateListing(id: string, actor: AuthenticatedUser, input: UpdateListingInput) {
    const existing = await this.prisma.listing.findUnique({
      where: { id },
      include: { auction: true },
    });
    if (!existing || existing.deletedAt) {
      const error = new Error('Listing not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    if (existing.sellerId !== actor.id && actor.role !== 'ADMIN') {
      const error = new Error('Access denied') as Error & { statusCode: number };
      error.statusCode = 403;
      throw error;
    }

    if (existing.status === 'SOLD') {
      const error = new Error('Cannot update a sold listing') as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    if (existing.auction && existing.auction.totalBids > 0) {
      const error = new Error('Cannot update a listing with active bids') as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...input,
        auctionStartsAt: input.auctionStartsAt ? new Date(input.auctionStartsAt) : undefined,
        auctionEndsAt: input.auctionEndsAt ? new Date(input.auctionEndsAt) : undefined,
      },
    });
  }

  async deleteListing(id: string, actor: AuthenticatedUser) {
    const existing = await this.prisma.listing.findUnique({
      where: { id },
      include: { auction: true },
    });
    if (!existing || existing.deletedAt) {
      const error = new Error('Listing not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    if (existing.sellerId !== actor.id && actor.role !== 'ADMIN') {
      const error = new Error('Access denied') as Error & { statusCode: number };
      error.statusCode = 403;
      throw error;
    }

    if (existing.status === 'SOLD') {
      const error = new Error('Cannot delete a sold listing') as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    if (existing.auction && existing.auction.totalBids > 0) {
      const error = new Error('Cannot delete a listing with active bids') as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    await this.prisma.listing.update({
      where: { id },
      data: { status: 'DELETED', deletedAt: new Date() },
    });
  }

  async publishListing(id: string, sellerId: string) {
    const existing = await this.prisma.listing.findFirst({
      where: { id, sellerId, deletedAt: null },
    });

    if (!existing) {
      const error = new Error('Listing not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    if (existing.status !== 'DRAFT') {
      const error = new Error('Only DRAFT listings can be published') as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });
  }

  async addToWatchlist(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, status: 'ACTIVE' },
    });
    if (!listing) {
      const error = new Error('Listing not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    await this.prisma.$transaction([
      this.prisma.watchlist.upsert({
        where: { userId_listingId: { userId, listingId } },
        create: { userId, listingId },
        update: {},
      }),
      this.prisma.listing.update({
        where: { id: listingId },
        data: { watchCount: { increment: 1 } },
      }),
    ]);
  }

  async removeFromWatchlist(userId: string, listingId: string) {
    const entry = await this.prisma.watchlist.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (!entry) return;

    await this.prisma.$transaction([
      this.prisma.watchlist.delete({
        where: { userId_listingId: { userId, listingId } },
      }),
      this.prisma.listing.update({
        where: { id: listingId },
        data: { watchCount: { decrement: 1 } },
      }),
    ]);
  }

  async reportListing(
    reporterId: string,
    listingId: string,
    reason: string,
    description?: string,
  ) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      const error = new Error('Listing not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    await this.prisma.$transaction([
      this.prisma.report.create({
        data: {
          reporterId,
          type: 'LISTING',
          listingId,
          reason,
          description,
        },
      }),
      this.prisma.listing.update({
        where: { id: listingId },
        data: { reportCount: { increment: 1 } },
      }),
    ]);
  }

  async getMyListings(
    sellerId: string,
    query: { page: number; pageSize: number; status?: string },
  ) {
    const { skip, take, page, pageSize } = getPaginationParams(query);

    const where: Prisma.ListingWhereInput = {
      sellerId,
      deletedAt: null,
      ...(query.status && { status: query.status as any }),
    };

    const [listings, totalCount] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: LISTING_SUMMARY_SELECT,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { data: listings, pagination: buildPaginationMeta(totalCount, page, pageSize) };
  }

  async getWatchlist(userId: string, query: { page: number; pageSize: number }) {
    const { skip, take, page, pageSize } = getPaginationParams(query);

    const [entries, totalCount] = await Promise.all([
      this.prisma.watchlist.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { select: LISTING_SUMMARY_SELECT },
        },
      }),
      this.prisma.watchlist.count({ where: { userId } }),
    ]);

    return {
      data: entries.map((e) => ({ ...e.listing, isWatched: true })),
      pagination: buildPaginationMeta(totalCount, page, pageSize),
    };
  }

  async incrementViewCount(listingId: string) {
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { viewCount: { increment: 1 } },
    });
  }

  async addMedia(listingId: string, sellerId: string, media: { url: string; sortOrder: number; isThumbnail: boolean }[]) {
    // Verify ownership
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, sellerId, deletedAt: null },
    });
    if (!listing) {
      const error = new Error('Listing not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    // Delete existing media and recreate
    await this.prisma.listingMedia.deleteMany({ where: { listingId } });

    const created = await this.prisma.$transaction(
      media.map((m) =>
        this.prisma.listingMedia.create({
          data: {
            listingId,
            url: m.url,
            publicId: '',
            mediaType: 'IMAGE',
            isThumbnail: m.isThumbnail,
            sortOrder: m.sortOrder,
          },
        })
      )
    );

    return created;
  }

  async addCertificate(listingId: string, sellerId: string, data: { labName: string; certificateNumber?: string; fileUrl: string }) {
    // Verify ownership
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, sellerId, deletedAt: null },
    });
    if (!listing) {
      const error = new Error('Listing not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    // Upsert certificate
    const certificate = await this.prisma.gemCertificate.upsert({
      where: { listingId },
      update: { labName: data.labName, certificateNumber: data.certificateNumber, fileUrl: data.fileUrl },
      create: { listingId, labName: data.labName, certificateNumber: data.certificateNumber, fileUrl: data.fileUrl },
    });

    return certificate;
  }

  private buildOrderBy(sortBy?: string): Prisma.ListingOrderByWithRelationInput {
    switch (sortBy) {
      case 'price_asc':
        return { fixedPrice: 'asc' };
      case 'price_desc':
        return { fixedPrice: 'desc' };
      case 'ending_soon':
        return { auctionEndsAt: 'asc' };
      case 'most_viewed':
        return { viewCount: 'desc' };
      case 'carat_desc':
        return { caratWeight: 'desc' };
      case 'carat_asc':
        return { caratWeight: 'asc' };
      case 'newest':
      default:
        return { publishedAt: 'desc' };
    }
  }
}
