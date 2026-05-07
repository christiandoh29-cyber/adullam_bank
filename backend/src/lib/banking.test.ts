import { describe, it, expect } from 'vitest'
import {
  generateAccountNumber,
  computeRibKey,
  generateIBAN,
  generateCardNumber,
  calculateFee,
  formatIBAN,
  generateTransactionReference,
} from './banking'

describe('banking utilities', () => {
  describe('generateAccountNumber', () => {
    it('should generate a 11-digit account number', () => {
      const accountNumber = generateAccountNumber()
      expect(accountNumber).toMatch(/^\d{11}$/)
    })

    it('should generate unique numbers', () => {
      const nums = new Set(Array.from({ length: 100 }, () => generateAccountNumber()))
      expect(nums.size).toBe(100)
    })
  })

  describe('computeRibKey', () => {
    it('should compute a valid 2-digit RIB key', () => {
      const key = computeRibKey('30006', '00001', '12345678901')
      expect(key).toMatch(/^\d{2}$/)
    })

    it('should handle all-numeric account numbers', () => {
      const key = computeRibKey('30006', '00001', '00000000001')
      expect(key).toMatch(/^\d{2}$/)
    })

    it('should produce consistent results for same input', () => {
      const key1 = computeRibKey('30006', '00001', '12345678901')
      const key2 = computeRibKey('30006', '00001', '12345678901')
      expect(key1).toBe(key2)
    })
  })

  describe('generateIBAN', () => {
    it('should generate a valid French IBAN format', () => {
      const iban = generateIBAN('30006', '00001', '12345678901', '97')
      expect(iban).toMatch(/^FR\d{2} \d{4}/)
      expect(iban).toContain(' ')
      expect(iban.length).toBeGreaterThan(10)
    })

    it('should generate consistent IBANs', () => {
      const iban1 = generateIBAN('30006', '00001', '12345678901', '97')
      const iban2 = generateIBAN('30006', '00001', '12345678901', '97')
      expect(iban1).toBe(iban2)
    })
  })

  describe('generateCardNumber', () => {
    it('should generate a 16-digit card number', () => {
      const card = generateCardNumber('4539')
      expect(card).toMatch(/^\d{16}$/)
    })

    it('should generate Luhn-valid card numbers', () => {
      const card = generateCardNumber('4539')
      let sum = 0
      let double = false
      for (let i = card.length - 1; i >= 0; i--) {
        let digit = parseInt(card[i])
        if (double) {
          digit *= 2
          if (digit > 9) digit -= 9
        }
        sum += digit
        double = !double
      }
      expect(sum % 10).toBe(0)
    })

    it('should respect custom prefix', () => {
      const visa = generateCardNumber('4539')
      const mc = generateCardNumber('5425')
      expect(visa.startsWith('4539')).toBe(true)
      expect(mc.startsWith('5425')).toBe(true)
    })
  })

  describe('calculateFee', () => {
    it('should return 0 for amounts <= 10', () => {
      expect(calculateFee(0)).toBe(0)
      expect(calculateFee(5)).toBe(0)
      expect(calculateFee(10)).toBe(0)
    })

    it('should calculate 0.5% fee for amounts > 10', () => {
      expect(calculateFee(100)).toBe(0.5)
      expect(calculateFee(1000)).toBe(5)
    })

    it('should cap fee at 10', () => {
      expect(calculateFee(5000)).toBe(10)
      expect(calculateFee(10000)).toBe(10)
      expect(calculateFee(100000)).toBe(10)
    })
  })

  describe('formatIBAN', () => {
    it('should group IBAN into 4-digit blocks', () => {
      const formatted = formatIBAN('FR76123456789012345678901234')
      expect(formatted).toMatch(/^FR\d{2}( \d{4}){1,}$/)
    })

    it('should handle already formatted IBAN', () => {
      const formatted = formatIBAN('FR76 1234 5678 9012 3456 7890 123')
      expect(formatted).toBe('FR76 1234 5678 9012 3456 7890 123')
    })
  })

  describe('generateTransactionReference', () => {
    it('should generate a reference with ADL prefix', () => {
      const ref = generateTransactionReference()
      expect(ref.startsWith('ADL-')).toBe(true)
    })

    it('should generate unique references', () => {
      const refs = new Set(
        Array.from({ length: 100 }, () => generateTransactionReference())
      )
      expect(refs.size).toBe(100)
    })
  })
})
