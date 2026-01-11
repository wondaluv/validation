import { Link } from 'react-router-dom'
import { CheckCircle, ArrowLeft, Download } from 'lucide-react'

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your payment has been processed successfully.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold">₦15,000</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200">
              <span className="text-gray-600">Reference</span>
              <span className="font-mono text-sm">AP_ABC123XYZ</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200">
              <span className="text-gray-600">Date</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full btn-secondary flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Download Receipt
            </button>
            <Link to="/" className="w-full btn-primary flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to Store
            </Link>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Powered by <span className="font-semibold text-primary-600">AfriPay</span>
        </p>
      </div>
    </div>
  )
}
