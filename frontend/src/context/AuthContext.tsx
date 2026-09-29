import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../services/api'

interface Merchant {
  id: string
  businessName: string
  email: string
  phone: string
  country: string
  currency: string
  isLive: boolean
  isVerified: boolean
  apiKey?: string
  webhookUrl?: string
  webhookSecret?: string
  settings?: {
    allowedPaymentMethods: string[]
    allowedCurrencies: string[]
    autoSettlement: boolean
    settlementSchedule: string
    minimumPayout: number
  }
}

interface AuthContextType {
  merchant: Merchant | null
  token: string | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<{ apiKey: string; secretKey: string }>
  logout: () => void
  refreshMerchant: () => Promise<void>
}

interface RegisterData {
  businessName: string
  email: string
  phone: string
  country: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('afripay_token'))
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = merchant?.email === 'admin@afripay.io'

  useEffect(() => {
    if (token) {
      fetchMerchant()
    } else {
      setIsLoading(false)
    }
  }, [token])

  const fetchMerchant = async () => {
    try {
      const response = await authApi.getProfile()
      if (response.success && response.merchant) {
        setMerchant(response.merchant)
        localStorage.setItem('afripay_merchant', JSON.stringify(response.merchant))
      }
    } catch (error) {
      console.error('Failed to fetch merchant:', error)
      const storedMerchant = localStorage.getItem('afripay_merchant')
      if (storedMerchant) {
        try {
          setMerchant(JSON.parse(storedMerchant))
        } catch {
          logout()
        }
      } else {
        logout()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshMerchant = async () => {
    if (token) {
      await fetchMerchant()
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(email, password)

      if (!response.success) {
        throw new Error(response.message || 'Login failed')
      }

      localStorage.setItem('afripay_token', response.token)
      localStorage.setItem('afripay_merchant', JSON.stringify(response.merchant))

      setToken(response.token)
      setMerchant(response.merchant)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await authApi.register(data)

      if (!response.success) {
        throw new Error(response.message || 'Registration failed')
      }

      const { apiKey, secretKey } = response.data

      const loginResponse = await authApi.login(data.email, data.password)
      if (!loginResponse.success) {
        throw new Error(loginResponse.message || 'Login after registration failed')
      }

      localStorage.setItem('afripay_token', loginResponse.token)
      localStorage.setItem('afripay_merchant', JSON.stringify(loginResponse.merchant))

      setToken(loginResponse.token)
      setMerchant(loginResponse.merchant)

      return { apiKey, secretKey }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('afripay_token')
    localStorage.removeItem('afripay_merchant')
    setToken(null)
    setMerchant(null)
  }

  return (
    <AuthContext.Provider value={{
      merchant,
      token,
      isLoading,
      isAdmin,
      login,
      register,
      logout,
      refreshMerchant
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
