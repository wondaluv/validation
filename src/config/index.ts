/**
 * AfriPay Configuration
 * Central configuration management for all payment providers
 */

import { Country, Currency, PaymentMethod } from '../types';

export interface AfriPayConfig {
  environment: 'sandbox' | 'production';
  apiVersion: string;

  // Provider Configurations
  mpesa?: {
    consumerKey: string;
    consumerSecret: string;
    shortCode: string;
    passKey: string;
    initiatorName: string;
    initiatorPassword: string;
    callbackUrl: string;
  };

  mtnMomo?: {
    subscriptionKey: string;
    apiKey: string;
    userId: string;
    targetEnvironment: string;
    callbackUrl: string;
  };

  airtelMoney?: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };

  // Card Processing
  cardProcessor?: {
    provider: 'paystack' | 'flutterwave' | 'interswitch';
    publicKey: string;
    secretKey: string;
    encryptionKey?: string;
  };

  // Platform Settings
  platform: {
    baseUrl: string;
    webhookSecret: string;
    encryptionKey: string;
    jwtSecret: string;
    jwtExpiresIn: string;
  };

  // Fee Configuration
  fees: FeeConfig;

  // Supported Countries and Currencies
  supportedCountries: Country[];
  supportedCurrencies: Currency[];
}

export interface FeeConfig {
  // Percentage fees (as decimal, e.g., 0.015 = 1.5%)
  mobileMoneyPercent: number;
  localCardPercent: number;
  internationalCardPercent: number;
  bankTransferPercent: number;

  // Flat fees (in smallest currency unit)
  mobileMoneyFlat: number;
  localCardFlat: number;
  internationalCardFlat: number;
  bankTransferFlat: number;

  // Caps (maximum fee)
  maxFeePercent: number;
  maxFeeFlat: number;

  // Payout fees
  payoutPercent: number;
  payoutFlat: number;
}

// Country-specific payment method availability
export const COUNTRY_PAYMENT_METHODS: Record<Country, PaymentMethod[]> = {
  [Country.KENYA]: [
    PaymentMethod.MPESA,
    PaymentMethod.AIRTEL_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD,
    PaymentMethod.BANK_TRANSFER
  ],
  [Country.NIGERIA]: [
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD,
    PaymentMethod.VERVE,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.USSD
  ],
  [Country.GHANA]: [
    PaymentMethod.MTN_MOMO,
    PaymentMethod.AIRTEL_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD,
    PaymentMethod.BANK_TRANSFER
  ],
  [Country.SOUTH_AFRICA]: [
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD,
    PaymentMethod.AMEX,
    PaymentMethod.BANK_TRANSFER
  ],
  [Country.TANZANIA]: [
    PaymentMethod.MPESA,
    PaymentMethod.TIGOPESA,
    PaymentMethod.AIRTEL_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.UGANDA]: [
    PaymentMethod.MTN_MOMO,
    PaymentMethod.AIRTEL_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.RWANDA]: [
    PaymentMethod.MTN_MOMO,
    PaymentMethod.AIRTEL_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.ZAMBIA]: [
    PaymentMethod.MTN_MOMO,
    PaymentMethod.AIRTEL_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.ZIMBABWE]: [
    PaymentMethod.ECOCASH,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.CAMEROON]: [
    PaymentMethod.MTN_MOMO,
    PaymentMethod.ORANGE_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.COTE_DIVOIRE]: [
    PaymentMethod.MTN_MOMO,
    PaymentMethod.ORANGE_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.SENEGAL]: [
    PaymentMethod.ORANGE_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.ETHIOPIA]: [
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.EGYPT]: [
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD,
    PaymentMethod.BANK_TRANSFER
  ],
  [Country.MOROCCO]: [
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD,
    PaymentMethod.BANK_TRANSFER
  ],
  [Country.BOTSWANA]: [
    PaymentMethod.ORANGE_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.DRC]: [
    PaymentMethod.MTN_MOMO,
    PaymentMethod.ORANGE_MONEY,
    PaymentMethod.AIRTEL_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ],
  [Country.MALAWI]: [
    PaymentMethod.AIRTEL_MONEY,
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD
  ]
};

