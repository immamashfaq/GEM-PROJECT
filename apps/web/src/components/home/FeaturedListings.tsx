'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ListingCard } from '@/components/listing/ListingCard';
import { ListingGridSkeleton } from '@/components/listing/ListingSkeleton';
import { ArrowRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import type { ListingSummary } from '@gem/types';

async function fetchFeaturedListings(): Promise<ListingSummary[]> {
  const res = await api.listings.getAll({ isFeatured: true, pageSize: 8, sortBy: 'newest' });
  return res.data.data;
}

export function FeaturedListings() {
  const { data: listings, isLoading, isError } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: fetchFeaturedListings,
  });

  return (
    <section className="py-16" aria-labelledby="featured-listings-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-gold-500" aria-hidden="true" />
              <span className="text-sm font-medium text-gold-500 uppercase tracking-widest">
                Curated Selection
              </span>
            </div>
            <h2
              id="featured-listings-title"
              className="text-2xl sm:text-3xl font-bold text-white section-title"
            >
              Featured Gems
            </h2>
          </div>
          <Link
            href="/marketplace?isFeatured=true"
            className="hidden sm:flex items-center gap-2 text-sm text-gold-500 hover:text-gold-400 transition-colors font-medium"
            aria-label="View all featured listings"
          >
            View all <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* Grid */}
        {isLoading && <ListingGridSkeleton count={8} />}

        {isError && (
          <div
            className="text-center py-12 text-gray-500"
            role="alert"
            aria-live="polite"
          >
            <p className="text-4xl mb-3" aria-hidden="true">😕</p>
            <p>Could not load featured listings. Please try again.</p>
          </div>
        )}

        {listings && listings.length === 0 && (
          <div className="text-center py-12 text-gray-500" aria-live="polite">
            <p className="text-4xl mb-3" aria-hidden="true">💎</p>
            <p>Featured gems coming soon.</p>
          </div>
        )}

        {listings && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Mobile view all */}
        {listings && listings.length > 0 && (
          <div className="mt-8 text-center sm:hidden">
            <Link href="/marketplace?isFeatured=true" className="btn-outline">
              View all featured gems
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
