import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Smartphone, CreditCard, Building, Lock, ChevronRight, Loader2 } from 'lucide-react'

const paymentMethods = [
  {
    id: 'mobile_money',
    name: 'Mobile Money',
    icon: Smartphone,
    options: [
      { id: 'mpesa', name: 'M-Pesa', logo: '🇰🇪' },
      { id: 'mtn_momo', name: 'MTN MoMo', logo: '🇬🇭' },
      { id: 'airtel', name: 'Airtel Money', logo: '🌍' },
    ]
  },
  {
    id: 'card',
    name: 'Card Payment',
    icon: CreditCard,
    options: [
      { id: 'visa', name: 'Visa', logo: '💳' },
      { id: 'mastercard', name: 'Mastercard', logo: '💳' },
    ]
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: Building,
    options: [
      { id: 'bank_transfer', name: 'Bank Transfer', logo: '🏦' },
    ]
  },
]

export default function Checkout() {
  const { reference } = useParams()
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [processing, setProcessing] = useState(false)

  // Mock payment details
  const payment = {
    amount: 15000,
    currency: 'NGN',
    merchant: 'Demo Store',
    description: 'Order #12345'
  }

  const handlePay = () => {
    setProcessing(true)
    setTimeout(() => {
      navigate('/checkout/success')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">AfriPay Checkout</h1>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Pay to</span>
            <span className="font-semibold text-gray-900">{payment.merchant}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Description</span>
            <span className="text-gray-900">{payment.description}</span>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="text-2xl font-bold text-gray-900">
                ₦{payment.amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Select Payment Method</h2>
          </div>

          {paymentMethods.map((method) => (
            <div key={method.id} className="border-b border-gray-50 last:border-0">
              <button
                onClick={() => {
                  setSelectedMethod(selectedMethod === method.id ? null : method.id)
                  setSelectedOption(null)
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <method.icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{method.name}</span>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                  selectedMethod === method.id ? 'rotate-90' : ''
                }`} />
              </button>

              {selectedMethod === method.id && (
                <div className="px-4 pb-4 space-y-2">
                  {method.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedOption(option.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                        selectedOption === option.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-xl">{option.logo}</span>
                      <span className="font-medium">{option.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Phone Input for Mobile Money */}
        {selectedMethod === 'mobile_money' && selectedOption && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-2">
              You'll receive a prompt on your phone to confirm the payment
            </p>
          </div>
        )}

        {/* Card Form */}
        {selectedMethod === 'card' && selectedOption && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input type="text" placeholder="1234 5678 9012 3456" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                <input type="text" placeholder="MM/YY" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input type="text" placeholder="123" className="input" />
              </div>
            </div>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={!selectedOption || processing}
          className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Pay ₦{payment.amount.toLocaleString()}
            </>
          )}
        </button>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
          <Lock className="w-4 h-4" />
          <span>Secured by AfriPay</span>
        </div>
      </div>
    </div>
  )
}
