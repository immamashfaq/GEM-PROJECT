'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Video, Users, Clock } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function StreamsDiscoveryPage() {
  const { data: streams, isLoading } = useQuery({
    queryKey: ['active-streams'],
    queryFn: async () => {
      const res = await api.streams.getActive();
      return res.data.data;
    },
    refetchInterval: 15000, // Refresh every 15s
  });

  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-end mb-8 border-b border-[#1e2d4e] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
              Live Auctions & Showcases
            </h1>
            <p className="text-gray-400">Watch expert sellers showcase premium gemstones in real-time.</p>
          </div>
          {/* Sellers would see a 'Go Live' button here */}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : (!streams || streams.length === 0) ? (
          <div className="card-gem p-16 text-center">
            <Video size={48} className="text-gray-500 mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-semibold text-white mb-2">No active streams right now</h2>
            <p className="text-gray-400">Check back later or browse the marketplace.</p>
            <Link href="/marketplace" className="btn-gold inline-flex mt-6">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {streams.map((stream: any) => (
              <Link 
                key={stream.id} 
                href={`/live/${stream.id}`}
                className="card-gem block group overflow-hidden border border-[#1e2d4e] hover:border-gold-500/40 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-[#0a0f1e] overflow-hidden">
                  {stream.thumbnailUrl ? (
                    <Image 
                      src={stream.thumbnailUrl} 
                      alt={stream.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl opacity-10">💎</span>
                    </div>
                  )}
                  
                  {/* Live Badge */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                  
                  {/* Viewer Count */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Users size={12} />
                    {stream._count.viewers}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white truncate mb-1 group-hover:text-gold-400 transition-colors">
                    {stream.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{stream.sellerProfile.user.username}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatRelativeTime(stream.startedAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
