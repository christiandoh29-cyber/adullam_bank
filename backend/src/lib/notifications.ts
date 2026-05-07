// src/lib/notifications.ts
import { prisma } from './prisma'
import type { NotificationType } from '@prisma/client'
import type { Prisma } from '@prisma/client'

interface CreateNotification {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Prisma.InputJsonValue
}

export async function createNotification(data: CreateNotification) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
    },
  })
}

export async function notifyTransferReceived(
  userId: string,
  firstName: string,
  lastName: string,
  amount: number,
  currency: string,
  reference: string
) {
  return createNotification({
    userId,
    type: 'TRANSFER_RECEIVED',
    title: 'Transfer received',
    message: `${firstName} ${lastName} sent you ${currency} ${amount.toFixed(2)}`,
    metadata: { reference },
  })
}

export async function notifyTransferSent(
  userId: string,
  recipientName: string,
  amount: number,
  currency: string,
  reference: string
) {
  return createNotification({
    userId,
    type: 'TRANSFER_SENT',
    title: 'Transfer sent',
    message: `You sent ${currency} ${amount.toFixed(2)} to ${recipientName}`,
    metadata: { reference },
  })
}

export async function notifyDepositApproved(
  userId: string,
  amount: number,
  currency: string
) {
  return createNotification({
    userId,
    type: 'DEPOSIT_APPROVED',
    title: 'Deposit approved',
    message: `Your deposit of ${currency} ${amount.toFixed(2)} has been approved and credited to your account`,
  })
}

export async function notifyDepositRejected(
  userId: string,
  amount: number,
  currency: string,
  reason?: string
) {
  return createNotification({
    userId,
    type: 'DEPOSIT_REJECTED',
    title: 'Deposit rejected',
    message: `Your deposit request of ${currency} ${amount.toFixed(2)} was rejected${reason ? `: ${reason}` : ''}`,
  })
}

export async function notifyCardCreated(
  userId: string,
  network: string
) {
  return createNotification({
    userId,
    type: 'CARD_CREATED',
    title: 'New card created',
    message: `Your new ${network} virtual card has been created successfully`,
  })
}

export async function notifyCardBlocked(
  userId: string,
  network: string
) {
  return createNotification({
    userId,
    type: 'CARD_BLOCKED',
    title: 'Card blocked',
    message: `Your ${network} card has been blocked as requested`,
  })
}
