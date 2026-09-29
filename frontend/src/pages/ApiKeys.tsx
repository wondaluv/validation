import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Key, Copy, Check, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react'

export default function ApiKeys() {
  const { merchant } = useAuth()
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showRegenModal, setShowRegenModal] = useState(false)

  const apiKey = merchant?.apiKey || 'pk_test_xxxxxxxxxxxxx'
  const secretKey = 'sk_test_' + 'x'.repeat(32)

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
        <p className="text-gray-600">Manage your API keys for integration.</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-yellow-800 font-medium">Keep your keys safe!</p>
          <p className="text-sm text-yellow-700 mt-1">
            Never share your secret key or commit it to version control. Use environment variables in production.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${merchant?.isLive ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <Key className={`w-5 h-5 ${merchant?.isLive ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {merchant?.isLive ? 'Live' : 'Test'} API Keys
            </h2>
            <p className="text-sm text-gray-500">
              {merchant?.isLive ? 'These keys will process real payments.' : 'Use these keys for testing. No real money is charged.'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
            <p className="text-xs text-gray-500 mb-2">This key can be safely used in client-side code.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                readOnly
                className="input bg-gray-50 font-mono text-sm flex-1"
              />
              <button
                onClick={() => copyToClipboard(apiKey, 'public')}
                className="btn-secondary px-4"
              >
                {copied === 'public' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
            <p className="text-xs text-gray-500 mb-2">Keep this key secret. Never expose it in client-side code.</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secretKey}
                  readOnly
                  className="input bg-gray-50 font-mono text-sm pr-10"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                onClick={() => copyToClipboard(secretKey, 'secret')}
                className="btn-secondary px-4"
              >
                {copied === 'secret' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={() => setShowRegenModal(true)}
            className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate Keys
          </button>
        </div>
      </div>

      {/* Code Example */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h2>
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-100">
{`// Initialize AfriPay
import AfriPayClient from 'afripay';

const afripay = new AfriPayClient({
  apiKey: '${apiKey}',
  secretKey: process.env.AFRIPAY_SECRET_KEY,
  environment: '${merchant?.isLive ? 'production' : 'sandbox'}'
});

// Create a payment
const payment = await afripay.payments.initialize({
  amount: 1000,
  currency: 'NGN',
  phone: '+2348012345678',
  email: 'customer@example.com'
});`}
          </pre>
        </div>
      </div>

      {/* Regenerate Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold">Regenerate API Keys?</h2>
            </div>
            <p className="text-gray-600 mb-6">
              This will invalidate your current keys immediately. Any applications using the old keys will stop working.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRegenModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button className="btn-primary flex-1 bg-red-600 hover:bg-red-700">Regenerate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
