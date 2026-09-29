import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  CreditCard,
  Smartphone,
  Building,
  DollarSign,
  Users,
  ArrowLeftRight,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { transactionsApi } from '../services/api'

interface Transaction {
  id: string
  reference: string
  customer?: { firstName?: string; lastName?: string; email?: string; phone: string }
  amount: number
  currency: string
  paymentMethod: string
  status: string
  createdAt: string
}

interface DashboardStats {
  totalRevenue: number
  totalTransactions: number
  successRate: number
  activeCustomers: number
  revenueChange: number
  transactionsChange: number
  successRateChange: number
  customersChange: number
}

const defaultPaymentMethods = [
  { name: 'Mobile Money', value: 45, color: '#22c55e' },
  { name: 'Cards', value: 35, color: '#3b82f6' },
  { name: 'Bank Transfer', value: 15, color: '#f59e0b' },
  { name: 'USSD', value: 5, color: '#8b5cf6' },
]

const methodIcons: Record<string, React.ReactNode> = {
  mpesa: <Smartphone className="w-4 h-4 text-green-600" />,
  mtn_momo: <Smartphone className="w-4 h-4 text-yellow-600" />,
  airtel_money: <Smartphone className="w-4 h-4 text-red-600" />,
  orange_money: <Smartphone className="w-4 h-4 text-orange-600" />,
  visa: <CreditCard className="w-4 h-4 text-blue-600" />,
  mastercard: <CreditCard className="w-4 h-4 text-red-600" />,
  verve: <CreditCard className="w-4 h-4 text-green-600" />,
  card: <CreditCard className="w-4 h-4 text-gray-600" />,
  bank: <Building className="w-4 h-4 text-gray-600" />,
  bank_transfer: <Building className="w-4 h-4 text-gray-600" />,
}

const statusBadges: Record<string, string> = {
  successful: 'badge-success',
  completed: 'badge-success',
  pending: 'badge-warning',
  processing: 'badge-warning',
  failed: 'badge-error',
}

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    NGN: '₦', KES: 'KSh', GHS: '₵', ZAR: 'R', TZS: 'TSh',
    UGX: 'USh', RWF: 'FRw', ETB: 'Br', ZMW: 'K', XOF: 'CFA',
    XAF: 'FCFA', USD: '$', EUR: '€', GBP: '£'
  }
  return symbols[currency] || currency + ' '
}

