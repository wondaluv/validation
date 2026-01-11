import { useState } from 'react'
import { Webhook, Plus, Copy, Check, Trash2, TestTube, CheckCircle, XCircle } from 'lucide-react'

const webhookEvents = [
  { id: 'payment.successful', label: 'Payment Successful', description: 'When a payment is completed' },
  { id: 'payment.failed', label: 'Payment Failed', description: 'When a payment fails' },
  { id: 'refund.successful', label: 'Refund Successful', description: 'When a refund is processed' },
  { id: 'payout.successful', label: 'Payout Successful', description: 'When a payout completes' },
  { id: 'payout.failed', label: 'Payout Failed', description: 'When a payout fails' },
]

const recentDeliveries = [
  { id: 1, event: 'payment.successful', status: 'delivered', statusCode: 200, time: '2 mins ago' },
  { id: 2, event: 'payment.successful', status: 'delivered', statusCode: 200, time: '5 mins ago' },
  { id: 3, event: 'payment.failed', status: 'failed', statusCode: 500, time: '10 mins ago' },
  { id: 4, event: 'refund.successful', status: 'delivered', statusCode: 200, time: '15 mins ago' },
]

export default function Webhooks() {
  const [webhookUrl, setWebhookUrl] = useState('https://example.com/webhooks/afripay')
  const [selectedEvents, setSelectedEvents] = useState(['payment.successful', 'payment.failed'])
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)
  const [testing, setTesting] = useState(false)

  const webhookSecret = 'whsec_' + 'x'.repeat(24)

  const copySecret = () => {
    navigator.clipboard.writeText(webhookSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const testWebhook = () => {
    setTesting(true)
    setTimeout(() => setTesting(false), 2000)
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
        <p className="text-gray-600">Configure webhook endpoints to receive real-time notifications.</p>
      </div>

      {/* Webhook Configuration */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Webhook className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Webhook Endpoint</h2>
            <p className="text-sm text-gray-500">We'll send POST requests to this URL</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="input flex-1"
                placeholder="https://your-domain.com/webhooks"
              />
              <button onClick={testWebhook} disabled={testing} className="btn-secondary flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                {testing ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signing Secret</label>
            <p className="text-xs text-gray-500 mb-2">Use this secret to verify webhook signatures</p>
            <div className="flex gap-2">
              <input
                type={showSecret ? 'text' : 'password'}
                value={webhookSecret}
                readOnly
                className="input bg-gray-50 font-mono text-sm flex-1"
              />
              <button onClick={() => setShowSecret(!showSecret)} className="btn-secondary px-4">
                {showSecret ? 'Hide' : 'Show'}
              </button>
              <button onClick={copySecret} className="btn-secondary px-4">
                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Events to Send</h2>
        <div className="space-y-3">
          {webhookEvents.map((event) => (
            <label
              key={event.id}
              className="flex items-center justify-between py-3 px-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div>
                <p className="font-medium text-gray-900">{event.label}</p>
                <p className="text-sm text-gray-500">{event.description}</p>
              </div>
              <input
                type="checkbox"
                checked={selectedEvents.includes(event.id)}
                onChange={() => toggleEvent(event.id)}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Deliveries</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header pb-3 px-4">Event</th>
                <th className="table-header pb-3 px-4">Status</th>
                <th className="table-header pb-3 px-4">Response</th>
                <th className="table-header pb-3 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm">{delivery.event}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {delivery.status === 'delivered' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm capitalize">{delivery.status}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${delivery.statusCode === 200 ? 'badge-success' : 'badge-error'}`}>
                      {delivery.statusCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{delivery.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">Save Webhook Configuration</button>
      </div>
    </div>
  )
}
