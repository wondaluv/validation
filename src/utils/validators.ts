/**
 * AfriPay Validation Utilities
 * Input validation for payments and data
 */

import { z } from 'zod';
import { Currency, Country, PaymentMethod } from '../types';

// Phone number regex patterns for African countries
const PHONE_PATTERNS: Record<Country, RegExp> = {
  [Country.NIGERIA]: /^234[789][01]\d{8}$/,
  [Country.KENYA]: /^254[71]\d{8}$/,
  [Country.GHANA]: /^233[235]\d{8}$/,
  [Country.SOUTH_AFRICA]: /^27[678]\d{8}$/,
  [Country.TANZANIA]: /^255[67]\d{8}$/,
  [Country.UGANDA]: /^256[7]\d{8}$/,
  [Country.RWANDA]: /^250[7]\d{8}$/,
  [Country.ETHIOPIA]: /^251[9]\d{8}$/,
  [Country.ZAMBIA]: /^260[9]\d{8}$/,
  [Country.ZIMBABWE]: /^263[7]\d{8}$/,
  [Country.BOTSWANA]: /^267[7]\d{7}$/,
  [Country.CAMEROON]: /^237[6]\d{8}$/,
  [Country.COTE_DIVOIRE]: /^225[0579]\d{8}$/,
  [Country.SENEGAL]: /^221[7]\d{8}$/,
  [Country.EGYPT]: /^20[1]\d{9}$/,
  [Country.MOROCCO]: /^212[67]\d{8}$/,
  [Country.DRC]: /^243[89]\d{8}$/,
  [Country.MALAWI]: /^265[89]\d{8}$/
};

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string, country?: Country): {
  valid: boolean;
  formatted: string;
  country?: Country;
  error?: string;
} {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Remove leading zeros if present
  const normalized = cleaned.replace(/^0+/, '');

  if (country) {
    const pattern = PHONE_PATTERNS[country];
    if (pattern && pattern.test(normalized)) {
      return { valid: true, formatted: normalized, country };
    }
    return {
      valid: false,
      formatted: normalized,
      error: `Invalid phone number format for ${country}`
    };
  }

  // Try to detect country from phone prefix
  for (const [countryCode, pattern] of Object.entries(PHONE_PATTERNS)) {
    if (pattern.test(normalized)) {
      return {
        valid: true,
        formatted: normalized,
        country: countryCode as Country
      };
    }
  }

  // If no pattern matches but number looks valid (10+ digits)
  if (normalized.length >= 10 && normalized.length <= 15) {
    return {
      valid: true,
      formatted: normalized,
      error: 'Country not detected'
    };
  }

  return {
    valid: false,
    formatted: normalized,
    error: 'Invalid phone number format'
  };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate card number using Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): {
  valid: boolean;
  brand?: string;
  error?: string;
} {
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 13 || cleaned.length > 19) {
    return { valid: false, error: 'Invalid card number length' };
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'Invalid card number' };
  }

  // Detect card brand
  const brand = detectCardBrand(cleaned);

  return { valid: true, brand };
}

/**
 * Detect card brand from number
 */
export function detectCardBrand(cardNumber: string): string {
  const patterns: Record<string, RegExp> = {
    visa: /^4/,
    mastercard: /^5[1-5]|^2[2-7]/,
    amex: /^3[47]/,
    verve: /^506[01]|^507[89]|^6500/,
    discover: /^6(?:011|5)/,
    diners: /^3(?:0[0-5]|[68])/,
    jcb: /^35/
  };

  for (const [brand, pattern] of Object.entries(patterns)) {
    if (pattern.test(cardNumber)) {
      return brand;
    }
  }

  return 'unknown';
}

/**
 * Validate card expiry
 */
export function validateCardExpiry(month: string, year: string): {
  valid: boolean;
  error?: string;
} {
  const monthNum = parseInt(month, 10);
  let yearNum = parseInt(year, 10);

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return { valid: false, error: 'Invalid expiry month' };
  }

  // Handle 2-digit year
  if (yearNum < 100) {
    yearNum += 2000;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
    return { valid: false, error: 'Card has expired' };
  }

  if (yearNum > currentYear + 20) {
    return { valid: false, error: 'Invalid expiry year' };
  }

  return { valid: true };
}

/**
 * Validate CVV
 */
export function validateCVV(cvv: string, cardBrand?: string): {
  valid: boolean;
  error?: string;
} {
  const cleaned = cvv.replace(/\D/g, '');

  if (cardBrand === 'amex') {
    if (cleaned.length !== 4) {
      return { valid: false, error: 'Amex CVV must be 4 digits' };
    }
  } else {
    if (cleaned.length !== 3) {
      return { valid: false, error: 'CVV must be 3 digits' };
    }
  }

  return { valid: true };
}

/**
 * Validate amount
 */
export function validateAmount(
  amount: number,
  currency: Currency,
  options?: { min?: number; max?: number }
): {
  valid: boolean;
  error?: string;
} {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a number' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }

  // Currency-specific minimum amounts
  const minimums: Partial<Record<Currency, number>> = {
    [Currency.NGN]: 100,
    [Currency.KES]: 10,
    [Currency.GHS]: 1,
    [Currency.ZAR]: 5,
    [Currency.USD]: 0.5,
    [Currency.EUR]: 0.5,
    [Currency.GBP]: 0.5
  };

  const min = options?.min ?? minimums[currency] ?? 1;
  const max = options?.max ?? 10000000; // Default max ~$10M equivalent

  if (amount < min) {
    return { valid: false, error: `Minimum amount is ${min} ${currency}` };
  }

  if (amount > max) {
    return { valid: false, error: `Maximum amount is ${max} ${currency}` };
  }

  return { valid: true };
}

/**
 * Validate bank account number (Nigerian format)
 */
export function validateBankAccount(accountNumber: string, country: Country): {
  valid: boolean;
  error?: string;
} {
  const cleaned = accountNumber.replace(/\D/g, '');

  const lengthByCountry: Partial<Record<Country, number>> = {
    [Country.NIGERIA]: 10,
    [Country.KENYA]: 14,
    [Country.GHANA]: 16,
    [Country.SOUTH_AFRICA]: 11
  };

  const expectedLength = lengthByCountry[country];

  if (expectedLength && cleaned.length !== expectedLength) {
    return {
      valid: false,
      error: `Account number should be ${expectedLength} digits for ${country}`
    };
  }

  return { valid: true };
}

// Zod schemas for API validation
export const InitializePaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.nativeEnum(Currency),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  reference: z.string().max(100).optional(),
  callbackUrl: z.string().url().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
  customer: z.object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    email: z.string().email().optional()
  }).optional()
});

export const PayoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.nativeEnum(Currency),
  recipient: z.object({
    type: z.enum(['mobile_money', 'bank_account']),
    phone: z.string().optional(),
    provider: z.nativeEnum(PaymentMethod).optional(),
    accountNumber: z.string().optional(),
    bankCode: z.string().optional(),
    accountName: z.string().optional(),
    country: z.nativeEnum(Country)
  }),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const MerchantRegistrationSchema = z.object({
  businessName: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  country: z.nativeEnum(Country),
  password: z.string().min(8).max(100)
});
