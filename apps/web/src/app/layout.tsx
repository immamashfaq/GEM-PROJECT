import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Gem Project',
    default: 'Gem Project — Sri Lanka\'s Premier Gemstone Marketplace',
  },
  description:
    'Buy, sell, and bid on certified natural gemstones from Sri Lanka. Verified sellers, live auctions, and buyer protection.',
  keywords: [
    'gemstones',
    'Sri Lanka',
    'Ceylon sapphire',
    'blue sapphire',
    'ruby',
    'gem marketplace',
    'natural gems',
    'gemstone auction',
    'ratnapura gems',
  ],
  authors: [{ name: 'Gem Project' }],
  openGraph: {
    type: 'website',
    locale: 'en_LK',
    url: process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://gemproject.lk',
    siteName: 'Gem Project',
    title: 'Gem Project — Sri Lanka\'s Premier Gemstone Marketplace',
    description: 'Buy, sell, and bid on certified natural gemstones from Sri Lanka.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gem Project',
    description: 'Sri Lanka\'s Premier Gemstone Marketplace',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-gem-bg text-white antialiased" suppressHydrationWarning>
        <QueryProvider>
          <ToastProvider />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