const formatTimeSince = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} mins ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hours ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} days ago`
}

export default function Dashboard() {
  const { merchant } = useAuth()
  const [timeRange, setTimeRange] = useState('7d')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<{date: string; amount: number}[]>([])
  const [paymentMethods, setPaymentMethods] = useState(defaultPaymentMethods)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [txResponse, statsResponse] = await Promise.all([
        transactionsApi.getAll({ limit: 5 }),
        transactionsApi.getStats(timeRange)
      ])

      if (txResponse.transactions) {
        setTransactions(txResponse.transactions)
      }

      if (statsResponse) {
        setStats(statsResponse.stats)
        if (statsResponse.revenueChart) {
          setRevenueData(statsResponse.revenueChart)
        }
        if (statsResponse.paymentMethodBreakdown) {
          setPaymentMethods(statsResponse.paymentMethodBreakdown)
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Unable to load dashboard data')
      generateMockData()
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockData = () => {
    const mockStats: DashboardStats = {
      totalRevenue: 2450000,
      totalTransactions: 1234,
      successRate: 98.5,
      activeCustomers: 5678,
      revenueChange: 12.5,
      transactionsChange: 8.2,
      successRateChange: 0.5,
      customersChange: -2.1
    }
    setStats(mockStats)

    const mockRevenueData = Array.from({ length: 12 }, (_, i) => ({
      date: `Day ${i + 1}`,
      amount: Math.floor(Math.random() * 300000) + 100000
    }))
    setRevenueData(mockRevenueData)

    setTransactions([
      { id: 'TXN001', reference: 'TXN001', customer: { firstName: 'John', lastName: 'Doe', phone: '+234...' }, amount: 25000, currency: 'NGN', paymentMethod: 'mpesa', status: 'successful', createdAt: new Date(Date.now() - 120000).toISOString() },
      { id: 'TXN002', reference: 'TXN002', customer: { firstName: 'Jane', lastName: 'Smith', phone: '+254...' }, amount: 150, currency: 'USD', paymentMethod: 'card', status: 'successful', createdAt: new Date(Date.now() - 300000).toISOString() },
      { id: 'TXN003', reference: 'TXN003', customer: { firstName: 'Bob', lastName: 'Wilson', phone: '+254...' }, amount: 5000, currency: 'KES', paymentMethod: 'mtn_momo', status: 'pending', createdAt: new Date(Date.now() - 480000).toISOString() },
      { id: 'TXN004', reference: 'TXN004', customer: { firstName: 'Alice', lastName: 'Brown', phone: '+234...' }, amount: 75000, currency: 'NGN', paymentMethod: 'bank_transfer', status: 'successful', createdAt: new Date(Date.now() - 720000).toISOString() },
      { id: 'TXN005', reference: 'TXN005', customer: { firstName: 'Charlie', lastName: 'Davis', phone: '+233...' }, amount: 300, currency: 'GHS', paymentMethod: 'card', status: 'failed', createdAt: new Date(Date.now() - 900000).toISOString() },
    ])
  }

  const statCards = stats ? [
    {
      name: 'Total Revenue',
      value: `${getCurrencySymbol(merchant?.currency || 'NGN')}${stats.totalRevenue.toLocaleString()}`,
      change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange}%`,
      trend: stats.revenueChange >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Transactions',
      value: stats.totalTransactions.toLocaleString(),
      change: `${stats.transactionsChange >= 0 ? '+' : ''}${stats.transactionsChange}%`,
      trend: stats.transactionsChange >= 0 ? 'up' : 'down',
      icon: ArrowLeftRight,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Success Rate',
      value: `${stats.successRate}%`,
      change: `${stats.successRateChange >= 0 ? '+' : ''}${stats.successRateChange}%`,
      trend: stats.successRateChange >= 0 ? 'up' : 'down',
      icon: CheckCircle,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Active Customers',
      value: stats.activeCustomers.toLocaleString(),
      change: `${stats.customersChange >= 0 ? '+' : ''}${stats.customersChange}%`,
      trend: stats.customersChange >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'bg-orange-100 text-orange-600'
    },
  ] : []

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {merchant?.businessName}
          </h1>
          <p className="text-gray-600">Here's what's happening with your payments today.</p>
          {error && (
            <p className="text-sm text-amber-600 mt-1">Using demo data - {error}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
          <button
            onClick={fetchDashboardData}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View Report <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${getCurrencySymbol(merchant?.currency || 'NGN')}${v/1000}k`} />
                <Tooltip
                  formatter={(value: number) => [`${getCurrencySymbol(merchant?.currency || 'NGN')}${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {paymentMethods.map((method) => (
              <div key={method.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: method.color }}
                  />
                  <span className="text-sm text-gray-600">{method.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{method.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <a href="/transactions" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View All <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header pb-3 px-3">Transaction ID</th>
                <th className="table-header pb-3 px-3">Customer</th>
                <th className="table-header pb-3 px-3">Amount</th>
                <th className="table-header pb-3 px-3">Method</th>
                <th className="table-header pb-3 px-3">Status</th>
                <th className="table-header pb-3 px-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <span className="font-mono text-sm text-gray-900">{tx.reference}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm text-gray-900">
                        {tx.customer?.firstName && tx.customer?.lastName
                          ? `${tx.customer.firstName} ${tx.customer.lastName}`
                          : tx.customer?.email || tx.customer?.phone || 'Anonymous'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm font-medium text-gray-900">
                        {getCurrencySymbol(tx.currency)}{tx.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {methodIcons[tx.paymentMethod] || <CreditCard className="w-4 h-4 text-gray-400" />}
                        <span className="text-sm text-gray-600 capitalize">
                          {tx.paymentMethod.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`badge ${statusBadges[tx.status] || 'badge-default'} capitalize`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm text-gray-500">{formatTimeSince(tx.createdAt)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
