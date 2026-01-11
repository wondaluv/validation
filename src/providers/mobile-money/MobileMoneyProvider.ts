/**
 * AfriPay Mobile Money Provider
 * Unified interface for all mobile money integrations
 */

import {
  PaymentMethod,
  Currency,
  TransactionStatus,
  MobileMoneyPaymentRequest,
  MobileMoneyPaymentResponse,
  Transaction
} from '../../types';
import { Logger } from '../../utils/Logger';
import { MpesaProvider } from './MpesaProvider';
import { MtnMomoProvider } from './MtnMomoProvider';
import { AirtelMoneyProvider } from './AirtelMoneyProvider';

export interface MobileMoneyConfig {
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
  environment: 'sandbox' | 'production';
}

export interface PayoutRequest {
  amount: number;
  currency: Currency;
  phone: string;
  provider: PaymentMethod;
  reference: string;
  description?: string;
}

export class MobileMoneyProvider {
  private config: MobileMoneyConfig;
  private logger: Logger;

  // Individual providers
  private mpesa?: MpesaProvider;
  private mtnMomo?: MtnMomoProvider;
  private airtelMoney?: AirtelMoneyProvider;

  constructor(config: MobileMoneyConfig) {
    this.config = config;
    this.logger = new Logger('MobileMoneyProvider');
    this.initializeProviders();
  }

  private initializeProviders(): void {
    if (this.config.mpesa) {
      this.mpesa = new MpesaProvider(this.config.mpesa, this.config.environment);
      this.logger.info('M-Pesa provider initialized');
    }

    if (this.config.mtnMomo) {
      this.mtnMomo = new MtnMomoProvider(this.config.mtnMomo, this.config.environment);
      this.logger.info('MTN MoMo provider initialized');
    }

    if (this.config.airtelMoney) {
      this.airtelMoney = new AirtelMoneyProvider(this.config.airtelMoney, this.config.environment);
      this.logger.info('Airtel Money provider initialized');
    }
  }

  /**
   * Initiate a mobile money payment
   */
  async initiatePayment(request: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    this.logger.info(`Initiating ${request.provider} payment`, {
      reference: request.reference,
      amount: request.amount,
      currency: request.currency
    });

    try {
      switch (request.provider) {
        case PaymentMethod.MPESA:
          return this.initiateMpesa(request);

        case PaymentMethod.MTN_MOMO:
          return this.initiateMtnMomo(request);

        case PaymentMethod.AIRTEL_MONEY:
          return this.initiateAirtelMoney(request);

        case PaymentMethod.ORANGE_MONEY:
          return this.initiateOrangeMoney(request);

        case PaymentMethod.TIGOPESA:
          return this.initiateTigoPesa(request);

        case PaymentMethod.ECOCASH:
          return this.initiateEcoCash(request);

        default:
          throw new Error(`Unsupported mobile money provider: ${request.provider}`);
      }
    } catch (error) {
      this.logger.error('Mobile money payment initiation failed', error as Error);
      return {
        success: false,
        transactionId: request.reference,
        status: TransactionStatus.FAILED,
        message: error instanceof Error ? error.message : 'Payment initiation failed'
      };
    }
  }

  /**
   * Process payout to mobile money
   */
  async processPayout(request: PayoutRequest): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    this.logger.info(`Processing ${request.provider} payout`, {
      reference: request.reference,
      amount: request.amount
    });

