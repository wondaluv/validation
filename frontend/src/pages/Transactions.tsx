import { useState } from 'react'
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  CreditCard,
  Smartphone,
  Building
} from 'lucide-react'

// Mock transactions data
const transactions = Array.from({ length: 50 }, (_, i) => ({
  id: `TXN${String(i + 1).padStart(6, '0')}`,
  reference: `AP_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
  customer: {
    name: ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis'][i % 5],
    email: `customer${i + 1}@example.com`,
    phone: `+234${Math.floor(Math.random() * 9000000000 + 1000000000)}`
  },
  amount: Math.floor(Math.random() * 500000) + 1000,
  currency: ['NGN', 'KES', 'GHS', 'USD'][i % 4],
  fee: Math.floor(Math.random() * 5000) + 100,
  method: ['mpesa', 'mtn_momo', 'visa', 'mastercard', 'bank_transfer'][i % 5],
  status: ['successful', 'successful', 'successful', 'pending', 'failed'][i % 5],
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
}))

const methodIcons: Record<string, React.ReactNode> = {
  mpesa: <Smartphone className="w-4 h-4 text-green-600" />,
  mtn_momo: <Smartphone className="w-4 h-4 text-yellow-600" />,
  visa: <CreditCard className="w-4 h-4 text-blue-600" />,
  mastercard: <CreditCard className="w-4 h-4 text-red-600" />,
  bank_transfer: <Building className="w-4 h-4 text-gray-600" />,
}

const statusStyles: Record<string, string> = {
  successful: 'badge-success',
  pending: 'badge-warning',
  failed: 'badge-error',
}

const currencySymbols: Record<string, string> = {
  NGN: '₦',
  KES: 'KSh',
  GHS: '₵',
  USD: '$',
}

export default function Transactions() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTx, setSelectedTx] = useState<typeof transactions[0] | null>(null)

  const itemsPerPage = 10
  const filtered = transactions.filter(tx => {
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false
    if (methodFilter !== 'all' && tx.method !== methodFilter) return false
    if (search && !tx.reference.toLowerCase().includes(search.toLowerCase()) &&
        !tx.customer.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">View and manage all payment transactions.</p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="mtn_momo">MTN MoMo</option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="table-header py-3 px-4">Reference</th>
                <th className="table-header py-3 px-4">Customer</th>
                <th className="table-header py-3 px-4">Amount</th>
                <th className="table-header py-3 px-4">Method</th>
                <th className="table-header py-3 px-4">Status</th>
                <th className="table-header py-3 px-4">Date</th>
                <th className="table-header py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="font-mono text-sm text-gray-900">{tx.reference.slice(0, 18)}...</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.customer.name}</p>
                      <p className="text-xs text-gray-500">{tx.customer.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {currencySymbols[tx.currency]}{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Fee: {currencySymbols[tx.currency]}{tx.fee}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {methodIcons[tx.method]}
                      <span className="text-sm text-gray-600 capitalize">{tx.method.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`badge ${statusStyles[tx.status]} capitalize`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {tx.status === 'successful' && (
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Transaction Details</h2>
                <button onClick={() => setSelectedTx(null)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono text-sm">{selectedTx.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold">{currencySymbols[selectedTx.currency]}{selectedTx.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fee</span>
                <span>{currencySymbols[selectedTx.currency]}{selectedTx.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Net Amount</span>
                <span className="font-semibold">{currencySymbols[selectedTx.currency]}{(selectedTx.amount - selectedTx.fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`badge ${statusStyles[selectedTx.status]} capitalize`}>{selectedTx.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span>{selectedTx.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span>{selectedTx.customer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{new Date(selectedTx.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              {selectedTx.status === 'successful' && (
                <button className="btn-secondary flex-1">Refund</button>
              )}
              <button onClick={() => setSelectedTx(null)} className="btn-primary flex-1">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
