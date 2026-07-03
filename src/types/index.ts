/**
 * AfriPay - African Payment Processing Platform
 * Core Types and Interfaces
 */

// ============================================
// ENUMS
// ============================================

export enum PaymentMethod {
  // Mobile Money
  MPESA = 'mpesa',
  MTN_MOMO = 'mtn_momo',
  AIRTEL_MONEY = 'airtel_money',
  ORANGE_MONEY = 'orange_money',
  TIGOPESA = 'tigopesa',
  ECOCASH = 'ecocash',

  // Cards
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  VERVE = 'verve',
  AMEX = 'amex',

  // Bank
  BANK_TRANSFER = 'bank_transfer',
  USSD = 'ussd',

  // Wallets
  AFRIPAY_WALLET = 'afripay_wallet'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  DISPUTED = 'disputed',
  EXPIRED = 'expired'
}

export enum TransactionType {
  PAYMENT = 'payment',
  PAYOUT = 'payout',
  TRANSFER = 'transfer',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit'
}

export enum Currency {
  // West Africa
  NGN = 'NGN', // Nigerian Naira
  GHS = 'GHS', // Ghanaian Cedi
  XOF = 'XOF', // CFA Franc (West)

  // East Africa
  KES = 'KES', // Kenyan Shilling
  TZS = 'TZS', // Tanzanian Shilling
  UGX = 'UGX', // Ugandan Shilling
  RWF = 'RWF', // Rwandan Franc
  ETB = 'ETB', // Ethiopian Birr

  // Southern Africa
  ZAR = 'ZAR', // South African Rand
  ZMW = 'ZMW', // Zambian Kwacha
  BWP = 'BWP', // Botswana Pula
  MWK = 'MWK', // Malawian Kwacha
  ZWL = 'ZWL', // Zimbabwean Dollar

  // Central Africa
  XAF = 'XAF', // CFA Franc (Central)
  CDF = 'CDF', // Congolese Franc

  // North Africa
  EGP = 'EGP', // Egyptian Pound
  MAD = 'MAD', // Moroccan Dirham

  // International
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP'
}

export enum Country {
  NIGERIA = 'NG',
  KENYA = 'KE',
  GHANA = 'GH',
  SOUTH_AFRICA = 'ZA',
  TANZANIA = 'TZ',
  UGANDA = 'UG',
  RWANDA = 'RW',
  ETHIOPIA = 'ET',
  ZAMBIA = 'ZM',
  ZIMBABWE = 'ZW',
  BOTSWANA = 'BW',
  CAMEROON = 'CM',
  COTE_DIVOIRE = 'CI',
  SENEGAL = 'SN',
  EGYPT = 'EG',
  MOROCCO = 'MA',
  DRC = 'CD',
  MALAWI = 'MW'
}

export enum WebhookEvent {
  PAYMENT_SUCCESSFUL = 'payment.successful',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_PENDING = 'payment.pending',
  REFUND_SUCCESSFUL = 'refund.successful',
  REFUND_FAILED = 'refund.failed',
  PAYOUT_SUCCESSFUL = 'payout.successful',
  PAYOUT_FAILED = 'payout.failed',
  TRANSFER_SUCCESSFUL = 'transfer.successful',
  TRANSFER_FAILED = 'transfer.failed',
  DISPUTE_CREATED = 'dispute.created',
  DISPUTE_RESOLVED = 'dispute.resolved',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled'
}

// ============================================
// INTERFACES - Core Entities
// ============================================

