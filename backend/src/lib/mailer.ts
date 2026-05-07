// src/lib/mailer.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.SMTP_FROM || 'Adullam Bank <christiandoh29@gmail.com>'
const APP_URL = process.env.APP_URL || 'http://localhost'

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Poppins', Arial, sans-serif; background: #0a0a0f; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #12121a; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e; }
    .header { background: linear-gradient(135deg, #6C3CE1 0%, #A855F7 100%); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; color: #e2e2e2; line-height: 1.6; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6C3CE1, #A855F7); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .footer { padding: 24px 32px; border-top: 1px solid #1e1e2e; color: #666; font-size: 12px; text-align: center; }
    .amount { font-size: 32px; font-weight: 700; color: #A855F7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Adullam Bank</h1>
      <p>Your trusted digital bank</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} Adullam Bank. All rights reserved.</div>
  </div>
</body>
</html>`
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const url = `${APP_URL}/auth/verify-email/${token}`
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Verify your Adullam Bank email',
    html: baseTemplate(`
      <h2>Welcome, ${name}! 👋</h2>
      <p>Thanks for joining Adullam Bank. Please verify your email address to activate your account.</p>
      <a href="${url}" class="btn">Verify Email Address</a>
      <p style="color:#666;font-size:12px">Link expires in 24 hours. If you didn't sign up, ignore this email.</p>
    `),
  })
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const url = `${APP_URL}/auth/reset-password/${token}`
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Reset your Adullam Bank password',
    html: baseTemplate(`
      <h2>Password Reset Request</h2>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <a href="${url}" class="btn">Reset Password</a>
      <p style="color:#666;font-size:12px">This link expires in <strong>15 minutes</strong>. If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    `),
  })
}

export async function sendTransferReceivedEmail(email: string, name: string, amount: number, currency: string, from: string, ref: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `You received ${currency} ${amount.toFixed(2)}`,
    html: baseTemplate(`
      <h2>Money Received 💰</h2>
      <p>Hi ${name}, you've received a transfer:</p>
      <p class="amount">+ ${currency} ${amount.toFixed(2)}</p>
      <p><strong>From:</strong> ${from}<br><strong>Reference:</strong> ${ref}</p>
      <p>The funds are now available in your account.</p>
    `),
  })
}

export async function sendTransferSentEmail(email: string, name: string, amount: number, currency: string, to: string, ref: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Transfer of ${currency} ${amount.toFixed(2)} sent`,
    html: baseTemplate(`
      <h2>Transfer Sent ✅</h2>
      <p>Hi ${name}, your transfer has been processed:</p>
      <p class="amount">- ${currency} ${amount.toFixed(2)}</p>
      <p><strong>To:</strong> ${to}<br><strong>Reference:</strong> ${ref}</p>
    `),
  })
}

export async function sendDepositApprovedEmail(email: string, name: string, amount: number, currency: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Deposit of ${currency} ${amount.toFixed(2)} approved`,
    html: baseTemplate(`
      <h2>Deposit Approved ✅</h2>
      <p>Hi ${name}, your deposit request has been approved!</p>
      <p class="amount">+ ${currency} ${amount.toFixed(2)}</p>
      <p>The funds are now available in your account.</p>
    `),
  })
}
