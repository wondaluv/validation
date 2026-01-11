import { useState } from 'react'
import { Search, Download, Eye, AlertTriangle } from 'lucide-react'

const transactions = Array.from({ length: 30 }, (_, i) => ({
  id: `TXN${String(i + 1).padStart(8, '0')}`,
  merchant: ['Tech Solutions', 'Afro Commerce', 'Lagos Ventures', 'Nairobi Traders'][i % 4],
  customer: `customer${i + 1}@example.com`,
  amount: Math.floor(Math.random() * 500000) + 1000,
  fee: Math.floor(Math.random() * 5000) + 100,
  currency: ['NGN', 'KES', 'GHS', 'USD'][i % 4],
  method: ['mpesa', 'mtn_momo', 'visa', 'mastercard', 'bank_transfer'][i % 5],
  status: ['successful', 'successful', 'successful', 'pending', 'failed'][i % 5],
  riskLevel: ['low', 'low', 'low', 'medium', 'high'][i % 5],
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
}))

const statusStyles: Record<string, string> = {
  successful: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
}

const riskStyles: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
}

const currencySymbols: Record<string, string> = { NGN: '₦', KES: 'KSh', GHS: '₵', USD: '$' }

export default function AdminTransactions() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')

  const filtered = transactions.filter(tx => {
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false
    if (riskFilter !== 'all' && tx.riskLevel !== riskFilter) return false
    if (search && !tx.id.toLowerCase().includes(search.toLowerCase()) &&
        !tx.merchant.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const highRiskCount = transactions.filter(tx => tx.riskLevel === 'high').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">All Transactions</h1>
          <p className="text-gray-400">Monitor all platform transactions</p>
        </div>
        <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Alert */}
      {highRiskCount > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-red-400">
            <span className="font-semibold">{highRiskCount} high-risk transactions</span> require review
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ID or merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Transaction ID</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Merchant</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Fee</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Risk</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Date</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.slice(0, 15).map((tx) => (
                <tr key={tx.id} className={`hover:bg-gray-700/50 ${tx.riskLevel === 'high' ? 'bg-red-900/10' : ''}`}>
                  <td className="py-4 px-4">
                    <span className="font-mono text-sm text-gray-300">{tx.id}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{tx.merchant}</td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-white">
                      {currencySymbols[tx.currency]}{tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-400">
                    {currencySymbols[tx.currency]}{tx.fee.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[tx.status]}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-sm font-medium capitalize ${riskStyles[tx.riskLevel]}`}>
                      {tx.riskLevel}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-500 text-sm">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
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
