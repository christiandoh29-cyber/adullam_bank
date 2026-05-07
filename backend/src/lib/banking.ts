// src/lib/banking.ts
import { v4 as uuidv4 } from 'uuid'

const BANK_CODE = '30006'
const BRANCH_CODE = '00001'

export function generateAccountNumber(): string {
  return Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('')
}

/**
 * Compute French RIB key (2-digit check key)
 * Replaces letters A-Z with numbers (A=1, B=2, ..., Z=26) then applies modulo 97 rule
 */
export function computeRibKey(bankCode: string, branchCode: string, accountNumber: string): string {
  const letterToNum = (s: string): string =>
    s.split('').map((c) => {
      const code = c.charCodeAt(0)
      return code >= 65 && code <= 90 ? String(code - 64) : c
    }).join('')

  const numStr = letterToNum(`${bankCode}${branchCode}${accountNumber}`)
  const key = 97 - Number(BigInt(numStr + '00') % 97n)
  return String(key === 97 ? 0 : key).padStart(2, '0')
}

/**
 * Generate French IBAN from RIB components
 */
export function generateIBAN(bankCode: string, branchCode: string, accountNumber: string, ribKey: string): string {
  const bban = `${bankCode}${branchCode}${accountNumber}${ribKey}`
  const rearranged = `${bban}FR00`
  const numericStr = rearranged
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0)
      return code >= 65 && code <= 90 ? String(code - 55) : c
    })
    .join('')
  const checkDigits = String(98 - Number(BigInt(numericStr) % 97n)).padStart(2, '0')
  const raw = `FR${checkDigits}${bban}`
  return raw.replace(/(.{4})/g, '$1 ').trim()
}

export interface BankingInfo {
  accountNumber: string
  bankCode: string
  branchCode: string
  ribKey: string
  iban: string
}

export function generateBankingInfo(): BankingInfo {
  const accountNumber = generateAccountNumber()
  const ribKey = computeRibKey(BANK_CODE, BRANCH_CODE, accountNumber)
  const iban = generateIBAN(BANK_CODE, BRANCH_CODE, accountNumber, ribKey)
  return { accountNumber, bankCode: BANK_CODE, branchCode: BRANCH_CODE, ribKey, iban }
}

/**
 * Generate a Luhn-valid card number for given BIN prefix
 */
export function generateCardNumber(prefix: string = '4539'): string {
  const partial = prefix + Array.from({ length: 15 - prefix.length }, () => Math.floor(Math.random() * 10)).join('')
  let sum = 0
  let double = true
  for (let i = partial.length - 1; i >= 0; i--) {
    let digit = parseInt(partial[i])
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return partial + checkDigit
}

export function generateCVV(): string {
  return String(Math.floor(100 + Math.random() * 900))
}

export function generateCardExpiry(): { month: number; year: number } {
  const now = new Date()
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear() + 4,
  }
}

export function generateTransactionReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()
  return `ADL-${timestamp}-${random}`
}

/**
 * Calculate transfer fee (0.5% capped at 10 EUR, free under 10 EUR)
 */
export function calculateFee(amount: number): number {
  if (amount <= 10) return 0
  return Math.min(amount * 0.005, 10)
}

/**
 * Format IBAN for display (groups of 4)
 */
export function formatIBAN(iban: string): string {
  return iban.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
}
