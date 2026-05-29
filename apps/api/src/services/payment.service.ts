import { FastifyInstance } from 'fastify';
import { randomBytes } from 'crypto';
import { paymentRegistry } from '../lib/payments/provider-registry.js';

export class PaymentService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Creates a checkout session using the registered payment provider registry.
   */
  async createPaymentIntent(orderId: string, buyerId: string, providerName: string = 'stripe_mock') {
    const order = await this.fastify.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });

    if (!order) {
      throw this.fastify.httpErrors.notFound('Order not found');
    }

    if (order.buyerId !== buyerId) {
      throw this.fastify.httpErrors.forbidden('Cannot pay for an order you do not own');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw this.fastify.httpErrors.badRequest('Order is not pending payment');
    }

    // Abstraction lookup
    const provider = paymentRegistry.get(providerName);
    
    // Create session via provider
    const session = await provider.createCheckoutSession(
      order.id,
      Number(order.total),
      order.currency,
      { orderNumber: order.orderNumber }
    );

    // Upsert payment record as INITIATED
    const payment = await this.fastify.prisma.payment.upsert({
      where: { orderId },
      update: {
        status: 'INITIATED',
        provider: provider.name,
        providerPaymentId: session.providerPaymentId,
      },
      create: {
        orderId,
        provider: provider.name,
        providerPaymentId: session.providerPaymentId,
        amount: order.total,
        currency: order.currency,
        status: 'INITIATED',
      }
    });

    return {
      clientSecret: session.clientSecret,
      paymentId: payment.id,
      checkoutUrl: session.checkoutUrl
    };
  }

  /**
   * Processes webhook payloads by verifying signatures and updating payment records.
   */
  async processWebhook(providerName: string, headers: Record<string, string>, rawBody: string) {
    const provider = paymentRegistry.get(providerName);

    // Log webhook event safely
    this.fastify.log.info({ provider: provider.name }, 'Processing payment webhook...');

    // 1. Signature Verification
    const verification = await provider.verifyWebhook(headers, rawBody);
    
    const payment = await this.fastify.prisma.payment.findFirst({
      where: { providerPaymentId: verification.providerPaymentId },
      include: { order: true }
    });

    if (!payment) {
      throw this.fastify.httpErrors.notFound('Payment record not found for provider reference');
    }

    // 2. Idempotency Check
    if (payment.status === 'PAID') {
      this.fastify.log.info({ providerPaymentId: verification.providerPaymentId }, 'Webhook already processed (Idempotent bypass)');
      return payment;
    }

    if (verification.status === 'FAILED') {
      return this.fastify.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failedAt: new Date()
        }
      });
    }

    if (verification.status === 'CANCELLED') {
      return this.fastify.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CANCELLED',
          failedAt: new Date()
        }
      });
    }

    // 3. Process PAID webhook
    return this.confirmPaymentState(payment.id, verification.providerFee || 0.00);
  }

  /**
   * Helper to atomically transition Payment and Order status and update commission fields.
   */
  private async confirmPaymentState(paymentId: string, providerFee: number) {
    const payment = await this.fastify.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true }
    });
    if (!payment) {
      throw this.fastify.httpErrors.notFound('Payment not found');
    }

    return this.fastify.prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'PAID',
          paidAt: new Date(),
          providerFee: providerFee,
        }
      });

      // 2. Compute Commission & Payouts
      const subtotal = Number(payment.order.subtotal);
      const commissionRate = 5.00; // 5% platform commission
      const platformFee = subtotal * 0.05;
      const sellerPayoutAmount = subtotal - platformFee;

      // 3. Update Order status & commission metrics
      await tx.order.update({
        where: { id: payment.orderId },
        data: { 
          status: 'PAID',
          paidAt: new Date(),
          commissionRate: commissionRate,
          platformFee: platformFee,
          sellerPayoutAmount: sellerPayoutAmount,
          payoutStatus: 'PENDING',
          paymentProviderFee: providerFee,
        }
      });

      // 4. Update listing to SOLD
      await tx.listing.update({
        where: { id: payment.order.listingId },
        data: { status: 'SOLD' }
      });

      // 5. Create draft Shipment
      const addressJson = payment.order.shippingAddress as any;
      const streetAddress = [addressJson?.addressLine1, addressJson?.addressLine2].filter(Boolean).join(', ');

      await tx.shipment.upsert({
        where: { orderId: payment.orderId },
        update: {
          recipientName: addressJson?.fullName || null,
          address: streetAddress || null,
          city: addressJson?.city || null,
          country: addressJson?.country || null,
          phone: addressJson?.phone || null,
        },
        create: {
          orderId: payment.orderId,
          recipientName: addressJson?.fullName || null,
          address: streetAddress || null,
          city: addressJson?.city || null,
          country: addressJson?.country || null,
          phone: addressJson?.phone || null,
        }
      });

      return updatedPayment;
    });
  }

  /**
   * Upload bank transfer deposit slip proof.
   */
  async uploadBankTransferProof(orderId: string, buyerId: string, proofUrl: string) {
    const order = await this.fastify.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw this.fastify.httpErrors.notFound('Order not found');
    }

    if (order.buyerId !== buyerId) {
      throw this.fastify.httpErrors.forbidden('Not your order');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw this.fastify.httpErrors.badRequest('Order is not eligible for payment proof upload');
    }

    return this.fastify.prisma.payment.upsert({
      where: { orderId },
      update: {
        status: 'PENDING', // Awaiting admin approval
        provider: 'bank_transfer',
        providerPaymentId: `bank_${orderId}`,
        proofUrl,
      },
      create: {
        orderId,
        provider: 'bank_transfer',
        providerPaymentId: `bank_${orderId}`,
        amount: order.total,
        currency: order.currency,
        status: 'PENDING',
        proofUrl,
      }
    });
  }

  /**
   * Admin approves a pending bank transfer payment.
   */
  async approveBankTransfer(orderId: string, adminId: string) {
    const payment = await this.fastify.prisma.payment.findUnique({
      where: { orderId },
      include: { order: true }
    });

    if (!payment) {
      throw this.fastify.httpErrors.notFound('No payment found for this order');
    }

    if (payment.provider !== 'bank_transfer' || payment.status !== 'PENDING') {
      throw this.fastify.httpErrors.badRequest('Order does not have a pending bank transfer payment proof');
    }

    return this.confirmPaymentState(payment.id, 0.00);
  }

  /**
   * Admin rejects a pending bank transfer payment proof.
   */
  async rejectBankTransfer(orderId: string, adminId: string) {
    const payment = await this.fastify.prisma.payment.findUnique({
      where: { orderId }
    });

    if (!payment) {
      throw this.fastify.httpErrors.notFound('No payment found for this order');
    }

    if (payment.provider !== 'bank_transfer' || payment.status !== 'PENDING') {
      throw this.fastify.httpErrors.badRequest('Order does not have a pending bank transfer payment proof');
    }

    return this.fastify.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failedAt: new Date()
      }
    });
  }
}
