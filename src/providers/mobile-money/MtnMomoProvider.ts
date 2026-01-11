/**
 * AfriPay MTN MoMo Provider
 * Integration with MTN Mobile Money (Ghana, Uganda, Rwanda, Cameroon, etc.)
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Currency, TransactionStatus, MobileMoneyPaymentResponse } from '../../types';
import { Logger } from '../../utils/Logger';

export interface MtnMomoConfig {
  subscriptionKey: string;
  apiKey: string;
  userId: string;
  targetEnvironment: string;
  callbackUrl: string;
}

interface RequestToPayParams {
  phone: string;
  amount: number;
  currency: Currency;
  reference: string;
  payerMessage: string;
  payeeNote: string;
}

interface TransferParams {
  phone: string;
  amount: number;
  currency: Currency;
  reference: string;
  payerMessage: string;
  payeeNote: string;
}

export class MtnMomoProvider {
  private config: MtnMomoConfig;
  private environment: 'sandbox' | 'production';
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiry?: Date;
  private logger: Logger;

  constructor(config: MtnMomoConfig, environment: 'sandbox' | 'production') {
    this.config = config;
    this.environment = environment;
    this.baseUrl = environment === 'production'
      ? 'https://proxy.momoapi.mtn.com'
      : 'https://sandbox.momodeveloper.mtn.com';
    this.logger = new Logger('MtnMomoProvider');
  }

  /**
   * Get OAuth access token for Collections
   */
  private async getAccessToken(product: 'collection' | 'disbursement'): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(
      `${this.config.userId}:${this.config.apiKey}`
    ).toString('base64');

    try {
      const response = await axios.post(
        `${this.baseUrl}/${product}/token/`,
        {},
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey
          }
        }
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 60) * 1000);

      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get MTN MoMo access token', error as Error);
      throw new Error('MTN MoMo authentication failed');
    }
  }

  /**
   * Format phone number for MTN MoMo
   */
  private formatPhone(phone: string): string {
    let formatted = phone.replace(/\D/g, '');

    // Remove leading zeros
    formatted = formatted.replace(/^0+/, '');

    return formatted;
  }

  /**
   * Request to Pay (Collection)
   */
  async requestToPay(params: RequestToPayParams): Promise<MobileMoneyPaymentResponse> {
    const token = await this.getAccessToken('collection');
    const phone = this.formatPhone(params.phone);
    const referenceId = uuidv4();

    try {
      await axios.post(
        `${this.baseUrl}/collection/v1_0/requesttopay`,
        {
          amount: String(Math.round(params.amount)),
          currency: params.currency,
          externalId: params.reference,
          payer: {
            partyIdType: 'MSISDN',
            partyId: phone
          },
          payerMessage: params.payerMessage,
          payeeNote: params.payeeNote
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
            'X-Callback-Url': this.config.callbackUrl,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        transactionId: params.reference,
        providerReference: referenceId,
        status: TransactionStatus.PENDING,
        message: 'Payment request sent to customer',
        promptSent: true
      };
    } catch (error) {
      this.logger.error('MTN MoMo request to pay failed', error as Error);

      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        return {
          success: false,
          transactionId: params.reference,
          status: TransactionStatus.FAILED,
          message: errorData?.message || 'Request to pay failed'
        };
      }

      throw error;
    }
  }

  /**
   * Get Request to Pay status
   */
  async getRequestToPayStatus(referenceId: string): Promise<TransactionStatus> {
    const token = await this.getAccessToken('collection');

    try {
      const response = await axios.get(
        `${this.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey
          }
        }
      );

      const status = response.data.status;

      switch (status) {
        case 'SUCCESSFUL':
          return TransactionStatus.SUCCESSFUL;
        case 'FAILED':
          return TransactionStatus.FAILED;
        case 'PENDING':
          return TransactionStatus.PENDING;
        case 'REJECTED':
          return TransactionStatus.CANCELLED;
        default:
          return TransactionStatus.PENDING;
      }
    } catch (error) {
      this.logger.error('MTN MoMo status check failed', error as Error);
      return TransactionStatus.PENDING;
    }
  }

  /**
   * Transfer (Disbursement)
   */
  async transfer(params: TransferParams): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    const token = await this.getAccessToken('disbursement');
    const phone = this.formatPhone(params.phone);
    const referenceId = uuidv4();

    try {
      await axios.post(
        `${this.baseUrl}/disbursement/v1_0/transfer`,
        {
          amount: String(Math.round(params.amount)),
          currency: params.currency,
          externalId: params.reference,
          payee: {
            partyIdType: 'MSISDN',
            partyId: phone
          },
          payerMessage: params.payerMessage,
          payeeNote: params.payeeNote
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
            'X-Callback-Url': this.config.callbackUrl,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        transactionId: referenceId,
        message: 'Transfer initiated successfully'
      };
    } catch (error) {
      this.logger.error('MTN MoMo transfer failed', error as Error);

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          transactionId: params.reference,
          message: error.response.data?.message || 'Transfer failed'
        };
      }

      throw error;
    }
  }

  /**
   * Get Transfer status
   */
  async getTransferStatus(referenceId: string): Promise<TransactionStatus> {
    const token = await this.getAccessToken('disbursement');

    try {
      const response = await axios.get(
        `${this.baseUrl}/disbursement/v1_0/transfer/${referenceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey
          }
        }
      );

      const status = response.data.status;

      switch (status) {
        case 'SUCCESSFUL':
          return TransactionStatus.SUCCESSFUL;
        case 'FAILED':
          return TransactionStatus.FAILED;
        case 'PENDING':
          return TransactionStatus.PROCESSING;
        default:
          return TransactionStatus.PENDING;
      }
    } catch (error) {
      this.logger.error('MTN MoMo transfer status check failed', error as Error);
      return TransactionStatus.PENDING;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(product: 'collection' | 'disbursement' = 'collection'): Promise<{
    balance: number;
    currency: string;
  }> {
    const token = await this.getAccessToken(product);

    try {
      const response = await axios.get(
        `${this.baseUrl}/${product}/v1_0/account/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey
          }
        }
      );

      return {
        balance: parseFloat(response.data.availableBalance),
        currency: response.data.currency
      };
    } catch (error) {
      this.logger.error('MTN MoMo balance check failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate account holder
   */
  async validateAccountHolder(phone: string): Promise<{
    valid: boolean;
    name?: string;
  }> {
    const token = await this.getAccessToken('collection');
    const formattedPhone = this.formatPhone(phone);

    try {
      const response = await axios.get(
        `${this.baseUrl}/collection/v1_0/accountholder/msisdn/${formattedPhone}/basicuserinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey
          }
        }
      );

      return {
        valid: true,
        name: response.data.name
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { valid: false };
      }
      this.logger.error('MTN MoMo account validation failed', error as Error);
      return { valid: false };
    }
  }

  /**
   * Process callback from MTN MoMo
   */
  processCallback(body: Record<string, unknown>): {
    success: boolean;
    referenceId?: string;
    externalId?: string;
    amount?: number;
    currency?: string;
    status?: string;
  } {
    try {
      const status = body.status as string;

      return {
        success: status === 'SUCCESSFUL',
        referenceId: body.referenceId as string,
        externalId: body.externalId as string,
        amount: parseFloat(body.amount as string),
        currency: body.currency as string,
        status
      };
    } catch (error) {
      this.logger.error('Error processing MTN MoMo callback', error as Error);
      return { success: false };
    }
  }
}

export default MtnMomoProvider;
