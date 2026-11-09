import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

let transport = null
function getTransport() {
  if (!env.mailConfigured) return null
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === 'true', // true for port 465 (Gmail), false for 587/STARTTLS
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
  return transport
}

// Sends an email. Never throws: a mail problem must not break the request that triggered it.
// Returns { sent: boolean }.
export async function sendMail({ to, subject, text, html }) {
  const t = getTransport()
  if (!t) {
    // Development without SMTP: show the email here so the flow can still be tried
    console.log(`\n── EMAIL (SMTP not configured, so it was NOT sent) ──\nTo: ${to}\nSubject: ${subject}\n\n${text}\n──────────────────────────────────────\n`)
    return { sent: false }
  }
  try {
    await t.sendMail({ from: env.MAIL_FROM || env.SMTP_USER, to, subject, text, html })
    return { sent: true }
  } catch (err) {
    console.error('Email failed to send:', err.message)
    return { sent: false }
  }
}
