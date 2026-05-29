'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/listing/ListingCard';
import { Search, SlidersHorizontal, Trash2, X, ChevronDown, Check } from 'lucide-react';
import type { ListingSummary } from '@gem/types';

const COMMON_GEM_TYPES = [
  'Sapphire',
  'Ruby',
  'Emerald',
  'Alexandrite',
  'Spinel',
  'Cat\'s Eye',
  'Amethyst',
  'Garnet',
  'Topaz',
  'Tourmaline'
];

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for search bar (not immediately pushed to URL until submitted)
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  // Sync search input when URL changes
  useEffect(() => {
    setSearchInput(searchParams.get('q') || '');
  }, [searchParams]);

  // Extract filters from search params
  const q = searchParams.get('q') || '';
  const gemType = searchParams.get('gemType') || '';
  const listingType = searchParams.get('listingType') || '';
  const priceMin = searchParams.get('priceMin') || '';
  const priceMax = searchParams.get('priceMax') || '';
  const caratMin = searchParams.get('caratMin') || '';
  const caratMax = searchParams.get('caratMax') || '';
  const certifiedOnly = searchParams.get('certifiedOnly') === 'true';
  const verifiedSellersOnly = searchParams.get('verifiedSellersOnly') === 'true';
  const sortBy = searchParams.get('sortBy') || 'newest';

  // Toggle state for mobile filters overlay
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Query search results
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'search-results',
      q,
      gemType,
      listingType,
      priceMin,
      priceMax,
      caratMin,
      caratMax,
      certifiedOnly,
      verifiedSellersOnly,
      sortBy
    ],
    queryFn: async () => {
      const params: Record<string, any> = {
        page: 1,
        pageSize: 40,
        sortBy
      };

      if (q) params.q = q;
      if (gemType) params.gemType = gemType;
      if (listingType) params.listingType = listingType;
      if (priceMin) params.priceMin = Number(priceMin);
      if (priceMax) params.priceMax = Number(priceMax);
      if (caratMin) params.caratMin = Number(caratMin);
      if (caratMax) params.caratMax = Number(caratMax);
      if (certifiedOnly) params.certifiedOnly = true;
      if (verifiedSellersOnly) params.verifiedSellersOnly = true;

      const res = await api.search.listings(params);
      return res.data;
    }
  });

  const listings = (data as any)?.data as ListingSummary[] || [];
  const totalCount = (data as any)?.pagination?.totalCount || 0;

  // Update query params function helper
  const updateParams = (newParams: Record<string, string | null | undefined>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    router.push(`/search?${current.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput.trim() });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    router.push('/search');
  };

  const hasActiveFilters = 
    q || gemType || listingType || priceMin || priceMax || caratMin || caratMax || certifiedOnly || verifiedSellersOnly;

  return (
    <div className="pt-20 min-h-screen bg-[#080d1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Search bar section */}
        <div className="mb-8">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-3xl">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by gemstone name, variety, origin..."
                className="input-gem pl-11 pr-4 h-12 text-base"
                aria-label="Search query"
              />
            </div>
            <button type="submit" className="btn-gold px-6 h-12 text-sm shrink-0">
              Search
            </button>
          </form>
          
          {/* Quick tags */}
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            <span className="text-xs text-gray-500">Popular:</span>
            {COMMON_GEM_TYPES.slice(0, 6).map((type) => (
              <button
                key={type}
                onClick={() => updateParams({ gemType: gemType === type ? null : type })}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  gemType === type
                    ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                    : 'border-[#1e2d4e] text-gray-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Results title + Sorting bar */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1e2d4e]">
          <div className="text-gray-400 text-sm">
            {isLoading ? (
              <span>Searching listings...</span>
            ) : (
              <span>
                Found <strong className="text-white">{totalCount}</strong>{' '}
                {totalCount === 1 ? 'gemstone' : 'gemstones'} matching criteria
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filters Toggle Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1e2d4e] bg-[#0e1628] text-sm text-gray-300 hover:text-white"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => updateParams({ sortBy: e.target.value })}
                className="bg-[#0e1628] border border-[#1e2d4e] rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gold-500/50"
              >
                <option value="newest">Newest Listings</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="ending_soon">Ending Soon</option>
                <option value="most_viewed">Popularity</option>
                <option value="carat_desc">Carats: High to Low</option>
                <option value="carat_asc">Carats: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Two columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* LEFT Sidebar: Web Desktop Filters */}
          <aside className="hidden lg:block space-y-6 lg:sticky lg:top-24 card-gem p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-gold-500" />
                Filters
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} />
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-5">
              {/* Gemstone Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gemstone Type</label>
                <select
                  value={gemType}
                  onChange={(e) => updateParams({ gemType: e.target.value })}
                  className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold-500/50"
                >
                  <option value="">All Gemstones</option>
                  {COMMON_GEM_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Listing Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Listing Type</label>
                <select
                  value={listingType}
                  onChange={(e) => updateParams({ listingType: e.target.value })}
                  className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold-500/50"
                >
                  <option value="">All Types</option>
                  <option value="FIXED_PRICE">Fixed Price</option>
                  <option value="NEGOTIABLE">Negotiable</option>
                  <option value="TIMED_AUCTION">Timed Auction</option>
                  <option value="LIVE_AUCTION">Live Auction</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Price Range</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => updateParams({ priceMin: e.target.value })}
                    className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gold-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-gray-600 text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => updateParams({ priceMax: e.target.value })}
                    className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gold-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Carat Range */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Carat Weight</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min ct"
                    value={caratMin}
                    onChange={(e) => updateParams({ caratMin: e.target.value })}
                    className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gold-500/50"
                  />
                  <span className="text-gray-600 text-xs">to</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max ct"
                    value={caratMax}
                    onChange={(e) => updateParams({ caratMax: e.target.value })}
                    className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={certifiedOnly}
                    onChange={(e) => updateParams({ certifiedOnly: e.target.checked ? 'true' : null })}
                    className="rounded border-[#1e2d4e] bg-[#0a0f1e] text-gold-500 focus:ring-0"
                  />
                  <span className="text-xs text-gray-300 hover:text-white transition-colors">Certified Gems Only</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={verifiedSellersOnly}
                    onChange={(e) => updateParams({ verifiedSellersOnly: e.target.checked ? 'true' : null })}
                    className="rounded border-[#1e2d4e] bg-[#0a0f1e] text-gold-500 focus:ring-0"
                  />
                  <span className="text-xs text-gray-300 hover:text-white transition-colors">Verified Sellers Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* RIGHT Side: Grid Results */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card-gem aspect-[4/5] p-4 flex flex-col gap-4 animate-pulse">
                    <div className="aspect-[4/3] bg-white/5 rounded-lg w-full" />
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                    <div className="h-5 bg-white/5 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-1/2 mt-auto" />
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="card-gem p-12 text-center max-w-md mx-auto mt-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#0e1628] border border-[#1e2d4e] flex items-center justify-center mb-6">
                  <Search size={28} className="text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">No Gems Found</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  We couldn't find any gemstones matching your current filters. Try adjusting your tags, query, or price boundaries.
                </p>
                {hasActiveFilters && (
                  <button onClick={handleClearFilters} className="btn-gold px-6">
                    Clear Search Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 relative">
                {isFetching && (
                  <div className="absolute inset-0 bg-[#080d1a]/20 backdrop-blur-[1px] flex items-center justify-center z-10" />
                )}
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MOBILE Filters Overlay Portal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-80 max-w-full bg-[#080d1a] border-l border-[#1e2d4e] h-full flex flex-col p-6 animate-slide-left overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2d4e] mb-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal size={16} />
                Filter Options
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6 flex-1">
              {/* Gemstone Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gemstone Type</label>
                <select
                  value={gemType}
                  onChange={(e) => updateParams({ gemType: e.target.value })}
                  className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold-500/50"
                >
                  <option value="">All Gemstones</option>
                  {COMMON_GEM_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Listing Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Listing Type</label>
                <select
                  value={listingType}
                  onChange={(e) => updateParams({ listingType: e.target.value })}
                  className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gold-500/50"
                >
                  <option value="">All Types</option>
                  <option value="FIXED_PRICE">Fixed Price</option>
                  <option value="NEGOTIABLE">Negotiable</option>
                  <option value="TIMED_AUCTION">Timed Auction</option>
                  <option value="LIVE_AUCTION">Live Auction</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Price Range</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => updateParams({ priceMin: e.target.value })}
                    className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gold-500/50"
                  />
                  <span className="text-gray-600 text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => updateParams({ priceMax: e.target.value })}
                    className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Carat Range */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Carat Weight</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={caratMin}
                    onChange={(e) => updateParams({ caratMin: e.target.value })}
                    className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
                  />
                  <span className="text-gray-600 text-xs">to</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={caratMax}
                    onChange={(e) => updateParams({ caratMax: e.target.value })}
                    className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg w-full px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certifiedOnly}
                    onChange={(e) => updateParams({ certifiedOnly: e.target.checked ? 'true' : null })}
                    className="rounded border-[#1e2d4e] bg-[#0a0f1e] text-gold-500"
                  />
                  <span className="text-xs text-gray-300">Certified Gems Only</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedSellersOnly}
                    onChange={(e) => updateParams({ verifiedSellersOnly: e.target.checked ? 'true' : null })}
                    className="rounded border-[#1e2d4e] bg-[#0a0f1e] text-gold-500"
                  />
                  <span className="text-xs text-gray-300">Verified Sellers Only</span>
                </label>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#1e2d4e] flex gap-3">
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    handleClearFilters();
                    setShowMobileFilters(false);
                  }}
                  className="btn-outline flex-1 justify-center py-2"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => setShowMobileFilters(false)}
                className="btn-gold flex-1 justify-center py-2"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