// Mobile Money Provider phone prefixes
export const MOBILE_MONEY_PREFIXES: Record<string, { country: Country; provider: PaymentMethod }[]> = {
  // Kenya
  '254': [
    { country: Country.KENYA, provider: PaymentMethod.MPESA }, // 254 7xx
    { country: Country.KENYA, provider: PaymentMethod.AIRTEL_MONEY } // 254 73x, 78x
  ],
  // Ghana
  '233': [
    { country: Country.GHANA, provider: PaymentMethod.MTN_MOMO }, // 233 24x, 54x, 55x
    { country: Country.GHANA, provider: PaymentMethod.AIRTEL_MONEY } // 233 26x, 56x
  ],
  // Uganda
  '256': [
    { country: Country.UGANDA, provider: PaymentMethod.MTN_MOMO },
    { country: Country.UGANDA, provider: PaymentMethod.AIRTEL_MONEY }
  ],
  // Tanzania
  '255': [
    { country: Country.TANZANIA, provider: PaymentMethod.MPESA },
    { country: Country.TANZANIA, provider: PaymentMethod.TIGOPESA },
    { country: Country.TANZANIA, provider: PaymentMethod.AIRTEL_MONEY }
  ],
  // Nigeria
  '234': [
    { country: Country.NIGERIA, provider: PaymentMethod.BANK_TRANSFER }
  ]
};

// Default configuration
export const DEFAULT_CONFIG: Partial<AfriPayConfig> = {
  environment: 'sandbox',
  apiVersion: 'v1',
  fees: {
    mobileMoneyPercent: 0.015, // 1.5%
    localCardPercent: 0.015, // 1.5%
    internationalCardPercent: 0.039, // 3.9%
    bankTransferPercent: 0.01, // 1%
    mobileMoneyFlat: 0,
    localCardFlat: 100, // in smallest unit
    internationalCardFlat: 100,
    bankTransferFlat: 50,
    maxFeePercent: 0.05, // 5% cap
    maxFeeFlat: 200000, // cap in smallest unit
    payoutPercent: 0,
    payoutFlat: 50
  },
  supportedCountries: Object.values(Country),
  supportedCurrencies: Object.values(Currency)
};

// Configuration loader
export function loadConfig(): AfriPayConfig {
  const config: AfriPayConfig = {
    ...DEFAULT_CONFIG,
    environment: (process.env.AFRIPAY_ENV as 'sandbox' | 'production') || 'sandbox',
    apiVersion: process.env.AFRIPAY_API_VERSION || 'v1',

    mpesa: process.env.MPESA_CONSUMER_KEY
      ? {
          consumerKey: process.env.MPESA_CONSUMER_KEY,
          consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
          shortCode: process.env.MPESA_SHORTCODE!,
          passKey: process.env.MPESA_PASSKEY!,
          initiatorName: process.env.MPESA_INITIATOR_NAME!,
          initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD!,
          callbackUrl: process.env.MPESA_CALLBACK_URL!
        }
      : undefined,

    mtnMomo: process.env.MTN_SUBSCRIPTION_KEY
      ? {
          subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY,
          apiKey: process.env.MTN_API_KEY!,
          userId: process.env.MTN_USER_ID!,
          targetEnvironment: process.env.MTN_ENVIRONMENT || 'sandbox',
          callbackUrl: process.env.MTN_CALLBACK_URL!
        }
      : undefined,

    airtelMoney: process.env.AIRTEL_CLIENT_ID
      ? {
          clientId: process.env.AIRTEL_CLIENT_ID,
          clientSecret: process.env.AIRTEL_CLIENT_SECRET!,
          callbackUrl: process.env.AIRTEL_CALLBACK_URL!
        }
      : undefined,

    cardProcessor: process.env.CARD_PROCESSOR_SECRET
      ? {
          provider: (process.env.CARD_PROCESSOR as 'paystack' | 'flutterwave' | 'interswitch') || 'paystack',
          publicKey: process.env.CARD_PROCESSOR_PUBLIC_KEY!,
          secretKey: process.env.CARD_PROCESSOR_SECRET,
          encryptionKey: process.env.CARD_PROCESSOR_ENCRYPTION_KEY
        }
      : undefined,

    platform: {
      baseUrl: process.env.AFRIPAY_BASE_URL || 'https://api.afripay.io',
      webhookSecret: process.env.AFRIPAY_WEBHOOK_SECRET || 'default-webhook-secret',
      encryptionKey: process.env.AFRIPAY_ENCRYPTION_KEY || 'default-encryption-key',
      jwtSecret: process.env.AFRIPAY_JWT_SECRET || 'default-jwt-secret',
      jwtExpiresIn: process.env.AFRIPAY_JWT_EXPIRES || '24h'
    },

    fees: {
      ...DEFAULT_CONFIG.fees!
    },

    supportedCountries: DEFAULT_CONFIG.supportedCountries!,
    supportedCurrencies: DEFAULT_CONFIG.supportedCurrencies!
  };

  return config;
}

export default loadConfig;
