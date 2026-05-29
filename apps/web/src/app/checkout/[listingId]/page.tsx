'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shippingAddressSchema, type ShippingAddressInput } from '@gem/validators';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ShieldCheck, Lock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export default function CheckoutPage() {
  const { listingId } = useParams() as { listingId: string };
  const searchParams = useSearchParams();
  const offerId = searchParams.get('offerId');
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/checkout/${listingId}`);
    }
  }, [isMounted, isAuthLoading, isAuthenticated, listingId, router]);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['checkout-listing', listingId],
    queryFn: async () => {
      const res = await api.listings.getById(listingId);
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingAddressInput>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      country: 'Sri Lanka',
    },
  });

  const onSubmit = async (data: ShippingAddressInput) => {
    try {
      setIsSubmitting(true);
      toast.loading('Processing your order securely...', { id: 'checkout' });

      await api.client.post('/orders/checkout', {
        listingId,
        offerId: offerId || undefined,
        shippingAddress: data,
        buyerNotes: '',
      });

      toast.success('Order completed successfully!', { id: 'checkout' });
      router.push('/dashboard/orders');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed', { id: 'checkout' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted || isAuthLoading || isLoading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) return null;

  // Let's assume offer handling implies getting the offer details via another query or relying on finalPrice
  // For simplicity, if there's no offer, we use fixedPrice.
  const basePrice = listing.fixedPrice || 0;
  const platformFee = basePrice * 0.05;
  const total = basePrice + platformFee;

  return (
    <div className="pt-20 min-h-screen bg-[#080d1a]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        <div className="flex items-center gap-2 mb-8 text-gray-500 text-sm">
          <span>Marketplace</span> <ChevronRight size={14} />
          <span>{listing.title}</span> <ChevronRight size={14} />
          <span className="text-white">Secure Checkout</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 items-start">
          
          {/* LEFT: Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Secure Checkout</h1>
            
            <div className="card-gem p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Shipping Information</h2>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                  <input {...register('fullName')} className="input-gem" placeholder="John Doe" />
                  {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
                    <input {...register('phone')} className="input-gem" placeholder="+94 77 123 4567" />
                    {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Country</label>
                    <input {...register('country')} className="input-gem" placeholder="Sri Lanka" />
                    {errors.country && <p className="mt-1 text-xs text-red-400">{errors.country.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Address Line 1</label>
                  <input {...register('addressLine1')} className="input-gem" placeholder="Street address, P.O. box, etc." />
                  {errors.addressLine1 && <p className="mt-1 text-xs text-red-400">{errors.addressLine1.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Address Line 2 (Optional)</label>
                  <input {...register('addressLine2')} className="input-gem" placeholder="Apartment, suite, unit, etc." />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">City</label>
                    <input {...register('city')} className="input-gem" placeholder="Colombo" />
                    {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">State/Province</label>
                    <input {...register('state')} className="input-gem" placeholder="Western Province" />
                    {errors.state && <p className="mt-1 text-xs text-red-400">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Postal Code</label>
                    <input {...register('postalCode')} className="input-gem" placeholder="00100" />
                    {errors.postalCode && <p className="mt-1 text-xs text-red-400">{errors.postalCode.message}</p>}
                  </div>
                </div>

              </form>
            </div>

            {/* Simulated Payment Section */}
            <div className="card-gem p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="text-emerald-400" size={20} />
                <h2 className="text-lg font-semibold text-white">Payment</h2>
              </div>
              <div className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Dummy Sandbox Checkout</div>
                  <div className="text-xs text-gray-500 mt-1">
                    This is a simulated checkout. No real money will be deducted.
                  </div>
                </div>
                <CheckCircle2 className="text-emerald-500" size={24} />
              </div>
            </div>

          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="card-gem p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
              
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-[#1e2d4e]">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#0a0f1e] border border-[#1e2d4e] shrink-0 flex items-center justify-center">
                  {listing.media?.[0]?.url ? (
                    <Image 
                      src={listing.media[0].url} 
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-3xl">💎</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white line-clamp-2">{listing.title}</h3>
                  <div className="text-xs text-gray-500 mt-1">{listing.gemType} • {listing.caratWeight} ct</div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-medium">{formatPrice(basePrice, listing.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Platform Fee (5%)</span>
                  <span className="text-white font-medium">{formatPrice(platformFee, listing.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-emerald-400 font-medium">Free</span>
                </div>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-[#1e2d4e] mb-6">
                <span className="text-white font-semibold">Total</span>
                <span className="text-2xl font-bold text-gold-400">{formatPrice(total, listing.currency)}</span>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={isSubmitting}
                className="btn-gold w-full justify-center py-3.5 text-base relative overflow-hidden"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <Lock size={16} className="mr-2" />
                    Pay and Complete Order
                  </>
                )}
              </button>

              <div className="flex items-start gap-2 mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  Your purchase is protected. If the gemstone doesn't match the description, you can open a dispute for a full refund within 14 days.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
