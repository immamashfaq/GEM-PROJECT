'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function SellerOffersPage() {
  const queryClient = useQueryClient();

  const { data: offers, isLoading } = useQuery({
    queryKey: ['seller-offers-received'],
    queryFn: async () => {
      const res = await api.client.get('/offers/received');
      return res.data.data;
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ offerId, status }: { offerId: string, status: 'ACCEPTED' | 'REJECTED' }) => 
      api.client.post(`/offers/${offerId}/respond`, { status }),
    onSuccess: (_, variables) => {
      toast.success(`Offer ${variables.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['seller-offers-received'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to respond to offer');
    }
  });

  if (isLoading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="text-gold-500" size={28} />
          <h1 className="text-2xl font-bold text-white">Offers Received</h1>
        </div>

        {(!offers || offers.length === 0) ? (
          <div className="card-gem p-12 text-center">
            <MessageSquare size={48} className="text-gray-500 mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-semibold text-white">No offers yet</h2>
            <p className="text-gray-400">When buyers make an offer on your listings, they will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {offers.map((offer: any) => (
              <div key={offer.id} className="card-gem overflow-hidden">
                <div className="bg-[#1e2d4e]/30 px-6 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2d4e]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 font-bold text-sm">
                      {offer.buyer.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{offer.buyer.username}</div>
                      <div className="text-xs text-gray-500">{formatRelativeTime(offer.createdAt)}</div>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      offer.status === 'PENDING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      offer.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {offer.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#0a0f1e] border border-[#1e2d4e] shrink-0">
                    {offer.listing.media?.[0]?.url && (
                      <Image 
                        src={offer.listing.media[0].url} 
                        alt={offer.listing.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">
                      <Link href={`/listings/${offer.listing.id}`} className="hover:text-gold-400 transition-colors">
                        {offer.listing.title}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="text-gray-400">
                        Asking: <span className="text-white line-through">{formatPrice(offer.listing.negotiablePrice, offer.currency)}</span>
                      </div>
                      <div className="text-gold-400 font-bold">
                        Offer: {formatPrice(offer.amount, offer.currency)}
                      </div>
                    </div>

                    {offer.message && (
                      <div className="bg-[#0a0f1e] p-3 rounded-lg border border-[#1e2d4e] mb-4 text-sm text-gray-300 italic">
                        "{offer.message}"
                      </div>
                    )}
                    
                    {offer.status === 'PENDING' && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-[#1e2d4e]">
                        <button 
                          className="flex-1 btn-outline border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10 justify-center py-2 text-sm"
                          onClick={() => respondMutation.mutate({ offerId: offer.id, status: 'REJECTED' })}
                          disabled={respondMutation.isPending}
                        >
                          <XCircle size={16} className="mr-2" /> Reject Offer
                        </button>
                        <button 
                          className="flex-1 btn-gold justify-center py-2 text-sm"
                          onClick={() => respondMutation.mutate({ offerId: offer.id, status: 'ACCEPTED' })}
                          disabled={respondMutation.isPending}
                        >
                          <CheckCircle2 size={16} className="mr-2" /> Accept Offer
                        </button>
                      </div>
                    )}

                    {offer.status === 'ACCEPTED' && (
                      <div className="mt-4 text-sm text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 size={16} /> 
                        Offer accepted. Waiting for buyer to complete checkout.
                      </div>
                    )}

                    {offer.status === 'REJECTED' && (
                      <div className="mt-4 text-sm text-red-400 flex items-center gap-2">
                        <XCircle size={16} /> 
                        You rejected this offer.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
