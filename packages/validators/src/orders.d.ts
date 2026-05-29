import { z } from 'zod';
export declare const shippingAddressSchema: z.ZodObject<{
    fullName: z.ZodString;
    addressLine1: z.ZodString;
    addressLine2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodString;
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    addressLine2?: string | undefined;
}, {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    addressLine2?: string | undefined;
}>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export declare const createOrderSchema: z.ZodObject<{
    listingId: z.ZodString;
    offerId: z.ZodOptional<z.ZodString>;
    shippingAddress: z.ZodObject<{
        fullName: z.ZodString;
        addressLine1: z.ZodString;
        addressLine2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodString;
        phone: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        fullName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone: string;
        addressLine2?: string | undefined;
    }, {
        fullName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone: string;
        addressLine2?: string | undefined;
    }>;
    buyerNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    listingId: string;
    shippingAddress: {
        fullName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone: string;
        addressLine2?: string | undefined;
    };
    offerId?: string | undefined;
    buyerNotes?: string | undefined;
}, {
    listingId: string;
    shippingAddress: {
        fullName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone: string;
        addressLine2?: string | undefined;
    };
    offerId?: string | undefined;
    buyerNotes?: string | undefined;
}>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
//# sourceMappingURL=orders.d.ts.map