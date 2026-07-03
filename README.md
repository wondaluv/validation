# AfriPay - African Payment Processing Platform

A unified payment gateway for Africa that standardizes local debit/credit cards and consolidates mobile money services (M-Pesa, MTN MoMo, Airtel Money, etc.) for seamless international transactions.

## Features

### Payment Methods
- **Mobile Money**: M-Pesa (Kenya, Tanzania), MTN MoMo (Ghana, Uganda, Rwanda, Cameroon), Airtel Money, Orange Money, TigoPesa, EcoCash
- **Card Payments**: Visa, Mastercard, Verve, AMEX (local and international)
- **Bank Transfers**: Direct bank transfers, USSD payments
- **Multi-Currency**: Support for 20+ African currencies plus USD, EUR, GBP

### Core Capabilities
- Merchant onboarding and API key management
- Real-time currency conversion
- Transaction fee calculation
- Webhook notifications
- Fraud detection and prevention
- PCI DSS compliant card handling
- Refund processing
- Payout/disbursement support

## Quick Start

### Installation

```bash
npm install afripay
```

### Basic Usage

```typescript
import { AfriPayClient } from 'afripay';

const afripay = new AfriPayClient({
  apiKey: 'pk_test_your_api_key',
  secretKey: 'sk_test_your_secret_key',
  environment: 'sandbox'
});

// Initialize a mobile money payment
const payment = await afripay.payments.initialize({
  amount: 1000,
  currency: 'KES',
  phone: '254712345678',
  paymentMethod: 'mpesa',
  description: 'Order #12345'
});

console.log(payment.reference);
// Customer receives STK push on their phone

// Verify payment
const result = await afripay.payments.verify(payment.reference);
console.log(result.status); // 'successful' | 'pending' | 'failed'
```

### Card Payment

```typescript
const cardPayment = await afripay.payments.initialize({
  amount: 5000,
  currency: 'NGN',
  email: 'customer@example.com',
  callbackUrl: 'https://yoursite.com/payment/callback'
});

// Redirect customer to authorizationUrl
console.log(cardPayment.authorizationUrl);
```

### Payout to Mobile Money

```typescript
const payout = await afripay.payouts.create({
  amount: 500,
  currency: 'GHS',
  recipient: {
    type: 'mobile_money',
    phone: '233241234567',
    provider: 'mtn_momo',
    country: 'GH'
  },
  description: 'Withdrawal'
});
```

### Bank Transfer Payout

```typescript
const bankPayout = await afripay.payouts.create({
  amount: 10000,
  currency: 'NGN',
  recipient: {
    type: 'bank_account',
    accountNumber: '0123456789',
    bankCode: '058',
    accountName: 'John Doe',
    country: 'NG'
  }
});
```

## API Reference

### Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/payments/initialize` | POST | Initialize a payment |
| `/api/v1/payments/verify/:reference` | GET | Verify payment status |
| `/api/v1/payments/:reference` | GET | Get payment details |
| `/api/v1/payments` | GET | List all payments |
| `/api/v1/payments/:reference/refund` | POST | Refund a payment |

### Payouts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/payouts` | POST | Create a payout |
| `/api/v1/payouts/:reference` | GET | Get payout status |
| `/api/v1/payouts` | GET | List all payouts |

### Merchants

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/merchants/register` | POST | Register new merchant |
| `/api/v1/merchants/login` | POST | Authenticate merchant |
| `/api/v1/merchants/me` | GET | Get merchant profile |
| `/api/v1/merchants/settings` | PUT | Update settings |
| `/api/v1/merchants/webhook` | PUT | Configure webhook |
| `/api/v1/merchants/dashboard` | GET | Get dashboard stats |

## Supported Countries & Currencies

| Country | Currency | Mobile Money | Cards |
|---------|----------|--------------|-------|
| Nigeria | NGN | - | Visa, Mastercard, Verve |
| Kenya | KES | M-Pesa, Airtel | Visa, Mastercard |
| Ghana | GHS | MTN MoMo, Airtel | Visa, Mastercard |
| South Africa | ZAR | - | Visa, Mastercard, AMEX |
| Tanzania | TZS | M-Pesa, TigoPesa, Airtel | Visa, Mastercard |
| Uganda | UGX | MTN MoMo, Airtel | Visa, Mastercard |
| Rwanda | RWF | MTN MoMo, Airtel | Visa, Mastercard |
| Cameroon | XAF | MTN MoMo, Orange | Visa, Mastercard |
| Senegal | XOF | Orange Money | Visa, Mastercard |
| Zimbabwe | ZWL | EcoCash | Visa, Mastercard |

## Webhooks

Configure webhooks to receive real-time notifications:

```typescript
// Your webhook endpoint
app.post('/webhooks/afripay', (req, res) => {
  const signature = req.headers['x-afripay-signature'];
  const event = afripay.webhooks.constructEvent(
    JSON.stringify(req.body),
    signature
  );

  switch (event.event) {
    case 'payment.successful':
      // Handle successful payment
      break;
    case 'payment.failed':
      // Handle failed payment
      break;
    case 'payout.successful':
      // Handle successful payout
      break;
  }

  res.status(200).send();
});
```

### Webhook Events

- `payment.successful` - Payment completed successfully
- `payment.failed` - Payment failed
- `payment.pending` - Payment is pending
- `refund.successful` - Refund processed
- `payout.successful` - Payout completed
- `payout.failed` - Payout failed

## Fee Structure

| Payment Method | Fee |
|----------------|-----|
| Mobile Money | 1.5% |
| Local Cards | 1.5% + NGN 100 |
| International Cards | 3.9% + NGN 100 |
| Bank Transfer | 1% + NGN 50 |
| Payouts | NGN 50 flat |

## Security

- PCI DSS Level 1 compliant
- End-to-end encryption
- Fraud detection and prevention
- Rate limiting
- IP whitelisting (optional)
- Webhook signature verification

## Environment Variables

```env
AFRIPAY_ENV=sandbox
AFRIPAY_API_VERSION=v1
AFRIPAY_BASE_URL=https://api.afripay.io
AFRIPAY_WEBHOOK_SECRET=your_webhook_secret
AFRIPAY_ENCRYPTION_KEY=your_encryption_key
AFRIPAY_JWT_SECRET=your_jwt_secret

# M-Pesa
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=

# MTN MoMo
MTN_SUBSCRIPTION_KEY=
MTN_API_KEY=
MTN_USER_ID=
MTN_CALLBACK_URL=

# Card Processor
CARD_PROCESSOR=paystack
CARD_PROCESSOR_PUBLIC_KEY=
CARD_PROCESSOR_SECRET=
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: https://docs.afripay.io
- API Status: https://status.afripay.io
- Email: support@afripay.io
