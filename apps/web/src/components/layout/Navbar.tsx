'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Search,
  Gem,
  Heart,
  User,
  Menu,
  X,
  Radio,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Package,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/live', label: 'Live', icon: Radio, badge: 'LIVE' },
  { href: '/search', label: 'Search' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-[#080d1a]/95 backdrop-blur-md border-b border-[#1e2d4e]/50 shadow-lg'
          : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Gem Project Home">
            <div className="relative">
              <Gem
                size={28}
                className="text-gold-500 transition-transform duration-300 group-hover:scale-110"
                aria-hidden="true"
              />
              <div className="absolute inset-0 blur-md bg-gold-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-white">Gem</span>
              <span className="text-gradient-gold"> Project</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-gold-400 bg-gold-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                )}
                aria-current={pathname === link.href ? 'page' : undefined}
              >
                {link.icon && (
                  <link.icon size={14} className="text-red-400" aria-hidden="true" />
                )}
                {link.label}
                {link.badge && (
                  <span className="badge-live text-[10px] px-1.5 py-0.5" aria-label="Live now">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Search icon (mobile) */}
            <Link
              href="/search"
              className="btn-ghost p-2"
              aria-label="Search gemstones"
            >
              <Search size={20} aria-hidden="true" />
            </Link>

            {isAuthenticated && user ? (
              <>
                {/* Watchlist */}
                <Link
                  href="/dashboard/watchlist"
                  className="hidden sm:flex btn-ghost p-2"
                  aria-label="Your watchlist"
                >
                  <Heart size={20} aria-hidden="true" />
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1e2d4e] bg-[#0e1628] hover:border-gold-500/40 transition-all duration-200"
                    aria-label="Open user menu"
                    aria-expanded={isProfileOpen}
                    id="user-menu-button"
                  >
                    <div className="w-7 h-7 rounded-full bg-gold-500/20 flex items-center justify-center">
                      <User size={14} className="text-gold-400" aria-hidden="true" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-300 max-w-[100px] truncate">
                      {user.username}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'text-gray-500 transition-transform duration-200',
                        isProfileOpen && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Dropdown */}
                  {isProfileOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-56 card-gem py-1.5 animate-fade-in"
                      role="menu"
                      aria-labelledby="user-menu-button"
                    >
                      <div className="px-4 py-3 border-b border-[#1e2d4e]">
                        <p className="text-sm font-semibold text-white truncate">{user.fullName ?? user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                          role="menuitem"
                        >
                          <LayoutDashboard size={16} aria-hidden="true" />
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/watchlist"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                          role="menuitem"
                        >
                          <Heart size={16} aria-hidden="true" />
                          Watchlist
                        </Link>
                        <Link
                          href="/dashboard/orders"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                          role="menuitem"
                        >
                          <Package size={16} aria-hidden="true" />
                          My Orders
                        </Link>
                        {(user.role === 'SELLER' || user.role === 'VERIFIED_SELLER') && (
                          <Link
                            href="/seller/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            role="menuitem"
                          >
                            <Star size={16} aria-hidden="true" />
                            Seller Dashboard
                          </Link>
                        )}
                        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                          <Link
                            href="/admin/kyc"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            role="menuitem"
                          >
                            <ShieldCheck size={16} className="text-gold-500" aria-hidden="true" />
                            Admin Panel
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-[#1e2d4e] pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                          role="menuitem"
                        >
                          <LogOut size={16} aria-hidden="true" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth/login" className="btn-ghost text-sm">
                  Log in
                </Link>
                <Link href="/auth/register" className="btn-gold text-sm py-2 px-4">
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden btn-ghost p-2"
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-[#1e2d4e] bg-[#080d1a]/98 backdrop-blur-md animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-gold-400 bg-gold-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                )}
              >
                {link.icon && <link.icon size={16} className="text-red-400" />}
                {link.label}
                {link.badge && (
                  <span className="badge-live text-[10px] px-1.5 py-0.5">{link.badge}</span>
                )}
              </Link>
            ))}

            {!isAuthenticated && (
              <div className="pt-3 flex flex-col gap-2">
                <Link href="/auth/login" className="btn-outline w-full justify-center">
                  Log in
                </Link>
                <Link href="/auth/register" className="btn-gold w-full justify-center">
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
