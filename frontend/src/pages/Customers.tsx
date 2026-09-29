import { useState } from 'react'
import { Search, User, Mail, Phone, MapPin, Calendar } from 'lucide-react'

const customers = Array.from({ length: 20 }, (_, i) => ({
  id: `CUS${String(i + 1).padStart(5, '0')}`,
  name: ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis'][i % 5],
  email: `customer${i + 1}@example.com`,
  phone: `+234${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
  country: ['Nigeria', 'Kenya', 'Ghana', 'South Africa'][i % 4],
  transactions: Math.floor(Math.random() * 50) + 1,
  totalSpent: Math.floor(Math.random() * 1000000) + 10000,
  currency: ['NGN', 'KES', 'GHS', 'ZAR'][i % 4],
  lastTransaction: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
}))

const currencySymbols: Record<string, string> = { NGN: '₦', KES: 'KSh', GHS: '₵', ZAR: 'R' }

export default function Customers() {
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[0] | null>(null)

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600">Manage your customer database.</p>
      </div>

      <div className="card">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className="p-4 border border-gray-100 rounded-lg hover:border-primary-200 hover:bg-primary-50/30 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                  <p className="text-sm text-gray-500 truncate">{customer.email}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>{customer.transactions} transactions</span>
                    <span>{currencySymbols[customer.currency]}{customer.totalSpent.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Customer Details</h2>
                <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-gray-500">{selectedCustomer.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{selectedCustomer.country}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>Customer since {new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Total Transactions</p>
                  <p className="text-xl font-bold text-gray-900">{selectedCustomer.transactions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-xl font-bold text-gray-900">
                    {currencySymbols[selectedCustomer.currency]}{selectedCustomer.totalSpent.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100">
              <button onClick={() => setSelectedCustomer(null)} className="btn-primary w-full">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
