/**
 * AfriPay M-Pesa Provider
 * Integration with Safaricom M-Pesa (Kenya, Tanzania)
 */

import axios from 'axios';
import { TransactionStatus, MobileMoneyPaymentResponse } from '../../types';
import { Logger } from '../../utils/Logger';

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  passKey: string;
  initiatorName: string;
  initiatorPassword: string;
  callbackUrl: string;
}

interface StkPushRequest {
  phone: string;
  amount: number;
  reference: string;
  description: string;
}

interface B2CRequest {
  phone: string;
  amount: number;
  reference: string;
  occasion: string;
}

export class MpesaProvider {
  private config: MpesaConfig;
  private environment: 'sandbox' | 'production';
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiry?: Date;
  private logger: Logger;

  constructor(config: MpesaConfig, environment: 'sandbox' | 'production') {
    this.config = config;
    this.environment = environment;
    this.baseUrl = environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    this.logger = new Logger('MpesaProvider');
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`
    ).toString('base64');

    try {
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Token typically valid for 1 hour, refresh at 50 minutes
      this.tokenExpiry = new Date(Date.now() + 50 * 60 * 1000);

      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get M-Pesa access token', error as Error);
      throw new Error('M-Pesa authentication failed');
    }
  }

  /**
   * Generate timestamp for M-Pesa
   */
  private getTimestamp(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Generate password for STK push
   */
  private generatePassword(timestamp: string): string {
    const data = `${this.config.shortCode}${this.config.passKey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Format phone number for M-Pesa
   */
  private formatPhone(phone: string): string {
    let formatted = phone.replace(/\D/g, '');

    // Remove leading zeros
    formatted = formatted.replace(/^0+/, '');

    // Add country code if missing
    if (!formatted.startsWith('254')) {
      formatted = '254' + formatted;
    }

    return formatted;
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa)
   */
  async stkPush(request: StkPushRequest): Promise<MobileMoneyPaymentResponse> {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generatePassword(timestamp);
    const phone = this.formatPhone(request.phone);

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.config.shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(request.amount),
          PartyA: phone,
          PartyB: this.config.shortCode,
          PhoneNumber: phone,
          CallBackURL: this.config.callbackUrl,
          AccountReference: request.reference.substring(0, 12),
          TransactionDesc: request.description.substring(0, 20)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.ResponseCode === '0') {
        return {
          success: true,
          transactionId: request.reference,
          providerReference: response.data.CheckoutRequestID,
          status: TransactionStatus.PENDING,
          message: 'STK push sent successfully',
          promptSent: true
        };
      }

      return {
        success: false,
        transactionId: request.reference,
        status: TransactionStatus.FAILED,
        message: response.data.ResponseDescription || 'STK push failed'
      };
    } catch (error) {
      this.logger.error('M-Pesa STK Push failed', error as Error);
      throw error;
    }
  }

  /**
   * Query STK Push status
   */
  async stkQuery(checkoutRequestId: string): Promise<TransactionStatus> {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generatePassword(timestamp);

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: this.config.shortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // ResultCode 0 means success
      if (response.data.ResultCode === '0') {
        return TransactionStatus.SUCCESSFUL;
      } else if (response.data.ResultCode === '1032') {
        return TransactionStatus.CANCELLED;
      } else if (response.data.ResultCode === '1') {
        return TransactionStatus.PENDING;
      }

      return TransactionStatus.FAILED;
    } catch (error) {
      this.logger.error('M-Pesa STK Query failed', error as Error);
      return TransactionStatus.PENDING;
    }
  }

  /**
   * B2C Payment (Business to Customer - for payouts)
   */
  async b2cPayment(request: B2CRequest): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    const token = await this.getAccessToken();
    const phone = this.formatPhone(request.phone);

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        {
          InitiatorName: this.config.initiatorName,
          SecurityCredential: this.config.initiatorPassword, // In production, encrypt this
          CommandID: 'BusinessPayment',
          Amount: Math.round(request.amount),
          PartyA: this.config.shortCode,
          PartyB: phone,
          Remarks: request.occasion.substring(0, 100),
          QueueTimeOutURL: this.config.callbackUrl,
          ResultURL: this.config.callbackUrl,
          Occasion: request.occasion.substring(0, 100)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.ResponseCode === '0') {
        return {
          success: true,
          transactionId: response.data.ConversationID,
          message: 'B2C payment initiated successfully'
        };
      }

      return {
        success: false,
        transactionId: request.reference,
        message: response.data.ResponseDescription || 'B2C payment failed'
      };
    } catch (error) {
      this.logger.error('M-Pesa B2C payment failed', error as Error);
      throw error;
    }
  }

  /**
   * C2B Register URLs
   */
  async registerC2BUrls(
    confirmationUrl: string,
    validationUrl: string
  ): Promise<boolean> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/c2b/v1/registerurl`,
        {
          ShortCode: this.config.shortCode,
          ResponseType: 'Completed',
          ConfirmationURL: confirmationUrl,
          ValidationURL: validationUrl
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.ResponseCode === '0';
    } catch (error) {
      this.logger.error('M-Pesa URL registration failed', error as Error);
      return false;
    }
  }

  /**
   * Process callback from M-Pesa
   */
  processCallback(body: Record<string, unknown>): {
    success: boolean;
    reference?: string;
    amount?: number;
    phone?: string;
    mpesaRef?: string;
  } {
    try {
      const stkCallback = body.Body as Record<string, unknown>;
      const resultCode = (stkCallback.stkCallback as Record<string, unknown>)?.ResultCode;

      if (resultCode === 0) {
        const callbackMetadata = (stkCallback.stkCallback as Record<string, unknown>)
          ?.CallbackMetadata as Record<string, unknown>;
        const items = callbackMetadata?.Item as Array<{ Name: string; Value: unknown }>;

        let amount: number | undefined;
        let phone: string | undefined;
        let mpesaRef: string | undefined;

        for (const item of items || []) {
          switch (item.Name) {
            case 'Amount':
              amount = item.Value as number;
              break;
            case 'PhoneNumber':
              phone = String(item.Value);
              break;
            case 'MpesaReceiptNumber':
              mpesaRef = String(item.Value);
              break;
          }
        }

        return { success: true, amount, phone, mpesaRef };
      }

      return { success: false };
    } catch (error) {
      this.logger.error('Error processing M-Pesa callback', error as Error);
      return { success: false };
    }
  }
}

export default MpesaProvider;
