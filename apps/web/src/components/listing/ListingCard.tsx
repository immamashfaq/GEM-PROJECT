'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  Heart,
  Award,
  Flame,
  Clock,
  Gavel,
  ShoppingBag,
  BadgeCheck,
  Zap,
  Eye,
} from 'lucide-react';
import type { ListingSummary } from '@gem/types';
import {
  cn,
  formatPrice,
  formatCarat,
  formatTimeRemaining,
  getListingTypeLabel,
} from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface ListingCardProps {
  listing: ListingSummary;
  className?: string;
}

export function ListingCard({ listing, className }: ListingCardProps) {
  const { isAuthenticated } = useAuthStore();
  const [isWatched, setIsWatched] = useState(listing.isWatched ?? false);
  const [isWatchLoading, setIsWatchLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const thumbnail = listing.thumbnail;
  const isAuction = listing.listingType === 'TIMED_AUCTION' || listing.listingType === 'LIVE_AUCTION';
  const isLive = listing.listingType === 'LIVE_AUCTION';
  const isEndingSoon =
    isAuction &&
    listing.auctionEndsAt &&
    new Date(listing.auctionEndsAt).getTime() - Date.now() < 2 * 60 * 60 * 1000;

  const displayPrice = listing.fixedPrice ?? listing.auctionStartPrice;
  const displayCurrency = listing.currency;

  const handleWatchToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to save gems to your watchlist');
      return;
    }

    setIsWatchLoading(true);
    try {
      if (isWatched) {
        await api.listings.unwatch(listing.id);
        setIsWatched(false);
        toast.success('Removed from watchlist');
      } else {
        await api.listings.watch(listing.id);
        setIsWatched(true);
        toast.success('Added to watchlist');
      }
    } catch {
      toast.error('Failed to update watchlist');
    } finally {
      setIsWatchLoading(false);
    }
  };

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn('group block', className)}
      aria-label={`View listing: ${listing.title}`}
    >
      <article className="card-gem overflow-hidden h-full flex flex-col">
        {/* Image section */}
        <div className="relative aspect-[4/3] bg-[#0a0f1e] overflow-hidden">
          {thumbnail && !imageError ? (
            <Image
              src={thumbnail}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[80px] opacity-10 select-none">💎</div>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top badges row */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
            {isLive && (
              <span className="badge-live" aria-label="Live auction">
                <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
                LIVE
              </span>
            )}
            {isAuction && !isLive && (
              <span className="badge-auction" aria-label="Timed auction">
                <Gavel size={10} aria-hidden="true" />
                Auction
              </span>
            )}
            {listing.isCertified && (
              <span className="badge-certified" aria-label="Certified gem">
                <Award size={10} aria-hidden="true" />
                Certified
              </span>
            )}
            {listing.naturalStatus === 'NATURAL' && listing.treatment === 'None (Unheated)' && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20"
                aria-label="Unheated natural gem"
              >
                Unheated
              </span>
            )}
          </div>

          {/* Watch button */}
          <button
            onClick={handleWatchToggle}
            disabled={isWatchLoading}
            aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
            aria-pressed={isWatched}
            className={cn(
              'absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center',
              'transition-all duration-200 backdrop-blur-sm',
              isWatched
                ? 'bg-red-500/90 text-white'
                : 'bg-black/40 text-white hover:bg-red-500/80 opacity-0 group-hover:opacity-100',
            )}
          >
            <Heart
              size={14}
              className={cn('transition-all', isWatched && 'fill-white')}
              aria-hidden="true"
            />
          </button>

          {/* Featured badge */}
          {listing.isFeatured && (
            <div
              className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-500/90 text-navy-900"
              aria-label="Featured listing"
            >
              <Zap size={9} fill="currentColor" aria-hidden="true" />
              Featured
            </div>
          )}

          {/* Ending soon overlay */}
          {isEndingSoon && listing.auctionEndsAt && (
            <div
              className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-red-900/90 to-transparent p-2"
              role="status"
              aria-label={`Auction ending soon: ${formatTimeRemaining(listing.auctionEndsAt)} remaining`}
            >
              <div className="flex items-center justify-center gap-1 text-red-300 text-xs font-semibold">
                <Flame size={12} aria-hidden="true" />
                Ends in {formatTimeRemaining(listing.auctionEndsAt)}
              </div>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {/* Gem type + carat */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gold-500 uppercase tracking-wide truncate">
              {listing.gemType}
              {listing.variety && listing.variety !== listing.gemType && ` · ${listing.variety}`}
            </span>
            {listing.caratWeight && (
              <span className="text-xs text-gray-500 shrink-0">{formatCarat(listing.caratWeight)}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-gold-400 transition-colors duration-200">
            {listing.title}
          </h3>

          {/* Color + Clarity */}
          {(listing.color || listing.clarity) && (
            <p className="text-xs text-gray-500">
              {[listing.color, listing.clarity].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Price + action */}
          <div className="flex items-end justify-between mt-auto pt-2 border-t border-[#1e2d4e]">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">
                {isAuction ? 'Starting bid' : listing.listingType === 'NEGOTIABLE' ? 'Asking price' : 'Price'}
              </div>
              <div className="text-base font-bold text-white">
                {formatPrice(displayPrice, displayCurrency)}
              </div>
            </div>

            {/* Type badge */}
            <div
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
                isAuction
                  ? 'bg-purple-500/15 text-purple-400'
                  : listing.listingType === 'NEGOTIABLE'
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-emerald-500/15 text-emerald-400',
              )}
              aria-label={`Listing type: ${getListingTypeLabel(listing.listingType)}`}
            >
              {listing.listingType === 'FIXED_PRICE' && (
                <ShoppingBag size={10} aria-hidden="true" />
              )}
              {isAuction && <Gavel size={10} aria-hidden="true" />}
              {listing.listingType === 'NEGOTIABLE' && (
                <span className="text-[10px]" aria-hidden="true">↕</span>
              )}
              {getListingTypeLabel(listing.listingType)}
            </div>
          </div>

          {/* Seller row */}
          {listing.seller && (
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {listing.sellerProfile?.isVerified && (
                  <BadgeCheck
                    size={12}
                    className="text-gold-500 shrink-0"
                    aria-label="Verified seller"
                  />
                )}
                <span className="text-xs text-gray-500 truncate">
                  {listing.seller.username}
                </span>
                {listing.sellerProfile?.averageRating && (
                  <span className="text-xs text-gold-500">
                    ★ {Number(listing.sellerProfile.averageRating).toFixed(1)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Eye size={11} aria-hidden="true" />
                <span className="text-[11px]">{listing.viewCount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Auction countdown */}
          {isAuction && listing.auctionEndsAt && !isEndingSoon && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500" role="status">
              <Clock size={10} aria-hidden="true" />
              <span>Ends {formatTimeRemaining(listing.auctionEndsAt)}</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
