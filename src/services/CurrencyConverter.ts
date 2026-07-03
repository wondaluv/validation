/**
 * AfriPay Currency Converter
 * Multi-currency support with real-time exchange rates
 */

import { Currency, ExchangeRate, ConversionResult } from '../types';
import { Logger } from '../utils/Logger';

// Exchange rates relative to USD (sample rates - in production, fetch from API)
const BASE_RATES: Record<Currency, number> = {
  // International
  [Currency.USD]: 1.0,
  [Currency.EUR]: 0.92,
  [Currency.GBP]: 0.79,

  // West Africa
  [Currency.NGN]: 1550.0,
  [Currency.GHS]: 15.5,
  [Currency.XOF]: 605.0,

  // East Africa
  [Currency.KES]: 153.0,
  [Currency.TZS]: 2510.0,
  [Currency.UGX]: 3780.0,
  [Currency.RWF]: 1280.0,
  [Currency.ETB]: 56.5,

  // Southern Africa
  [Currency.ZAR]: 18.5,
  [Currency.ZMW]: 26.5,
  [Currency.BWP]: 13.5,
  [Currency.MWK]: 1680.0,
  [Currency.ZWL]: 13500.0,

  // Central Africa
  [Currency.XAF]: 605.0,
  [Currency.CDF]: 2750.0,

  // North Africa
  [Currency.EGP]: 30.9,
  [Currency.MAD]: 10.0
};

export class CurrencyConverter {
  private rates: Map<string, ExchangeRate>;
  private logger: Logger;
  private lastUpdate: Date;
  private cacheTimeout: number = 3600000; // 1 hour

  constructor() {
    this.rates = new Map();
    this.logger = new Logger('CurrencyConverter');
    this.lastUpdate = new Date(0);
    this.initializeRates();
  }

  /**
   * Initialize rates from base rates
   */
  private initializeRates(): void {
    const currencies = Object.values(Currency);

    for (const from of currencies) {
      for (const to of currencies) {
        if (from !== to) {
          const rate = this.calculateCrossRate(from, to);
          this.rates.set(`${from}_${to}`, {
            from,
            to,
            rate,
            timestamp: new Date(),
            source: 'internal'
          });
        }
      }
    }

    this.lastUpdate = new Date();
    this.logger.info('Exchange rates initialized');
  }

  /**
   * Calculate cross rate between two currencies
   */
  private calculateCrossRate(from: Currency, to: Currency): number {
    const fromRate = BASE_RATES[from];
    const toRate = BASE_RATES[to];

    if (!fromRate || !toRate) {
      throw new Error(`Unsupported currency pair: ${from}/${to}`);
    }

    // Cross rate: toRate / fromRate
    return toRate / fromRate;
  }

  /**
   * Get exchange rate
   */
  getRate(from: Currency, to: Currency): ExchangeRate | null {
    if (from === to) {
      return {
        from,
        to,
        rate: 1.0,
        timestamp: new Date(),
        source: 'internal'
      };
    }

    const key = `${from}_${to}`;
    return this.rates.get(key) || null;
  }

  /**
   * Convert amount between currencies
   */
  convert(
    amount: number,
    from: Currency,
    to: Currency,
    options?: { includeFee?: boolean; feePercent?: number }
  ): ConversionResult {
    const rate = this.getRate(from, to);

    if (!rate) {
      throw new Error(`Cannot convert ${from} to ${to}: rate not available`);
    }

    let convertedAmount = amount * rate.rate;
    let fee = 0;

    if (options?.includeFee) {
      const feePercent = options.feePercent ?? 0.01; // Default 1% conversion fee
      fee = amount * feePercent;
      convertedAmount = (amount - fee) * rate.rate;
    }

    // Round to appropriate decimal places based on currency
    convertedAmount = this.roundForCurrency(convertedAmount, to);

    return {
      originalAmount: amount,
      originalCurrency: from,
      convertedAmount,
      convertedCurrency: to,
      exchangeRate: rate.rate,
      fee,
      timestamp: new Date()
    };
  }

