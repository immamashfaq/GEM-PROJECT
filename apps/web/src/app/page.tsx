import type { Metadata } from 'next';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedListings } from '@/components/home/FeaturedListings';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { LiveSection } from '@/components/home/LiveSection';
import { TrustSection } from '@/components/home/TrustSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';

export const metadata: Metadata = {
  title: "Gem Project — Sri Lanka's Premier Gemstone Marketplace",
  description:
    'Discover, buy, sell, and bid on certified natural gemstones from Sri Lanka. Verified sellers, live auctions, buyer protection.',
};

// This page is mostly static — use ISR
export const revalidate = 300; // revalidate every 5 minutes

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <CategoriesSection />
      <FeaturedListings />
      <LiveSection />
      <HowItWorksSection />
      <TrustSection />
    </div>
  );
}