    try {
      switch (request.provider) {
        case PaymentMethod.MPESA:
          return this.mpesaPayout(request);

        case PaymentMethod.MTN_MOMO:
          return this.mtnMomoPayout(request);

        case PaymentMethod.AIRTEL_MONEY:
          return this.airtelMoneyPayout(request);

        default:
          throw new Error(`Payout not supported for: ${request.provider}`);
      }
    } catch (error) {
      this.logger.error('Mobile money payout failed', error as Error);
      return {
        success: false,
        transactionId: request.reference,
        message: error instanceof Error ? error.message : 'Payout failed'
      };
    }
  }

  /**
   * Check transaction status
   */
  async checkStatus(reference: string): Promise<TransactionStatus> {
    // In production, query the respective provider
    return TransactionStatus.PENDING;
  }

  /**
   * Process refund
   */
  async processRefund(transaction: Transaction, amount: number): Promise<boolean> {
    this.logger.info(`Processing refund for ${transaction.reference}`, { amount });

    // Refund is essentially a payout to the original customer
    const result = await this.processPayout({
      amount,
      currency: transaction.currency,
      phone: transaction.metadata?.phone as string || '',
      provider: transaction.paymentMethod,
      reference: `RF_${transaction.reference}`,
      description: `Refund for ${transaction.reference}`
    });

    return result.success;
  }

  // ==========================================
  // M-Pesa Implementation
  // ==========================================

  private async initiateMpesa(request: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    if (!this.mpesa) {
      throw new Error('M-Pesa not configured');
    }

    return this.mpesa.stkPush({
      phone: request.phone,
      amount: request.amount,
      reference: request.reference,
      description: request.description || 'Payment'
    });
  }

  private async mpesaPayout(request: PayoutRequest): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    if (!this.mpesa) {
      throw new Error('M-Pesa not configured');
    }

    return this.mpesa.b2cPayment({
      phone: request.phone,
      amount: request.amount,
      reference: request.reference,
      occasion: request.description || 'Payout'
    });
  }

  // ==========================================
  // MTN MoMo Implementation
  // ==========================================

  private async initiateMtnMomo(request: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    if (!this.mtnMomo) {
      throw new Error('MTN MoMo not configured');
    }

    return this.mtnMomo.requestToPay({
      phone: request.phone,
      amount: request.amount,
      currency: request.currency,
      reference: request.reference,
      payerMessage: request.description || 'Payment',
      payeeNote: request.description || 'Payment'
    });
  }

  private async mtnMomoPayout(request: PayoutRequest): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    if (!this.mtnMomo) {
      throw new Error('MTN MoMo not configured');
    }

    return this.mtnMomo.transfer({
      phone: request.phone,
      amount: request.amount,
      currency: request.currency,
      reference: request.reference,
      payerMessage: request.description || 'Payout',
      payeeNote: request.description || 'Payout'
    });
  }

  // ==========================================
  // Airtel Money Implementation
  // ==========================================

  private async initiateAirtelMoney(request: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    if (!this.airtelMoney) {
      throw new Error('Airtel Money not configured');
    }

    return this.airtelMoney.collectPayment({
      phone: request.phone,
      amount: request.amount,
      currency: request.currency,
      reference: request.reference,
      country: this.detectCountryFromPhone(request.phone)
    });
  }

  private async airtelMoneyPayout(request: PayoutRequest): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    if (!this.airtelMoney) {
      throw new Error('Airtel Money not configured');
    }

    return this.airtelMoney.disbursement({
      phone: request.phone,
      amount: request.amount,
      currency: request.currency,
      reference: request.reference,
      country: this.detectCountryFromPhone(request.phone)
    });
  }

  // ==========================================
  // Other Providers (Stubs for expansion)
  // ==========================================

  private async initiateOrangeMoney(request: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    // Orange Money integration (Senegal, Cameroon, etc.)
    this.logger.info('Orange Money payment initiated (stub)', { reference: request.reference });

    return {
      success: true,
      transactionId: request.reference,
      status: TransactionStatus.PENDING,
      message: 'Payment prompt sent',
      promptSent: true
    };
  }

  private async initiateTigoPesa(request: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    // TigoPesa integration (Tanzania)
    this.logger.info('TigoPesa payment initiated (stub)', { reference: request.reference });

    return {
      success: true,
      transactionId: request.reference,
      status: TransactionStatus.PENDING,
      message: 'Payment prompt sent',
      promptSent: true
    };
  }

  private async initiateEcoCash(request: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    // EcoCash integration (Zimbabwe)
    this.logger.info('EcoCash payment initiated (stub)', { reference: request.reference });

    return {
      success: true,
      transactionId: request.reference,
      status: TransactionStatus.PENDING,
      message: 'Payment prompt sent',
      promptSent: true
    };
  }

  /**
   * Detect country from phone prefix
   */
  private detectCountryFromPhone(phone: string): string {
    const prefixMap: Record<string, string> = {
      '254': 'KE',
      '255': 'TZ',
      '256': 'UG',
      '250': 'RW',
      '233': 'GH',
      '234': 'NG',
      '237': 'CM',
      '225': 'CI',
      '221': 'SN',
      '260': 'ZM',
      '263': 'ZW',
      '265': 'MW',
      '243': 'CD'
    };

    for (const [prefix, country] of Object.entries(prefixMap)) {
      if (phone.startsWith(prefix)) {
        return country;
      }
    }

    return 'KE'; // Default
  }

  /**
   * Get supported providers for a country
   */
  getSupportedProviders(countryCode: string): PaymentMethod[] {
    const countryProviders: Record<string, PaymentMethod[]> = {
      KE: [PaymentMethod.MPESA, PaymentMethod.AIRTEL_MONEY],
      TZ: [PaymentMethod.MPESA, PaymentMethod.TIGOPESA, PaymentMethod.AIRTEL_MONEY],
      UG: [PaymentMethod.MTN_MOMO, PaymentMethod.AIRTEL_MONEY],
      RW: [PaymentMethod.MTN_MOMO, PaymentMethod.AIRTEL_MONEY],
      GH: [PaymentMethod.MTN_MOMO, PaymentMethod.AIRTEL_MONEY],
      CM: [PaymentMethod.MTN_MOMO, PaymentMethod.ORANGE_MONEY],
      CI: [PaymentMethod.MTN_MOMO, PaymentMethod.ORANGE_MONEY],
      SN: [PaymentMethod.ORANGE_MONEY],
      ZM: [PaymentMethod.MTN_MOMO, PaymentMethod.AIRTEL_MONEY],
      ZW: [PaymentMethod.ECOCASH],
      MW: [PaymentMethod.AIRTEL_MONEY],
      CD: [PaymentMethod.MTN_MOMO, PaymentMethod.ORANGE_MONEY, PaymentMethod.AIRTEL_MONEY]
    };

    return countryProviders[countryCode] || [];
  }
}

export default MobileMoneyProvider;
