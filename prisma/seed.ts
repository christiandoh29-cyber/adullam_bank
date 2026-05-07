// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function generateAccountNumber(): string {
  return Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('')
}

function computeRibKey(bankCode: string, branchCode: string, accountNumber: string): string {
  const num = `${bankCode}${branchCode}${accountNumber}`
    .split('')
    .map((c) => (isNaN(Number(c)) ? c.charCodeAt(0) - 55 : c))
    .join('')
  const key = 97 - (Number(BigInt(num + '00') % 97n))
  return String(key).padStart(2, '0')
}

function generateIBAN(bankCode: string, branchCode: string, accountNumber: string, ribKey: string): string {
  const bban = `${bankCode}${branchCode}${accountNumber}${ribKey}`
  const numericIban = `${bban}FR00`
    .split('')
    .map((c) => (isNaN(Number(c)) ? c.charCodeAt(0) - 55 : c))
    .join('')
  const checkDigits = String(98 - Number(BigInt(numericIban) % 97n)).padStart(2, '0')
  const grouped = bban.match(/.{1,4}/g)?.join(' ') ?? bban
  return `FR${checkDigits} ${grouped}`
}

async function main() {
  console.log('🌱 Seeding Adullam Bank database...')

  // Admin user
  const adminPassword = await bcrypt.hash('Hacker@117', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'christiandoh29@gmail.com' },
    update: {},
    create: {
      email: 'christiandoh29@gmail.com',
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Christian nundo',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Demo user
  const demoPassword = await bcrypt.hash('Hacker@117', 12)
  const bankCode = '30006'
  const branchCode = '00001'
  const accountNumber = generateAccountNumber()
  const ribKey = computeRibKey(bankCode, branchCode, accountNumber)
  const iban = generateIBAN(bankCode, branchCode, accountNumber, ribKey)

  const demo = await prisma.user.upsert({
    where: { email: 'christiandoh99@gmail.com' },
    update: {},
    create: {
      email: 'christiandoh99@gmail.com',
      password: demoPassword,
      firstName: 'Christian',
      lastName: 'Doh Lah',
      role: 'USER',
      isEmailVerified: true,
      accounts: {
        create: {
          accountNumber,
          bankCode,
          branchCode,
          ribKey,
          iban,
          balance: 5000,
          cards: {
            create: {
              cardNumber: '4539' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join(''),
              cardHolder: 'JEAN DUPONT',
              expiryMonth: new Date().getMonth() + 1,
              expiryYear: new Date().getFullYear() + 4,
              cvv: String(Math.floor(100 + Math.random() * 900)),
              network: 'VISA',
            },
          },
        },
      },
    },
  })
  console.log('✅ Demo user created:', demo.email)
  console.log('\n📋 Credentials:')
  console.log('  Admin → christiandoh29@gmail.com / ....')
  console.log('  Demo  → christiandoh99@gmail.com  /....')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
