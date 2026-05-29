'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AlertTriangle, MessageSquare, Plus, ExternalLink, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function DashboardDisputesPage() {
  const queryClient = useQueryClient();
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  
  const { data: disputes, isLoading } = useQuery({
    queryKey: ['my-disputes'],
    queryFn: async () => {
      const res = await api.disputes.getAll();
      return res.data.data;
    },
  });

  const addEvidenceMutation = useMutation({
    mutationFn: async (data: { id: string, evidenceUrls: string[] }) => {
      const res = await api.disputes.addEvidence(data.id, { evidenceUrls: data.evidenceUrls });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Evidence added');
      setEvidenceUrl('');
      queryClient.invalidateQueries({ queryKey: ['my-disputes'] });
    },
    onError: () => {
      toast.error('Failed to add evidence');
    }
  });

  if (isLoading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  const selectedDispute = disputes?.find((d: any) => d.id === selectedDisputeId);

  return (
    <div className="pt-20 min-h-screen flex">
      {/* Sidebar - Dispute List */}
      <div className="w-1/3 border-r border-[#1e2d4e] overflow-y-auto h-[calc(100vh-80px)] p-4">
        <h1 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <AlertTriangle className="text-amber-400" size={24} />
          My Disputes
        </h1>
        
        {(!disputes || disputes.length === 0) ? (
          <div className="text-center p-8 border border-dashed border-[#1e2d4e] rounded-xl">
            <p className="text-gray-400 text-sm">You have no active disputes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((dispute: any) => (
              <button
                key={dispute.id}
                onClick={() => setSelectedDisputeId(dispute.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedDisputeId === dispute.id 
                    ? 'bg-[#1e2d4e]/40 border-gold-500/50' 
                    : 'bg-[#0a0f1e] border-[#1e2d4e] hover:border-gold-500/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase">
                    Order #{dispute.order.orderNumber.substring(0, 8)}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                    dispute.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                    dispute.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                  }`}>
                    {dispute.status}
                  </span>
                </div>
                <h3 className="text-sm text-white font-medium truncate mb-1">
                  {dispute.order.listing.title}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  Reason: {dispute.reason.replace(/_/g, ' ')}
                </p>
                <div className="text-[10px] text-gray-600 mt-2">
                  Opened {new Date(dispute.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content - Dispute Details */}
      <div className="flex-1 bg-[#050810] h-[calc(100vh-80px)] overflow-y-auto">
        {selectedDispute ? (
          <div className="p-8 max-w-3xl mx-auto">
            <div className="card-gem p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Dispute Details</h2>
              <p className="text-sm text-gray-400 mb-6">
                Our support team reviews disputes within 48-72 hours. Please provide as much evidence as possible.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0a0f1e] p-4 rounded-xl border border-[#1e2d4e]">
                  <div className="text-xs text-gray-500 mb-1">Reason</div>
                  <div className="text-sm text-white font-medium">{selectedDispute.reason.replace(/_/g, ' ')}</div>
                </div>
                <div className="bg-[#0a0f1e] p-4 rounded-xl border border-[#1e2d4e]">
                  <div className="text-xs text-gray-500 mb-1">Item</div>
                  <Link href={`/listings/${selectedDispute.order.listing.id}`} className="text-sm text-gold-400 hover:underline flex items-center gap-1">
                    {selectedDispute.order.listing.title} <ExternalLink size={12} />
                  </Link>
                </div>
              </div>

              <div className="bg-[#0a0f1e] p-4 rounded-xl border border-[#1e2d4e] mb-6">
                <div className="text-xs text-gray-500 mb-2">Description</div>
                <p className="text-sm text-white whitespace-pre-wrap">{selectedDispute.description}</p>
              </div>

              <h3 className="text-lg font-bold text-white mb-4">Evidence & Timeline</h3>
              
              <div className="space-y-4">
                {/* Initial evidence */}
                {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                  <div className="bg-[#1e2d4e]/20 p-4 rounded-xl border border-[#1e2d4e]">
                    <div className="text-xs text-gray-500 mb-3">Provided Evidence</div>
                    <div className="flex flex-wrap gap-3">
                      {selectedDispute.evidence.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#1e2d4e] block group">
                          {url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img src={url} alt={`Evidence ${i}`} className="object-cover w-full h-full group-hover:scale-110 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#0a0f1e]">
                              <ImageIcon className="text-gray-500" size={24} />
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add new evidence */}
                {selectedDispute.status === 'OPEN' && (
                  <div className="bg-[#0a0f1e] p-4 rounded-xl border border-[#1e2d4e]">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Add Evidence Link
                    </h4>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        placeholder="https://..." 
                        className="input-gem flex-1"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                      />
                      <button 
                        className="btn-gold"
                        disabled={!evidenceUrl || addEvidenceMutation.isPending}
                        onClick={() => {
                          addEvidenceMutation.mutate({
                            id: selectedDispute.id,
                            evidenceUrls: [evidenceUrl]
                          });
                        }}
                      >
                        {addEvidenceMutation.isPending ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedDispute.adminNotes && (
                  <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 mt-6">
                    <div className="text-xs text-blue-400 font-bold mb-2 uppercase tracking-wider">Admin Note</div>
                    <p className="text-sm text-blue-100">{selectedDispute.adminNotes}</p>
                  </div>
                )}
                
                {selectedDispute.resolution && (
                  <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 mt-6">
                    <div className="text-xs text-emerald-400 font-bold mb-2 uppercase tracking-wider">Resolution</div>
                    <p className="text-sm text-emerald-100">{selectedDispute.resolution}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center flex-col text-center p-8">
            <AlertTriangle className="text-[#1e2d4e] w-24 h-24 mb-6" />
            <h2 className="text-xl font-bold text-gray-500 mb-2">Select a Dispute</h2>
            <p className="text-gray-600 text-sm max-w-sm">
              Choose a dispute from the sidebar to view details, add evidence, and check the resolution status.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
