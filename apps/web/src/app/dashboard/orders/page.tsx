'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, Search, AlertCircle, X, CreditCard, Building2, UploadCloud, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function DashboardOrdersPage() {
  const queryClient = useQueryClient();
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }
    setProofFile(file);
  };

  const { data: orders, isLoading } = useQuery({
    queryKey: ['buyer-purchases'],
    queryFn: async () => {
      const res = await api.client.get('/orders/purchases');
      return res.data.data;
    },
  });

  const openDisputeMutation = useMutation({
    mutationFn: async (data: { orderId: string, reason: string, description: string }) => {
      const res = await api.disputes.open(data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Dispute opened successfully');
      setDisputeModalOpen(false);
      setDisputeReason('');
      setDisputeDescription('');
      queryClient.invalidateQueries({ queryKey: ['buyer-purchases'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to open dispute');
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
    <div className="pt-20 min-h-screen relative">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="text-gold-500" size={28} />
          <h1 className="text-2xl font-bold text-white">My Purchases</h1>
        </div>

        {(!orders || orders.length === 0) ? (
          <div className="card-gem p-12 text-center">
            <Search size={48} className="text-gray-500 mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-semibold text-white">No purchases yet</h2>
            <p className="text-gray-400 mb-6">You haven't bought any gemstones yet.</p>
            <Link href="/marketplace" className="btn-gold inline-flex">
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order: any) => (
              <div key={order.id} className="card-gem overflow-hidden">
                <div className="bg-[#1e2d4e]/30 px-6 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2d4e]">
                  <div className="flex gap-6">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Order Placed</div>
                      <div className="text-sm text-white">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Total</div>
                      <div className="text-sm text-white font-medium">{formatPrice(order.total, order.currency)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Order #</div>
                      <div className="text-sm text-white">{order.orderNumber}</div>
                    </div>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col md:flex-row gap-6">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-[#0a0f1e] border border-[#1e2d4e] shrink-0">
                    {order.listing.media?.[0]?.url && (
                      <Image 
                        src={order.listing.media[0].url} 
                        alt={order.listing.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      <Link href={`/listings/${order.listing.id}`} className="hover:text-gold-400 transition-colors">
                        {order.listing.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Sold by: <span className="text-white">{order.seller.sellerProfile?.businessName || order.seller.username}</span>
                    </p>
                    
                    {order.shipment && (
                      <div className="mt-4 p-3 bg-[#0a0f1e]/50 border border-[#1e2d4e] rounded-lg text-xs space-y-2 mb-4">
                        <div className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Shipping & Tracking</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300">
                          <div>
                            <span className="text-gray-500">Recipient:</span> {order.shipment.recipientName || 'N/A'}
                          </div>
                          <div>
                            <span className="text-gray-500">Address:</span> {order.shipment.address ? `${order.shipment.address}, ${order.shipment.city}, ${order.shipment.country}` : 'N/A'}
                          </div>
                          {order.shipment.courierName && (
                            <div>
                              <span className="text-gray-500">Courier:</span> {order.shipment.courierName}
                            </div>
                          )}
                          {order.shipment.trackingNumber && (
                            <div>
                              <span className="text-gray-500">Tracking #:</span>{' '}
                              {order.shipment.trackingUrl ? (
                                <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer" className="text-gold-400 hover:underline">
                                  {order.shipment.trackingNumber}
                                </a>
                              ) : (
                                order.shipment.trackingNumber
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/listings/${order.listing.id}`} className="btn-outline text-xs px-4 py-2">
                        View Listing
                      </Link>
                      
                      {order.status === 'PENDING_PAYMENT' && (
                        order.payment?.status === 'PENDING' ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Awaiting Verification
                          </span>
                        ) : (
                          <button
                            className="btn-gold text-xs px-4 py-2"
                            onClick={() => {
                              setPaymentOrder(order);
                              setPaymentMethod('card');
                              setProofFile(null);
                              setPaymentModalOpen(true);
                            }}
                          >
                            Pay Now
                          </button>
                        )
                      )}
                      
                      {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                        <button
                          className="btn-gold text-xs px-4 py-2"
                          onClick={async () => {
                            try {
                              toast.loading('Confirming delivery...', { id: 'delivery' });
                              await api.client.post(`/orders/${order.id}/complete`);
                              toast.success('Delivery confirmed successfully!', { id: 'delivery' });
                              queryClient.invalidateQueries({ queryKey: ['buyer-purchases'] });
                            } catch (err: any) {
                              toast.error(err.response?.data?.message || 'Failed to confirm delivery', { id: 'delivery' });
                            }
                          }}
                        >
                          Confirm Delivery
                        </button>
                      )}

                      {(order.status === 'PENDING_PAYMENT' || order.status === 'PAID') && (
                        <button
                          className="btn-outline text-xs px-4 py-2 border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10"
                          onClick={async () => {
                            if (confirm('Are you sure you want to cancel this order?')) {
                              try {
                                toast.loading('Cancelling order...', { id: 'cancel' });
                                await api.client.post(`/orders/${order.id}/cancel`);
                                toast.success('Order cancelled successfully!', { id: 'cancel' });
                                queryClient.invalidateQueries({ queryKey: ['buyer-purchases'] });
                              } catch (err: any) {
                                toast.error(err.response?.data?.message || 'Failed to cancel order', { id: 'cancel' });
                              }
                            }
                          }}
                        >
                          Cancel Order
                        </button>
                      )}

                      {order.status !== 'DISPUTED' && order.status !== 'PENDING_PAYMENT' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && order.status !== 'COMPLETED' && (
                        <button 
                          className="btn-outline text-xs px-4 py-2 border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10" 
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setDisputeModalOpen(true);
                          }}
                        >
                          Report Issue
                        </button>
                      )}
                      {order.status === 'DISPUTED' && (
                        <Link href="/dashboard/disputes" className="btn-outline text-xs px-4 py-2 text-amber-400 border-amber-500/40 hover:border-amber-500">
                          View Dispute
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-gem w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setDisputeModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="text-red-400" size={24} />
              <h2 className="text-xl font-bold text-white">Report an Issue</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Please provide details about the issue with your order. Opening a dispute will halt the transaction until it's resolved.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
                <select 
                  className="input-gem"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                >
                  <option value="">Select a reason</option>
                  <option value="ITEM_NOT_AS_DESCRIBED">Item not as described</option>
                  <option value="CERTIFICATE_MISMATCH">Certificate mismatch</option>
                  <option value="ITEM_DAMAGED">Item damaged upon arrival</option>
                  <option value="ITEM_NOT_RECEIVED">Item not received</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea 
                  className="input-gem h-32"
                  placeholder="Please provide detailed information about the issue (min 20 characters)..."
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  className="flex-1 btn-outline justify-center"
                  onClick={() => setDisputeModalOpen(false)}
                  disabled={openDisputeMutation.isPending}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 btn-gold justify-center bg-red-600 hover:bg-red-700 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] text-white"
                  disabled={openDisputeMutation.isPending || !disputeReason || disputeDescription.length < 20}
                  onClick={() => {
                    if (selectedOrderId) {
                      openDisputeMutation.mutate({
                        orderId: selectedOrderId,
                        reason: disputeReason,
                        description: disputeDescription
                      });
                    }
                  }}
                >
                  {openDisputeMutation.isPending ? 'Submitting...' : 'Open Dispute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Selection & Proof Upload Modal */}
      {paymentModalOpen && paymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card-gem w-full max-w-lg p-6 relative">
            <button 
              onClick={() => {
                setPaymentModalOpen(false);
                setPaymentOrder(null);
                setProofFile(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-gold-500" size={24} />
              <h2 className="text-xl font-bold text-white">Complete Payment</h2>
            </div>
            
            <div className="mb-6 p-4 bg-[#0a0f1e]/50 border border-[#1e2d4e] rounded-lg text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Gemstone:</span>
                <span className="text-white font-medium">{paymentOrder.listing.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Amount:</span>
                <span className="text-gold-400 font-bold">{formatPrice(paymentOrder.total, paymentOrder.currency)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">Select Payment Method</label>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                      : 'border-[#1e2d4e] bg-[#0a0f1e] text-gray-400 hover:border-gold-500/40'
                  }`}
                >
                  <CreditCard size={24} />
                  <span className="text-xs font-semibold">Online Sandbox Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                      : 'border-[#1e2d4e] bg-[#0a0f1e] text-gray-400 hover:border-gold-500/40'
                  }`}
                >
                  <Building2 size={24} />
                  <span className="text-xs font-semibold">Bank Transfer fallback</span>
                </button>
              </div>

              {paymentMethod === 'card' ? (
                <div className="pt-4 space-y-4">
                  <p className="text-xs text-gray-400 leading-relaxed bg-[#0a0f1e] p-3 rounded-lg border border-[#1e2d4e]">
                    This is a simulated payment gateway. Clicking proceed will direct you to a mock Stripe session and immediately mark the order as PAID via verified webhook triggers.
                  </p>
                  
                  <button
                    onClick={async () => {
                      try {
                        toast.loading('Initializing payment...', { id: 'payment' });
                        const intentRes = await api.payments.createIntent({ 
                          orderId: paymentOrder.id, 
                          providerName: 'stripe_mock' 
                        });
                        const { providerPaymentId } = intentRes.data.data;
                        
                        toast.loading('Simulating payment sandbox...', { id: 'payment' });
                        await api.payments.simulateWebhook({ providerPaymentId, status: 'succeeded' });
                        
                        toast.success('Payment completed successfully!', { id: 'payment' });
                        setPaymentModalOpen(false);
                        setPaymentOrder(null);
                        queryClient.invalidateQueries({ queryKey: ['buyer-purchases'] });
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Payment failed', { id: 'payment' });
                      }
                    }}
                    className="w-full btn-gold py-3 justify-center text-white font-semibold"
                  >
                    Pay with Card Sandbox
                  </button>
                </div>
              ) : (
                <div className="pt-4 space-y-4">
                  <div className="text-xs text-gray-400 space-y-2 bg-[#0a0f1e] p-4 rounded-lg border border-[#1e2d4e]">
                    <div className="font-semibold text-white uppercase text-[10px] tracking-wider mb-2">Deposit Bank Details</div>
                    <div><span className="text-gray-500">Bank:</span> Gem Trust Bank</div>
                    <div><span className="text-gray-500">Account Name:</span> Gem Project PVT Ltd</div>
                    <div><span className="text-gray-500">Account Number:</span> 0045-8832-1102</div>
                    <div><span className="text-gray-500">Branch:</span> Ratnapura Corporate Branch</div>
                  </div>

                  <div className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xs font-semibold text-white">Deposit Slip Proof</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Please upload a clear photo of your bank deposit receipt.</p>
                      </div>
                      {proofFile && <Check className="text-emerald-400" size={16} />}
                    </div>

                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#1e2d4e] rounded-lg cursor-pointer bg-[#080d1a] hover:bg-[#1e2d4e]/30 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        <UploadCloud className="mb-1 text-gray-400" size={20} />
                        <p className="mb-0.5 text-xs text-gray-400">
                          <span className="font-semibold text-gold-500">Click to upload</span>
                        </p>
                        <p className="text-[10px] text-gray-500">PNG or JPG (max 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept=".jpg,.jpeg,.png" 
                        onChange={handleProofUpload} 
                      />
                    </label>
                    {proofFile && (
                      <div className="mt-2 text-xs text-gold-400 truncate">
                        Uploaded: {proofFile.name}
                      </div>
                    )}
                  </div>

                  <button
                    disabled={!proofFile || uploadingProof}
                    onClick={async () => {
                      if (!proofFile || !paymentOrder) return;
                      try {
                        setUploadingProof(true);
                        toast.loading('Uploading deposit slip...', { id: 'proof' });
                        
                        // 1. Get presigned URL
                        const presignedRes = await api.payments.presignedUrl({
                          fileName: proofFile.name,
                          contentType: proofFile.type,
                        });
                        const { uploadUrl, publicUrl } = presignedRes.data.data;
                        
                        // 2. Upload file directly to S3/MinIO
                        await fetch(uploadUrl, {
                          method: 'PUT',
                          body: proofFile,
                          headers: {
                            'Content-Type': proofFile.type,
                          },
                        });
                        
                        // 3. Submit proof to order
                        toast.loading('Submitting proof for admin verification...', { id: 'proof' });
                        await api.payments.uploadProof(paymentOrder.id, { proofUrl: publicUrl });
                        
                        toast.success('Deposit slip uploaded successfully! Awaiting admin approval.', { id: 'proof' });
                        setPaymentModalOpen(false);
                        setPaymentOrder(null);
                        setProofFile(null);
                        queryClient.invalidateQueries({ queryKey: ['buyer-purchases'] });
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Proof submission failed', { id: 'proof' });
                      } finally {
                        setUploadingProof(false);
                      }
                    }}
                    className="w-full btn-gold py-3 justify-center text-white font-semibold"
                  >
                    {uploadingProof ? 'Uploading...' : 'Submit Deposit Slip'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
