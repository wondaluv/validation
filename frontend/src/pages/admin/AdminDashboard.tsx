import { Users, ArrowLeftRight, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const volumeData = [
  { date: 'Jan 1', amount: 12500000 },
  { date: 'Jan 2', amount: 19800000 },
  { date: 'Jan 3', amount: 15600000 },
  { date: 'Jan 4', amount: 24500000 },
  { date: 'Jan 5', amount: 18900000 },
  { date: 'Jan 6', amount: 31200000 },
  { date: 'Jan 7', amount: 27800000 },
]

const stats = [
  { name: 'Total Merchants', value: '1,234', change: '+12%', icon: Users, color: 'bg-blue-500' },
  { name: 'Total Transactions', value: '45,678', change: '+8%', icon: ArrowLeftRight, color: 'bg-green-500' },
  { name: 'Total Volume', value: '₦2.4B', change: '+15%', icon: DollarSign, color: 'bg-purple-500' },
  { name: 'Platform Fees', value: '₦36M', change: '+10%', icon: TrendingUp, color: 'bg-orange-500' },
]

const recentActivity = [
  { type: 'merchant', message: 'New merchant registered: Tech Solutions Ltd', time: '2 mins ago' },
  { type: 'alert', message: 'High-risk transaction flagged for review', time: '5 mins ago' },
  { type: 'transaction', message: 'Large payout processed: ₦5,000,000', time: '10 mins ago' },
  { type: 'merchant', message: 'Merchant verified: Afro Commerce', time: '15 mins ago' },
  { type: 'alert', message: 'Unusual activity detected for merchant #1234', time: '20 mins ago' },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-green-400 text-sm font-medium">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-6">Transaction Volume</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₦${v/1000000}M`} />
                <Tooltip
                  formatter={(value: number) => [`₦${(value/1000000).toFixed(1)}M`, 'Volume']}
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'alert' ? 'bg-red-500' : activity.type === 'merchant' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <div>
                  <p className="text-sm text-gray-300">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h2 className="text-lg font-semibold text-white">Pending Reviews</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">12</p>
            <p className="text-sm text-gray-400">High-risk transactions</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">5</p>
            <p className="text-sm text-gray-400">Pending verifications</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">3</p>
            <p className="text-sm text-gray-400">Dispute cases</p>
          </div>
        </div>
      </div>
    </div>
  )
}
