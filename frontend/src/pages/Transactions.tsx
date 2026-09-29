import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  CreditCard,
  Smartphone,
  Building,
  AlertCircle
} from 'lucide-react'
import { transactionsApi } from '../services/api'

interface Transaction {
  id: string
  reference: string
  customer?: {
    firstName?: string
    lastName?: string
    email?: string
    phone: string
  }
  amount: number
  currency: string
  fee?: number
  paymentMethod: string
  status: string
  createdAt: string
  metadata?: Record<string, unknown>
}

const methodIcons: Record<string, React.ReactNode> = {
  mpesa: <Smartphone className="w-4 h-4 text-green-600" />,
  mtn_momo: <Smartphone className="w-4 h-4 text-yellow-600" />,
  airtel_money: <Smartphone className="w-4 h-4 text-red-600" />,
  orange_money: <Smartphone className="w-4 h-4 text-orange-600" />,
  visa: <CreditCard className="w-4 h-4 text-blue-600" />,
  mastercard: <CreditCard className="w-4 h-4 text-red-600" />,
  verve: <CreditCard className="w-4 h-4 text-green-600" />,
  card: <CreditCard className="w-4 h-4 text-gray-600" />,
  bank_transfer: <Building className="w-4 h-4 text-gray-600" />,
}

const statusStyles: Record<string, string> = {
  successful: 'badge-success',
  completed: 'badge-success',
  pending: 'badge-warning',
  processing: 'badge-warning',
  failed: 'badge-error',
}

const currencySymbols: Record<string, string> = {
  NGN: '₦', KES: 'KSh', GHS: '₵', ZAR: 'R', TZS: 'TSh',
  UGX: 'USh', RWF: 'FRw', ETB: 'Br', ZMW: 'K', XOF: 'CFA',
  XAF: 'FCFA', USD: '$', EUR: '€', GBP: '£'
}

