const API_BASE = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: { total: number; page: number; limit: number; pages: number };
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('divulguei_token');

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Erro ao conectar com o servidor');
  }

  return data;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),

  post: <T = any>(path: string, body: any) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T = any>(path: string, body: any) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T = any>(path: string, body: any) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),

  // Auth
  requestWhatsAppCode: (phone: string) => request('/auth/whatsapp/request-code', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyWhatsAppCode: (phone: string, code: string) => request('/auth/whatsapp/verify-code', { method: 'POST', body: JSON.stringify({ phone, code }) }),
  googleAuth: (token: string) => request('/auth/google', { method: 'POST', body: JSON.stringify({ token }) }),

  // Cities
  getCities: () => request('/cities'),
  getCity: (slug: string) => request(`/cities/${slug}`),

  // Categories
  getCategories: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/categories${qs}`);
  },

  // Businesses
  getBusinesses: (citySlug: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/${citySlug}/businesses${qs}`);
  },
  getBusinessBySlug: (citySlug: string, slug: string) => request(`/${citySlug}/businesses/${slug}`),
  createBusiness: (citySlug: string, data: any) => request(`/${citySlug}/businesses`, { method: 'POST', body: JSON.stringify(data) }),
  updateBusiness: (citySlug: string, id: string, data: any) => request(`/${citySlug}/businesses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBusiness: (citySlug: string, id: string) => request(`/${citySlug}/businesses/${id}`, { method: 'DELETE' }),
  claimBusiness: (citySlug: string, id: string, message: string) => request(`/${citySlug}/businesses/${id}/claim`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Classifieds
  getClassifieds: (citySlug: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/${citySlug}/classifieds${qs}`);
  },
  getClassifiedById: (citySlug: string, id: string) => request(`/${citySlug}/classifieds/${id}`),
  createClassified: (citySlug: string, data: any) => request(`/${citySlug}/classifieds`, { method: 'POST', body: JSON.stringify(data) }),
  improveClassifiedDescription: (citySlug: string, description: string) => request(`/${citySlug}/classifieds/improve`, { method: 'POST', body: JSON.stringify({ description }) }),
  updateClassified: (citySlug: string, id: string, data: any) => request(`/${citySlug}/classifieds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClassified: (citySlug: string, id: string) => request(`/${citySlug}/classifieds/${id}`, { method: 'DELETE' }),

  // Professionals
  getProfessionals: (citySlug: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/${citySlug}/professionals${qs}`);
  },
  getProfessional: (citySlug: string, id: string) => request(`/${citySlug}/professionals/${id}`),

  // Jobs
  getJobs: (citySlug: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/${citySlug}/jobs${qs}`);
  },
  getJob: (citySlug: string, id: string) => request(`/${citySlug}/jobs/${id}`),

  // Events
  getEvents: (citySlug: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/${citySlug}/events${qs}`);
  },
  getEventById: (citySlug: string, id: string) => request(`/${citySlug}/events/${id}`),
  approveEvent: (citySlug: string, id: string) => request(`/${citySlug}/events/${id}/approve`, { method: 'PATCH' }),
  deleteEvent: (citySlug: string, id: string) => request(`/${citySlug}/events/${id}`, { method: 'DELETE' }),

  // News
  getNews: (citySlug: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/${citySlug}/news${qs}`);
  },

  // Public Services
  getPublicServices: (citySlug: string) => request(`/${citySlug}/public-services`),

  // Search
  search: (citySlug: string, query: string, source: string = 'web') =>
    request(`/${citySlug}/search`, { method: 'POST', body: JSON.stringify({ query, source }) }),

  // Profile
  getMe: () => request('/me'),
  updateProfile: (data: any) => request('/me', { method: 'PUT', body: JSON.stringify(data) }),

  // Alerts
  getMyAlerts: () => request('/me/alerts'),
  createAlert: (citySlug: string, data: { alert_type: string; keywords: string }) => request(`/${citySlug}/alerts`, { method: 'POST', body: JSON.stringify(data) }),
  deleteAlert: (id: string) => request(`/me/alerts/${id}`, { method: 'DELETE' }),

  // File upload
  uploadFile: (formData: FormData) => request('/upload', { method: 'POST', body: formData }),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminGroups: () => request('/admin/groups'),
  deleteAdminGroup: (id: string) => request(`/admin/groups/${id}`, { method: 'DELETE' }),
  getAdminClaims: () => request('/admin/claims'),
  updateAdminClaim: (id: string, status: string) => request(`/admin/claims/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
};
