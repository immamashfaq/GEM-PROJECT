'use client';

import Link from 'next/link';
import { Search, ArrowRight, Shield, Award, Zap } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

const gemImages = ['💎', '🔵', '🟢', '🔴', '🟡'];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated } = useAuthStore();
  
  const isSeller = isAuthenticated && user && (user.role === 'SELLER' || user.role === 'VERIFIED_SELLER');
  const startSellingHref = isSeller ? '/seller/dashboard' : '/seller/onboarding';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/marketplace');
    }
  };

  const popularSearches = [
    'Blue Sapphire',
    'Unheated Ruby',
    'Star Sapphire',
    'Ceylon Alexandrite',
    'Cat\'s Eye',
  ];

  return (
    <section
      className="relative min-h-[85vh] flex items-center pt-20"
      aria-label="Hero section"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Radial glow top left */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        {/* Radial glow top right */}
        <div className="absolute -top-20 right-0 w-[600px] h-[600px] bg-navy-600/30 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(201,168,76,1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating gem emojis */}
        {gemImages.map((emoji, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-5 animate-float"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
            aria-hidden="true"
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          {/* Top badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-500/25 bg-gold-500/5 mb-6 animate-fade-in">
            <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">
              🇱🇰 Sri Lanka's #1 Gem Marketplace
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            <span className="text-white">Discover</span>
            <br />
            <span className="text-gradient-gold">Rare Gemstones</span>
            <br />
            <span className="text-white">from Sri Lanka</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
            Buy, sell, and bid on certified natural gemstones from Ratnapura and beyond.
            Verified sellers. Live auctions. Buyer protection guaranteed.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="flex gap-2 mb-5 animate-slide-up"
            style={{ animationDelay: '200ms' }}
            role="search"
            aria-label="Search gemstones"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                aria-hidden="true"
              />
              <input
                type="search"
                id="hero-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sapphires, rubies, alexandrite..."
                className="input-gem pl-11 pr-4 h-13 text-base"
                aria-label="Search gemstones"
              />
            </div>
            <button
              type="submit"
              className="btn-gold px-6 h-13 text-base shrink-0"
              aria-label="Search"
            >
              Search
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>

          {/* Popular searches */}
          <div
            className="flex flex-wrap gap-2 mb-10 animate-slide-up"
            style={{ animationDelay: '300ms' }}
          >
            <span className="text-sm text-gray-600" id="popular-label">Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                className="text-sm px-3 py-1 rounded-full border border-[#1e2d4e] text-gray-400 hover:text-gold-400 hover:border-gold-500/30 transition-all duration-200"
                aria-describedby="popular-label"
              >
                {term}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div
            className="flex flex-wrap gap-3 animate-slide-up"
            style={{ animationDelay: '400ms' }}
          >
            <Link href="/marketplace" className="btn-gold text-base px-8 py-3">
              Browse Marketplace
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href={startSellingHref} className="btn-outline text-base py-3">
              Start Selling
            </Link>
          </div>

          {/* Trust indicators */}
          <div
            className="flex flex-wrap gap-6 mt-10 animate-fade-in"
            style={{ animationDelay: '500ms' }}
          >
            {[
              { icon: Shield, text: 'Buyer Protection', color: 'text-emerald-400' },
              { icon: Award, text: 'Certified Gems', color: 'text-gold-400' },
              { icon: Zap, text: 'Live Auctions', color: 'text-purple-400' },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={16} className={color} aria-hidden="true" />
                <span className="text-sm text-gray-500">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
