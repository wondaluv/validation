import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Merchant {
  id: string
  businessName: string
  email: string
  country: string
  currency: string
  isLive: boolean
  isVerified: boolean
  apiKey?: string
}

interface AuthContextType {
  merchant: Merchant | null
  token: string | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<{ apiKey: string; secretKey: string }>
  logout: () => void
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

  // Check if user is admin (for demo, check email)
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
      // Simulate API call - in production, call actual API
      const storedMerchant = localStorage.getItem('afripay_merchant')
      if (storedMerchant) {
        setMerchant(JSON.parse(storedMerchant))
      }
    } catch (error) {
      console.error('Failed to fetch merchant:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Demo login - accept any credentials
      const mockMerchant: Merchant = {
        id: 'merchant_' + Math.random().toString(36).substr(2, 9),
        businessName: email.includes('admin') ? 'AfriPay Admin' : 'Demo Business',
        email,
        country: 'NG',
        currency: 'NGN',
        isLive: false,
        isVerified: true,
        apiKey: 'pk_test_' + Math.random().toString(36).substr(2, 16)
      }

      const mockToken = 'token_' + Math.random().toString(36).substr(2, 32)

      localStorage.setItem('afripay_token', mockToken)
      localStorage.setItem('afripay_merchant', JSON.stringify(mockMerchant))

      setToken(mockToken)
      setMerchant(mockMerchant)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const mockMerchant: Merchant = {
        id: 'merchant_' + Math.random().toString(36).substr(2, 9),
        businessName: data.businessName,
        email: data.email,
        country: data.country,
        currency: data.country === 'NG' ? 'NGN' : data.country === 'KE' ? 'KES' : 'USD',
        isLive: false,
        isVerified: false,
        apiKey: 'pk_test_' + Math.random().toString(36).substr(2, 16)
      }

      const mockToken = 'token_' + Math.random().toString(36).substr(2, 32)
      const secretKey = 'sk_test_' + Math.random().toString(36).substr(2, 32)

      localStorage.setItem('afripay_token', mockToken)
      localStorage.setItem('afripay_merchant', JSON.stringify(mockMerchant))

      setToken(mockToken)
      setMerchant(mockMerchant)

      return { apiKey: mockMerchant.apiKey!, secretKey }
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
    <AuthContext.Provider value={{ merchant, token, isLoading, isAdmin, login, register, logout }}>
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
