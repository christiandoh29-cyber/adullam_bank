// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmount(amount: number | string, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount))
}

export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(.{4})/g, '$1 ').trim()
}

export function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy', { locale: fr })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr })
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
}

export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\s/g, '')
  return `•••• •••• •••• ${clean.slice(-4)}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}

export function getTransactionSign(type: string, myAccountId: string, fromAccountId?: string): '+' | '-' {
  if (type === 'DEPOSIT' || type === 'TRANSFER_RECEIVED') return '+'
  if (type === 'TRANSFER_SENT' || type === 'FEE') return '-'
  return fromAccountId === myAccountId ? '-' : '+'
}

export function getTransactionColor(type: string): string {
  switch (type) {
    case 'DEPOSIT':
    case 'TRANSFER_RECEIVED':
      return 'text-accent-green'
    case 'TRANSFER_SENT':
    case 'FEE':
      return 'text-accent-rose'
    default:
      return 'text-surface-300'
  }
}

export function getStatusBadge(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'badge-green'
    case 'PENDING': return 'badge-yellow'
    case 'FAILED':
    case 'CANCELLED':
    case 'REJECTED': return 'badge-red'
    case 'APPROVED': return 'badge-green'
    default: return 'badge-gray'
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
