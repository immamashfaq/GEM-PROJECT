import { randomBytes, createHmac } from 'crypto';
import { PaymentProvider, CheckoutSessionResult, WebhookVerificationResult, RefundResult } from './types.js';

export class StripeMockProvider implements PaymentProvider {
  name = 'stripe_mock';

  // In production, this would use a real webhook secret key
  private webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'mock_secret_signature_key';

  async createCheckoutSession(
    orderId: string,
    amount: number,
    currency: string,
    metadata?: any,
  ): Promise<CheckoutSessionResult> {
    const providerPaymentId = `pi_mock_${randomBytes(16).toString('hex')}`;
    return {
      clientSecret: `dummy_secret_${providerPaymentId}`,
      providerPaymentId,
      checkoutUrl: `https://checkout.stripe.com/pay/${providerPaymentId}`,
    };
  }

  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookVerificationResult> {
    const signature = headers['x-mock-signature'] || headers['X-Mock-Signature'];
    if (!signature) {
      throw new Error('Missing x-mock-signature header');
    }

    // Verify signature using HMAC SHA256 of rawBody with webhookSecret
    const expectedSignature = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature verification failed');
    }

    // Parse payload
    const payload = JSON.parse(rawBody);
    const providerPaymentId = payload.providerPaymentId;
    const status = payload.status === 'succeeded' ? 'PAID' : 'FAILED';
    const providerFee = payload.amount ? Number(payload.amount) * 0.029 + 30 : 0.00; // Simulated 2.9% + 30 LKR card processing fee

    return {
      providerPaymentId,
      status,
      providerFee,
      metadata: payload.metadata,
    };
  }

  async refundPayment(
    providerPaymentId: string,
    amount: number,
  ): Promise<RefundResult> {
    return {
      refundReference: `ref_${randomBytes(8).toString('hex')}`,
      success: true,
    };
  }
}
