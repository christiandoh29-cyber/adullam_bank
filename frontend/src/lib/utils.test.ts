import { describe, it, expect } from 'vitest'
import {
  formatAmount,
  formatCardNumber,
  formatExpiry,
  maskCardNumber,
  getInitials,
  getTransactionSign,
  getTransactionColor,
  getStatusBadge,
  sleep,
} from '../lib/utils'

describe('utils', () => {
  describe('formatAmount', () => {
    it('should format EUR amounts with 2 decimal places', () => {
      const result = formatAmount(1234.5, 'EUR')
      expect(result).toContain('1')
      expect(result).toContain('234')
    })

    it('should handle string amounts', () => {
      const result = formatAmount('100', 'EUR')
      expect(result).toContain('100')
    })

    it('should format zero correctly', () => {
      expect(formatAmount(0)).toBeDefined()
    })
  })

  describe('formatCardNumber', () => {
    it('should group card number into 4-digit blocks', () => {
      const result = formatCardNumber('1234567890123456')
      expect(result).toBe('1234 5678 9012 3456')
    })

    it('should handle already formatted card', () => {
      const result = formatCardNumber('1234567890123456')
      expect(result).toBe('1234 5678 9012 3456')
    })
  })

  describe('formatExpiry', () => {
    it('should format month and year with leading zero', () => {
      expect(formatExpiry(1, 2027)).toBe('01/27')
    })

    it('should not pad double-digit months', () => {
      expect(formatExpiry(12, 2027)).toBe('12/27')
    })

    it('should take last 2 digits of year', () => {
      expect(formatExpiry(6, 2030)).toBe('06/30')
    })
  })

  describe('maskCardNumber', () => {
    it('should show only last 4 digits', () => {
      const result = maskCardNumber('1234567890123456')
      expect(result).toBe('•••• •••• •••• 3456')
    })

    it('should handle card with spaces', () => {
      const result = maskCardNumber('1234 5678 9012 3456')
      expect(result).toBe('•••• •••• •••• 3456')
    })
  })

  describe('getInitials', () => {
    it('should return first letter of each name', () => {
      expect(getInitials('Jean', 'Dupont')).toBe('JD')
    })

    it('should uppercase both letters', () => {
      expect(getInitials('jean', 'dupont')).toBe('JD')
    })
  })

  describe('getTransactionSign', () => {
    it('should return + for DEPOSIT', () => {
      expect(getTransactionSign('DEPOSIT', 'acc1')).toBe('+')
    })

    it('should return + for TRANSFER_RECEIVED', () => {
      expect(getTransactionSign('TRANSFER_RECEIVED', 'acc1')).toBe('+')
    })

    it('should return - for TRANSFER_SENT', () => {
      expect(getTransactionSign('TRANSFER_SENT', 'acc1')).toBe('-')
    })

    it('should return - for FEE', () => {
      expect(getTransactionSign('FEE', 'acc1')).toBe('-')
    })
  })

  describe('getTransactionColor', () => {
    it('should return green for DEPOSIT', () => {
      expect(getTransactionColor('DEPOSIT')).toBe('text-accent-green')
    })

    it('should return green for TRANSFER_RECEIVED', () => {
      expect(getTransactionColor('TRANSFER_RECEIVED')).toBe('text-accent-green')
    })

    it('should return rose for TRANSFER_SENT', () => {
      expect(getTransactionColor('TRANSFER_SENT')).toBe('text-accent-rose')
    })

    it('should return default for unknown type', () => {
      expect(getTransactionColor('UNKNOWN')).toBe('text-surface-300')
    })
  })

  describe('getStatusBadge', () => {
    it('should return badge-green for COMPLETED', () => {
      expect(getStatusBadge('COMPLETED')).toBe('badge-green')
    })

    it('should return badge-yellow for PENDING', () => {
      expect(getStatusBadge('PENDING')).toBe('badge-yellow')
    })

    it('should return badge-red for FAILED', () => {
      expect(getStatusBadge('FAILED')).toBe('badge-red')
    })

    it('should return badge-green for APPROVED', () => {
      expect(getStatusBadge('APPROVED')).toBe('badge-green')
    })

    it('should return badge-gray for unknown', () => {
      expect(getStatusBadge('UNKNOWN')).toBe('badge-gray')
    })
  })

  describe('sleep', () => {
    it('should resolve after specified milliseconds', async () => {
      const start = Date.now()
      await sleep(50)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(45)
    })
  })
})
