import nodemailer from 'nodemailer'
import sgMail from '@sendgrid/mail'
import postmark from 'postmark'
import twilio from 'twilio'

type EmailArgs = { to: string; subject: string; text?: string; html?: string }
type SmsArgs = { to: string; body: string }

export async function sendEmail({ to, subject, text, html }: EmailArgs) {
  const provider = (process.env.NOTIFY_PROVIDER || 'nodemailer').toLowerCase()
  const from = process.env.EMAIL_FROM || 'noreply@example.com'

  if (provider === 'postmark' && process.env.POSTMARK_TOKEN) {
    const c = new postmark.ServerClient(process.env.POSTMARK_TOKEN)
    await c.sendEmail({
      From: from,
      To: to,
      Subject: subject,
      TextBody: text,
      HtmlBody: html
    })
    return
  }

  if (provider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    await sgMail.send({ to, from, subject, text, html })
    return
  }

  const transporter = nodemailer.createTransport(
    process.env.SMTP_URL || 'smtp://localhost'
  )
  await transporter.sendMail({ from, to, subject, text, html })
}

export async function sendSms({ to, body }: SmsArgs) {
  if ((process.env.SMS_PROVIDER || 'none').toLowerCase() !== 'twilio') return
  const { TWILIO_ACCOUNT_SID: a, TWILIO_AUTH_TOKEN: t, TWILIO_FROM: f } =
    process.env
  if (!a || !t || !f) return

  const client = twilio(a, t)
  await client.messages.create({ from: f, to, body })
}
