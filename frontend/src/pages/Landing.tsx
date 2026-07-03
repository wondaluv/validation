import { Link } from 'react-router-dom'
import {
  CreditCard,
  Smartphone,
  Globe,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  Check
} from 'lucide-react'

const features = [
  {
    icon: Smartphone,
    title: 'Mobile Money',
    description: 'Accept M-Pesa, MTN MoMo, Airtel Money, and more across 15+ African countries.'
  },
  {
    icon: CreditCard,
    title: 'Card Payments',
    description: 'Process Visa, Mastercard, Verve, and AMEX - both local and international cards.'
  },
  {
    icon: Globe,
    title: 'Multi-Currency',
    description: 'Support 20+ African currencies plus USD, EUR, GBP with real-time conversion.'
  },
  {
    icon: Shield,
    title: 'Secure & Compliant',
    description: 'PCI DSS Level 1 compliant with advanced fraud detection and prevention.'
  },
  {
    icon: Zap,
    title: 'Instant Payouts',
    description: 'Disburse funds to mobile money wallets and bank accounts in real-time.'
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track transactions, revenue, and customer insights in real-time.'
  }
]

const countries = [
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'Tanzania', flag: '🇹🇿' },
  { name: 'Uganda', flag: '🇺🇬' },
  { name: 'Rwanda', flag: '🇷🇼' },
  { name: 'Cameroon', flag: '🇨🇲' },
]

const pricing = [
  { method: 'Mobile Money', fee: '1.5%', desc: 'M-Pesa, MTN MoMo, Airtel' },
  { method: 'Local Cards', fee: '1.5% + ₦100', desc: 'Visa, Mastercard, Verve' },
  { method: 'International Cards', fee: '3.9% + ₦100', desc: 'Cross-border payments' },
  { method: 'Bank Transfer', fee: '1%', desc: 'Direct bank payments' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl text-gray-900">AfriPay</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#countries" className="text-gray-600 hover:text-gray-900">Coverage</a>
              <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              The #1 Payment Gateway for Africa
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Accept Payments from{' '}
              <span className="text-primary-600">Anywhere in Africa</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              One API to accept mobile money, cards, and bank transfers.
              Enable international companies to trade with Africa seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2">
                Start Accepting Payments <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="btn-secondary text-lg px-8 py-3">
                See How It Works
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              No setup fees. No monthly fees. Pay only when you get paid.
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none"></div>
            <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Today\'s Revenue', value: '₦2,450,000', change: '+12%' },
                    { label: 'Transactions', value: '1,234', change: '+8%' },
                    { label: 'Success Rate', value: '98.5%', change: '+0.5%' },
                    { label: 'Active Customers', value: '5,678', change: '+23%' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-green-600">{stat.change}</p>
                    </div>
                  ))}
                </div>
                <div className="h-48 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
                  Transaction Chart Preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Accept Payments
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for African businesses and international companies expanding into Africa.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section id="countries" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Available Across Africa
            </h2>
            <p className="text-xl text-gray-600">
              Accept payments from customers in 18+ African countries.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {countries.map((country, index) => (
              <div key={index} className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{country.flag}</span>
                <span className="font-medium text-gray-900">{country.name}</span>
              </div>
            ))}
            <div className="bg-primary-100 px-6 py-4 rounded-xl flex items-center gap-3">
              <span className="text-primary-700 font-medium">+10 more countries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              No setup fees. No monthly fees. Pay only for successful transactions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {pricing.map((item, index) => (
              <div key={index} className="card text-center">
                <h3 className="font-semibold text-gray-900 mb-2">{item.method}</h3>
                <p className="text-3xl font-bold text-primary-600 mb-2">{item.fee}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">All plans include:</p>
            <div className="flex flex-wrap justify-center gap-6">
              {['Instant notifications', 'Fraud protection', '24/7 support', 'API access', 'Dashboard analytics'].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-primary-600" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Accepting Payments?
          </h2>
          <p className="text-xl text-primary-100 mb-10">
            Join thousands of businesses using AfriPay to accept payments from customers across Africa.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 font-semibold px-8 py-4 rounded-lg text-lg hover:bg-gray-100 transition-colors">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="font-bold text-xl text-white">AfriPay</span>
              </div>
              <p className="text-sm">
                The unified payment gateway for Africa. Accept payments from anywhere.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API Documentation</a></li>
                <li><a href="#" className="hover:text-white">SDKs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            © 2024 AfriPay. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
