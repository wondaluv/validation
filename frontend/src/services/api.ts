import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('afripay_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('afripay_token')
      localStorage.removeItem('afripay_merchant')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/merchants/authenticate', { email, password })
    return response.data
  },

  register: async (data: {
    businessName: string
    email: string
    phone: string
    country: string
    password: string
  }) => {
    const response = await api.post('/merchants/register', data)
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/merchants/profile')
    return response.data
  }
}

// Transactions API
export const transactionsApi = {
  getAll: async (params?: {
    status?: string
    paymentMethod?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }) => {
    const response = await api.get('/merchants/transactions', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/transactions/${id}`)
    return response.data
  },

  getStats: async (timeRange: string = '7d') => {
    const response = await api.get('/merchants/stats', { params: { timeRange } })
    return response.data
  }
}

// Payments API
export const paymentsApi = {
  initialize: async (data: {
    amount: number
    currency: string
    email?: string
    phone: string
    paymentMethod?: string
    description?: string
    metadata?: Record<string, unknown>
  }) => {
    const response = await api.post('/payments/initialize', data)
    return response.data
  },

  verify: async (reference: string) => {
    const response = await api.get(`/payments/verify/${reference}`)
    return response.data
  },

  getMethods: async (country: string) => {
    const response = await api.get(`/payments/methods/${country}`)
    return response.data
  }
}

// Payouts API
export const payoutsApi = {
  create: async (data: {
    amount: number
    currency: string
    recipient: {
      type: 'mobile_money' | 'bank_account'
      phone?: string
      provider?: string
      accountNumber?: string
      bankCode?: string
      accountName?: string
      country: string
    }
    description?: string
  }) => {
    const response = await api.post('/payouts', data)
    return response.data
  },

  getAll: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/payouts', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/payouts/${id}`)
    return response.data
  }
}

// Customers API
export const customersApi = {
  getAll: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/customers', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/customers/${id}`)
    return response.data
  }
}

// Settings API
export const settingsApi = {
  getSettings: async () => {
    const response = await api.get('/merchants/settings')
    return response.data
  },

  updateSettings: async (settings: {
    autoSettlement?: boolean
    settlementSchedule?: string
    minimumPayout?: number
    allowedPaymentMethods?: string[]
  }) => {
    const response = await api.put('/merchants/settings', settings)
    return response.data
  },

  updateWebhook: async (webhookUrl: string) => {
    const response = await api.put('/merchants/webhook', { webhookUrl })
    return response.data
  },

  regenerateApiKeys: async () => {
    const response = await api.post('/merchants/regenerate-keys')
    return response.data
  }
}

// Admin API
export const adminApi = {
  getAllMerchants: async (params?: {
    country?: string
    isLive?: boolean
    isVerified?: boolean
    limit?: number
    offset?: number
  }) => {
    const response = await api.get('/admin/merchants', { params })
    return response.data
  },

  verifyMerchant: async (merchantId: string) => {
    const response = await api.post(`/admin/merchants/${merchantId}/verify`)
    return response.data
  },

  getAllTransactions: async (params?: {
    merchantId?: string
    status?: string
    limit?: number
    offset?: number
  }) => {
    const response = await api.get('/admin/transactions', { params })
    return response.data
  },

  getSystemStats: async () => {
    const response = await api.get('/admin/stats')
    return response.data
  }
}

export default api
