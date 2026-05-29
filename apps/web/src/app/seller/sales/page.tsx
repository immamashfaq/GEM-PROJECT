'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Tag, Package, Truck, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function SellerSalesPage() {
  const queryClient = useQueryClient();
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  const { data: sales, isLoading } = useQuery({
    queryKey: ['seller-sales'],
    queryFn: async () => {
      const res = await api.client.get('/orders/sales');
      return res.data.data;
    },
  });

  const handleAction = async (orderId: string, action: string, body?: any) => {
    try {
      toast.loading(`Processing...`, { id: 'action' });
      await api.client.post(`/orders/${orderId}/${action}`, body);
      toast.success(`Action completed successfully!`, { id: 'action' });
      queryClient.invalidateQueries({ queryKey: ['seller-sales'] });
      setShippingModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed', { id: 'action' });
    }
  };

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
          <Tag className="text-gold-500" size={28} />
          <h1 className="text-2xl font-bold text-white">Sales & Orders</h1>
        </div>

        {(!sales || sales.length === 0) ? (
          <div className="card-gem p-12 text-center">
            <Package size={48} className="text-gray-500 mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-semibold text-white">No sales yet</h2>
            <p className="text-gray-400 mb-6">When buyers purchase your items, the orders will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sales.map((order: any) => (
              <div key={order.id} className="card-gem overflow-hidden">
                <div className="bg-[#1e2d4e]/30 px-6 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2d4e]">
                  <div className="flex gap-6">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Order Date</div>
                      <div className="text-sm text-white">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Buyer Paid</div>
                      <div className="text-sm text-emerald-400 font-medium">{formatPrice(order.total, order.currency)}</div>
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
                    <div className="text-sm text-gray-400 mb-4 space-y-1">
                      <p>Buyer: <span className="text-white">{order.buyer.fullName || order.buyer.username}</span></p>
                      <p>Email: <span className="text-white">{order.buyer.email}</span></p>
                      {order.payment && (
                        <p>Payment Method: <span className="text-white uppercase">{order.payment.provider.replace('_', ' ')}</span></p>
                      )}
                      {order.payment?.proofUrl && (
                        <p>
                          Payment Proof:{' '}
                          <a href={order.payment.proofUrl} target="_blank" rel="noreferrer" className="text-gold-400 hover:underline font-semibold">
                            View Deposit Slip
                          </a>
                        </p>
                      )}
                    </div>

                    {order.shipment && (
                      <div className="mb-4 p-3 bg-[#0a0f1e]/50 border border-[#1e2d4e] rounded-lg text-xs space-y-2">
                        <div className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Shipping Details</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300">
                          <div>
                            <span className="text-gray-500">Recipient Name:</span> {order.shipment.recipientName || 'N/A'}
                          </div>
                          <div>
                            <span className="text-gray-500">Shipping Address:</span> {order.shipment.address ? `${order.shipment.address}, ${order.shipment.city}, ${order.shipment.country}` : 'N/A'}
                          </div>
                          <div>
                            <span className="text-gray-500">Contact Phone:</span> {order.shipment.phone || 'N/A'}
                          </div>
                          {order.shipment.courierName && (
                            <div>
                              <span className="text-gray-500">Courier Name:</span> {order.shipment.courierName}
                            </div>
                          )}
                          {order.shipment.trackingNumber && (
                            <div>
                              <span className="text-gray-500">Tracking Number:</span>{' '}
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
                      {order.status === 'PAID' && (
                        <button className="btn-gold text-xs px-4 py-2" onClick={() => handleAction(order.id, 'confirm')}>
                          Confirm Order
                        </button>
                      )}

                      {order.status === 'SELLER_CONFIRMED' && (
                        <button className="btn-gold text-xs px-4 py-2" onClick={() => handleAction(order.id, 'pack')}>
                          Mark as Packed
                        </button>
                      )}

                      {order.status === 'PACKED' && (
                        <button 
                          className="btn-gold text-xs px-4 py-2" 
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setCourierName('');
                            setTrackingNumber('');
                            setTrackingUrl('');
                            setShippingModalOpen(true);
                          }}
                        >
                          Ship Order
                        </button>
                      )}

                      {order.status === 'SHIPPED' && (
                        <button className="btn-gold text-xs px-4 py-2" onClick={() => handleAction(order.id, 'deliver')}>
                          Mark as Delivered
                        </button>
                      )}

                      {(order.status === 'PENDING_PAYMENT' || order.status === 'PAID') && (
                        <button 
                          className="btn-outline text-xs px-4 py-2 border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10" 
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this order?')) {
                              handleAction(order.id, 'cancel');
                            }
                          }}
                        >
                          Cancel Order
                        </button>
                      )}

                      <Link href={`/listings/${order.listing.id}`} className="btn-outline text-xs px-4 py-2">
                        View listing
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shipping Details Modal */}
      {shippingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-gem w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setShippingModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <Truck className="text-gold-500" size={24} />
              <h2 className="text-xl font-bold text-white">Add Shipping Tracking Details</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Courier Name</label>
                <input 
                  type="text"
                  className="input-gem"
                  placeholder="DHL, FedEx, UPS..."
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tracking Number</label>
                <input 
                  type="text"
                  className="input-gem"
                  placeholder="1Z9999999999999999..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tracking URL (Optional)</label>
                <input 
                  type="text"
                  className="input-gem"
                  placeholder="https://www.dhl.com/track..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  className="flex-1 btn-outline justify-center"
                  onClick={() => setShippingModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 btn-gold justify-center text-white"
                  disabled={!courierName || !trackingNumber}
                  onClick={() => {
                    if (selectedOrderId) {
                      handleAction(selectedOrderId, 'ship', {
                        courierName,
                        trackingNumber,
                        trackingUrl: trackingUrl || undefined,
                      });
                    }
                  }}
                >
                  Mark as Shipped
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
