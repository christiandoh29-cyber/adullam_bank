// src/lib/receipt.ts
import { jsPDF } from 'jspdf'
import { formatAmount, formatDateTime } from './utils'

interface ReceiptTransaction {
  id: string
  reference: string
  type: string
  status: string
  amount: number | string
  fee: number | string
  currency: string
  description?: string
  createdAt: string
  fromAccountId?: string
  toAccountId?: string
  fromAccount?: {
    iban?: string
    accountNumber?: string
    user?: { id?: string; firstName?: string; lastName?: string }
  }
  toAccount?: {
    iban?: string
    accountNumber?: string
    user?: { id?: string; firstName?: string; lastName?: string }
  }
}

export function downloadReceipt(tx: ReceiptTransaction) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  // eslint-disable-next-line no-useless-assignment
  let y = 20

  const isCredit = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED'
  const counterparty = isCredit ? tx.fromAccount : tx.toAccount
  const myAccount = isCredit ? tx.toAccount : tx.fromAccount
  const amount = Number(tx.amount)
  const fee = Number(tx.fee)
  const currency = tx.currency

  const BRAND_PURPLE = [108, 60, 225] as [number, number, number]
  const BRAND_LIGHT = [168, 85, 247] as [number, number, number]

  // Header background
  doc.setFillColor(10, 10, 15)
  doc.rect(0, 0, pageWidth, 50, 'F')

  // Brand name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('ADULLAM BANK', margin, 22)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 200)
  doc.text('Digital Banking Platform', margin, 30)

  // Receipt label
  doc.setTextColor(...BRAND_PURPLE as [number, number, number])
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TRANSACTION RECEIPT', pageWidth - margin, 22, { align: 'right' })

  doc.setTextColor(180, 180, 200)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Official Transaction Record', pageWidth - margin, 30, { align: 'right' })

  y = 65

  // Amount section
  doc.setFillColor(...BRAND_PURPLE as [number, number, number])
  doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 3, 3, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(isCredit ? 'AMOUNT RECEIVED' : 'AMOUNT SENT', margin + 5, y + 10)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(`${isCredit ? '+' : '-'}${formatAmount(amount, currency)}`, margin + 5, y + 23)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(220, 220, 255)
  doc.text(tx.type.replace(/_/g, ' '), pageWidth - margin - 5, y + 15, { align: 'right' })

  y += 45

  // Transaction details
  const addRow = (label: string, value: string, yPos: number) => {
    doc.setFillColor(15, 15, 25)
    doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'F')
    doc.setTextColor(120, 120, 150)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(label, margin + 3, yPos + 7)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(value, pageWidth - margin - 3, yPos + 7, { align: 'right' })
    return yPos + 10
  }

  const rows = [
    ['Reference', tx.reference],
    ['Status', tx.status],
    ['Date & Time', formatDateTime(tx.createdAt)],
    ['Fee', fee > 0 ? formatAmount(fee, currency) : 'Free'],
    ...(tx.description ? [['Description', tx.description]] : []),
  ]

  for (const [label, value] of rows) {
    y = addRow(label, value, y) + 2
  }

  y += 5

  // Counterparty section
  if (counterparty) {
    const name = `${counterparty.user?.firstName ?? ''} ${counterparty.user?.lastName ?? ''}`.trim()
    if (name) {
      doc.setFillColor(...BRAND_PURPLE as [number, number, number])
      doc.rect(margin, y, pageWidth - margin * 2, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(isCredit ? 'RECEIVED FROM' : 'SENT TO', margin + 3, y + 5.5)
      y += 12

      doc.setFillColor(15, 15, 25)
      doc.rect(margin, y, pageWidth - margin * 2, 25, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(name, margin + 5, y + 10)
      doc.setTextColor(120, 120, 150)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      if (counterparty.iban) doc.text(`IBAN: ${counterparty.iban}`, margin + 5, y + 18)
      if (counterparty.accountNumber) doc.text(`Account: ${counterparty.accountNumber}`, margin + 5, y + 23)
      y += 30
    }
  }

  // My account section
  if (myAccount && (myAccount.iban || myAccount.accountNumber)) {
    doc.setFillColor(...BRAND_LIGHT as [number, number, number])
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('YOUR ACCOUNT', margin + 3, y + 5.5)
    y += 12

    doc.setFillColor(15, 15, 25)
    doc.rect(margin, y, pageWidth - margin * 2, 18, 'F')
    doc.setTextColor(120, 120, 150)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    if (myAccount.iban) doc.text(`IBAN: ${myAccount.iban}`, margin + 5, y + 7)
    if (myAccount.accountNumber) doc.text(`Account: ${myAccount.accountNumber}`, margin + 5, y + 14)
  }

  // Footer
  y = doc.internal.pageSize.getHeight() - 20
  doc.setTextColor(80, 80, 100)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('This is an official transaction receipt from Adullam Bank.', margin, y)
  doc.text(`Generated on ${new Date().toLocaleString('fr-FR')} — Adullam Bank | adullam.bank`, margin, y + 5)
  doc.text('ADL-' + tx.reference, pageWidth - margin, y + 5, { align: 'right' })

  doc.save(`adullam-receipt-${tx.reference}.pdf`)
}
