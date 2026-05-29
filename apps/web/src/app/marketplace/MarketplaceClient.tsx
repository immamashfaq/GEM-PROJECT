'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, Grid3X3, List, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { ListingCard } from '@/components/listing/ListingCard';
import { ListingGridSkeleton } from '@/components/listing/ListingSkeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ListingSummary } from '@gem/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'carat_desc', label: 'Largest Carat' },
  { value: 'ending_soon', label: 'Ending Soon' },
];

const LISTING_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'FIXED_PRICE', label: 'Buy Now' },
  { value: 'NEGOTIABLE', label: 'Make Offer' },
  { value: 'TIMED_AUCTION', label: 'Timed Auction' },
  { value: 'LIVE_AUCTION', label: 'Live Auction' },
];

async function fetchListings(params: Record<string, string>) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined),
  );
  const res = await api.listings.getAll(cleanParams);
  return res.data;
}

async function fetchCategories() {
  const res = await api.listings.getCategories();
  return res.data.data;
}

export function MarketplaceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') ?? 'newest');
  const [listingType, setListingType] = useState(searchParams.get('listingType') ?? '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') ?? '');
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [verifiedSellersOnly, setVerifiedSellersOnly] = useState(false);

  const queryParams = {
    page: String(page),
    pageSize: '20',
    sortBy,
    listingType,
    categoryId,
    certifiedOnly: certifiedOnly ? 'true' : '',
    verifiedSellersOnly: verifiedSellersOnly ? 'true' : '',
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', queryParams],
    queryFn: () => fetchListings(queryParams),
  });

  const { data: categories } = useQuery({
    queryKey: ['gem-categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  });

  const listings: ListingSummary[] = data?.data ?? [];
  const pagination = data?.pagination;

  const activeFilterCount = [
    listingType,
    categoryId,
    certifiedOnly,
    verifiedSellersOnly,
  ].filter(Boolean).length;

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Gemstone Marketplace</h1>
            {pagination && (
              <p className="text-sm text-gray-500 mt-1">
                {pagination.totalCount.toLocaleString()} gems available
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="appearance-none input-gem pr-8 py-2 text-sm"
                aria-label="Sort listings"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                aria-hidden="true"
              />
            </div>

            {/* Filter button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
                isFilterOpen || activeFilterCount > 0
                  ? 'border-gold-500 text-gold-400 bg-gold-500/10'
                  : 'border-[#1e2d4e] text-gray-400 hover:border-gold-500/30 hover:text-white',
              )}
              aria-expanded={isFilterOpen}
              aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-gold-500 text-navy-900 text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter drawer */}
        {isFilterOpen && (
          <div className="mb-6 p-5 rounded-xl border border-[#1e2d4e] bg-[#0e1628] animate-slide-up" role="region" aria-label="Filter options">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Listing type filter */}
              <div>
                <label htmlFor="type-filter" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                  Listing Type
                </label>
                <select
                  id="type-filter"
                  value={listingType}
                  onChange={(e) => { setListingType(e.target.value); setPage(1); }}
                  className="input-gem text-sm py-2"
                >
                  {LISTING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Category filter */}
              <div>
                <label htmlFor="category-filter" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                  Gem Category
                </label>
                <select
                  id="category-filter"
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                  className="input-gem text-sm py-2"
                >
                  <option value="">All Categories</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Toggle filters */}
              <div className="flex flex-col gap-3 pt-5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors duration-200',
                      certifiedOnly ? 'bg-gold-500' : 'bg-[#1e2d4e]',
                    )}
                    onClick={() => { setCertifiedOnly(!certifiedOnly); setPage(1); }}
                    role="checkbox"
                    aria-checked={certifiedOnly}
                    aria-label="Certified only"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setCertifiedOnly(!certifiedOnly)}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                        certifiedOnly ? 'translate-x-5' : 'translate-x-0.5',
                      )}
                    />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Certified only
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors duration-200',
                      verifiedSellersOnly ? 'bg-gold-500' : 'bg-[#1e2d4e]',
                    )}
                    onClick={() => { setVerifiedSellersOnly(!verifiedSellersOnly); setPage(1); }}
                    role="checkbox"
                    aria-checked={verifiedSellersOnly}
                    aria-label="Verified sellers only"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setVerifiedSellersOnly(!verifiedSellersOnly)}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                        verifiedSellersOnly ? 'translate-x-5' : 'translate-x-0.5',
                      )}
                    />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Verified sellers only
                  </span>
                </label>
              </div>

              {/* Clear filters */}
              {activeFilterCount > 0 && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setListingType('');
                      setCategoryId('');
                      setCertifiedOnly(false);
                      setVerifiedSellersOnly(false);
                      setPage(1);
                    }}
                    className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                    aria-label="Clear all filters"
                  >
                    <X size={14} aria-hidden="true" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listings grid */}
        {isLoading && <ListingGridSkeleton count={20} />}

        {isError && (
          <div className="text-center py-16" role="alert">
            <p className="text-4xl mb-3" aria-hidden="true">😕</p>
            <p className="text-gray-400">Failed to load listings. Please refresh the page.</p>
          </div>
        )}

        {!isLoading && !isError && listings.length === 0 && (
          <div className="text-center py-20" aria-live="polite">
            <p className="text-5xl mb-4" aria-hidden="true">💎</p>
            <h2 className="text-xl font-semibold text-white mb-2">No gems found</h2>
            <p className="text-gray-500 mb-6">Try adjusting your filters or browse all categories.</p>
            <button
              onClick={() => {
                setListingType('');
                setCategoryId('');
                setCertifiedOnly(false);
                setVerifiedSellersOnly(false);
              }}
              className="btn-outline"
            >
              Clear Filters
            </button>
          </div>
        )}

        {listings.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10" role="navigation" aria-label="Pagination">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="btn-outline px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1" aria-label={`Page ${pagination.page} of ${pagination.totalPages}`}>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          'w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150',
                          p === pagination.page
                            ? 'bg-gold-500 text-navy-900'
                            : 'border border-[#1e2d4e] text-gray-400 hover:border-gold-500/30 hover:text-white',
                        )}
                        aria-current={p === pagination.page ? 'page' : undefined}
                        aria-label={`Go to page ${p}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                  className="btn-outline px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
