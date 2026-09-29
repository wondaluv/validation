/**
 * AfriPay Fee Calculator
 * Calculates transaction fees based on payment method and amount
 */

import { Currency, PaymentMethod, isMobileMoneyMethod, isCardMethod } from '../types';
import { FeeConfig } from '../config';

export interface FeeBreakdown {
  baseFee: number;
  percentageFee: number;
  flatFee: number;
  totalFee: number;
  netAmount: number;
  feePercent: number;
}

export class FeeCalculator {
  private config: FeeConfig;

  constructor(config: FeeConfig) {
    this.config = config;
  }

  /**
   * Calculate fee for a transaction
   */
  calculateFee(
    amount: number,
    currency: Currency,
    paymentMethod: PaymentMethod
  ): number {
    const breakdown = this.getDetailedFee(amount, currency, paymentMethod);
    return breakdown.totalFee;
  }

  /**
   * Get detailed fee breakdown
   */
  getDetailedFee(
    amount: number,
    currency: Currency,
    paymentMethod: PaymentMethod
  ): FeeBreakdown {
    let percentFee: number;
    let flatFee: number;

    if (isMobileMoneyMethod(paymentMethod)) {
      percentFee = this.config.mobileMoneyPercent;
      flatFee = this.config.mobileMoneyFlat;
    } else if (isCardMethod(paymentMethod)) {
      // Check if international card
      const isInternational = this.isInternationalCard(paymentMethod, currency);
      percentFee = isInternational
        ? this.config.internationalCardPercent
        : this.config.localCardPercent;
      flatFee = isInternational
        ? this.config.internationalCardFlat
        : this.config.localCardFlat;
    } else if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
      percentFee = this.config.bankTransferPercent;
      flatFee = this.config.bankTransferFlat;
    } else {
      // Default fee
      percentFee = this.config.localCardPercent;
      flatFee = this.config.localCardFlat;
    }

    // Calculate fees
    const percentageFee = amount * percentFee;
    let totalFee = percentageFee + flatFee;

    // Apply caps
    const maxFeeByPercent = amount * this.config.maxFeePercent;
    if (totalFee > maxFeeByPercent) {
      totalFee = maxFeeByPercent;
    }
    if (totalFee > this.config.maxFeeFlat) {
      totalFee = this.config.maxFeeFlat;
    }

    // Round to 2 decimal places
    totalFee = Math.round(totalFee * 100) / 100;

    return {
      baseFee: amount,
      percentageFee: Math.round(percentageFee * 100) / 100,
      flatFee,
      totalFee,
      netAmount: amount - totalFee,
      feePercent: (totalFee / amount) * 100
    };
  }

  /**
   * Calculate payout fee
   */
  calculatePayoutFee(amount: number, currency: Currency): number {
    const percentageFee = amount * this.config.payoutPercent;
    const totalFee = percentageFee + this.config.payoutFlat;
    return Math.round(totalFee * 100) / 100;
  }

  /**
   * Get fee for currency conversion
   */
  calculateConversionFee(amount: number, fromCurrency: Currency, toCurrency: Currency): number {
    // 1% conversion fee for cross-currency transactions
    const CONVERSION_FEE_PERCENT = 0.01;
    return Math.round(amount * CONVERSION_FEE_PERCENT * 100) / 100;
  }

  /**
   * Estimate total cost for customer
   */
  estimateTotalCost(
    merchantReceives: number,
    currency: Currency,
    paymentMethod: PaymentMethod,
    passFeeToCustomer: boolean = false
  ): { customerPays: number; merchantReceives: number; fee: number } {
    if (!passFeeToCustomer) {
      const fee = this.calculateFee(merchantReceives, currency, paymentMethod);
      return {
        customerPays: merchantReceives,
        merchantReceives: merchantReceives - fee,
        fee
      };
    }

    // Calculate amount customer needs to pay so merchant receives desired amount
    const feeConfig = this.getFeeConfigForMethod(paymentMethod, currency);
    const percentFee = feeConfig.percent;
    const flatFee = feeConfig.flat;

    // Formula: customerPays = (merchantReceives + flatFee) / (1 - percentFee)
    const customerPays = Math.ceil((merchantReceives + flatFee) / (1 - percentFee));
    const fee = customerPays - merchantReceives;

    return {
      customerPays,
      merchantReceives,
      fee
    };
  }

  /**
   * Check if card is international
   */
  private isInternationalCard(paymentMethod: PaymentMethod, currency: Currency): boolean {
    // AMEX is always treated as international in Africa
    if (paymentMethod === PaymentMethod.AMEX) {
      return true;
    }

    // Verve is always local (Nigerian)
    if (paymentMethod === PaymentMethod.VERVE) {
      return false;
    }

    // For Visa/Mastercard, consider international if not in local African currency
    const localCurrencies: Currency[] = [
      Currency.NGN,
      Currency.KES,
      Currency.GHS,
      Currency.ZAR,
      Currency.TZS,
      Currency.UGX,
      Currency.RWF,
      Currency.XOF,
      Currency.XAF
    ];

    return !localCurrencies.includes(currency);
  }

  /**
   * Get fee configuration for payment method
   */
  private getFeeConfigForMethod(
    paymentMethod: PaymentMethod,
    currency: Currency
  ): { percent: number; flat: number } {
    if (isMobileMoneyMethod(paymentMethod)) {
      return {
        percent: this.config.mobileMoneyPercent,
        flat: this.config.mobileMoneyFlat
      };
    }

    if (isCardMethod(paymentMethod)) {
      const isInternational = this.isInternationalCard(paymentMethod, currency);
      return {
        percent: isInternational
          ? this.config.internationalCardPercent
          : this.config.localCardPercent,
        flat: isInternational
          ? this.config.internationalCardFlat
          : this.config.localCardFlat
      };
    }

    return {
      percent: this.config.bankTransferPercent,
      flat: this.config.bankTransferFlat
    };
  }

  /**
   * Get fee summary for display
   */
  getFeeSummary(paymentMethod: PaymentMethod, currency: Currency): string {
    const config = this.getFeeConfigForMethod(paymentMethod, currency);
    const percentStr = (config.percent * 100).toFixed(1);

    if (config.flat > 0) {
      return `${percentStr}% + ${config.flat} ${currency}`;
    }

    return `${percentStr}%`;
  }
}

export default FeeCalculator;
