'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Grid3X3 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const categoryEmojis: Record<string, string> = {
  'blue-sapphire': '🔵',
  'star-sapphire': '⭐',
  'ruby': '🔴',
  'alexandrite': '🟣',
  "cats-eye-chrysoberyl": '🟡',
  'yellow-sapphire': '🟡',
  'pink-sapphire': '🩷',
  'spinel': '💜',
  'tourmaline': '🌈',
  'aquamarine': '💙',
  'emerald': '💚',
  'garnet': '❤️',
  'zircon': '💎',
  'moonstone': '🌙',
  'amethyst': '🟣',
  'other': '✨',
};

async function fetchCategories() {
  const res = await api.listings.getCategories();
  return res.data.data;
}

export function CategoriesSection() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['gem-categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const displayCategories = categories?.slice(0, 8) ?? [];

  return (
    <section className="py-12 bg-gradient-to-b from-transparent to-[#060a14]/50" aria-labelledby="categories-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Grid3X3 size={18} className="text-gold-500" aria-hidden="true" />
              <span className="text-sm font-medium text-gold-500 uppercase tracking-widest">
                Browse by Type
              </span>
            </div>
            <h2 id="categories-title" className="text-2xl sm:text-3xl font-bold text-white section-title">
              Gem Categories
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="hidden sm:flex items-center gap-2 text-sm text-gold-500 hover:text-gold-400 transition-colors font-medium"
            aria-label="View all gem categories"
          >
            View all <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* Categories grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" aria-hidden="true" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {displayCategories.map((category: any) => (
              <Link
                key={category.id}
                href={`/marketplace?categoryId=${category.id}`}
                className={cn(
                  'group flex flex-col items-center justify-center p-4 rounded-xl text-center',
                  'card-gem transition-all duration-200 hover:scale-105',
                )}
                aria-label={`Browse ${category.name} (${category._count?.listings ?? 0} listings)`}
              >
                <span
                  className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110 inline-block"
                  aria-hidden="true"
                >
                  {categoryEmojis[category.slug] ?? '💎'}
                </span>
                <span className="text-xs font-semibold text-white leading-tight">
                  {category.name}
                </span>
                {category._count?.listings > 0 && (
                  <span className="text-[10px] text-gray-600 mt-1">
                    {category._count.listings} listing{category._count.listings !== 1 ? 's' : ''}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
