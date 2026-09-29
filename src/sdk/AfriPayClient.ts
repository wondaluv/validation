/**
 * AfriPay SDK Client
 * Easy-to-use client library for integrating AfriPay into applications
 *
 * Usage:
 * ```typescript
 * const afripay = new AfriPayClient({
 *   apiKey: 'pk_test_xxx',
 *   secretKey: 'sk_test_xxx',
 *   environment: 'sandbox'
 * });
 *
 * // Initialize payment
 * const payment = await afripay.payments.initialize({
 *   amount: 1000,
 *   currency: 'NGN',
 *   phone: '2348012345678',
 *   email: 'customer@example.com'
 * });
 *
 * // Verify payment
 * const verified = await afripay.payments.verify(payment.reference);
 * ```
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { createWebhookSignature, verifyWebhookSignature } from '../utils/crypto';
import {
  Currency,
  PaymentMethod,
  TransactionStatus,
  InitializePaymentRequest,
  PayoutRequest
} from '../types';

export interface AfriPayConfig {
  apiKey: string;
  secretKey: string;
  environment?: 'sandbox' | 'production';
  baseUrl?: string;
  timeout?: number;
}

export interface AfriPayPayment {
  reference: string;
  transactionId: string;
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  paymentMethod?: PaymentMethod;
  authorizationUrl?: string;
  ussdCode?: string;
  paymentInstructions?: string;
}

export interface AfriPayPayout {
  reference: string;
  transactionId: string;
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  estimatedArrival?: Date;
}

export class AfriPayClient {
  private client: AxiosInstance;
  private config: AfriPayConfig;

  public payments: PaymentsAPI;
  public payouts: PayoutsAPI;
  public customers: CustomersAPI;
  public webhooks: WebhooksAPI;

  constructor(config: AfriPayConfig) {
    this.config = config;

    const baseURL = config.baseUrl || (
      config.environment === 'production'
        ? 'https://api.afripay.io/api/v1'
        : 'https://sandbox.afripay.io/api/v1'
    );

    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Secret-Key': config.secretKey
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          const data = error.response.data as Record<string, unknown>;
          throw new AfriPayError(
            data.message as string || 'Request failed',
            error.response.status,
            data.code as string
          );
        }
        throw new AfriPayError(error.message, 0, 'NETWORK_ERROR');
      }
    );

    // Initialize API namespaces
    this.payments = new PaymentsAPI(this.client);
    this.payouts = new PayoutsAPI(this.client);
    this.customers = new CustomersAPI(this.client);
    this.webhooks = new WebhooksAPI(config.secretKey);
  }

  /**
   * Set custom headers for requests
   */
  setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }
}

/**
 * Payments API
 */
class PaymentsAPI {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Initialize a payment
   */
  async initialize(params: {
    amount: number;
    currency: Currency;
    phone?: string;
    email?: string;
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
  }): Promise<AfriPayPayment> {
    const response = await this.client.post('/payments/initialize', params);
    return {
      reference: response.data.data.reference,
      transactionId: response.data.data.transactionId,
      status: TransactionStatus.PENDING,
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      authorizationUrl: response.data.data.authorizationUrl,
      ussdCode: response.data.data.ussdCode,
      paymentInstructions: response.data.data.paymentInstructions
    };
  }

  /**
   * Verify a payment
   */
  async verify(reference: string): Promise<{
    status: TransactionStatus;
    transaction: Record<string, unknown>;
  }> {
    const response = await this.client.get(`/payments/verify/${reference}`);
    return {
      status: response.data.data.transaction.status,
      transaction: response.data.data.transaction
    };
  }

  /**
   * Get payment details
   */
  async get(reference: string): Promise<Record<string, unknown>> {
    const response = await this.client.get(`/payments/${reference}`);
    return response.data.data.transaction;
  }

