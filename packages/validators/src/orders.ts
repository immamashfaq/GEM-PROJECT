import { z } from 'zod';

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  addressLine1: z.string().min(5, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postalCode: z.string().min(2, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().min(5, 'Phone number is required'),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

export const createOrderSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  offerId: z.string().optional(),
  shippingAddress: shippingAddressSchema,
  buyerNotes: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const confirmOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;

export const markPackedSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});
export type MarkPackedInput = z.infer<typeof markPackedSchema>;

export const markShippedSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  courierName: z.string().min(2, 'Courier name is required'),
  trackingNumber: z.string().min(2, 'Tracking number is required'),
  trackingUrl: z.string().url('Invalid URL format').or(z.string().length(0)).optional().or(z.null()),
});
export type MarkShippedInput = z.infer<typeof markShippedSchema>;

export const markDeliveredSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});
export type MarkDeliveredInput = z.infer<typeof markDeliveredSchema>;

export const confirmDeliverySchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});
export type ConfirmDeliveryInput = z.infer<typeof confirmDeliverySchema>;

export const cancelOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export const refundOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});
export type RefundOrderInput = z.infer<typeof refundOrderSchema>;
