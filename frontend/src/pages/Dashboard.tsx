import { useState } from 'react'
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
  CheckCircle
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

// Mock data
const revenueData = [
  { date: 'Jan 1', amount: 125000 },
  { date: 'Jan 2', amount: 198000 },
  { date: 'Jan 3', amount: 156000 },
  { date: 'Jan 4', amount: 245000 },
  { date: 'Jan 5', amount: 189000 },
  { date: 'Jan 6', amount: 312000 },
  { date: 'Jan 7', amount: 278000 },
  { date: 'Jan 8', amount: 345000 },
  { date: 'Jan 9', amount: 298000 },
  { date: 'Jan 10', amount: 412000 },
  { date: 'Jan 11', amount: 389000 },
  { date: 'Jan 12', amount: 456000 },
]

const paymentMethods = [
  { name: 'Mobile Money', value: 45, color: '#22c55e' },
  { name: 'Cards', value: 35, color: '#3b82f6' },
  { name: 'Bank Transfer', value: 15, color: '#f59e0b' },
  { name: 'USSD', value: 5, color: '#8b5cf6' },
]

const recentTransactions = [
  { id: 'TXN001', customer: 'John Doe', amount: 25000, currency: 'NGN', method: 'mpesa', status: 'successful', time: '2 mins ago' },
  { id: 'TXN002', customer: 'Jane Smith', amount: 150, currency: 'USD', method: 'visa', status: 'successful', time: '5 mins ago' },
  { id: 'TXN003', customer: 'Bob Wilson', amount: 5000, currency: 'KES', method: 'mtn_momo', status: 'pending', time: '8 mins ago' },
  { id: 'TXN004', customer: 'Alice Brown', amount: 75000, currency: 'NGN', method: 'bank', status: 'successful', time: '12 mins ago' },
  { id: 'TXN005', customer: 'Charlie Davis', amount: 300, currency: 'GHS', method: 'mastercard', status: 'failed', time: '15 mins ago' },
]

const methodIcons: Record<string, React.ReactNode> = {
  mpesa: <Smartphone className="w-4 h-4 text-green-600" />,
  mtn_momo: <Smartphone className="w-4 h-4 text-yellow-600" />,
  visa: <CreditCard className="w-4 h-4 text-blue-600" />,
  mastercard: <CreditCard className="w-4 h-4 text-red-600" />,
  bank: <Building className="w-4 h-4 text-gray-600" />,
}

const statusBadges: Record<string, string> = {
  successful: 'badge-success',
  pending: 'badge-warning',
  failed: 'badge-error',
}

export default function Dashboard() {
  const { merchant } = useAuth()
  const [timeRange, setTimeRange] = useState('7d')

  const stats = [
    {
      name: 'Total Revenue',
      value: '₦2,450,000',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Transactions',
      value: '1,234',
      change: '+8.2%',
      trend: 'up',
      icon: ArrowLeftRight,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Success Rate',
      value: '98.5%',
      change: '+0.5%',
      trend: 'up',
      icon: CheckCircle,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Active Customers',
      value: '5,678',
      change: '-2.1%',
      trend: 'down',
      icon: Users,
      color: 'bg-orange-100 text-orange-600'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {merchant?.businessName}
          </h1>
          <p className="text-gray-600">Here's what's happening with your payments today.</p>
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
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
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
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₦${v/1000}k`} />
                <Tooltip
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
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
          <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View All <ArrowUpRight className="w-4 h-4" />
          </button>
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
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <span className="font-mono text-sm text-gray-900">{tx.id}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-gray-900">{tx.customer}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm font-medium text-gray-900">
                      {tx.currency === 'NGN' ? '₦' : tx.currency === 'USD' ? '$' : tx.currency === 'KES' ? 'KSh' : '₵'}
                      {tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {methodIcons[tx.method]}
                      <span className="text-sm text-gray-600 capitalize">
                        {tx.method.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`badge ${statusBadges[tx.status]} capitalize`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-gray-500">{tx.time}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
