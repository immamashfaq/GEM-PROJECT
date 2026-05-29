import type { Metadata } from 'next';
import { MarketplaceClient } from './MarketplaceClient';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Marketplace — Browse Gemstones',
  description:
    'Browse thousands of certified natural gemstones from verified Sri Lankan sellers. Filter by type, origin, carat, and certification.',
};

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="pt-24 min-h-screen flex items-center justify-center bg-gem-bg">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    }>
      <MarketplaceClient />
    </Suspense>
  );
}
