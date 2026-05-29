'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Settings, ShieldCheck, User, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isMounted, isLoading, isAuthenticated, router]);

  const { data: kycStatus, isLoading: isKycLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: async () => {
      const res = await api.client.get('/kyc/status');
      return res.data.data;
    },
    enabled: isAuthenticated && user?.role !== 'ADMIN',
  });

  if (!isMounted || isLoading || !isAuthenticated) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="text-gold-500" size={24} />
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        </div>

        <div className="grid gap-6">
          {/* Profile Details */}
          <section className="card-gem p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-gray-400" />
              Profile Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                <div className="text-sm text-white bg-[#0a0f1e] p-3 rounded-lg border border-[#1e2d4e]">
                  {user?.username}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <div className="text-sm text-white bg-[#0a0f1e] p-3 rounded-lg border border-[#1e2d4e]">
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                <div className="text-sm text-white bg-[#0a0f1e] p-3 rounded-lg border border-[#1e2d4e]">
                  {user?.fullName || 'Not provided'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Current Role</label>
                <div className="text-sm text-gold-400 font-semibold bg-[#0a0f1e] p-3 rounded-lg border border-[#1e2d4e]">
                  {user?.role.replace('_', ' ')}
                </div>
              </div>
            </div>
          </section>

          {/* KYC Status Section */}
          {user?.role !== 'ADMIN' && (
            <section className="card-gem p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                Verification Status
              </h2>

              {isKycLoading ? (
                <div className="text-sm text-gray-500">Checking status...</div>
              ) : (
                <div className="space-y-4">
                  {kycStatus?.status === 'NOT_SUBMITTED' && (
                    <div className="bg-[#0a0f1e] p-4 rounded-xl border border-[#1e2d4e]">
                      <p className="text-sm text-gray-400 mb-4">
                        You are currently a buyer. To list gemstones, you must complete the KYC verification process.
                      </p>
                      <Link href="/seller/onboarding" className="btn-gold text-sm py-2 px-4 inline-flex">
                        Become a Seller
                      </Link>
                    </div>
                  )}

                  {kycStatus?.status === 'PENDING' && (
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex items-start gap-3">
                      <Clock size={20} className="text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-blue-300">Application Pending</h3>
                        <p className="text-sm text-blue-300/80 mt-1">
                          Your seller application has been received and is currently under review by our team. This usually takes 1-2 business days.
                        </p>
                      </div>
                    </div>
                  )}

                  {kycStatus?.status === 'VERIFIED' && (
                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                      <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-300">Verified Seller</h3>
                        <p className="text-sm text-emerald-300/80 mt-1">
                          You are fully verified. You can list gemstones and host live auctions.
                        </p>
                        <p className="text-xs text-emerald-500/60 mt-2">
                          Verified on: {new Date(kycStatus.verifiedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Admin link if Admin */}
          {user?.role === 'ADMIN' && (
            <section className="card-gem p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Admin Controls</h2>
              <Link href="/admin/kyc" className="btn-outline text-sm">
                Manage KYC Requests
              </Link>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
