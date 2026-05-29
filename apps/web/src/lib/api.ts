import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Attach the access token to every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.__gem_access_token__;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('gem_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;

          window.__gem_access_token__ = accessToken;
          localStorage.setItem('gem_refresh_token', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return apiClient(originalRequest);
        } catch {
          // Refresh failed — clear auth state
          window.__gem_access_token__ = undefined;
          localStorage.removeItem('gem_refresh_token');
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

// Augment Window type
declare global {
  interface Window {
    __gem_access_token__?: string;
  }
}

// Typed API helpers
export const api = {
  client: apiClient,

  // Auth
  auth: {
    register: (data: unknown) => apiClient.post('/auth/register', data),
    login: (data: unknown) => apiClient.post('/auth/login', data),
    refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
    logout: (refreshToken?: string) => apiClient.post('/auth/logout', { refreshToken }),
    me: () => apiClient.get('/auth/me'),
    forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  },

  // Listings
  listings: {
    getAll: (params?: Record<string, unknown>) => apiClient.get('/listings', { params }),
    getById: (id: string) => apiClient.get(`/listings/${id}`),
    getCategories: () => apiClient.get('/listings/categories'),
    create: (data: unknown) => apiClient.post('/listings', data),
    update: (id: string, data: unknown) => apiClient.patch(`/listings/${id}`, data),
    delete: (id: string) => apiClient.delete(`/listings/${id}`),
    publish: (id: string) => apiClient.post(`/listings/${id}/publish`),
    presignedUrl: (data: { fileName: string; contentType: string }) => apiClient.post('/listings/presigned-url', data),
    addMedia: (id: string, data: { media: { url: string; sortOrder: number; isThumbnail: boolean }[] }) => apiClient.post(`/listings/${id}/media`, data),
    addCertificate: (id: string, data: { labName: string; certificateNumber?: string; fileUrl: string }) => apiClient.post(`/listings/${id}/certificate`, data),
    watch: (id: string) => apiClient.post(`/listings/${id}/watch`),
    unwatch: (id: string) => apiClient.delete(`/listings/${id}/watch`),
    report: (id: string, data: unknown) => apiClient.post(`/listings/${id}/report`, data),
    getMyListings: (params?: Record<string, unknown>) => apiClient.get('/listings/my', { params }),
    getWatchlist: (params?: Record<string, unknown>) => apiClient.get('/listings/watchlist', { params }),
  },

  // Search
  search: {
    listings: (params?: Record<string, unknown>) => apiClient.get('/search/listings', { params }),
    facets: () => apiClient.get('/search/facets'),
    suggestions: (q: string) => apiClient.get('/search/suggestions', { params: { q } }),
  },

  // Users
  users: {
    getProfile: (id: string) => apiClient.get(`/users/${id}/profile`),
    updateMe: (data: unknown) => apiClient.patch('/users/me', data),
    updateSellerProfile: (data: unknown) => apiClient.patch('/users/me/seller-profile', data),
  },

  // Payments
  payments: {
    createIntent: (data: { orderId: string; providerName?: string }) => apiClient.post('/payments/intent', data),
    simulateWebhook: (data: { providerPaymentId: string, status: string }) => apiClient.post('/payments/simulate', data),
    uploadProof: (orderId: string, data: { proofUrl: string }) => apiClient.post(`/orders/${orderId}/upload-proof`, data),
    presignedUrl: (data: { fileName: string; contentType: string }) => apiClient.post('/orders/presigned-url', data),
  },

  // Admin
  admin: {
    getPendingKyc: () => apiClient.get('/admin/kyc/pending'),
    approveKyc: (id: string) => apiClient.post(`/admin/kyc/${id}/approve`),
    rejectKyc: (id: string, reason?: string) => apiClient.post(`/admin/kyc/${id}/reject`, { reason }),
    suspendSeller: (id: string, reason?: string) => apiClient.post(`/admin/kyc/${id}/suspend`, { reason }),
    getPendingPayments: () => apiClient.get('/admin/orders/pending-payments'),
    approvePayment: (orderId: string) => apiClient.post(`/admin/orders/${orderId}/approve-payment`),
    rejectPayment: (orderId: string) => apiClient.post(`/admin/orders/${orderId}/reject-payment`),
    getActiveStreams: () => apiClient.get('/admin/streams/active'),
    flagStream: (id: string) => apiClient.post(`/admin/streams/${id}/flag`),
    suspendStream: (id: string) => apiClient.post(`/admin/streams/${id}/suspend`),
    endStream: (id: string) => apiClient.post(`/admin/streams/${id}/end`),
    getReports: (params?: Record<string, unknown>) => apiClient.get('/admin/reports', { params }),
    assignReport: (id: string, data: { assignedToId: string }) => apiClient.post(`/admin/reports/${id}/assign`, data),
    resolveReport: (id: string, data: { status: string; adminNotes?: string }) => apiClient.post(`/admin/reports/${id}/resolve`, data),
    suspendUser: (id: string, reason?: string) => apiClient.post(`/admin/users/${id}/suspend`, { reason }),
    suspendListing: (id: string, reason?: string) => apiClient.post(`/admin/listings/${id}/suspend`, { reason }),
    getDisputes: (params?: Record<string, unknown>) => apiClient.get('/admin/disputes', { params }),
    getDisputeById: (id: string) => apiClient.get(`/admin/disputes/${id}`),
    updateDisputeStatus: (id: string, data: { status: string; adminNotes?: string; resolution?: string }) => apiClient.post(`/admin/disputes/${id}/status`, data),
    getAuditLogs: () => apiClient.get('/admin/audit-logs'),
  },

  // Disputes
  disputes: {
    getAll: () => apiClient.get('/disputes'),
    open: (data: unknown) => apiClient.post('/disputes', data),
    addEvidence: (id: string, data: unknown) => apiClient.post(`/disputes/${id}/evidence`, data),
    presignedUrl: (data: { fileName: string; contentType: string }) => apiClient.post('/disputes/presigned-url', data),
  },

  // Reports
  reports: {
    create: (data: unknown) => apiClient.post('/reports', data),
  },

  // Streams
  streams: {
    getActive: () => apiClient.get('/streams'),
    getById: (id: string) => apiClient.get(`/streams/${id}`),
    create: (data: unknown) => apiClient.post('/streams', data),
    end: (id: string) => apiClient.post(`/streams/${id}/end`),
    getChatHistory: (id: string) => apiClient.get(`/streams/${id}/chat-history`),
    sendChatMessage: (id: string, data: { message: string }) => apiClient.post(`/streams/${id}/chat`, data),
  },
};