export interface Merchant {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  country: Country;
  currency: Currency;
  apiKey: string;
  secretKey: string;
  webhookUrl?: string;
  webhookSecret?: string;
  isLive: boolean;
  isVerified: boolean;
  settings: MerchantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchantSettings {
  allowedPaymentMethods: PaymentMethod[];
  allowedCurrencies: Currency[];
  autoSettlement: boolean;
  settlementSchedule: 'instant' | 'daily' | 'weekly';
  minimumPayout: number;
  chargebackEmail?: string;
  supportEmail?: string;
}

export interface Customer {
  id: string;
  merchantId: string;
  email?: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  country: Country;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  reference: string;
  merchantId: string;
  customerId?: string;
  type: TransactionType;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: Currency;
  fee: number;
  netAmount: number;
  exchangeRate?: number;
  originalAmount?: number;
  originalCurrency?: Currency;
  description?: string;
  metadata?: Record<string, unknown>;
  providerReference?: string;
  providerResponse?: Record<string, unknown>;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============================================
// INTERFACES - Payment Requests
// ============================================

export interface InitializePaymentRequest {
  amount: number;
  currency: Currency;
  email?: string;
  phone: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  description?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface InitializePaymentResponse {
  success: boolean;
  message: string;
  data?: {
    reference: string;
    transactionId: string;
    authorizationUrl?: string;
    ussdCode?: string;
    qrCode?: string;
    paymentInstructions?: string;
    expiresAt?: Date;
  };
  error?: PaymentError;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    transaction: Transaction;
    customer?: Customer;
  };
  error?: PaymentError;
}

export interface PaymentError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// INTERFACES - Mobile Money
// ============================================

export interface MobileMoneyPaymentRequest {
  amount: number;
  currency: Currency;
  phone: string;
  provider: PaymentMethod;
  reference: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface MobileMoneyPaymentResponse {
  success: boolean;
  transactionId: string;
  providerReference?: string;
  status: TransactionStatus;
  message: string;
  ussdCode?: string;
  promptSent?: boolean;
}

export interface MobileMoneyCallbackPayload {
  transactionId: string;
  providerReference: string;
  status: 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  phone: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================
// INTERFACES - Card Payments
// ============================================

export interface CardPaymentRequest {
  amount: number;
  currency: Currency;
  card?: CardDetails;
  cardToken?: string;
  email: string;
  reference: string;
  saveCard?: boolean;
  is3DSecure?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CardDetails {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  billingAddress?: BillingAddress;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: Country;
}

export interface CardPaymentResponse {
  success: boolean;
  transactionId: string;
  status: TransactionStatus;
  authorizationUrl?: string;
  cardToken?: string;
  message: string;
}

export interface TokenizedCard {
  token: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  brand: string;
  bank?: string;
  country?: Country;
  isReusable: boolean;
}

// ============================================
// INTERFACES - Payouts
// ============================================

export interface PayoutRequest {
  amount: number;
  currency: Currency;
  recipient: PayoutRecipient;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PayoutRecipient {
  type: 'mobile_money' | 'bank_account';
  // Mobile Money
  phone?: string;
  provider?: PaymentMethod;
  // Bank Account
  accountNumber?: string;
  bankCode?: string;
  accountName?: string;
  // Common
  country: Country;
}

export interface PayoutResponse {
  success: boolean;
  transactionId: string;
  reference: string;
  status: TransactionStatus;
  message: string;
  estimatedArrival?: Date;
}

// ============================================
// INTERFACES - Webhooks
// ============================================

export interface WebhookPayload {
  event: WebhookEvent;
  data: {
    transaction?: Transaction;
    customer?: Customer;
    merchant?: Partial<Merchant>;
    metadata?: Record<string, unknown>;
  };
  timestamp: Date;
  signature: string;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
}

// ============================================
// INTERFACES - Currency Exchange
// ============================================

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: Date;
  source: string;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: Currency;
  convertedAmount: number;
  convertedCurrency: Currency;
  exchangeRate: number;
  fee: number;
  timestamp: Date;
}

// ============================================
// INTERFACES - Settlements
// ============================================

export interface Settlement {
  id: string;
  merchantId: string;
  amount: number;
  currency: Currency;
  fee: number;
  netAmount: number;
  transactionCount: number;
  transactions: string[]; // Transaction IDs
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankAccount?: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: Date;
  processedAt?: Date;
}

// ============================================
// INTERFACES - Provider Configuration
// ============================================

export interface ProviderConfig {
  name: string;
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  webhookSecret?: string;
  environment: 'sandbox' | 'production';
  supportedCountries: Country[];
  supportedCurrencies: Currency[];
}

export interface MpesaConfig extends ProviderConfig {
  shortCode: string;
  passKey: string;
  consumerKey: string;
  consumerSecret: string;
  initiatorName: string;
  initiatorPassword: string;
}

export interface MtnMomoConfig extends ProviderConfig {
  subscriptionKey: string;
  userId: string;
  targetEnvironment: string;
  callbackHost: string;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isMobileMoneyMethod(method: PaymentMethod): boolean {
  return [
    PaymentMethod.MPESA,
    PaymentMethod.MTN_MOMO,
    PaymentMethod.AIRTEL_MONEY,
    PaymentMethod.ORANGE_MONEY,
    PaymentMethod.TIGOPESA,
    PaymentMethod.ECOCASH
  ].includes(method);
}

export function isCardMethod(method: PaymentMethod): boolean {
  return [
    PaymentMethod.VISA,
    PaymentMethod.MASTERCARD,
    PaymentMethod.VERVE,
    PaymentMethod.AMEX
  ].includes(method);
}

export function getCountryCurrency(country: Country): Currency {
  const mapping: Record<Country, Currency> = {
    [Country.NIGERIA]: Currency.NGN,
    [Country.KENYA]: Currency.KES,
    [Country.GHANA]: Currency.GHS,
    [Country.SOUTH_AFRICA]: Currency.ZAR,
    [Country.TANZANIA]: Currency.TZS,
    [Country.UGANDA]: Currency.UGX,
    [Country.RWANDA]: Currency.RWF,
    [Country.ETHIOPIA]: Currency.ETB,
    [Country.ZAMBIA]: Currency.ZMW,
    [Country.ZIMBABWE]: Currency.ZWL,
    [Country.BOTSWANA]: Currency.BWP,
    [Country.CAMEROON]: Currency.XAF,
    [Country.COTE_DIVOIRE]: Currency.XOF,
    [Country.SENEGAL]: Currency.XOF,
    [Country.EGYPT]: Currency.EGP,
    [Country.MOROCCO]: Currency.MAD,
    [Country.DRC]: Currency.CDF,
    [Country.MALAWI]: Currency.MWK
  };
  return mapping[country];
}
