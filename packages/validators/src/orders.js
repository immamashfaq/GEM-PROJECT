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
export const createOrderSchema = z.object({
    listingId: z.string().min(1, 'Listing ID is required'),
    offerId: z.string().optional(),
    shippingAddress: shippingAddressSchema,
    buyerNotes: z.string().max(500).optional(),
});
//# sourceMappingURL=orders.js.map