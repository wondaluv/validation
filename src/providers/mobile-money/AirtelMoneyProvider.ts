/**
 * AfriPay Airtel Money Provider
 * Integration with Airtel Money (Kenya, Tanzania, Uganda, Malawi, etc.)
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Currency, TransactionStatus, MobileMoneyPaymentResponse } from '../../types';
import { Logger } from '../../utils/Logger';

export interface AirtelMoneyConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

interface CollectPaymentParams {
  phone: string;
  amount: number;
  currency: Currency;
  reference: string;
  country: string;
}

interface DisbursementParams {
  phone: string;
  amount: number;
  currency: Currency;
  reference: string;
  country: string;
}

// Country-specific configurations
const COUNTRY_CONFIG: Record<string, { currency: Currency; prefix: string }> = {
  KE: { currency: Currency.KES, prefix: '254' },
  TZ: { currency: Currency.TZS, prefix: '255' },
  UG: { currency: Currency.UGX, prefix: '256' },
  RW: { currency: Currency.RWF, prefix: '250' },
  MW: { currency: Currency.MWK, prefix: '265' },
  ZM: { currency: Currency.ZMW, prefix: '260' },
  CD: { currency: Currency.CDF, prefix: '243' },
  NG: { currency: Currency.NGN, prefix: '234' }
};

export class AirtelMoneyProvider {
  private config: AirtelMoneyConfig;
  private environment: 'sandbox' | 'production';
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiry?: Date;
  private logger: Logger;

  constructor(config: AirtelMoneyConfig, environment: 'sandbox' | 'production') {
    this.config = config;
    this.environment = environment;
    this.baseUrl = environment === 'production'
      ? 'https://openapi.airtel.africa'
      : 'https://openapiuat.airtel.africa';
    this.logger = new Logger('AirtelMoneyProvider');
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/oauth2/token`,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 60) * 1000);

      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get Airtel Money access token', error as Error);
      throw new Error('Airtel Money authentication failed');
    }
  }

  /**
   * Format phone number for Airtel
   */
  private formatPhone(phone: string, country: string): string {
    let formatted = phone.replace(/\D/g, '');

    // Remove leading zeros
    formatted = formatted.replace(/^0+/, '');

    // Remove country prefix if present, then re-add correct one
    const countryConfig = COUNTRY_CONFIG[country];
    if (countryConfig) {
      if (formatted.startsWith(countryConfig.prefix)) {
        formatted = formatted.substring(countryConfig.prefix.length);
      }
    }

    return formatted;
  }

  /**
   * Collect Payment (USSD Push)
   */
  async collectPayment(params: CollectPaymentParams): Promise<MobileMoneyPaymentResponse> {
    const token = await this.getAccessToken();
    const phone = this.formatPhone(params.phone, params.country);
    const transactionId = uuidv4();

    try {
      const response = await axios.post(
        `${this.baseUrl}/merchant/v1/payments/`,
        {
          reference: params.reference,
          subscriber: {
            country: params.country,
            currency: params.currency,
            msisdn: phone
          },
          transaction: {
            amount: Math.round(params.amount),
            country: params.country,
            currency: params.currency,
            id: transactionId
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Country': params.country,
            'X-Currency': params.currency,
            'Content-Type': 'application/json'
          }
        }
      );

      const status = response.data.status;

      if (status.success || status.code === '200') {
        return {
          success: true,
          transactionId: params.reference,
          providerReference: response.data.data?.transaction?.id || transactionId,
          status: TransactionStatus.PENDING,
          message: status.message || 'Payment prompt sent',
          promptSent: true
        };
      }

      return {
        success: false,
        transactionId: params.reference,
        status: TransactionStatus.FAILED,
        message: status.message || 'Payment initiation failed'
      };
    } catch (error) {
      this.logger.error('Airtel Money collection failed', error as Error);

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          transactionId: params.reference,
          status: TransactionStatus.FAILED,
          message: error.response.data?.status?.message || 'Collection failed'
        };
      }

      throw error;
    }
  }

  /**
   * Get Payment status
   */
  async getPaymentStatus(transactionId: string, country: string): Promise<TransactionStatus> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.baseUrl}/standard/v1/payments/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Country': country,
            'Content-Type': 'application/json'
          }
        }
      );

      const status = response.data.data?.transaction?.status;

      switch (status) {
        case 'TS':
        case 'TIP':
          return TransactionStatus.SUCCESSFUL;
        case 'TF':
          return TransactionStatus.FAILED;
        case 'TA':
        case 'TXA':
          return TransactionStatus.CANCELLED;
        default:
          return TransactionStatus.PENDING;
      }
    } catch (error) {
      this.logger.error('Airtel Money status check failed', error as Error);
      return TransactionStatus.PENDING;
    }
  }

  /**
   * Disbursement (B2C)
   */
  async disbursement(params: DisbursementParams): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    const token = await this.getAccessToken();
    const phone = this.formatPhone(params.phone, params.country);
    const transactionId = uuidv4();

    try {
      const response = await axios.post(
        `${this.baseUrl}/standard/v1/disbursements/`,
        {
          payee: {
            msisdn: phone,
            wallet_type: 'NORMAL'
          },
          reference: params.reference,
          pin: '', // For sandbox; in production, use encrypted PIN
          transaction: {
            amount: Math.round(params.amount),
            id: transactionId,
            type: 'B2C'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Country': params.country,
            'X-Currency': params.currency,
            'Content-Type': 'application/json'
          }
        }
      );

      const status = response.data.status;

      if (status.success || status.code === '200') {
        return {
          success: true,
          transactionId: response.data.data?.transaction?.id || transactionId,
          message: status.message || 'Disbursement initiated'
        };
      }

      return {
        success: false,
        transactionId: params.reference,
        message: status.message || 'Disbursement failed'
      };
    } catch (error) {
      this.logger.error('Airtel Money disbursement failed', error as Error);

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          transactionId: params.reference,
          message: error.response.data?.status?.message || 'Disbursement failed'
        };
      }

      throw error;
    }
  }

  /**
   * Get disbursement status
   */
  async getDisbursementStatus(transactionId: string, country: string): Promise<TransactionStatus> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.baseUrl}/standard/v1/disbursements/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Country': country,
            'Content-Type': 'application/json'
          }
        }
      );

      const status = response.data.data?.transaction?.status;

      switch (status) {
        case 'TS':
          return TransactionStatus.SUCCESSFUL;
        case 'TF':
          return TransactionStatus.FAILED;
        case 'TA':
          return TransactionStatus.CANCELLED;
        default:
          return TransactionStatus.PROCESSING;
      }
    } catch (error) {
      this.logger.error('Airtel Money disbursement status check failed', error as Error);
      return TransactionStatus.PENDING;
    }
  }

  /**
   * Check user KYC status
   */
  async checkKYC(phone: string, country: string): Promise<{
    valid: boolean;
    firstName?: string;
    lastName?: string;
    kycStatus?: string;
  }> {
    const token = await this.getAccessToken();
    const formattedPhone = this.formatPhone(phone, country);

    try {
      const response = await axios.get(
        `${this.baseUrl}/standard/v1/users/${formattedPhone}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Country': country,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data.data;

      return {
        valid: data?.is_barred === false,
        firstName: data?.first_name,
        lastName: data?.last_name,
        kycStatus: data?.kyc_status
      };
    } catch (error) {
      this.logger.error('Airtel Money KYC check failed', error as Error);
      return { valid: false };
    }
  }

  /**
   * Process callback from Airtel
   */
  processCallback(body: Record<string, unknown>): {
    success: boolean;
    transactionId?: string;
    amount?: number;
    phone?: string;
    status?: string;
  } {
    try {
      const transaction = body.transaction as Record<string, unknown>;
      const status = transaction?.status_code as string;

      return {
        success: status === 'TS',
        transactionId: transaction?.airtel_money_id as string,
        amount: transaction?.amount as number,
        phone: (body.subscriber as Record<string, unknown>)?.msisdn as string,
        status
      };
    } catch (error) {
      this.logger.error('Error processing Airtel callback', error as Error);
      return { success: false };
    }
  }

  /**
   * Refund a payment
   */
  async refund(
    transactionId: string,
    country: string
  ): Promise<{ success: boolean; message: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/standard/v1/payments/refund`,
        {
          transaction: {
            airtel_money_id: transactionId
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Country': country,
            'Content-Type': 'application/json'
          }
        }
      );

      const status = response.data.status;

      return {
        success: status.success || status.code === '200',
        message: status.message || 'Refund processed'
      };
    } catch (error) {
      this.logger.error('Airtel Money refund failed', error as Error);
      return { success: false, message: 'Refund failed' };
    }
  }
}

export default AirtelMoneyProvider;
