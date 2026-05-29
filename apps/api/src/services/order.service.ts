import type { FastifyInstance } from 'fastify';
import { CreateOrderInput } from '@gem/validators';
import { randomBytes } from 'crypto';

export class OrderService {
  constructor(private fastify: FastifyInstance) {}

  async checkout(buyerId: string, data: CreateOrderInput) {
    const { prisma } = this.fastify;

    // Retrieve listing
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: {
        id: true,
        sellerId: true,
        listingType: true,
        fixedPrice: true,
        status: true,
      },
    });

    if (!listing) {
      throw this.fastify.httpErrors.notFound('Listing not found');
    }

    if (listing.status !== 'ACTIVE') {
      throw this.fastify.httpErrors.badRequest('Listing is no longer active');
    }

    if (buyerId === listing.sellerId) {
      throw this.fastify.httpErrors.badRequest('You cannot purchase your own listing');
    }

    let finalPrice = 0;

    // If an offer is provided, validate it
    if (data.offerId) {
      const offer = await prisma.offer.findUnique({
        where: { id: data.offerId },
      });

      if (!offer) {
        throw this.fastify.httpErrors.notFound('Offer not found');
      }

      if (offer.buyerId !== buyerId) {
        throw this.fastify.httpErrors.forbidden('Not your offer');
      }

      if (offer.status !== 'ACCEPTED') {
        throw this.fastify.httpErrors.badRequest('Offer must be ACCEPTED to checkout');
      }

      // Check if an order already exists for this offer
      const existingOrder = await prisma.order.findUnique({
        where: { offerId: data.offerId },
      });

      if (existingOrder) {
        throw this.fastify.httpErrors.badRequest('Order already placed for this offer');
      }

      finalPrice = Number(offer.amount);
    } else {
      // Direct checkout for fixed price
      if (listing.listingType !== 'FIXED_PRICE') {
        throw this.fastify.httpErrors.badRequest('This listing requires an offer or auction bid to purchase');
      }

      if (!listing.fixedPrice) {
        throw this.fastify.httpErrors.internalServerError('Fixed price not set on listing');
      }

      finalPrice = Number(listing.fixedPrice);
    }

    // Generate Order Number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    // Calculate fees (5% platform fee)
    const platformFee = finalPrice * 0.05;
    const total = finalPrice + platformFee;

    // Create Order Transaction
    const order = await prisma.$transaction(async (tx) => {
      // Prevent duplicate active orders
      const activeOrder = await tx.order.findFirst({
        where: {
          listingId: data.listingId,
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      });
      if (activeOrder) {
        throw this.fastify.httpErrors.badRequest('This listing already has an active order');
      }

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          listingId: data.listingId,
          buyerId,
          sellerId: listing.sellerId,
          offerId: data.offerId,
          orderNumber,
          status: 'PENDING_PAYMENT',
          currency: 'LKR',
          subtotal: finalPrice,
          platformFee,
          total,
          shippingAddress: data.shippingAddress as any,
          buyerNotes: data.buyerNotes,
        },
      });

      return newOrder;
    });

    return order;
  }

  async getOrderById(orderId: string, actorId: string, role: string) {
    const { prisma } = this.fastify;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            media: {
              where: { isThumbnail: true },
              take: 1,
            },
          },
        },
        buyer: {
          select: { id: true, username: true, fullName: true, email: true },
        },
        seller: {
          select: { id: true, username: true, sellerProfile: { select: { businessName: true } } },
        },
        shipment: true,
        payment: true,
        dispute: true,
      }
    });

    if (!order) {
      throw this.fastify.httpErrors.notFound('Order not found');
    }

    if (order.buyerId !== actorId && order.sellerId !== actorId && role !== 'ADMIN') {
      throw this.fastify.httpErrors.forbidden('Not authorized to view this order');
    }

    return order;
  }

  async getPurchases(buyerId: string) {
    const { prisma } = this.fastify;
    return prisma.order.findMany({
      where: { buyerId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            media: {
              where: { isThumbnail: true },
              take: 1,
            },
          },
        },
        seller: {
          select: { id: true, username: true, sellerProfile: { select: { businessName: true } } },
        },
        shipment: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSales(sellerId: string) {
    const { prisma } = this.fastify;
    return prisma.order.findMany({
      where: { sellerId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            media: {
              where: { isThumbnail: true },
              take: 1,
            },
          },
        },
        buyer: {
          select: { id: true, username: true, fullName: true, email: true },
        },
        shipment: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirmOrder(orderId: string, sellerId: string) {
    const { prisma } = this.fastify;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw this.fastify.httpErrors.notFound('Order not found');
    if (order.sellerId !== sellerId) throw this.fastify.httpErrors.forbidden('Not your sale');

    if (order.status !== 'PAID') {
      throw this.fastify.httpErrors.badRequest(`Cannot confirm order from status ${order.status}`);
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: 'SELLER_CONFIRMED' },
    });
  }

  async markPacked(orderId: string, sellerId: string) {
    const { prisma } = this.fastify;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw this.fastify.httpErrors.notFound('Order not found');
    if (order.sellerId !== sellerId) throw this.fastify.httpErrors.forbidden('Not your sale');

    if (order.status !== 'SELLER_CONFIRMED') {
      throw this.fastify.httpErrors.badRequest(`Cannot pack order from status ${order.status}`);
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: 'PACKED' },
    });
  }

  async markShipped(
    orderId: string,
    sellerId: string,
    data: { courierName: string; trackingNumber: string; trackingUrl?: string | null },
  ) {
    const { prisma } = this.fastify;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw this.fastify.httpErrors.notFound('Order not found');
    if (order.sellerId !== sellerId) throw this.fastify.httpErrors.forbidden('Not your sale');

    if (order.status !== 'PACKED') {
      throw this.fastify.httpErrors.badRequest(`Cannot ship order from status ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'SHIPPED', shippedAt: new Date() },
      });

      await tx.shipment.upsert({
        where: { orderId },
        update: {
          courierName: data.courierName,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl || null,
          shippedAt: new Date(),
        },
        create: {
          orderId,
          courierName: data.courierName,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl || null,
          shippedAt: new Date(),
        },
      });

      return updatedOrder;
    });
  }

  async markDelivered(orderId: string, sellerOrAdminId: string, role: string) {
    const { prisma } = this.fastify;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw this.fastify.httpErrors.notFound('Order not found');

    if (order.sellerId !== sellerOrAdminId && role !== 'ADMIN') {
      throw this.fastify.httpErrors.forbidden('Not authorized to mark this order as delivered');
    }

    if (order.status !== 'SHIPPED') {
      throw this.fastify.httpErrors.badRequest(`Cannot deliver order from status ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      });

      await tx.shipment.update({
        where: { orderId },
        data: { deliveredAt: new Date() },
      });

      return updatedOrder;
    });
  }

  async confirmDelivery(orderId: string, buyerId: string) {
    const { prisma } = this.fastify;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw this.fastify.httpErrors.notFound('Order not found');
    if (order.buyerId !== buyerId) throw this.fastify.httpErrors.forbidden('Not your purchase');

    if (order.status !== 'SHIPPED' && order.status !== 'DELIVERED') {
      throw this.fastify.httpErrors.badRequest(`Cannot complete order from status ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      await tx.shipment.updateMany({
        where: { orderId, deliveredAt: null },
        data: { deliveredAt: new Date() },
      });

      return updatedOrder;
    });
  }

  async cancelOrder(orderId: string, actorId: string, role: string) {
    const { prisma } = this.fastify;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw this.fastify.httpErrors.notFound('Order not found');

    const isBuyer = order.buyerId === actorId;
    const isSeller = order.sellerId === actorId;
    const isAdmin = role === 'ADMIN';

    if (!isBuyer && !isSeller && !isAdmin) {
      throw this.fastify.httpErrors.forbidden('Not authorized to cancel this order');
    }

    if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PAID') {
      throw this.fastify.httpErrors.badRequest(`Cannot cancel order from status ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });

      // Release listing status back to ACTIVE
      await tx.listing.update({
        where: { id: order.listingId },
        data: { status: 'ACTIVE' },
      });

      // If PAID, release payment status
      if (order.status === 'PAID') {
        await tx.payment.updateMany({
          where: { orderId, status: 'PAID' },
          data: { status: 'REFUNDED', refundedAt: new Date() },
        });
      }

      return updatedOrder;
    });
  }

  async refundOrder(orderId: string, adminId: string) {
    const { prisma } = this.fastify;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw this.fastify.httpErrors.notFound('Order not found');

    if (order.status === 'PENDING_PAYMENT' || order.status === 'CANCELLED') {
      throw this.fastify.httpErrors.badRequest(`Cannot refund order in status ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED', cancelledAt: new Date() },
      });

      // Release listing status back to ACTIVE
      await tx.listing.update({
        where: { id: order.listingId },
        data: { status: 'ACTIVE' },
      });

      await tx.payment.updateMany({
        where: { orderId },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });

      await tx.dispute.updateMany({
        where: { orderId, status: 'OPEN' },
        data: {
          status: 'CLOSED',
          resolution: 'Refunded by admin',
          resolvedAt: new Date(),
          resolvedBy: adminId,
        },
      });

      return updatedOrder;
    });
  }
}