const generateMockTransactions = (): Transaction[] => {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `TXN${String(i + 1).padStart(6, '0')}`,
    reference: `AP_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    customer: {
      firstName: ['John', 'Jane', 'Bob', 'Alice', 'Charlie'][i % 5],
      lastName: ['Doe', 'Smith', 'Wilson', 'Brown', 'Davis'][i % 5],
      email: `customer${i + 1}@example.com`,
      phone: `+234${Math.floor(Math.random() * 9000000000 + 1000000000)}`
    },
    amount: Math.floor(Math.random() * 500000) + 1000,
    currency: ['NGN', 'KES', 'GHS', 'USD'][i % 4],
    fee: Math.floor(Math.random() * 5000) + 100,
    paymentMethod: ['mpesa', 'mtn_momo', 'card', 'card', 'bank_transfer'][i % 5],
    status: ['successful', 'successful', 'successful', 'pending', 'failed'][i % 5],
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }))
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const itemsPerPage = 10

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: Record<string, unknown> = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      }

      if (statusFilter !== 'all') params.status = statusFilter
      if (methodFilter !== 'all') params.paymentMethod = methodFilter

      const response = await transactionsApi.getAll(params as Parameters<typeof transactionsApi.getAll>[0])

      if (response.transactions) {
        setTransactions(response.transactions)
        setTotalTransactions(response.total || response.transactions.length)
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError('Unable to load transactions from API')
      const mockData = generateMockTransactions()
      setTransactions(mockData)
      setTotalTransactions(mockData.length)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, statusFilter, methodFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const filteredTransactions = transactions.filter(tx => {
    if (search) {
      const searchLower = search.toLowerCase()
      const customerName = `${tx.customer?.firstName || ''} ${tx.customer?.lastName || ''}`.toLowerCase()
      if (!tx.reference.toLowerCase().includes(searchLower) && !customerName.includes(searchLower)) {
        return false
      }
    }
    return true
  })

  const totalPages = Math.ceil((error ? filteredTransactions.length : totalTransactions) / itemsPerPage)
  const displayedTransactions = error
    ? filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredTransactions

  const exportCSV = () => {
    const headers = ['Reference', 'Customer', 'Email', 'Amount', 'Currency', 'Method', 'Status', 'Date']
    const rows = transactions.map(tx => [
      tx.reference,
      `${tx.customer?.firstName || ''} ${tx.customer?.lastName || ''}`.trim(),
      tx.customer?.email || '',
      tx.amount,
      tx.currency,
      tx.paymentMethod,
      tx.status,
      new Date(tx.createdAt).toISOString()
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">View and manage all payment transactions.</p>
          {error && (
            <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Using demo data - {error}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTransactions}
            className="btn-secondary flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
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
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="input w-auto"
            >
              <option value="all">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
              className="input w-auto"
            >
              <option value="all">All Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="mtn_momo">MTN MoMo</option>
              <option value="airtel_money">Airtel Money</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : (
          <>
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
                  {displayedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    displayedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm text-gray-900">
                            {tx.reference.length > 18 ? `${tx.reference.slice(0, 18)}...` : tx.reference}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {tx.customer?.firstName && tx.customer?.lastName
                                ? `${tx.customer.firstName} ${tx.customer.lastName}`
                                : tx.customer?.email || tx.customer?.phone || 'Anonymous'}
                            </p>
                            {tx.customer?.email && (
                              <p className="text-xs text-gray-500">{tx.customer.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-semibold text-gray-900">
                            {currencySymbols[tx.currency] || tx.currency}{tx.amount.toLocaleString()}
                          </p>
                          {tx.fee !== undefined && (
                            <p className="text-xs text-gray-500">
                              Fee: {currencySymbols[tx.currency] || tx.currency}{tx.fee}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {methodIcons[tx.paymentMethod] || <CreditCard className="w-4 h-4 text-gray-400" />}
                            <span className="text-sm text-gray-600 capitalize">
                              {tx.paymentMethod.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`badge ${statusStyles[tx.status] || 'badge-default'} capitalize`}>
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
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {displayedTransactions.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, error ? filteredTransactions.length : totalTransactions)} of{' '}
                  {error ? filteredTransactions.length : totalTransactions} transactions
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page = i + 1
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        page = currentPage - 2 + i
                      }
                      if (currentPage > totalPages - 2) {
                        page = totalPages - 4 + i
                      }
                    }
                    return page
                  }).filter(p => p > 0 && p <= totalPages).map((page) => (
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
            )}
          </>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Transaction Details</h2>
                <button onClick={() => setSelectedTx(null)} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono text-sm text-right max-w-[200px] break-all">{selectedTx.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold">
                  {currencySymbols[selectedTx.currency] || selectedTx.currency}{selectedTx.amount.toLocaleString()}
                </span>
              </div>
              {selectedTx.fee !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fee</span>
                    <span>{currencySymbols[selectedTx.currency] || selectedTx.currency}{selectedTx.fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Net Amount</span>
                    <span className="font-semibold">
                      {currencySymbols[selectedTx.currency] || selectedTx.currency}
                      {(selectedTx.amount - (selectedTx.fee || 0)).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`badge ${statusStyles[selectedTx.status] || 'badge-default'} capitalize`}>
                  {selectedTx.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method</span>
                <div className="flex items-center gap-2">
                  {methodIcons[selectedTx.paymentMethod] || <CreditCard className="w-4 h-4" />}
                  <span className="capitalize">{selectedTx.paymentMethod.replace(/_/g, ' ')}</span>
                </div>
              </div>
              {selectedTx.customer && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer</span>
                    <span>
                      {selectedTx.customer.firstName && selectedTx.customer.lastName
                        ? `${selectedTx.customer.firstName} ${selectedTx.customer.lastName}`
                        : 'N/A'}
                    </span>
                  </div>
                  {selectedTx.customer.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <span>{selectedTx.customer.email}</span>
                    </div>
                  )}
                  {selectedTx.customer.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <span>{selectedTx.customer.phone}</span>
                    </div>
                  )}
                </>
              )}
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
