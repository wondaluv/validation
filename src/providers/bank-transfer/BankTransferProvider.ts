/**
 * AfriPay Bank Transfer Provider
 * Handles bank transfers and payouts across Africa
 */

import axios from 'axios';
import { Currency, TransactionStatus, Country } from '../../types';
import { AfriPayConfig } from '../../config';
import { Logger } from '../../utils/Logger';

interface TransferInitParams {
  amount: number;
  currency: Currency;
  reference: string;
}

interface PayoutParams {
  amount: number;
  currency: Currency;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  reference: string;
}

interface VirtualAccountParams {
  merchantId: string;
  customerEmail: string;
  customerName: string;
  amount?: number;
  currency: Currency;
  expiresAt?: Date;
}

interface BankInfo {
  code: string;
  name: string;
  slug: string;
  country: Country;
  currency: Currency;
}

export class BankTransferProvider {
  private config: AfriPayConfig;
  private logger: Logger;

  constructor(config: AfriPayConfig) {
    this.config = config;
    this.logger = new Logger('BankTransferProvider');
  }

  /**
   * Initiate bank transfer payment
   */
  async initiateTransfer(params: TransferInitParams): Promise<{
    success: boolean;
    accountNumber?: string;
    bankName?: string;
    accountName?: string;
    expiresAt?: Date;
    instructions: string;
  }> {
    this.logger.info('Initiating bank transfer', { reference: params.reference });

    // Generate virtual account or provide bank details
    const virtualAccount = await this.generateVirtualAccount({
      merchantId: 'system',
      customerEmail: 'customer@example.com',
      customerName: 'Customer',
      amount: params.amount,
      currency: params.currency,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    if (virtualAccount.success) {
      return {
        success: true,
        accountNumber: virtualAccount.accountNumber,
        bankName: virtualAccount.bankName,
        accountName: virtualAccount.accountName,
        expiresAt: virtualAccount.expiresAt,
        instructions: `Transfer ${params.amount} ${params.currency} to:\n` +
          `Bank: ${virtualAccount.bankName}\n` +
          `Account: ${virtualAccount.accountNumber}\n` +
          `Name: ${virtualAccount.accountName}\n` +
          `Reference: ${params.reference}`
      };
    }

    return {
      success: false,
      instructions: 'Unable to generate payment account. Please try another method.'
    };
  }

  /**
   * Process bank payout
   */
  async processPayout(params: PayoutParams): Promise<{
    success: boolean;
    transactionId?: string;
    message: string;
  }> {
    this.logger.info('Processing bank payout', {
      reference: params.reference,
      bankCode: params.bankCode
    });

    // Validate account first
    const validation = await this.validateBankAccount(
      params.accountNumber,
      params.bankCode
    );

    if (!validation.valid) {
      return {
        success: false,
        message: validation.message || 'Invalid bank account'
      };
    }

    // Process payout based on configured provider
    if (this.config.cardProcessor) {
      return this.processPayoutViaProvider(params);
    }

    // Fallback to mock success for demo
    return {
      success: true,
      transactionId: `PO_${params.reference}`,
      message: 'Payout initiated successfully'
    };
  }

  /**
   * Process payout via card processor (Paystack/Flutterwave)
   */
  private async processPayoutViaProvider(params: PayoutParams): Promise<{
    success: boolean;
    transactionId?: string;
    message: string;
  }> {
    const { provider, secretKey } = this.config.cardProcessor!;

    try {
      if (provider === 'paystack') {
        // Create transfer recipient
        const recipientResponse = await axios.post(
          'https://api.paystack.co/transferrecipient',
          {
            type: 'nuban',
            name: params.accountName,
            account_number: params.accountNumber,
            bank_code: params.bankCode,
            currency: params.currency
          },
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const recipientCode = recipientResponse.data.data.recipient_code;

        // Initiate transfer
        const transferResponse = await axios.post(
          'https://api.paystack.co/transfer',
          {
            source: 'balance',
            amount: Math.round(params.amount * 100),
            recipient: recipientCode,
            reason: params.reference
          },
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return {
          success: true,
          transactionId: transferResponse.data.data.transfer_code,
          message: 'Transfer initiated'
        };
      }

      if (provider === 'flutterwave') {
        const response = await axios.post(
          'https://api.flutterwave.com/v3/transfers',
          {
            account_bank: params.bankCode,
            account_number: params.accountNumber,
            amount: params.amount,
            currency: params.currency,
            reference: params.reference,
            beneficiary_name: params.accountName
          },
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return {
          success: response.data.status === 'success',
          transactionId: response.data.data?.id,
          message: response.data.message
        };
      }

      return { success: false, message: 'Unsupported provider' };
    } catch (error) {
      this.logger.error('Bank payout failed', error as Error);
      return { success: false, message: 'Payout processing failed' };
    }
  }

  /**
   * Validate bank account
   */
  async validateBankAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<{
    valid: boolean;
    accountName?: string;
    message?: string;
  }> {
    if (!this.config.cardProcessor) {
      return { valid: true }; // Skip validation if no provider
    }

    const { provider, secretKey } = this.config.cardProcessor;

    try {
      if (provider === 'paystack') {
        const response = await axios.get(
          `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
          {
            headers: {
              Authorization: `Bearer ${secretKey}`
            }
          }
        );

        return {
          valid: true,
          accountName: response.data.data.account_name
        };
      }

      if (provider === 'flutterwave') {
        const response = await axios.post(
          'https://api.flutterwave.com/v3/accounts/resolve',
          {
            account_number: accountNumber,
            account_bank: bankCode
          },
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return {
          valid: response.data.status === 'success',
          accountName: response.data.data?.account_name
        };
      }

      return { valid: true };
    } catch (error) {
      this.logger.warn('Account validation failed', { accountNumber, bankCode });
      return { valid: false, message: 'Could not validate account' };
    }
  }

  /**
   * Generate virtual account for payment collection
   */
  async generateVirtualAccount(params: VirtualAccountParams): Promise<{
    success: boolean;
    accountNumber?: string;
    bankName?: string;
    accountName?: string;
    expiresAt?: Date;
    message?: string;
  }> {
    if (!this.config.cardProcessor) {
      // Return mock virtual account
      return {
        success: true,
        accountNumber: `99${Math.random().toString().slice(2, 10)}`,
        bankName: 'AfriPay Bank',
        accountName: params.customerName,
        expiresAt: params.expiresAt
      };
    }

    const { provider, secretKey } = this.config.cardProcessor;

    try {
      if (provider === 'paystack') {
        const response = await axios.post(
          'https://api.paystack.co/dedicated_account',
          {
            customer: params.customerEmail,
            preferred_bank: 'wema-bank' // or 'test-bank' for test
          },
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = response.data.data;
        return {
          success: true,
          accountNumber: data.account_number,
          bankName: data.bank.name,
          accountName: data.account_name
        };
      }

      if (provider === 'flutterwave') {
        const response = await axios.post(
          'https://api.flutterwave.com/v3/virtual-account-numbers',
          {
            email: params.customerEmail,
            bvn: '22222222222', // In production, get actual BVN
            tx_ref: `VA_${params.merchantId}_${Date.now()}`,
            is_permanent: false,
            amount: params.amount
          },
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = response.data.data;
        return {
          success: response.data.status === 'success',
          accountNumber: data.account_number,
          bankName: data.bank_name,
          accountName: params.customerName,
          expiresAt: data.expiry_date ? new Date(data.expiry_date) : undefined
        };
      }

      return { success: false, message: 'Unsupported provider' };
    } catch (error) {
      this.logger.error('Virtual account generation failed', error as Error);
      return { success: false, message: 'Failed to generate virtual account' };
    }
  }

  /**
   * Get list of supported banks
   */
  async getBanks(country: Country = Country.NIGERIA): Promise<BankInfo[]> {
    // Comprehensive list of African banks
    const banks: Record<Country, BankInfo[]> = {
      [Country.NIGERIA]: [
        { code: '044', name: 'Access Bank', slug: 'access-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '023', name: 'Citibank Nigeria', slug: 'citibank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '050', name: 'Ecobank Nigeria', slug: 'ecobank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '070', name: 'Fidelity Bank', slug: 'fidelity-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '011', name: 'First Bank of Nigeria', slug: 'first-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '214', name: 'First City Monument Bank', slug: 'fcmb', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '058', name: 'Guaranty Trust Bank', slug: 'gtbank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '030', name: 'Heritage Bank', slug: 'heritage-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '301', name: 'Jaiz Bank', slug: 'jaiz-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '082', name: 'Keystone Bank', slug: 'keystone-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '526', name: 'Parallex Bank', slug: 'parallex-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '076', name: 'Polaris Bank', slug: 'polaris-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '101', name: 'Providus Bank', slug: 'providus-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '221', name: 'Stanbic IBTC Bank', slug: 'stanbic-ibtc', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '068', name: 'Standard Chartered Bank', slug: 'standard-chartered', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '232', name: 'Sterling Bank', slug: 'sterling-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '100', name: 'Suntrust Bank', slug: 'suntrust-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '032', name: 'Union Bank of Nigeria', slug: 'union-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '033', name: 'United Bank For Africa', slug: 'uba', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '215', name: 'Unity Bank', slug: 'unity-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '035', name: 'Wema Bank', slug: 'wema-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '057', name: 'Zenith Bank', slug: 'zenith-bank', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '999992', name: 'Opay', slug: 'opay', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '999991', name: 'PalmPay', slug: 'palmpay', country: Country.NIGERIA, currency: Currency.NGN },
        { code: '999994', name: 'Kuda Bank', slug: 'kuda-bank', country: Country.NIGERIA, currency: Currency.NGN }
      ],
      [Country.KENYA]: [
        { code: '01', name: 'Kenya Commercial Bank', slug: 'kcb', country: Country.KENYA, currency: Currency.KES },
        { code: '02', name: 'Standard Chartered Bank Kenya', slug: 'scb-kenya', country: Country.KENYA, currency: Currency.KES },
        { code: '03', name: 'Barclays Bank of Kenya', slug: 'barclays-kenya', country: Country.KENYA, currency: Currency.KES },
        { code: '11', name: 'Co-operative Bank of Kenya', slug: 'coop-bank', country: Country.KENYA, currency: Currency.KES },
        { code: '12', name: 'National Bank of Kenya', slug: 'nbk', country: Country.KENYA, currency: Currency.KES },
        { code: '07', name: 'Equity Bank', slug: 'equity-bank', country: Country.KENYA, currency: Currency.KES },
        { code: '31', name: 'CFC Stanbic Bank', slug: 'cfc-stanbic', country: Country.KENYA, currency: Currency.KES },
        { code: '68', name: 'Ecobank Kenya', slug: 'ecobank-kenya', country: Country.KENYA, currency: Currency.KES }
      ],
      [Country.GHANA]: [
        { code: '030100', name: 'GCB Bank', slug: 'gcb-bank', country: Country.GHANA, currency: Currency.GHS },
        { code: '030101', name: 'Ecobank Ghana', slug: 'ecobank-ghana', country: Country.GHANA, currency: Currency.GHS },
        { code: '030102', name: 'Fidelity Bank Ghana', slug: 'fidelity-ghana', country: Country.GHANA, currency: Currency.GHS },
        { code: '030103', name: 'Zenith Bank Ghana', slug: 'zenith-ghana', country: Country.GHANA, currency: Currency.GHS },
        { code: '030104', name: 'Access Bank Ghana', slug: 'access-ghana', country: Country.GHANA, currency: Currency.GHS },
        { code: '030105', name: 'Stanbic Bank Ghana', slug: 'stanbic-ghana', country: Country.GHANA, currency: Currency.GHS }
      ],
      [Country.SOUTH_AFRICA]: [
        { code: '051001', name: 'Standard Bank', slug: 'standard-bank', country: Country.SOUTH_AFRICA, currency: Currency.ZAR },
        { code: '051002', name: 'First National Bank', slug: 'fnb', country: Country.SOUTH_AFRICA, currency: Currency.ZAR },
        { code: '051003', name: 'ABSA Bank', slug: 'absa', country: Country.SOUTH_AFRICA, currency: Currency.ZAR },
        { code: '051004', name: 'Nedbank', slug: 'nedbank', country: Country.SOUTH_AFRICA, currency: Currency.ZAR },
        { code: '051005', name: 'Capitec Bank', slug: 'capitec', country: Country.SOUTH_AFRICA, currency: Currency.ZAR },
        { code: '051006', name: 'Investec', slug: 'investec', country: Country.SOUTH_AFRICA, currency: Currency.ZAR }
      ],
      // Add minimal entries for other countries
      [Country.TANZANIA]: [],
      [Country.UGANDA]: [],
      [Country.RWANDA]: [],
      [Country.ETHIOPIA]: [],
      [Country.ZAMBIA]: [],
      [Country.ZIMBABWE]: [],
      [Country.BOTSWANA]: [],
      [Country.CAMEROON]: [],
      [Country.COTE_DIVOIRE]: [],
      [Country.SENEGAL]: [],
      [Country.EGYPT]: [],
      [Country.MOROCCO]: [],
      [Country.DRC]: [],
      [Country.MALAWI]: []
    };

    return banks[country] || [];
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(reference: string): Promise<TransactionStatus> {
    if (!this.config.cardProcessor) {
      return TransactionStatus.PENDING;
    }

    const { provider, secretKey } = this.config.cardProcessor;

    try {
      if (provider === 'paystack') {
        const response = await axios.get(
          `https://api.paystack.co/transfer/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${secretKey}`
            }
          }
        );

        switch (response.data.data.status) {
          case 'success':
            return TransactionStatus.SUCCESSFUL;
          case 'failed':
            return TransactionStatus.FAILED;
          case 'reversed':
            return TransactionStatus.REFUNDED;
          default:
            return TransactionStatus.PROCESSING;
        }
      }

      return TransactionStatus.PENDING;
    } catch (error) {
      this.logger.error('Transfer status check failed', error as Error);
      return TransactionStatus.PENDING;
    }
  }
}

export default BankTransferProvider;
