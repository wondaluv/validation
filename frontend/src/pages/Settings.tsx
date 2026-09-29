import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Save, Bell, Shield, CreditCard, Globe } from 'lucide-react'

export default function Settings() {
  const { merchant } = useAuth()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences.</p>
      </div>

      {saved && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Save className="w-5 h-5" />
          Settings saved successfully!
        </div>
      )}

      {/* Business Information */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-400" />
          Business Information
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input type="text" defaultValue={merchant?.businessName} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" defaultValue={merchant?.email} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" defaultValue="+234 800 000 0000" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select defaultValue={merchant?.country} className="input">
              <option value="NG">Nigeria</option>
              <option value="KE">Kenya</option>
              <option value="GH">Ghana</option>
              <option value="ZA">South Africa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gray-400" />
          Payment Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
            <select defaultValue={merchant?.currency} className="input max-w-xs">
              <option value="NGN">Nigerian Naira (NGN)</option>
              <option value="KES">Kenyan Shilling (KES)</option>
              <option value="GHS">Ghanaian Cedi (GHS)</option>
              <option value="USD">US Dollar (USD)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accepted Payment Methods</label>
            <div className="space-y-2">
              {['Mobile Money (M-Pesa, MTN MoMo, Airtel)', 'Card Payments (Visa, Mastercard)', 'Bank Transfer', 'USSD'].map((method) => (
                <label key={method} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded" />
                  <span className="text-sm text-gray-700">{method}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Schedule</label>
            <select className="input max-w-xs">
              <option>Instant (T+0)</option>
              <option>Next Day (T+1)</option>
              <option>Weekly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-400" />
          Notifications
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Email notifications for successful payments', checked: true },
            { label: 'Email notifications for failed payments', checked: true },
            { label: 'Daily summary reports', checked: false },
            { label: 'Weekly analytics digest', checked: true },
          ].map((item) => (
            <label key={item.label} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">{item.label}</span>
              <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 text-primary-600 rounded" />
            </label>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-400" />
          Security
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" className="input max-w-md" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" className="input max-w-md" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" className="input max-w-md" placeholder="••••••••" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
            <span className="text-sm text-gray-700">Enable Two-Factor Authentication</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  )
}
