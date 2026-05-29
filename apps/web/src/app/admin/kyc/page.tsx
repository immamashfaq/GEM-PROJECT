'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  ShieldCheck, XCircle, CheckCircle2, FileText, User, MapPin, 
  Building, Eye, CreditCard, AlertTriangle, MessageSquare, Clipboard, 
  Activity, Star, Flame, EyeOff, ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type TabType = 'kyc' | 'payments' | 'listings' | 'reports' | 'disputes' | 'auditLogs';

export default function AdminKycPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('kyc');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  const [disputeNotes, setDisputeNotes] = useState('');
  const [disputeResolution, setDisputeResolution] = useState('');
  const [disputeStatusInput, setDisputeStatusInput] = useState('');

  const [suspensionReason, setSuspensionReason] = useState('');
  const [reportActionNotes, setReportActionNotes] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isMounted, isAuthLoading, isAuthenticated, user, router]);

  // Tab 1: KYC Queue query
  const { data: pendingRequests, isLoading: isKycLoading } = useQuery({
    queryKey: ['admin-kyc-pending'],
    queryFn: async () => {
      const res = await api.client.get('/admin/kyc/pending');
      return res.data.data;
    },
    enabled: activeTab === 'kyc' && !!user && user.role === 'ADMIN',
  });

  // Tab 2: Payments Queue query
  const { data: pendingPayments, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['admin-payments-pending'],
    queryFn: async () => {
      const res = await api.admin.getPendingPayments();
      return res.data.data;
    },
    enabled: activeTab === 'payments' && !!user && user.role === 'ADMIN',
  });

  // Tab 3: Listings Queue query
  const { data: activeListings, isLoading: isListingsLoading } = useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      const res = await api.listings.getAll({ pageSize: 50 });
      return res.data.data;
    },
    enabled: activeTab === 'listings' && !!user && user.role === 'ADMIN',
  });

  // Tab 4: Reports Queue query
  const { data: reports, isLoading: isReportsLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const res = await api.admin.getReports();
      return res.data.data;
    },
    enabled: activeTab === 'reports' && !!user && user.role === 'ADMIN',
  });

  // Tab 5: Disputes Queue query
  const { data: disputes, isLoading: isDisputesLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const res = await api.admin.getDisputes();
      return res.data.data;
    },
    enabled: activeTab === 'disputes' && !!user && user.role === 'ADMIN',
  });

  // Dispute Details query (for modal review)
  const { data: disputeDetail, isLoading: isDisputeDetailLoading } = useQuery({
    queryKey: ['admin-dispute-detail', selectedDisputeId],
    queryFn: async () => {
      if (!selectedDisputeId) return null;
      const res = await api.admin.getDisputeById(selectedDisputeId);
      return res.data.data;
    },
    enabled: !!selectedDisputeId,
  });

  // Tab 6: Audit Logs query
  const { data: auditLogs, isLoading: isAuditLogsLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await api.admin.getAuditLogs();
      return res.data.data;
    },
    enabled: activeTab === 'auditLogs' && !!user && user.role === 'ADMIN',
  });

  // --- Mutations ---

  const approveMutation = useMutation({
    mutationFn: (sellerId: string) => api.client.post(`/admin/kyc/${sellerId}/approve`),
    onSuccess: () => {
      toast.success('Seller approved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-pending'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Approval failed');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (sellerId: string) => api.client.post(`/admin/kyc/${sellerId}/reject`, { reason: 'Failed verification checks' }),
    onSuccess: () => {
      toast.success('Seller rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-pending'] });
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: (orderId: string) => api.admin.approvePayment(orderId),
    onSuccess: () => {
      toast.success('Payment approved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-payments-pending'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Approval failed');
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: (orderId: string) => api.admin.rejectPayment(orderId),
    onSuccess: () => {
      toast.success('Payment rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-payments-pending'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Rejection failed');
    },
  });

  const suspendListingMutation = useMutation({
    mutationFn: ({ listingId, reason }: { listingId: string; reason?: string }) => 
      api.admin.suspendListing(listingId, reason),
    onSuccess: () => {
      toast.success('Listing suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      setSuspensionReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Listing suspension failed');
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) => 
      api.admin.suspendUser(userId, reason),
    onSuccess: () => {
      toast.success('User account suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSuspensionReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'User suspension failed');
    }
  });

  const assignReportMutation = useMutation({
    mutationFn: (reportId: string) => 
      api.admin.assignReport(reportId, { assignedToId: user!.id }),
    onSuccess: () => {
      toast.success('Report assigned to you');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ reportId, status, notes }: { reportId: string; status: string; notes?: string }) => 
      api.admin.resolveReport(reportId, { status, adminNotes: notes }),
    onSuccess: () => {
      toast.success('Report resolved');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setReportActionNotes('');
    },
  });

  const updateDisputeMutation = useMutation({
    mutationFn: ({ disputeId, status, notes, resolution }: { disputeId: string; status: string; notes?: string; resolution?: string }) => 
      api.admin.updateDisputeStatus(disputeId, { status, adminNotes: notes, resolution }),
    onSuccess: () => {
      toast.success('Dispute updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setSelectedDisputeId(null);
      setDisputeNotes('');
      setDisputeResolution('');
      setDisputeStatusInput('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Dispute update failed');
    }
  });

  const isTabLoading = 
    (activeTab === 'kyc' && isKycLoading) ||
    (activeTab === 'payments' && isPaymentsLoading) ||
    (activeTab === 'listings' && isListingsLoading) ||
    (activeTab === 'reports' && isReportsLoading) ||
    (activeTab === 'disputes' && isDisputesLoading) ||
    (activeTab === 'auditLogs' && isAuditLogsLoading);

  if (!isMounted || isAuthLoading || isTabLoading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-gem-bg">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="pt-20 min-h-screen bg-gem-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="text-gold-500" size={28} />
          <h1 className="text-2xl font-bold text-white">Trust & Safety Moderation Dashboard</h1>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-4 mb-8 border-b border-[#1e2d4e] pb-1">
          {[
            { id: 'kyc', label: `KYC Requests (${pendingRequests?.length || 0})` },
            { id: 'payments', label: `Bank Transfers (${pendingPayments?.length || 0})` },
            { id: 'listings', label: `Listings Moderation` },
            { id: 'reports', label: `Reports (${reports?.length || 0})` },
            { id: 'disputes', label: `Disputes (${disputes?.length || 0})` },
            { id: 'auditLogs', label: `Audit Trails` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-gold-500 text-gold-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: KYC Queue */}
        {activeTab === 'kyc' && (
          pendingRequests?.length === 0 ? (
            <div className="card-gem p-12 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white">All caught up!</h2>
              <p className="text-gray-400">There are no pending KYC requests at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {pendingRequests?.map((request: any) => (
                <div key={request.userId} className="card-gem p-6">
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">User Info</h3>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0a0f1e] border border-[#1e2d4e] flex items-center justify-center">
                          <User size={18} className="text-gold-500" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{request.user.fullName || request.user.username}</div>
                          <div className="text-sm text-gray-500">{request.user.email}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Business Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Building size={16} className="text-gray-500 mt-0.5" />
                          <div>
                            <div className="text-sm text-white font-medium">{request.businessName}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-gray-500 mt-0.5 shrink-0" />
                          <div className="text-sm text-gray-400">{request.address}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Documents</h3>
                      <div className="space-y-2">
                        {request.documents?.nicPassportUrlSigned && (
                          <button 
                            onClick={() => setSelectedDoc(request.documents.nicPassportUrlSigned)}
                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors w-full bg-blue-500/10 p-2 rounded-lg border border-blue-500/20"
                          >
                            <FileText size={16} /> NIC / Passport <Eye size={14} className="ml-auto" />
                          </button>
                        )}
                        {request.documents?.businessRegUrlSigned && (
                          <button 
                            onClick={() => setSelectedDoc(request.documents.businessRegUrlSigned)}
                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors w-full bg-blue-500/10 p-2 rounded-lg border border-blue-500/20"
                          >
                            <FileText size={16} /> Business Registration <Eye size={14} className="ml-auto" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex gap-3 pt-4 mt-4 border-t border-[#1e2d4e]">
                        <button
                          onClick={() => rejectMutation.mutate(request.userId)}
                          disabled={rejectMutation.isPending || approveMutation.isPending}
                          className="flex-1 btn-outline justify-center text-red-400 hover:text-red-300 hover:border-red-500/50 py-2.5"
                        >
                          <XCircle size={16} className="mr-1.5" /> Reject
                        </button>
                        <button
                          onClick={() => approveMutation.mutate(request.userId)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="flex-1 btn-gold justify-center py-2.5"
                        >
                          <CheckCircle2 size={16} className="mr-1.5" /> Approve
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 2: Bank Transfers */}
        {activeTab === 'payments' && (
          pendingPayments?.length === 0 ? (
            <div className="card-gem p-12 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white">All caught up!</h2>
              <p className="text-gray-400">There are no pending bank transfer approvals at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {pendingPayments?.map((payment: any) => (
                <div key={payment.id} className="card-gem p-6">
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Buyer Info</h3>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0a0f1e] border border-[#1e2d4e] flex items-center justify-center">
                          <User size={18} className="text-gold-500" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{payment.order.buyer.fullName || payment.order.buyer.username}</div>
                          <div className="text-sm text-gray-500">{payment.order.buyer.email}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Order Info</h3>
                      <div className="space-y-2">
                        <div className="text-sm text-white font-semibold">{payment.order.listing.title}</div>
                        <div className="text-xs text-gray-500">Order: #{payment.order.orderNumber}</div>
                        <div className="text-xs text-gray-500">Subtotal: LKR {Number(payment.order.subtotal).toLocaleString()}</div>
                        <div className="text-sm text-gold-400 font-bold">Total: LKR {Number(payment.order.total).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Deposit Slip</h3>
                      {payment.proofUrl ? (
                        <button
                          onClick={() => setSelectedDoc(payment.proofUrl)}
                          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors w-full bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 mb-4"
                        >
                          <FileText size={16} /> View Deposit Slip <Eye size={14} className="ml-auto" />
                        </button>
                      ) : (
                        <div className="text-sm text-red-400 font-medium mb-4">No slip uploaded</div>
                      )}

                      <div className="flex gap-3 pt-4 border-t border-[#1e2d4e]">
                        <button
                          onClick={() => rejectPaymentMutation.mutate(payment.orderId)}
                          disabled={rejectPaymentMutation.isPending || approvePaymentMutation.isPending}
                          className="flex-1 btn-outline justify-center text-red-400 hover:text-red-300 hover:border-red-500/50 py-2.5"
                        >
                          <XCircle size={16} className="mr-1.5" /> Reject
                        </button>
                        <button
                          onClick={() => approvePaymentMutation.mutate(payment.orderId)}
                          disabled={approvePaymentMutation.isPending || rejectPaymentMutation.isPending}
                          className="flex-1 btn-gold justify-center py-2.5"
                        >
                          <CheckCircle2 size={16} className="mr-1.5" /> Approve
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 3: Listings Moderation */}
        {activeTab === 'listings' && (
          <div className="grid gap-6">
            <h2 className="text-lg font-bold text-white">Active Gem Listings</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeListings?.map((listing: any) => (
                <div key={listing.id} className="card-gem p-4 flex flex-col justify-between">
                  <div>
                    {listing.thumbnail && (
                      <img src={listing.thumbnail} alt={listing.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                    )}
                    <h3 className="font-semibold text-white truncate">{listing.title}</h3>
                    <p className="text-xs text-gray-500 mb-2">Seller: {listing.seller.username}</p>
                    <div className="text-sm text-gold-400 font-bold mb-4">
                      {listing.currency} {listing.fixedPrice ? listing.fixedPrice.toLocaleString() : (listing.auctionStartPrice ? listing.auctionStartPrice.toLocaleString() : 'Negotiable')}
                    </div>
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Suspension reason..." 
                      className="input-gem text-xs py-1.5 mb-2 w-full"
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                    />
                    <button
                      onClick={() => suspendListingMutation.mutate({ listingId: listing.id, reason: suspensionReason })}
                      className="btn-outline justify-center w-full py-1.5 text-xs text-red-400 hover:bg-red-500/10 border-red-500/20"
                    >
                      <EyeOff size={12} className="mr-1.5" /> Suspend Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Reports */}
        {activeTab === 'reports' && (
          reports?.length === 0 ? (
            <div className="card-gem p-12 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white">No active safety reports!</h2>
              <p className="text-gray-400">All users and listings are acting in accordance with guidelines.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {reports?.map((report: any) => (
                <div key={report.id} className="card-gem p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4 pb-4 border-b border-[#1e2d4e]">
                    <div>
                      <span className="badge-live bg-red-500/10 text-red-400 border-red-500/20 px-2 py-0.5 text-xs font-semibold mr-3">
                        {report.type} REPORT
                      </span>
                      <span className="text-xs text-gray-500">Reported by: @{report.reporter.username}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: <span className="font-bold text-white">{report.status}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mb-4">
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Reason</div>
                      <p className="text-sm text-gray-300">{report.reason}</p>
                      {report.description && (
                        <>
                          <div className="text-sm font-semibold text-white mt-3 mb-1">Description</div>
                          <p className="text-sm text-gray-400">{report.description}</p>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Target Resource ID</div>
                      <div className="text-xs text-blue-400 font-mono bg-blue-500/5 p-2 rounded border border-blue-500/10 mb-2 truncate">
                        {report.listingId || report.userId || report.streamId || 'N/A'}
                      </div>
                      {report.assignedTo ? (
                        <div className="text-xs text-gray-400">Assigned to: <span className="text-white font-medium">@{report.assignedTo.username}</span></div>
                      ) : (
                        <button
                          onClick={() => assignReportMutation.mutate(report.id)}
                          className="btn-outline py-1 px-3 text-xs"
                        >
                          Assign to me
                        </button>
                      )}
                    </div>
                  </div>

                  {report.status === 'PENDING' && (
                    <div className="pt-4 border-t border-[#1e2d4e] flex flex-wrap items-center gap-4">
                      <input 
                        type="text" 
                        placeholder="Admin notes..." 
                        className="input-gem text-xs flex-1 max-w-md"
                        value={reportActionNotes}
                        onChange={(e) => setReportActionNotes(e.target.value)}
                      />
                      <button
                        onClick={() => resolveReportMutation.mutate({ reportId: report.id, status: 'DISMISSED', notes: reportActionNotes })}
                        className="btn-outline text-gray-400 py-1.5 px-4 text-xs"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => resolveReportMutation.mutate({ reportId: report.id, status: 'REVIEWED', notes: reportActionNotes })}
                        className="btn-outline text-blue-400 py-1.5 px-4 text-xs"
                      >
                        Mark Reviewed
                      </button>
                      {report.type === 'USER' && (
                        <button
                          onClick={() => suspendUserMutation.mutate({ userId: report.userId, reason: reportActionNotes })}
                          className="btn-gold bg-red-600 hover:bg-red-500 py-1.5 px-4 text-xs"
                        >
                          Suspend User
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 5: Disputes */}
        {activeTab === 'disputes' && (
          disputes?.length === 0 ? (
            <div className="card-gem p-12 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white">No buyer disputes!</h2>
              <p className="text-gray-400">Orders are moving smoothly without arbitration.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {disputes?.map((dispute: any) => (
                <div key={dispute.id} className="card-gem p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between border-b border-[#1e2d4e] pb-3 mb-4">
                      <div>
                        <span className="font-semibold text-white">Dispute for Order #{dispute.order.orderNumber}</span>
                        <div className="text-xs text-gray-500">Reason: {dispute.reason}</div>
                      </div>
                      <div className="text-xs font-bold text-gold-400 bg-gold-400/10 px-2.5 py-1 rounded">
                        {dispute.status}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mb-4">{dispute.description}</div>
                  </div>
                  <div>
                    <button
                      onClick={() => setSelectedDisputeId(dispute.id)}
                      className="btn-gold w-full justify-center text-xs py-2"
                    >
                      <Clipboard size={14} className="mr-1.5" /> Review Dispute & Evidence
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 6: Audit Trails */}
        {activeTab === 'auditLogs' && (
          auditLogs?.length === 0 ? (
            <div className="card-gem p-12 text-center">
              <Activity size={48} className="text-gold-500/40 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white">No audit logs found</h2>
              <p className="text-gray-400">Moderation activities will be recorded here.</p>
            </div>
          ) : (
            <div className="card-gem overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#1e2d4e] text-left text-sm text-gray-300">
                  <thead className="bg-[#0a0f1e] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Actor</th>
                      <th className="px-6 py-4">Resource</th>
                      <th className="px-6 py-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2d4e]/40 bg-[#070b16]">
                    {auditLogs?.map((log: any) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {log.actor ? `@${log.actor.username}` : 'System'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                          {log.resource} ({log.resourceId})
                        </td>
                        <td className="px-6 py-4 text-xs max-w-xs truncate">
                          {JSON.stringify(log.metadata)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Dispute Detail Modal */}
        {selectedDisputeId && disputeDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#080d1a] rounded-xl border border-[#1e2d4e] overflow-hidden flex flex-col p-6">
              <div className="flex justify-between items-center pb-4 border-b border-[#1e2d4e] mb-4">
                <h3 className="font-bold text-white text-lg">Arbitrate Dispute: #{disputeDetail.order.orderNumber}</h3>
                <button onClick={() => setSelectedDisputeId(null)} className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <div className="grid md:grid-cols-2 gap-6 bg-[#0a0f1e] p-4 rounded-lg border border-[#1e2d4e]">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dispute Status</h4>
                    <p className="text-sm font-semibold text-gold-400">{disputeDetail.status}</p>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2">Buyer</h4>
                    <p className="text-sm text-white">{disputeDetail.buyer.fullName || disputeDetail.buyer.username}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason</h4>
                    <p className="text-sm text-red-400">{disputeDetail.reason}</p>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2">Order Price</h4>
                    <p className="text-sm text-gold-400 font-bold">{disputeDetail.order.listing.currency} {disputeDetail.order.total.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Claim Description</h4>
                  <p className="text-sm text-gray-300 whitespace-pre-line bg-[#090e1b] p-4 rounded border border-[#1e2d4e]/50">{disputeDetail.description}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Claim Evidence Documents (Admin-Only Review)</h4>
                  {disputeDetail.signedEvidenceUrls?.length === 0 ? (
                    <p className="text-sm text-gray-500">No evidence uploads provided.</p>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {disputeDetail.signedEvidenceUrls?.map((url: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setSelectedDoc(url)}
                          className="flex items-center gap-2 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 py-2 px-3 rounded-lg hover:bg-blue-500/20 transition-colors"
                        >
                          <FileText size={14} /> Evidence Document #{i + 1} <Eye size={12} className="ml-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-[#1e2d4e] space-y-4">
                  <h4 className="text-sm font-bold text-white">Dispute Arbitration Decision</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Set Status</label>
                      <select
                        className="select-gem w-full"
                        value={disputeStatusInput}
                        onChange={(e) => setDisputeStatusInput(e.target.value)}
                      >
                        <option value="">Select status...</option>
                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        <option value="WAITING_FOR_BUYER">WAITING_FOR_BUYER</option>
                        <option value="WAITING_FOR_SELLER">WAITING_FOR_SELLER</option>
                        <option value="RESOLVED_BUYER">RESOLVED_BUYER (Complete Order)</option>
                        <option value="RESOLVED_SELLER">RESOLVED_SELLER</option>
                        <option value="REFUNDED">REFUNDED (Trigger Automated Refund)</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Resolution Text</label>
                      <input
                        type="text"
                        placeholder="Public resolution description..."
                        className="input-gem w-full"
                        value={disputeResolution}
                        onChange={(e) => setDisputeResolution(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Internal Admin Notes</label>
                    <textarea
                      placeholder="Add arbitration details for other admins..."
                      className="input-gem w-full h-20"
                      value={disputeNotes}
                      onChange={(e) => setDisputeNotes(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => updateDisputeMutation.mutate({
                      disputeId: disputeDetail.id,
                      status: disputeStatusInput || disputeDetail.status,
                      notes: disputeNotes,
                      resolution: disputeResolution,
                    })}
                    className="btn-gold w-full justify-center py-2.5 font-bold"
                  >
                    Submit Decision & Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Modal Overlay */}
        {selectedDoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl h-[80vh] bg-[#080d1a] rounded-xl border border-[#1e2d4e] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-[#1e2d4e]">
                <h3 className="font-semibold text-white">Document Viewer</h3>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close document viewer"
                  title="Close document viewer"
                >
                  <XCircle size={24} aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-[#0a0f1e]">
                <iframe src={selectedDoc} className="w-full h-full rounded bg-white" title="Document" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