  /**
   * Get amount in smallest currency unit (for API calls)
   */
  toSmallestUnit(amount: number, currency: Currency): number {
    const noDecimalCurrencies: Currency[] = [
      Currency.UGX,
      Currency.TZS,
      Currency.RWF,
      Currency.XOF,
      Currency.XAF,
      Currency.MWK,
      Currency.ZWL,
      Currency.CDF
    ];

    if (noDecimalCurrencies.includes(currency)) {
      return Math.round(amount);
    }

    // Most currencies use 2 decimal places
    return Math.round(amount * 100);
  }

  /**
   * Convert from smallest unit to standard amount
   */
  fromSmallestUnit(amount: number, currency: Currency): number {
    const noDecimalCurrencies: Currency[] = [
      Currency.UGX,
      Currency.TZS,
      Currency.RWF,
      Currency.XOF,
      Currency.XAF,
      Currency.MWK,
      Currency.ZWL,
      Currency.CDF
    ];

    if (noDecimalCurrencies.includes(currency)) {
      return amount;
    }

    return amount / 100;
  }

  /**
   * Round amount appropriately for currency
   */
  private roundForCurrency(amount: number, currency: Currency): number {
    const noDecimalCurrencies: Currency[] = [
      Currency.UGX,
      Currency.TZS,
      Currency.RWF,
      Currency.XOF,
      Currency.XAF,
      Currency.MWK,
      Currency.ZWL,
      Currency.CDF
    ];

    if (noDecimalCurrencies.includes(currency)) {
      return Math.round(amount);
    }

    return Math.round(amount * 100) / 100;
  }

  /**
   * Format amount for display
   */
  format(amount: number, currency: Currency, options?: {
    showSymbol?: boolean;
    locale?: string;
  }): string {
    const symbols: Partial<Record<Currency, string>> = {
      [Currency.USD]: '$',
      [Currency.EUR]: '€',
      [Currency.GBP]: '£',
      [Currency.NGN]: '₦',
      [Currency.KES]: 'KSh',
      [Currency.GHS]: 'GH₵',
      [Currency.ZAR]: 'R',
      [Currency.EGP]: 'E£'
    };

    const locale = options?.locale || 'en-US';
    const showSymbol = options?.showSymbol ?? true;

    try {
      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: this.getDecimalPlaces(currency),
        maximumFractionDigits: this.getDecimalPlaces(currency)
      }).format(amount);

      return formatted;
    } catch {
      // Fallback formatting
      const symbol = showSymbol ? (symbols[currency] || currency) : '';
      const decimals = this.getDecimalPlaces(currency);
      const formattedAmount = amount.toFixed(decimals);
      return `${symbol}${formattedAmount}`;
    }
  }

  /**
   * Get decimal places for currency
   */
  private getDecimalPlaces(currency: Currency): number {
    const noDecimalCurrencies: Currency[] = [
      Currency.UGX,
      Currency.TZS,
      Currency.RWF,
      Currency.XOF,
      Currency.XAF,
      Currency.MWK,
      Currency.ZWL,
      Currency.CDF
    ];

    return noDecimalCurrencies.includes(currency) ? 0 : 2;
  }

  /**
   * Update rates from external API (placeholder for production)
   */
  async updateRates(): Promise<void> {
    // In production, fetch from exchange rate API
    // For now, just refresh from base rates with slight variations
    this.initializeRates();
    this.logger.info('Exchange rates updated');
  }

  /**
   * Check if rates need refresh
   */
  needsRefresh(): boolean {
    const now = new Date();
    return now.getTime() - this.lastUpdate.getTime() > this.cacheTimeout;
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): Currency[] {
    return Object.values(Currency);
  }

  /**
   * Get all current rates for a currency
   */
  getAllRatesFor(currency: Currency): ExchangeRate[] {
    const rates: ExchangeRate[] = [];

    for (const to of Object.values(Currency)) {
      if (to !== currency) {
        const rate = this.getRate(currency, to);
        if (rate) {
          rates.push(rate);
        }
      }
    }

    return rates;
  }
}

export default CurrencyConverter;
