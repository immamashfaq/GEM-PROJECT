import Link from 'next/link';
import { Gem, Twitter, Instagram, Facebook, Mail, Shield } from 'lucide-react';

const footerLinks = {
  Marketplace: [
    { label: 'Browse Gems', href: '/marketplace' },
    { label: 'Live Auctions', href: '/live' },
    { label: 'Search', href: '/search' },
    { label: 'Gem Categories', href: '/marketplace?view=categories' },
  ],
  Sellers: [
    { label: 'Start Selling', href: '/seller/onboarding' },
    { label: 'Seller Guidelines', href: '/help/seller-guidelines' },
    { label: 'KYC Verification', href: '/seller/kyc' },
    { label: 'Pricing & Fees', href: '/help/fees' },
  ],
  Support: [
    { label: 'Buyer Protection', href: '/help/buyer-protection' },
    { label: 'How It Works', href: '/help/how-it-works' },
    { label: 'Gem Education', href: '/education' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Cookie Policy', href: '/legal/cookies' },
    { label: 'Dispute Resolution', href: '/legal/disputes' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[#1e2d4e] bg-[#060a14] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <Gem size={24} className="text-gold-500" aria-hidden="true" />
              <span className="text-lg font-bold">
                <span className="text-white">Gem</span>
                <span className="text-gradient-gold"> Project</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Sri Lanka's premier marketplace for natural, certified gemstones. Trusted by collectors,
              jewelers, and gem enthusiasts worldwide.
            </p>
            {/* Trust badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold-500/5 border border-gold-500/15 w-fit">
              <Shield size={14} className="text-gold-500" aria-hidden="true" />
              <span className="text-xs text-gold-400 font-medium">Buyer Protected</span>
            </div>
            {/* Social links */}
            <div className="flex gap-3 mt-5">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Mail, href: 'mailto:hello@gemproject.lk', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg border border-[#1e2d4e] flex items-center justify-center text-gray-500 hover:text-gold-400 hover:border-gold-500/30 transition-all duration-200"
                >
                  <Icon size={15} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gold-400 transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-[#1e2d4e] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Gem Project (Pvt) Ltd. All rights reserved. Registered in
            Sri Lanka.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">🇱🇰 Made in Sri Lanka</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-600">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
