import type { PrismaClient, Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import type { SearchListingsInput } from '@gem/validators';
import { getPaginationParams, buildPaginationMeta } from '../lib/pagination.js';

export class SearchService {
  constructor(private readonly server: FastifyInstance) {}

  private get prisma() {
    return this.server.prisma;
  }

  async searchListings(filters: SearchListingsInput, userId?: string) {
    const { skip, take, page, pageSize } = getPaginationParams({
      page: filters.page,
      pageSize: filters.pageSize,
    });

    // Build the where clause from filters
    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
    };

    // Full-text search
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { gemType: { contains: filters.q, mode: 'insensitive' } },
        { variety: { contains: filters.q, mode: 'insensitive' } },
        { originCountry: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    if (filters.gemType) {
      where.gemType = { contains: filters.gemType, mode: 'insensitive' };
    }
    if (filters.variety) {
      where.variety = { contains: filters.variety, mode: 'insensitive' };
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.color) {
      where.color = { contains: filters.color, mode: 'insensitive' };
    }
    if (filters.clarity) {
      where.clarity = { contains: filters.clarity, mode: 'insensitive' };
    }
    if (filters.cut) {
      where.cut = { contains: filters.cut, mode: 'insensitive' };
    }
    if (filters.shape) {
      where.shape = { contains: filters.shape, mode: 'insensitive' };
    }
    if (filters.originCountry) {
      where.originCountry = { contains: filters.originCountry, mode: 'insensitive' };
    }
    if (filters.treatment) {
      where.treatment = { contains: filters.treatment, mode: 'insensitive' };
    }
    if (filters.certifiedOnly) {
      where.isCertified = true;
    }
    if (filters.naturalStatus) {
      where.naturalStatus = filters.naturalStatus;
    }
    if (filters.listingType) {
      where.listingType = filters.listingType;
    }

    // Carat range
    if (filters.caratMin !== undefined || filters.caratMax !== undefined) {
      where.caratWeight = {};
      if (filters.caratMin !== undefined) where.caratWeight.gte = filters.caratMin;
      if (filters.caratMax !== undefined) where.caratWeight.lte = filters.caratMax;
    }

    // Price range (checks both fixedPrice and negotiablePrice)
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const priceConditions: Prisma.ListingWhereInput[] = [];
      if (filters.priceMin !== undefined) {
        priceConditions.push({ fixedPrice: { gte: filters.priceMin } });
        priceConditions.push({ negotiablePrice: { gte: filters.priceMin } });
        priceConditions.push({ auctionStartPrice: { gte: filters.priceMin } });
      }
      if (filters.priceMax !== undefined) {
        priceConditions.push({ fixedPrice: { lte: filters.priceMax } });
        priceConditions.push({ negotiablePrice: { lte: filters.priceMax } });
        priceConditions.push({ auctionStartPrice: { lte: filters.priceMax } });
      }
      where.OR = [...(where.OR ?? []), ...priceConditions];
    }

    // Currency
    if (filters.currency) {
      where.currency = filters.currency;
    }

    // Verified sellers only
    if (filters.verifiedSellersOnly) {
      where.seller = { sellerProfile: { isVerified: true } };
    }

    if (filters.isFeatured) {
      where.isFeatured = true;
    }

    // Build order by
    const orderBy = this.buildOrderBy(filters.sortBy);

    const [listings, totalCount] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
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
          isFeatured: true,
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
                select: { id: true, isVerified: true, averageRating: true, completedSales: true },
              },
            },
          },
          media: {
            where: { isThumbnail: true },
            select: { url: true },
            take: 1,
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    // Watchlist status
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

  async getFacets() {
    const cacheKey = 'search:facets';
    
    try {
      const cached = await this.server.redis.get(cacheKey);
      if (cached) {
        this.server.log.info({ cacheKey }, 'Search facets cache hit');
        return JSON.parse(cached);
      }
    } catch (err) {
      this.server.log.error({ err }, 'Redis error while retrieving search facets cache');
    }

    const [gemTypes, origins, listingTypes, priceStats, caratStats] = await Promise.all([
      this.prisma.listing.groupBy({
        by: ['gemType'],
        where: { status: 'ACTIVE' },
        _count: { gemType: true },
        orderBy: { _count: { gemType: 'desc' } },
        take: 30,
      }),
      this.prisma.listing.groupBy({
        by: ['originCountry'],
        where: { status: 'ACTIVE', originCountry: { not: null } },
        _count: { originCountry: true },
        orderBy: { _count: { originCountry: 'desc' } },
        take: 20,
      }),
      this.prisma.listing.groupBy({
        by: ['listingType'],
        where: { status: 'ACTIVE' },
        _count: { listingType: true },
      }),
      this.prisma.listing.aggregate({
        where: { status: 'ACTIVE', fixedPrice: { not: null } },
        _min: { fixedPrice: true },
        _max: { fixedPrice: true },
      }),
      this.prisma.listing.aggregate({
        where: { status: 'ACTIVE', caratWeight: { not: null } },
        _min: { caratWeight: true },
        _max: { caratWeight: true },
      }),
    ]);

    const result = {
      gemTypes: gemTypes.map((g) => ({ value: g.gemType, count: g._count.gemType })),
      origins: origins
        .filter((o) => o.originCountry)
        .map((o) => ({ value: o.originCountry!, count: o._count.originCountry })),
      listingTypes: listingTypes.map((l) => ({ value: l.listingType, count: l._count.listingType })),
      priceRange: {
        min: Number(priceStats._min.fixedPrice ?? 0),
        max: Number(priceStats._max.fixedPrice ?? 0),
      },
      caratRange: {
        min: Number(caratStats._min.caratWeight ?? 0),
        max: Number(caratStats._max.caratWeight ?? 0),
      },
    };

    try {
      await this.server.redis.setex(cacheKey, 300, JSON.stringify(result));
    } catch (err) {
      this.server.log.error({ err }, 'Redis error while saving search facets cache');
    }

    return result;
  }

  async getSuggestions(query: string) {
    const results = await this.prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { gemType: { contains: query, mode: 'insensitive' } },
          { variety: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, gemType: true, slug: true },
      take: 10,
      distinct: ['title'],
    });

    return results.map((r) => ({
      id: r.id,
      label: r.title,
      type: r.gemType,
      slug: r.slug,
    }));
  }

  private buildOrderBy(sortBy: SearchListingsInput['sortBy']): Prisma.ListingOrderByWithRelationInput {
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
