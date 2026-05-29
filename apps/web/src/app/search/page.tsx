'use client';

import { Suspense } from 'react';
import SearchClient from './SearchClient';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 min-h-screen flex items-center justify-center bg-[#080d1a]">
          <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" aria-label="Loading Search Results" />
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
