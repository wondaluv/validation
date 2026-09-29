/**
 * AfriPay Card Provider
 * Unified card payment processing for Africa
 * Supports integration with Paystack, Flutterwave, and Interswitch
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  Currency,
  TransactionStatus,
  CardDetails,
  TokenizedCard
} from '../../types';
import { Logger } from '../../utils/Logger';
import { encrypt, hashCardNumber } from '../../utils/crypto';

export interface CardProviderConfig {
  provider: 'paystack' | 'flutterwave' | 'interswitch';
  publicKey: string;
  secretKey: string;
  encryptionKey?: string;
}

interface InitiatePaymentParams {
  amount: number;
  currency: Currency;
  email: string;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  card?: CardDetails;
  cardToken?: string;
}

interface InitiatePaymentResult {
  success: boolean;
  authorizationUrl?: string;
  providerReference?: string;
  accessCode?: string;
  message: string;
}

export class CardProvider {
  private config: CardProviderConfig;
  private baseUrl: string;
  private logger: Logger;

  constructor(config: CardProviderConfig) {
    this.config = config;
    this.logger = new Logger('CardProvider');

    // Set base URL based on provider
    switch (config.provider) {
      case 'paystack':
        this.baseUrl = 'https://api.paystack.co';
        break;
      case 'flutterwave':
        this.baseUrl = 'https://api.flutterwave.com/v3';
        break;
      case 'interswitch':
        this.baseUrl = 'https://api.interswitchng.com';
        break;
    }
  }

  /**
   * Initialize a card payment
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    switch (this.config.provider) {
      case 'paystack':
        return this.initiatePaystackPayment(params);
      case 'flutterwave':
        return this.initiateFlutterwavePayment(params);
      case 'interswitch':
        return this.initiateInterswitchPayment(params);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(reference: string): Promise<{
    success: boolean;
    status: TransactionStatus;
    amount?: number;
    currency?: Currency;
    cardDetails?: Partial<TokenizedCard>;
  }> {
    switch (this.config.provider) {
      case 'paystack':
        return this.verifyPaystackPayment(reference);
      case 'flutterwave':
        return this.verifyFlutterwavePayment(reference);
      case 'interswitch':
        return this.verifyInterswitchPayment(reference);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Check transaction status
   */
  async checkStatus(reference: string): Promise<TransactionStatus> {
    const result = await this.verifyPayment(reference);
    return result.status;
  }

  /**
   * Process refund
   */
  async processRefund(transaction: { reference: string; amount: number }, amount?: number): Promise<boolean> {
    const refundAmount = amount || transaction.amount;

    switch (this.config.provider) {
      case 'paystack':
        return this.paystackRefund(transaction.reference, refundAmount);
      case 'flutterwave':
        return this.flutterwaveRefund(transaction.reference, refundAmount);
      default:
        this.logger.warn('Refund not implemented for provider', { provider: this.config.provider });
        return false;
    }
  }

  /**
   * Charge with saved card token
   */
  async chargeToken(
    token: string,
    email: string,
    amount: number,
    currency: Currency,
    reference: string
  ): Promise<{
    success: boolean;
    reference?: string;
    message: string;
  }> {
    switch (this.config.provider) {
      case 'paystack':
        return this.paystackChargeToken(token, email, amount, currency, reference);
      case 'flutterwave':
        return this.flutterwaveChargeToken(token, email, amount, currency, reference);
      default:
        throw new Error('Token charge not supported for this provider');
    }
  }

  // ==========================================
  // Paystack Implementation
  // ==========================================

  private async initiatePaystackPayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email: params.email,
          amount: Math.round(params.amount * 100), // Paystack uses kobo
          currency: params.currency,
          reference: params.reference,
          callback_url: params.callbackUrl,
          metadata: params.metadata
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status) {
        return {
          success: true,
          authorizationUrl: response.data.data.authorization_url,
          providerReference: response.data.data.reference,
          accessCode: response.data.data.access_code,
          message: 'Payment initialized'
        };
      }

      return {
        success: false,
        message: response.data.message || 'Payment initialization failed'
      };
    } catch (error) {
      this.logger.error('Paystack payment initialization failed', error as Error);
      throw error;
    }
  }

  private async verifyPaystackPayment(reference: string): Promise<{
    success: boolean;
    status: TransactionStatus;
    amount?: number;
    currency?: Currency;
    cardDetails?: Partial<TokenizedCard>;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`
          }
        }
      );

      const data = response.data.data;
      let status: TransactionStatus;

      switch (data.status) {
        case 'success':
          status = TransactionStatus.SUCCESSFUL;
          break;
        case 'failed':
          status = TransactionStatus.FAILED;
          break;
        case 'abandoned':
          status = TransactionStatus.CANCELLED;
          break;
        default:
          status = TransactionStatus.PENDING;
      }

      return {
        success: data.status === 'success',
        status,
        amount: data.amount / 100, // Convert from kobo
        currency: data.currency as Currency,
        cardDetails: data.authorization ? {
          token: data.authorization.authorization_code,
          last4: data.authorization.last4,
          expiryMonth: data.authorization.exp_month,
          expiryYear: data.authorization.exp_year,
          brand: data.authorization.brand,
          bank: data.authorization.bank,
          isReusable: data.authorization.reusable
        } : undefined
      };
    } catch (error) {
      this.logger.error('Paystack payment verification failed', error as Error);
      return { success: false, status: TransactionStatus.PENDING };
    }
  }

  private async paystackRefund(reference: string, amount: number): Promise<boolean> {
    try {
      // First get transaction ID
      const verifyResponse = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`
          }
        }
      );

      const transactionId = verifyResponse.data.data.id;

      const response = await axios.post(
        `${this.baseUrl}/refund`,
        {
          transaction: transactionId,
          amount: Math.round(amount * 100)
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.status === true;
    } catch (error) {
      this.logger.error('Paystack refund failed', error as Error);
      return false;
    }
  }

  private async paystackChargeToken(
    token: string,
    email: string,
    amount: number,
    currency: Currency,
    reference: string
  ): Promise<{ success: boolean; reference?: string; message: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/charge_authorization`,
        {
          authorization_code: token,
          email,
          amount: Math.round(amount * 100),
          currency,
          reference
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.data.status === 'success',
        reference: response.data.data.reference,
        message: response.data.message
      };
    } catch (error) {
      this.logger.error('Paystack token charge failed', error as Error);
      return { success: false, message: 'Token charge failed' };
    }
  }

  // ==========================================
  // Flutterwave Implementation
  // ==========================================

  private async initiateFlutterwavePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          tx_ref: params.reference,
          amount: params.amount,
          currency: params.currency,
          redirect_url: params.callbackUrl,
          customer: {
            email: params.email
          },
          meta: params.metadata,
          customizations: {
            title: 'AfriPay Payment'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        return {
          success: true,
          authorizationUrl: response.data.data.link,
          providerReference: params.reference,
          message: 'Payment initialized'
        };
      }

      return {
        success: false,
        message: response.data.message || 'Payment initialization failed'
      };
    } catch (error) {
      this.logger.error('Flutterwave payment initialization failed', error as Error);
      throw error;
    }
  }

  private async verifyFlutterwavePayment(reference: string): Promise<{
    success: boolean;
    status: TransactionStatus;
    amount?: number;
    currency?: Currency;
    cardDetails?: Partial<TokenizedCard>;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/verify_by_reference?tx_ref=${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`
          }
        }
      );

      const data = response.data.data;
      let status: TransactionStatus;

      switch (data.status) {
        case 'successful':
          status = TransactionStatus.SUCCESSFUL;
          break;
        case 'failed':
          status = TransactionStatus.FAILED;
          break;
        default:
          status = TransactionStatus.PENDING;
      }

      return {
        success: data.status === 'successful',
        status,
        amount: data.amount,
        currency: data.currency as Currency,
        cardDetails: data.card ? {
          token: data.card.token,
          last4: data.card.last_4digits,
          expiryMonth: data.card.expiry?.split('/')[0],
          expiryYear: data.card.expiry?.split('/')[1],
          brand: data.card.type,
          isReusable: true
        } : undefined
      };
    } catch (error) {
      this.logger.error('Flutterwave payment verification failed', error as Error);
      return { success: false, status: TransactionStatus.PENDING };
    }
  }

  private async flutterwaveRefund(reference: string, amount: number): Promise<boolean> {
    try {
      // Get transaction ID first
      const verifyResponse = await axios.get(
        `${this.baseUrl}/transactions/verify_by_reference?tx_ref=${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`
          }
        }
      );

      const transactionId = verifyResponse.data.data.id;

      const response = await axios.post(
        `${this.baseUrl}/transactions/${transactionId}/refund`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.status === 'success';
    } catch (error) {
      this.logger.error('Flutterwave refund failed', error as Error);
      return false;
    }
  }

  private async flutterwaveChargeToken(
    token: string,
    email: string,
    amount: number,
    currency: Currency,
    reference: string
  ): Promise<{ success: boolean; reference?: string; message: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/tokenized-charges`,
        {
          token,
          email,
          amount,
          currency,
          tx_ref: reference
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.status === 'success',
        reference: response.data.data?.tx_ref,
        message: response.data.message
      };
    } catch (error) {
      this.logger.error('Flutterwave token charge failed', error as Error);
      return { success: false, message: 'Token charge failed' };
    }
  }

  // ==========================================
  // Interswitch Implementation
  // ==========================================

  private async initiateInterswitchPayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    // Interswitch requires different integration approach
    // This is a simplified implementation
    try {
      const timestamp = new Date().toISOString();

      const response = await axios.post(
        `${this.baseUrl}/api/v2/quickteller/payments/initiate`,
        {
          merchantCode: this.config.publicKey,
          amount: Math.round(params.amount * 100),
          currency: params.currency,
          transactionReference: params.reference,
          customerEmail: params.email,
          redirectUrl: params.callbackUrl
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json',
            Timestamp: timestamp
          }
        }
      );

      if (response.data.responseCode === '00') {
        return {
          success: true,
          authorizationUrl: response.data.paymentUrl,
          providerReference: response.data.transactionReference,
          message: 'Payment initialized'
        };
      }

      return {
        success: false,
        message: response.data.responseMessage || 'Payment initialization failed'
      };
    } catch (error) {
      this.logger.error('Interswitch payment initialization failed', error as Error);
      throw error;
    }
  }

  private async verifyInterswitchPayment(reference: string): Promise<{
    success: boolean;
    status: TransactionStatus;
    amount?: number;
    currency?: Currency;
    cardDetails?: Partial<TokenizedCard>;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v2/quickteller/transactions/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`
          }
        }
      );

      const data = response.data;
      let status: TransactionStatus;

      switch (data.responseCode) {
        case '00':
          status = TransactionStatus.SUCCESSFUL;
          break;
        case '09':
          status = TransactionStatus.PENDING;
          break;
        default:
          status = TransactionStatus.FAILED;
      }

      return {
        success: data.responseCode === '00',
        status,
        amount: data.amount ? data.amount / 100 : undefined,
        currency: data.currency as Currency
      };
    } catch (error) {
      this.logger.error('Interswitch payment verification failed', error as Error);
      return { success: false, status: TransactionStatus.PENDING };
    }
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  /**
   * Get list of supported banks
   */
  async getBanks(country: string = 'NG'): Promise<Array<{ code: string; name: string }>> {
    if (this.config.provider === 'paystack') {
      try {
        const response = await axios.get(
          `${this.baseUrl}/bank?country=${country}`,
          {
            headers: {
              Authorization: `Bearer ${this.config.secretKey}`
            }
          }
        );

        return response.data.data.map((bank: { code: string; name: string }) => ({
          code: bank.code,
          name: bank.name
        }));
      } catch (error) {
        this.logger.error('Failed to fetch banks', error as Error);
        return [];
      }
    }

    return [];
  }

  /**
   * Resolve bank account
   */
  async resolveBankAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<{ valid: boolean; accountName?: string }> {
    if (this.config.provider === 'paystack') {
      try {
        const response = await axios.get(
          `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
          {
            headers: {
              Authorization: `Bearer ${this.config.secretKey}`
            }
          }
        );

        return {
          valid: true,
          accountName: response.data.data.account_name
        };
      } catch (error) {
        return { valid: false };
      }
    }

    return { valid: false };
  }
}

export default CardProvider;
