import { useState } from 'react'
import { Search, CheckCircle, XCircle, Clock, Eye, MoreVertical } from 'lucide-react'

const merchants = Array.from({ length: 20 }, (_, i) => ({
  id: `MER${String(i + 1).padStart(5, '0')}`,
  businessName: ['Tech Solutions Ltd', 'Afro Commerce', 'Lagos Ventures', 'Nairobi Traders', 'Accra Imports'][i % 5],
  email: `merchant${i + 1}@example.com`,
  country: ['Nigeria', 'Kenya', 'Ghana', 'South Africa'][i % 4],
  status: ['verified', 'verified', 'pending', 'verified', 'suspended'][i % 5],
  isLive: i % 3 === 0,
  transactions: Math.floor(Math.random() * 10000),
  volume: Math.floor(Math.random() * 100000000),
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
}))

const statusStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  verified: { bg: 'bg-green-500/20', text: 'text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <Clock className="w-4 h-4" /> },
  suspended: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <XCircle className="w-4 h-4" /> },
}

export default function AdminMerchants() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = merchants.filter(m => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false
    if (search && !m.businessName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Merchants</h1>
        <p className="text-gray-400">Manage all registered merchants</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search merchants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Merchant</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Country</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Mode</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Volume</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Joined</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-gray-700/50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-white">{merchant.businessName}</p>
                      <p className="text-sm text-gray-500">{merchant.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{merchant.country}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[merchant.status].bg} ${statusStyles[merchant.status].text}`}>
                      {statusStyles[merchant.status].icon}
                      {merchant.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${merchant.isLive ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
                      {merchant.isLive ? 'Live' : 'Test'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-300">₦{(merchant.volume / 1000000).toFixed(1)}M</td>
                  <td className="py-4 px-4 text-gray-500 text-sm">
                    {new Date(merchant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
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
