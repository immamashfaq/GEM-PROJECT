'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/listing/ListingCard';
import { Heart, ChevronRight, ShoppingBag } from 'lucide-react';
import type { ListingSummary } from '@gem/types';

export default function WatchlistPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/watchlist');
    }
  }, [isMounted, isAuthenticated, isAuthLoading, router]);

  const { data: watchlist, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const res = await api.listings.getWatchlist();
      return res.data.data as ListingSummary[];
    },
    enabled: isAuthenticated,
  });

  if (!isMounted || isAuthLoading || isLoading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-[#080d1a]">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pt-20 min-h-screen bg-[#080d1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-6 text-gray-500 text-sm">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <ChevronRight size={14} />
          <span className="text-white">Watchlist</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <Heart size={20} className="text-red-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Your Watchlist</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Track active auctions and gemstones you have saved.
            </p>
          </div>
        </div>

        {/* Content */}
        {!watchlist || watchlist.length === 0 ? (
          <div className="card-gem p-12 text-center max-w-xl mx-auto mt-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#0e1628] border border-[#1e2d4e] flex items-center justify-center mb-6">
              <Heart size={28} className="text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Watchlist is Empty</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              You haven't saved any gemstone listings yet. Explore the marketplace to find rare sapphires, rubies, and more.
            </p>
            <Link href="/marketplace" className="btn-gold px-6">
              <ShoppingBag size={16} className="mr-2" />
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {watchlist.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
