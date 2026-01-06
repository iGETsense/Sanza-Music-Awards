const API_BASE_URL = '/api';

interface ApiRequestOptions extends RequestInit {
    withAuth?: boolean;
    headers?: Record<string, string>;
}

// Helper for making API requests
async function apiRequest(endpoint: string, options: ApiRequestOptions = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token && options.withAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`Expected JSON but got ${contentType || 'nothing'}`, text.slice(0, 100));
            throw new Error(`Invalid API response: Server returned ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error: any) {
        console.warn(`API Service [${endpoint}]:`, error.message);
        throw error;
    }
}

// Public API methods
export const api = {
    // Health check
    health: () => apiRequest('/health'),

    // Categories
    getCategories: () => apiRequest('/categories'),
    getCategory: (id: string | number) => apiRequest(`/categories/${id}`),

    // Nominees
    getNominees: (categoryId: string | number | null = null) => {
        const query = categoryId ? `?categoryId=${categoryId}` : '';
        return apiRequest(`/nominees${query}`);
    },
    getNominee: (id: string | number) => apiRequest(`/nominees/${id}`),
    getGlobalRankings: () => apiRequest('/nominees/rankings/global'),

    // Votes
    getTotalVotes: () => apiRequest('/votes/total'),

    // Payments
    initiatePayment: (data: any) => apiRequest('/vote/submit', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    checkPaymentStatus: (id: string) => apiRequest('/vote/verify', {
        method: 'POST',
        body: JSON.stringify({ transactionId: id }),
    }),

    // Authentication
    login: (email?: string, password?: string) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }),
    verifyToken: () => apiRequest('/auth/verify', {
        method: 'POST',
        withAuth: true,
    }),

    // Admin (requires authentication)
    admin: {
        getStats: () => apiRequest('/admin/stats', { withAuth: true }),
        getTransactions: (params: Record<string, any> = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiRequest(`/admin/transactions?${query}`, { withAuth: true });
        },
        getTopNominees: (limit = 10) => apiRequest(`/admin/top-nominees?limit=${limit}`, { withAuth: true }),
        getRecentActivity: (limit = 20) => apiRequest(`/admin/recent-activity?limit=${limit}`, { withAuth: true }),
        getBalance: () => apiRequest('/admin/balance', { withAuth: true }),
        withdraw: (data: { amount: number; service: string; receiver: string }) => apiRequest('/admin/withdraw', {
            method: 'POST',
            body: JSON.stringify(data),
            withAuth: true,
        }),
    },
};

export default api;
