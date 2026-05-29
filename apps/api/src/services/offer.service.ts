import type { FastifyInstance } from 'fastify';
import { CreateOfferInput, RespondOfferInput } from '@gem/validators';

export class OfferService {
  constructor(private fastify: FastifyInstance) {}

  async createOffer(buyerId: string, data: CreateOfferInput) {
    const { prisma } = this.fastify;

    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: {
        sellerId: true,
        listingType: true,
        status: true,
        minAcceptableOffer: true,
      },
    });

    if (!listing) {
      throw this.fastify.httpErrors.notFound('Listing not found');
    }

    if (listing.status !== 'ACTIVE') {
      throw this.fastify.httpErrors.badRequest('Listing is not active');
    }

    if (listing.listingType !== 'NEGOTIABLE') {
      throw this.fastify.httpErrors.badRequest('This listing does not accept offers');
    }

    if (buyerId === listing.sellerId) {
      throw this.fastify.httpErrors.badRequest('You cannot make an offer on your own listing');
    }

    // Auto-reject if below minimum acceptable offer (if set by seller)
    if (listing.minAcceptableOffer && data.amount < Number(listing.minAcceptableOffer)) {
      throw this.fastify.httpErrors.badRequest(`Offer is too low. The seller has set a minimum acceptable offer.`);
    }

    // Check if buyer already has a pending offer on this listing
    const existingOffer = await prisma.offer.findFirst({
      where: {
        listingId: data.listingId,
        buyerId,
        status: 'PENDING',
      },
    });

    if (existingOffer) {
      throw this.fastify.httpErrors.badRequest('You already have a pending offer on this listing');
    }

    // Create the offer
    // Offers expire in 48 hours by default
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const offer = await prisma.offer.create({
      data: {
        listingId: data.listingId,
        buyerId,
        sellerId: listing.sellerId,
        amount: data.amount,
        message: data.message,
        expiresAt,
        history: {
          create: {
            actorId: buyerId,
            status: 'PENDING',
            amount: data.amount,
            note: 'Initial offer',
          },
        },
      },
      include: {
        listing: {
          select: { title: true, media: { take: 1 } },
        },
      },
    });

    return offer;
  }

  async getSentOffers(buyerId: string) {
    const { prisma } = this.fastify;

    return prisma.offer.findMany({
      where: { buyerId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            negotiablePrice: true,
            media: {
              where: { isThumbnail: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReceivedOffers(sellerId: string) {
    const { prisma } = this.fastify;

    return prisma.offer.findMany({
      where: { sellerId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            negotiablePrice: true,
            media: {
              where: { isThumbnail: true },
              take: 1,
            },
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToOffer(sellerId: string, offerId: string, response: RespondOfferInput) {
    const { prisma } = this.fastify;

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw this.fastify.httpErrors.notFound('Offer not found');
    }

    if (offer.sellerId !== sellerId) {
      throw this.fastify.httpErrors.forbidden('Not authorized to respond to this offer');
    }

    if (offer.status !== 'PENDING') {
      throw this.fastify.httpErrors.badRequest(`Offer is already ${offer.status.toLowerCase()}`);
    }

    // Execute atomic update
    const updatedOffer = await prisma.$transaction(async (tx) => {
      const updated = await tx.offer.update({
        where: { id: offerId },
        data: {
          status: response.status,
        },
        include: {
          listing: {
            select: { title: true },
          },
        },
      });

      await tx.offerHistory.create({
        data: {
          offerId,
          actorId: sellerId,
          status: response.status,
          amount: offer.amount,
          note: response.note,
        },
      });

      return updated;
    });

    return updatedOffer;
  }
}
