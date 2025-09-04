// server/src/lib/mailer.ts
import nodemailer, { type Transporter } from 'nodemailer'

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true'
const EMAIL_FROM = process.env.EMAIL_FROM || 'GoalBuddy <no-reply@example.com>'

// Generic SMTP (Mailtrap/SendGrid SMTP/SES SMTP/etc.)
const SMTP_HOST = process.env.SMTP_HOST || ''
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' // true for 465

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (!EMAIL_ENABLED) return null
  if (transporter) return transporter
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

export type ShareEmailPayload = {
  to: string
  ownerEmail: string
  goalTitle: string
  goalCategory?: string | null
  targetDate?: string | null // YYYY-MM-DD
  permission: 'view' | 'checkin'
  link?: string
}

export async function sendSharedGoalEmail(p: ShareEmailPayload): Promise<boolean> {
  const tx = getTransporter()
  if (!tx) {
    console.log('[mailer] Email disabled/not configured. Would send:', p)
    return false
  }

  const subject = `Goal shared with you: ${p.goalTitle}`
  const permText = p.permission === 'checkin' ? 'Check-in (can add updates)' : 'View only'

  const html = [
    `<p><strong>${p.ownerEmail}</strong> shared a goal with you.</p>`,
    `<p><strong>Title:</strong> ${p.goalTitle}</p>`,
    p.goalCategory ? `<p><strong>Category:</strong> ${p.goalCategory}</p>` : '',
    p.targetDate ? `<p><strong>Target date:</strong> ${p.targetDate}</p>` : '',
    `<p><strong>Permission:</strong> ${permText}</p>`,
    p.link ? `<p><a href="${p.link}">Open the goal</a></p>` : '',
  ].filter(Boolean).join('\n')

  await tx.sendMail({
    from: EMAIL_FROM,
    to: p.to,
    subject,
    html,
  })

  return true
}
