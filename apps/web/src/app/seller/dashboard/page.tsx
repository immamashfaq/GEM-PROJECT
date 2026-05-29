'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  LayoutDashboard,
  Gem,
  Plus,
  Radio,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  ArrowUpRight,
  ShoppingBag,
  MessageSquare,
  Tag,
  ShieldCheck,
  Package,
  Award,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';

type TabType = 'listings' | 'offers' | 'sales';

export default function SellerDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('listings');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if not authenticated or not a seller
  useEffect(() => {
    if (isMounted && !isAuthLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login?redirect=/seller/dashboard');
      } else if (user?.role === 'BUYER') {
        toast.error('You must complete onboarding as a seller to access the seller dashboard');
        router.push('/seller/onboarding');
      }
    }
  }, [isMounted, isAuthLoading, isAuthenticated, user, router]);

  // Fetch listings
  const { data: listingsData, isLoading: isListingsLoading } = useQuery({
    queryKey: ['seller-listings'],
    queryFn: async () => {
      const res = await api.listings.getMyListings({ pageSize: 50 });
      return res.data;
    },
    enabled: isMounted && isAuthenticated && user?.role !== 'BUYER',
  });

  // Fetch offers
  const { data: offers, isLoading: isOffersLoading } = useQuery({
    queryKey: ['seller-offers-received'],
    queryFn: async () => {
      const res = await api.client.get('/offers/received');
      return res.data.data;
    },
    enabled: isMounted && isAuthenticated && user?.role !== 'BUYER',
  });

  // Fetch sales
  const { data: sales, isLoading: isSalesLoading } = useQuery({
    queryKey: ['seller-sales'],
    queryFn: async () => {
      const res = await api.client.get('/orders/sales');
      return res.data.data;
    },
    enabled: isMounted && isAuthenticated && user?.role !== 'BUYER',
  });

  // Publish listing mutation
  const publishMutation = useMutation({
    mutationFn: (listingId: string) => api.listings.publish(listingId),
    onSuccess: () => {
      toast.success('Listing published successfully!');
      queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to publish listing');
    },
  });

  // Delete listing mutation
  const deleteMutation = useMutation({
    mutationFn: (listingId: string) => api.listings.delete(listingId),
    onSuccess: () => {
      toast.success('Listing deleted');
      queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete listing');
    },
  });

  // Respond to offer mutation
  const respondOfferMutation = useMutation({
    mutationFn: ({ offerId, status }: { offerId: string; status: 'ACCEPTED' | 'REJECTED' }) =>
      api.client.post(`/offers/${offerId}/respond`, { status }),
    onSuccess: (_, variables) => {
      toast.success(`Offer ${variables.status.toLowerCase()} successfully`);
      queryClient.invalidateQueries({ queryKey: ['seller-offers-received'] });
      queryClient.invalidateQueries({ queryKey: ['seller-sales'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to respond to offer');
    },
  });

  if (!isMounted || isAuthLoading || !user || user.role === 'BUYER') {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-[#080d1a]">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  const listings = listingsData?.data || [];
  const activeListingsCount = listings.filter((l: any) => l.status === 'ACTIVE').length;
  const draftListingsCount = listings.filter((l: any) => l.status === 'DRAFT').length;
  const pendingOffersCount = offers?.filter((o: any) => o.status === 'PENDING').length || 0;

  // Calculate total revenue
  const totalRevenue = sales
    ?.filter((s: any) => s.status === 'COMPLETED' || s.status === 'PAID')
    ?.reduce((sum: number, order: any) => sum + Number(order.total), 0) || 0;

  return (
    <div className="pt-20 min-h-screen bg-[#080d1a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard size={18} className="text-gold-500" />
              <span className="text-xs text-gold-500 font-bold uppercase tracking-widest">Control Panel</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Seller Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
              <span>{user.fullName || user.username}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              <span className="text-gray-500">{user.email}</span>
              {user.role === 'VERIFIED_SELLER' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  <span className="badge-verified text-[10px] px-2 py-0.5 flex items-center gap-1 font-bold">
                    <ShieldCheck size={11} /> VERIFIED
                  </span>
                </>
              )}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/seller/listings/create" className="btn-gold text-sm py-2.5 px-4 flex items-center gap-1.5 font-semibold">
              <Plus size={16} /> Create Listing
            </Link>
            {user.role === 'VERIFIED_SELLER' && (
              <Link href="/seller/live" className="btn-outline border-red-500/30 text-red-400 hover:border-red-500 hover:bg-red-500/10 text-sm py-2.5 px-4 flex items-center gap-1.5 font-semibold">
                <Radio size={16} className="animate-pulse" /> Go Live
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          {/* Card 1: Total Revenue */}
          <div className="card-gem p-6 bg-gradient-to-br from-[#1e2d4e]/10 to-transparent border border-[#1e2d4e]/40 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Sales Revenue</p>
                <h3 className="text-2xl font-bold mt-2 text-emerald-400">
                  {formatPrice(totalRevenue, 'LKR')}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShoppingBag size={20} />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 flex items-center gap-1">
              <ArrowUpRight size={12} className="text-emerald-400" />
              Calculated from paid orders
            </p>
          </div>

          {/* Card 2: Active Listings */}
          <div className="card-gem p-6 bg-gradient-to-br from-[#1e2d4e]/10 to-transparent border border-[#1e2d4e]/40 hover:border-blue-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Listings</p>
                <h3 className="text-2xl font-bold mt-2 text-blue-400">
                  {activeListingsCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Gem size={20} />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-4">
              Visible to buyers in the marketplace
            </p>
          </div>

          {/* Card 3: Draft Listings */}
          <div className="card-gem p-6 bg-gradient-to-br from-[#1e2d4e]/10 to-transparent border border-[#1e2d4e]/40 hover:border-amber-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Drafts</p>
                <h3 className="text-2xl font-bold mt-2 text-amber-500">
                  {draftListingsCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Clock size={20} />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-4">
              Awaiting images or publishing
            </p>
          </div>

          {/* Card 4: Pending Offers */}
          <div className="card-gem p-6 bg-gradient-to-br from-[#1e2d4e]/10 to-transparent border border-[#1e2d4e]/40 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Pending Offers</p>
                <h3 className="text-2xl font-bold mt-2 text-purple-400">
                  {pendingOffersCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <MessageSquare size={20} />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-4">
              Buyer price negotiations awaiting response
            </p>
          </div>

        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[#1e2d4e] mb-6">
          {[
            { id: 'listings', label: 'My Listings', count: listings.length, icon: Gem },
            { id: 'offers', label: 'Offers Received', count: offers?.length || 0, icon: MessageSquare },
            { id: 'sales', label: 'Sales & Orders', count: sales?.length || 0, icon: Tag },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-gold-500 text-gold-400 bg-gold-500/5'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-gold-500/20 text-gold-400' : 'bg-gray-800 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Panel */}
        <div className="min-h-[400px]">
          
          {/* listings Tab */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              {isListingsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-[#1e2d4e]/20 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="card-gem p-12 text-center">
                  <Gem size={48} className="text-gray-600 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-white mb-2">No gemstone listings</h3>
                  <p className="text-gray-400 mb-6 text-sm">Get started by creating your first listing to showcase your gems.</p>
                  <Link href="/seller/listings/create" className="btn-gold text-sm py-2 px-4">
                    Create Listing
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {listings.map((listing: any) => (
                    <div key={listing.id} className="card-gem p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#1e2d4e]/40 hover:border-gold-500/20 transition-all duration-200">
                      
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#0a0f1e] border border-[#1e2d4e]/60 shrink-0">
                          {listing.thumbnail ? (
                            <Image
                              src={listing.thumbnail}
                              alt={listing.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-20">💎</div>
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-white truncate hover:text-gold-400 transition-colors">
                            <Link href={`/listings/${listing.id}`}>
                              {listing.title}
                            </Link>
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                            <span className="text-gold-400 font-bold">
                              {listing.fixedPrice 
                                ? formatPrice(listing.fixedPrice, listing.currency)
                                : formatPrice(listing.negotiablePrice, listing.currency)}
                            </span>
                            <span>·</span>
                            <span>{listing.category?.name || 'Gemstone'}</span>
                            <span>·</span>
                            <span>Created {new Date(listing.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                        {/* Status Badge */}
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            listing.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : listing.status === 'DRAFT'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-gray-800 text-gray-400 border-gray-700'
                          }`}>
                            {listing.status}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {listing.status === 'DRAFT' && (
                            <button
                              onClick={() => publishMutation.mutate(listing.id)}
                              disabled={publishMutation.isPending}
                              className="btn-gold py-1.5 px-3 text-xs flex items-center gap-1"
                              title="Publish listing"
                            >
                              <Play size={12} /> Publish
                            </button>
                          )}
                          <Link
                            href={`/listings/${listing.id}`}
                            className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1 border-[#1e2d4e]/85"
                          >
                            <Eye size={12} /> View
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this listing?')) {
                                deleteMutation.mutate(listing.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs"
                            title="Delete listing"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Offers Tab */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              {isOffersLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-28 bg-[#1e2d4e]/20 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : !offers || offers.length === 0 ? (
                <div className="card-gem p-12 text-center">
                  <MessageSquare size={48} className="text-gray-600 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-white mb-2">No offers received</h3>
                  <p className="text-gray-400 text-sm">When buyers submit offers on negotiable listings, they will show up here.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {offers.map((offer: any) => (
                    <div key={offer.id} className="card-gem overflow-hidden border border-[#1e2d4e]/40">
                      
                      {/* Offer Header */}
                      <div className="bg-[#1e2d4e]/20 px-4 py-2 border-b border-[#1e2d4e]/40 flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{offer.buyer.username}</span>
                          <span>made an offer</span>
                          <span>·</span>
                          <span>{formatRelativeTime(offer.createdAt)}</span>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            offer.status === 'PENDING'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : offer.status === 'ACCEPTED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {offer.status}
                          </span>
                        </div>
                      </div>

                      {/* Offer Body */}
                      <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#0a0f1e] border border-[#1e2d4e]/60 shrink-0">
                            {offer.listing.media?.[0]?.url ? (
                              <Image
                                src={offer.listing.media[0].url}
                                alt={offer.listing.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-xl opacity-20">💎</div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">
                              <Link href={`/listings/${offer.listing.id}`} className="hover:text-gold-400">
                                {offer.listing.title}
                              </Link>
                            </h4>
                            <div className="flex gap-4 text-xs text-gray-500 mt-1">
                              <span>Asking: <span className="line-through">{formatPrice(offer.listing.negotiablePrice, offer.currency)}</span></span>
                              <span className="text-gold-400 font-bold">Offer: {formatPrice(offer.amount, offer.currency)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Respond Actions */}
                        {offer.status === 'PENDING' && (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => respondOfferMutation.mutate({ offerId: offer.id, status: 'REJECTED' })}
                              disabled={respondOfferMutation.isPending}
                              className="flex-1 sm:flex-none btn-outline border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10 py-1.5 px-3 text-xs flex items-center justify-center gap-1"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                            <button
                              onClick={() => respondOfferMutation.mutate({ offerId: offer.id, status: 'ACCEPTED' })}
                              disabled={respondOfferMutation.isPending}
                              className="flex-1 sm:flex-none btn-gold py-1.5 px-3 text-xs flex items-center justify-center gap-1 font-bold"
                            >
                              <CheckCircle2 size={12} /> Accept
                            </button>
                          </div>
                        )}

                        {offer.status === 'ACCEPTED' && (
                          <div className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle2 size={12} /> Offer accepted! Awaiting payment.
                          </div>
                        )}

                        {offer.status === 'REJECTED' && (
                          <div className="text-xs text-red-400 flex items-center gap-1 font-medium">
                            <XCircle size={12} /> Offer rejected.
                          </div>
                        )}

                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              {isSalesLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-28 bg-[#1e2d4e]/20 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : !sales || sales.length === 0 ? (
                <div className="card-gem p-12 text-center">
                  <Tag size={48} className="text-gray-600 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-white mb-2">No sales yet</h3>
                  <p className="text-gray-400 text-sm">When buyers complete checkout for your gemstones, the orders will appear here.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sales.map((order: any) => (
                    <div key={order.id} className="card-gem overflow-hidden border border-[#1e2d4e]/40">
                      
                      {/* Order Header */}
                      <div className="bg-[#1e2d4e]/20 px-4 py-3 border-b border-[#1e2d4e]/40 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                        <div className="flex gap-4">
                          <div>Order #<span className="text-white font-medium">{order.orderNumber}</span></div>
                          <div>Date: <span className="text-white">{new Date(order.createdAt).toLocaleDateString()}</span></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div>Earnings: <span className="text-emerald-400 font-bold">{formatPrice(order.total, order.currency)}</span></div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            order.status === 'COMPLETED' || order.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Order Body */}
                      <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#0a0f1e] border border-[#1e2d4e]/60 shrink-0">
                            {order.listing.media?.[0]?.url ? (
                              <Image
                                src={order.listing.media[0].url}
                                alt={order.listing.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-xl opacity-20">💎</div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">
                              <Link href={`/listings/${order.listing.id}`} className="hover:text-gold-400">
                                {order.listing.title}
                              </Link>
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Buyer: <span className="text-white">{order.buyer.fullName || order.buyer.username}</span> ({order.buyer.email})
                            </p>
                          </div>
                        </div>

                        {/* Order Actions */}
                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            onClick={() => alert('Shipping flows and notifications coming soon!')}
                            className="flex-1 md:flex-none btn-gold py-1.5 px-4 text-xs font-semibold"
                          >
                            Mark Shipped
                          </button>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
