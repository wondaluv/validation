import { useState } from 'react'
import { Plus, Search, Send, Smartphone, Building, CheckCircle, Clock, XCircle } from 'lucide-react'

const payouts = [
  { id: 'PO001', recipient: 'John Doe', phone: '+234801234567', type: 'mobile_money', provider: 'MTN MoMo', amount: 50000, currency: 'NGN', status: 'successful', date: '2024-01-10' },
  { id: 'PO002', recipient: 'Jane Smith', account: '0123456789', bank: 'GTBank', type: 'bank', amount: 150000, currency: 'NGN', status: 'processing', date: '2024-01-10' },
  { id: 'PO003', recipient: 'Bob Wilson', phone: '+254712345678', type: 'mobile_money', provider: 'M-Pesa', amount: 5000, currency: 'KES', status: 'successful', date: '2024-01-09' },
  { id: 'PO004', recipient: 'Alice Brown', account: '9876543210', bank: 'Access Bank', type: 'bank', amount: 75000, currency: 'NGN', status: 'failed', date: '2024-01-09' },
]

const statusIcons: Record<string, React.ReactNode> = {
  successful: <CheckCircle className="w-4 h-4 text-green-600" />,
  processing: <Clock className="w-4 h-4 text-yellow-600" />,
  failed: <XCircle className="w-4 h-4 text-red-600" />,
}

export default function Payouts() {
  const [showModal, setShowModal] = useState(false)
  const [payoutType, setPayoutType] = useState<'mobile_money' | 'bank'>('mobile_money')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-600">Send money to mobile wallets and bank accounts.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Payout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-gray-500">Available Balance</p>
          <p className="text-2xl font-bold text-gray-900">₦1,250,000</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Total Payouts (This Month)</p>
          <p className="text-2xl font-bold text-gray-900">₦850,000</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Pending Payouts</p>
          <p className="text-2xl font-bold text-gray-900">₦75,000</p>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header pb-3 px-4">Recipient</th>
                <th className="table-header pb-3 px-4">Type</th>
                <th className="table-header pb-3 px-4">Amount</th>
                <th className="table-header pb-3 px-4">Status</th>
                <th className="table-header pb-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{payout.recipient}</p>
                      <p className="text-sm text-gray-500">
                        {payout.type === 'mobile_money' ? payout.phone : `${payout.bank} - ${payout.account}`}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {payout.type === 'mobile_money' ? (
                        <Smartphone className="w-4 h-4 text-green-600" />
                      ) : (
                        <Building className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm capitalize">
                        {payout.type === 'mobile_money' ? payout.provider : 'Bank Transfer'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold">
                      {payout.currency === 'NGN' ? '₦' : 'KSh'}{payout.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {statusIcons[payout.status]}
                      <span className="text-sm capitalize">{payout.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">{payout.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Payout Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">New Payout</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setPayoutType('mobile_money')}
                  className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 border-2 transition-colors ${
                    payoutType === 'mobile_money' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  Mobile Money
                </button>
                <button
                  onClick={() => setPayoutType('bank')}
                  className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 border-2 transition-colors ${
                    payoutType === 'bank' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200'
                  }`}
                >
                  <Building className="w-5 h-5" />
                  Bank Transfer
                </button>
              </div>

              {payoutType === 'mobile_money' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <select className="input">
                      <option>M-Pesa</option>
                      <option>MTN MoMo</option>
                      <option>Airtel Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" className="input" placeholder="+234..." />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                    <select className="input">
                      <option>GTBank</option>
                      <option>Access Bank</option>
                      <option>First Bank</option>
                      <option>UBA</option>
                      <option>Zenith Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input type="text" className="input" placeholder="0123456789" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input type="text" className="input" placeholder="John Doe" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" className="input" placeholder="10000" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
