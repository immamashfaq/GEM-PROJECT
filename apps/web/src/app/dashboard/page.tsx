'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { LayoutDashboard, Heart, Package, Star, Gavel, Settings } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isMounted, isAuthenticated, isLoading, router]);

  if (!isMounted || isLoading || !user) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  const quickLinks = [
    {
      icon: Heart,
      label: 'Watchlist',
      href: '/dashboard/watchlist',
      description: 'Gems you\'ve saved',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      icon: Gavel,
      label: 'My Bids',
      href: '/dashboard/bids',
      description: 'Active auction bids',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      icon: Package,
      label: 'Orders',
      href: '/dashboard/orders',
      description: 'Purchase history',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Star,
      label: 'Reviews',
      href: '/dashboard/reviews',
      description: 'Your reviews given',
      color: 'text-gold-400',
      bg: 'bg-gold-500/10',
    },
  ];

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard size={20} className="text-gold-500" aria-hidden="true" />
              <span className="text-sm text-gold-500 font-medium uppercase tracking-widest">Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user.fullName ?? user.username}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {user.role === 'BUYER' ? 'Buyer Account' : user.role.replace('_', ' ')} ·{' '}
              {user.email}
            </p>
          </div>
          <Link href="/settings" className="btn-outline gap-2 text-sm">
            <Settings size={15} aria-hidden="true" />
            Settings
          </Link>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="card-gem p-5 group hover:scale-[1.02] transition-all duration-200"
              aria-label={link.label}
            >
              <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center mb-3`}>
                <link.icon size={20} className={link.color} aria-hidden="true" />
              </div>
              <div className="font-semibold text-white text-sm group-hover:text-gold-400 transition-colors">
                {link.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{link.description}</div>
            </Link>
          ))}
        </div>

        {/* Seller upgrade CTA */}
        {user.role === 'BUYER' && (
          <div className="card-gem p-6 border border-gold-500/20 bg-gradient-to-br from-gold-500/5 to-transparent">
            <h2 className="text-lg font-semibold text-white mb-2">Start Selling on Gem Project</h2>
            <p className="text-sm text-gray-400 mb-4">
              List your gemstones and reach thousands of buyers. Complete KYC verification to get your
              verified seller badge.
            </p>
            <Link href="/seller/onboarding" className="btn-gold text-sm py-2">
              Become a Seller
            </Link>
          </div>
        )}

        {/* Seller CTA if they're a seller */}
        {(user.role === 'SELLER' || user.role === 'VERIFIED_SELLER') && (
          <div className="card-gem p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Seller Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/seller/dashboard" className="btn-gold text-sm py-2">
                Seller Dashboard
              </Link>
              <Link href="/seller/listings/create" className="btn-outline text-sm py-2">
                Create Listing
              </Link>
              {user.role === 'VERIFIED_SELLER' && (
                <Link href="/seller/live" className="btn-outline text-sm py-2">
                  Go Live
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
