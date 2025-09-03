type Email = { to: string; subject: string; text: string }

export async function sendEmail({ to, subject, text }: Email) {
  const provider = (process.env.NOTIFY_PROVIDER || '').toLowerCase()

  if (provider === 'postmark' && process.env.POSTMARK_TOKEN) {
    const r = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': process.env.POSTMARK_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: process.env.EMAIL_FROM || 'noreply@example.com',
        To: to,
        Subject: subject,
        TextBody: text,
      }),
    })
    if (!r.ok) console.error('Postmark error', await r.text())
    return
  }

  if (provider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: (process.env.EMAIL_FROM || 'noreply@example.com').replace(/.*<|>/g, '') },
        subject,
        content: [{ type: 'text/plain', value: text }],
      }),
    })
    if (!r.ok) console.error('SendGrid error', await r.text())
    return
  }

  // Fallback: log (ingen ekstern afsender sat op)
  console.log('[notify] email fallback:', { to, subject, text })
}
