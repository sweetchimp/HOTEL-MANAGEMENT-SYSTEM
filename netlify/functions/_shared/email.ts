// ============================================================
// Email Service — SMTP via nodemailer, console-log fallback
// Env: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
// When SMTP_HOST is unset, emails are logged to console instead.
// ============================================================

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export interface SendEmailResult {
  sent: boolean
  mode: 'smtp' | 'log' | 'skipped'
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const host = process.env.SMTP_HOST
    if (!host) {
      console.log(`[EMAIL:LOG] To: ${opts.to} | Subject: ${opts.subject}`)
      return { sent: true, mode: 'log' }
    }

    const { createTransport } = await import('nodemailer')
    const port = Number(process.env.SMTP_PORT || 587)
    const secure = process.env.SMTP_SECURE === 'true' || port === 465

    const transporter = createTransport({
      host,
      port,
      secure,
      ...(process.env.SMTP_USER && {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        },
      }),
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@altonshotel.com',
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })

    return { sent: true, mode: 'smtp' }
  } catch (err) {
    console.error('[EMAIL] send failed:', err instanceof Error ? err.message : err)
    return { sent: false, mode: 'skipped' }
  }
}