  /**
   * List payments
   */
  async list(params?: {
    status?: TransactionStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    transactions: Record<string, unknown>[];
    total: number;
  }> {
    const response = await this.client.get('/payments', { params });
    return response.data.data;
  }

  /**
   * Refund a payment
   */
  async refund(reference: string, params?: {
    amount?: number;
    reason?: string;
  }): Promise<{
    success: boolean;
    refundId?: string;
    message: string;
  }> {
    const response = await this.client.post(`/payments/${reference}/refund`, params);
    return response.data;
  }

  /**
   * Charge a saved card token
   */
  async chargeToken(params: {
    token: string;
    email: string;
    amount: number;
    currency: Currency;
    reference?: string;
  }): Promise<AfriPayPayment> {
    const response = await this.client.post('/payments/charge-token', params);
    return response.data.data;
  }
}

/**
 * Payouts API
 */
class PayoutsAPI {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Create a payout
   */
  async create(params: {
    amount: number;
    currency: Currency;
    recipient: {
      type: 'mobile_money' | 'bank_account';
      phone?: string;
      provider?: PaymentMethod;
      accountNumber?: string;
      bankCode?: string;
      accountName?: string;
      country: string;
    };
    reference?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AfriPayPayout> {
    const response = await this.client.post('/payouts', params);
    return {
      reference: response.data.reference,
      transactionId: response.data.transactionId,
      status: response.data.status,
      amount: params.amount,
      currency: params.currency,
      estimatedArrival: response.data.estimatedArrival
        ? new Date(response.data.estimatedArrival)
        : undefined
    };
  }

  /**
   * Get payout details
   */
  async get(reference: string): Promise<Record<string, unknown>> {
    const response = await this.client.get(`/payouts/${reference}`);
    return response.data.data.payout;
  }

  /**
   * List payouts
   */
  async list(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    payouts: Record<string, unknown>[];
    total: number;
  }> {
    const response = await this.client.get('/payouts', { params });
    return response.data.data;
  }

  /**
   * Get bank list for a country
   */
  async getBanks(country: string): Promise<Array<{
    code: string;
    name: string;
  }>> {
    const response = await this.client.get(`/banks?country=${country}`);
    return response.data.data;
  }

  /**
   * Resolve bank account
   */
  async resolveAccount(accountNumber: string, bankCode: string): Promise<{
    valid: boolean;
    accountName?: string;
  }> {
    const response = await this.client.get('/banks/resolve', {
      params: { account_number: accountNumber, bank_code: bankCode }
    });
    return response.data.data;
  }
}

/**
 * Customers API
 */
class CustomersAPI {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Create a customer
   */
  async create(params: {
    email?: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const response = await this.client.post('/customers', params);
    return response.data.data.customer;
  }

  /**
   * Get customer
   */
  async get(customerId: string): Promise<Record<string, unknown>> {
    const response = await this.client.get(`/customers/${customerId}`);
    return response.data.data.customer;
  }

  /**
   * List customers
   */
  async list(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    customers: Record<string, unknown>[];
    total: number;
  }> {
    const response = await this.client.get('/customers', { params });
    return response.data.data;
  }
}

/**
 * Webhooks API
 */
class WebhooksAPI {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Verify webhook signature
   */
  verify(payload: string, signature: string): boolean {
    // Parse signature header: t=timestamp,v1=signature
    const parts = signature.split(',');
    const timestamp = parseInt(parts[0]?.split('=')[1] || '0', 10);
    const sig = parts[1]?.split('=')[1] || '';

    return verifyWebhookSignature(payload, sig, this.secretKey, timestamp);
  }

  /**
   * Construct event from webhook payload
   */
  constructEvent(payload: string, signature: string): {
    event: string;
    data: Record<string, unknown>;
  } {
    if (!this.verify(payload, signature)) {
      throw new AfriPayError('Invalid webhook signature', 400, 'INVALID_SIGNATURE');
    }

    return JSON.parse(payload);
  }
}

/**
 * AfriPay Error class
 */
export class AfriPayError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'AfriPayError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export default AfriPayClient;
