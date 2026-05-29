export interface CheckoutSessionResult {
  clientSecret: string;
  providerPaymentId: string;
  checkoutUrl?: string;
}

export interface WebhookVerificationResult {
  providerPaymentId: string;
  status: 'PAID' | 'FAILED' | 'CANCELLED';
  providerFee?: number;
  metadata?: any;
}

export interface RefundResult {
  refundReference: string;
  success: boolean;
}

export interface PaymentProvider {
  name: string;
  createCheckoutSession(
    orderId: string,
    amount: number,
    currency: string,
    metadata?: any,
  ): Promise<CheckoutSessionResult>;
  
  verifyWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookVerificationResult>;
  
  refundPayment(
    providerPaymentId: string,
    amount: number,
  ): Promise<RefundResult>;
}
