'use client';

import type { Listing } from '@gem/types';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Heart,
  Award,
  BadgeCheck,
  Star,
  MapPin,
  Clock,
  Eye,
  Gavel,
  ShoppingBag,
  MessageSquare,
  Share2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Shield,
  ExternalLink,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import {
  cn,
  formatPrice,
  formatCarat,
  formatTimeRemaining,
  formatRelativeTime,
  getListingTypeLabel,
} from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/listing/ListingSkeleton';
import { useAuctionSocket } from '@/hooks/useAuctionSocket';

interface Props {
  id: string;
}

async function fetchListing(id: string): Promise<Listing> {
  const res = await api.listings.getById(id);
  return res.data.data;
}

export function ListingDetailClient({ id }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWatched, setIsWatched] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [bidAmountInput, setBidAmountInput] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  const { data: listing, isLoading, isError } = useQuery<Listing>({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id),
  });

  // Since onSuccess is removed in React Query v5, we can use a simple effect
  useEffect(() => {
    if (listing) {
      setIsWatched(listing.isWatched ?? false);
    }
  }, [listing]);

  const isAuctionType = listing?.listingType === 'TIMED_AUCTION' || listing?.listingType === 'LIVE_AUCTION';
  const { auctionState, isConnected } = useAuctionSocket(isAuctionType && listing ? listing.id : '', (listing as any)?.auction);

  const handleWatchToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save to watchlist');
      return;
    }
    try {
      if (isWatched) {
        await api.listings.unwatch(id);
        setIsWatched(false);
        toast.success('Removed from watchlist');
      } else {
        await api.listings.watch(id);
        setIsWatched(true);
        toast.success('Added to watchlist');
      }
    } catch {
      toast.error('Failed to update watchlist');
    }
  };

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="flex gap-2 mt-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="w-16 h-16 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4" aria-hidden="true">💎</p>
          <h1 className="text-2xl font-bold text-white mb-2">Listing not found</h1>
          <p className="text-gray-400 mb-6">This gem may have been sold or removed.</p>
          <Link href="/marketplace" className="btn-gold">Browse Marketplace</Link>
        </div>
      </div>
    );
  }

  const images = listing.media ?? [];
  const activeImage = images[activeImageIndex];
  const isAuction = listing.listingType === 'TIMED_AUCTION' || listing.listingType === 'LIVE_AUCTION';
  const isOwnListing = user?.id === listing.sellerId;

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/marketplace" className="hover:text-gold-400 transition-colors">Marketplace</Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-400">{listing.category?.name}</span>
          <span aria-hidden="true">/</span>
          <span className="text-white truncate max-w-[200px]">{listing.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-10 items-start">
          {/* ---- LEFT: Images ---- */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-square bg-[#0a0f1e] rounded-2xl overflow-hidden border border-[#1e2d4e]">
              {activeImage ? (
                <Image
                  src={activeImage.url}
                  alt={listing.title}
                  fill
                  className="object-contain p-4 cursor-zoom-in"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                  onClick={() => setIsLightboxOpen(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[120px] opacity-10" aria-hidden="true">
                  💎
                </div>
              )}

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {listing.isCertified && (
                  <span className="badge-certified">
                    <Award size={10} aria-hidden="true" />
                    Certified
                  </span>
                )}
                {listing.naturalStatus === 'NATURAL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                    Natural
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Image gallery">
                {images.map((img: any, i: number) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(i)}
                    className={cn(
                      'shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200',
                      i === activeImageIndex
                        ? 'border-gold-500'
                        : 'border-[#1e2d4e] hover:border-gold-500/40',
                    )}
                    role="listitem"
                    aria-label={`View image ${i + 1}`}
                    aria-pressed={i === activeImageIndex}
                  >
                    <Image
                      src={img.url}
                      alt={`${listing.title} image ${i + 1}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Gem attributes table */}
            <div className="card-gem p-5">
              <h2 className="text-base font-semibold text-white mb-4">Gem Specifications</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  { label: 'Gem Type', value: listing.gemType },
                  { label: 'Variety', value: listing.variety },
                  { label: 'Carat Weight', value: listing.caratWeight ? formatCarat(listing.caratWeight) : undefined },
                  { label: 'Color', value: listing.color },
                  { label: 'Clarity', value: listing.clarity },
                  { label: 'Cut', value: listing.cut },
                  { label: 'Shape', value: listing.shape },
                  { label: 'Dimensions', value: listing.dimensionsMm ? `${listing.dimensionsMm} mm` : undefined },
                  { label: 'Origin', value: listing.originCountry },
                  { label: 'Region', value: listing.originRegion },
                  { label: 'Treatment', value: listing.treatment },
                  { label: 'Heat Treated', value: listing.isHeatTreated != null ? (listing.isHeatTreated ? 'Yes' : 'No') : undefined },
                  { label: 'Transparency', value: listing.transparency },
                  { label: 'Natural Status', value: listing.naturalStatus?.replace('_', ' ') },
                  { label: 'Mounted', value: listing.mountedStatus },
                  ...(listing.refractiveIndex ? [{ label: 'Refractive Index', value: String(listing.refractiveIndex) }] : []),
                  ...(listing.specificGravity ? [{ label: 'Specific Gravity', value: String(listing.specificGravity) }] : []),
                  ...(listing.hardness ? [{ label: 'Hardness (Mohs)', value: String(listing.hardness) }] : []),
                ]
                  .filter((row) => row.value)
                  .map(({ label, value }) => (
                    <div key={label} className="contents">
                      <dt className="text-gray-500">{label}</dt>
                      <dd className="text-white font-medium">{value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </div>

          {/* ---- RIGHT: Info + Actions ---- */}
          <div className="space-y-4 lg:sticky lg:top-24">
            {/* Title + badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {listing.sellerProfile?.isVerified && (
                  <span className="badge-verified">
                    <BadgeCheck size={10} aria-hidden="true" />
                    Verified Seller
                  </span>
                )}
                {listing.isCertified && listing.certificate?.labName && (
                  <span className="badge-certified">
                    <Award size={10} aria-hidden="true" />
                    {listing.certificate.labName} Certified
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight mb-2">{listing.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye size={14} aria-hidden="true" />
                  {listing.viewCount} views
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={14} aria-hidden="true" />
                  {listing.favoriteCount} saved
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} aria-hidden="true" />
                  {formatRelativeTime(listing.publishedAt ?? listing.createdAt)}
                </div>
              </div>
            </div>

            {/* Price / Auction Block */}
            <div className="card-gem p-5 relative overflow-hidden">
              {isAuction ? (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm text-gray-500">
                      {auctionState.currentPrice ? 'Current bid' : 'Starting bid'}
                    </div>
                    {isConnected && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </div>
                    )}
                  </div>
                  
                  <div className="text-4xl font-bold text-white transition-all duration-300" key={auctionState.currentPrice}>
                    {formatPrice(
                      auctionState.currentPrice || auctionState.startPrice,
                      listing.currency,
                    )}
                  </div>
                  
                  {listing.auctionEndsAt && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm">
                      <Clock size={14} className="text-red-400" aria-hidden="true" />
                      <span className="text-red-400 font-medium">
                        Ends in {formatTimeRemaining(listing.auctionEndsAt)}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2 flex justify-between items-center border-t border-[#1e2d4e] pt-2">
                    <span>{auctionState.totalBids} bid{auctionState.totalBids !== 1 ? 's' : ''} placed</span>
                    {auctionState.bids?.[0] && (
                      <span>Last bid by: <span className="text-white">{auctionState.bids[0].bidder.username}</span></span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500 mb-1">
                    {listing.listingType === 'NEGOTIABLE' ? 'Asking price' : 'Price'}
                  </div>
                  <div className="text-4xl font-bold text-white">
                    {formatPrice(listing.fixedPrice ?? listing.negotiablePrice, listing.currency)}
                  </div>
                  {listing.listingType === 'NEGOTIABLE' && listing.minAcceptableOffer && (
                    <div className="text-xs text-gray-500 mt-1">
                      Minimum offer: {formatPrice(listing.minAcceptableOffer, listing.currency)}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action buttons */}
            {!isOwnListing && listing.status === 'ACTIVE' && (
              <div className="space-y-3">
                {listing.listingType === 'FIXED_PRICE' && (
                  <button
                    className="btn-gold w-full justify-center py-3 text-base"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Please log in to purchase');
                        return;
                      }
                      window.location.href = `/checkout/${listing.id}`;
                    }}
                    aria-label={`Buy ${listing.title} for ${formatPrice(listing.fixedPrice, listing.currency)}`}
                  >
                    <ShoppingBag size={18} aria-hidden="true" />
                    Buy Now — {formatPrice(listing.fixedPrice, listing.currency)}
                  </button>
                )}

                {listing.listingType === 'NEGOTIABLE' && (
                  <button
                    className="btn-gold w-full justify-center py-3 text-base"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Please log in to make an offer');
                        return;
                      }
                      setShowOfferForm(!showOfferForm);
                    }}
                    aria-expanded={showOfferForm}
                  >
                    <MessageSquare size={18} aria-hidden="true" />
                    Make an Offer
                  </button>
                )}

                {isAuction && (
                  <div className="card-gem p-4 bg-[#0a0f1e]/50 border border-[#1e2d4e]">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={bidAmountInput}
                        onChange={(e) => setBidAmountInput(e.target.value)}
                        placeholder={`Min: ${(Number(auctionState.currentPrice || auctionState.startPrice) + Number(auctionState.minBidIncrement)).toLocaleString()}`}
                        className="input-gem text-sm flex-1"
                      />
                      <button
                        className="btn-gold px-4 shrink-0"
                        onClick={async () => {
                          if (!isAuthenticated) {
                            toast.error('Please log in to bid');
                            return;
                          }
                          try {
                            const amount = Number(bidAmountInput);
                            if (!amount || amount <= 0) {
                              toast.error('Invalid bid amount');
                              return;
                            }
                            await api.client.post(`/auctions/${listing.id}/bids`, { amount });
                            setBidAmountInput('');
                            toast.success('Bid placed successfully!');
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Failed to place bid');
                          }
                        }}
                      >
                        <Gavel size={16} className="mr-1" aria-hidden="true" />
                        Place Bid
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleWatchToggle}
                    className={cn(
                      'flex-1 btn-outline justify-center py-2.5',
                      isWatched && 'border-red-500/40 text-red-400 hover:border-red-500',
                    )}
                    aria-pressed={isWatched}
                    aria-label={isWatched ? 'Remove from watchlist' : 'Save to watchlist'}
                  >
                    <Heart size={16} className={cn(isWatched && 'fill-red-400')} aria-hidden="true" />
                    {isWatched ? 'Saved' : 'Save'}
                  </button>
                  <button
                    className="flex-1 btn-outline justify-center py-2.5"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success('Link copied!');
                    }}
                    aria-label="Share this listing"
                  >
                    <Share2 size={16} aria-hidden="true" />
                    Share
                  </button>
                </div>
              </div>
            )}

            {/* Offer form */}
            {showOfferForm && (
              <div className="card-gem p-4 animate-slide-up" role="region" aria-label="Make an offer">
                <h3 className="text-sm font-semibold text-white mb-3">Your Offer</h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      placeholder={`Min: ${formatPrice(listing.minAcceptableOffer, listing.currency)}`}
                      className="input-gem text-sm"
                      aria-label="Offer amount"
                    />
                  </div>
                  <button
                    className="btn-gold px-4"
                    onClick={async () => {
                      try {
                        const amount = Number(offerAmount);
                        if (!amount || amount <= 0) {
                          toast.error('Enter a valid amount');
                          return;
                        }
                        await api.client.post('/offers', { listingId: listing.id, amount });
                        toast.success('Offer submitted successfully!');
                        setShowOfferForm(false);
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Failed to submit offer');
                      }
                    }}
                    aria-label="Submit offer"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Certificate */}
            {listing.certificate && (
              <div className="card-gem p-4 border border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <Award size={20} className="text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">
                        {listing.certificate.labName} Certificate
                      </h3>
                      {listing.certificate.verificationUrl && (
                        <a
                          href={listing.certificate.verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gold-500 flex items-center gap-1 hover:text-gold-400 transition-colors"
                          aria-label="Verify certificate (opens in new tab)"
                        >
                          Verify <ExternalLink size={11} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    {listing.certificate.certificateNumber && (
                      <p className="text-xs text-gray-500 mt-1">
                        No. {listing.certificate.certificateNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Not certified warning */}
            {!listing.isCertified && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-xs text-amber-300/80">
                  This gem does not have a laboratory certificate. Request an independent certificate
                  before purchase.
                </p>
              </div>
            )}

            {/* Seller card */}
            {listing.seller && (
              <div className="card-gem p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
                    <span className="text-base" aria-hidden="true">
                      {listing.seller.username?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white text-sm truncate">
                        {listing.seller.fullName ?? listing.seller.username}
                      </span>
                      {listing.sellerProfile?.isVerified && (
                        <BadgeCheck size={14} className="text-gold-500 shrink-0" aria-label="Verified seller" />
                      )}
                    </div>
                    {listing.sellerProfile?.averageRating && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star size={11} className="text-gold-400 fill-gold-400" aria-hidden="true" />
                        <span className="text-gold-400 font-semibold">
                          {Number(listing.sellerProfile.averageRating).toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          ({listing.sellerProfile.totalReviews} reviews)
                        </span>
                      </div>
                    )}
                    {listing.sellerProfile?.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin size={11} aria-hidden="true" />
                        {listing.sellerProfile.location}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/sellers/${listing.sellerId}`}
                    className="btn-outline text-xs px-3 py-1.5 shrink-0"
                    aria-label={`View ${listing.seller.username}'s profile`}
                  >
                    View Profile
                  </Link>
                </div>

                {listing.sellerProfile && (
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#1e2d4e]">
                    {[
                      { label: 'Sales', value: listing.sellerProfile.completedSales },
                      { label: 'Rating', value: listing.sellerProfile.averageRating ? `${Number(listing.sellerProfile.averageRating).toFixed(1)}★` : 'N/A' },
                      { label: 'Response', value: listing.sellerProfile.responseRatePercent ? `${Math.round(Number(listing.sellerProfile.responseRatePercent))}%` : 'N/A' },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <div className="text-sm font-bold text-white">{value}</div>
                        <div className="text-[10px] text-gray-500">{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Buyer protection */}
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <Shield size={16} className="text-emerald-400 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-emerald-300">Buyer Protection</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Open a dispute within 14 days if the gem doesn't match the description.
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="card-gem p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Description</h2>
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-300"
          onClick={() => {
            setIsLightboxOpen(false);
            setLightboxZoom(1);
          }}
        >
          {/* Close button */}
          <button
            onClick={() => {
              setIsLightboxOpen(false);
              setLightboxZoom(1);
            }}
            className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
            aria-label="Close image viewer"
          >
            <X size={24} />
          </button>

          {/* Left Arrow */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((i) => (i - 1 + images.length) % images.length);
                setLightboxZoom(1);
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Image Container with Zoom support */}
          <div 
            className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="transition-transform duration-200 ease-out"
              style={{ transform: `scale(${lightboxZoom})` }}
            >
              <img
                src={images[activeImageIndex]?.url ?? ''}
                alt={listing.title}
                className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg select-none"
              />
            </div>
          </div>

          {/* Right Arrow */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((i) => (i + 1) % images.length);
                setLightboxZoom(1);
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200 z-10"
              aria-label="Next image"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Zoom controls */}
          <div 
            className="absolute bottom-6 flex items-center gap-4 bg-black/60 px-5 py-2.5 rounded-full border border-white/10 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setLightboxZoom(z => Math.max(1, z - 0.25))}
              className="text-white hover:text-gold-400 font-extrabold px-3 text-lg disabled:opacity-40"
              disabled={lightboxZoom <= 1}
            >
              -
            </button>
            <span className="text-white text-xs font-semibold select-none w-12 text-center">
              {Math.round(lightboxZoom * 100)}%
            </span>
            <button 
              onClick={() => setLightboxZoom(z => Math.min(3, z + 0.25))}
              className="text-white hover:text-gold-400 font-extrabold px-3 text-lg disabled:opacity-40"
              disabled={lightboxZoom >= 3}
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
