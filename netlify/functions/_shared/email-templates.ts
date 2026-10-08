// ============================================================
// Branded HTML Email Templates — Public Booking Workflow
// ============================================================

export interface EmailContent {
  subject: string
  html: string
}

const NAVY = '#0f3b59'
const GOLD = '#dba12c'
const INK = '#1a1a1a'
const STEEL = '#7d929e'
const DUST = '#dbd4cc'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmtDate(value: string): string {
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return value
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return `${DAYS[date.getUTCDay()]}, ${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`
}

function fmtMoney(usd: number): string {
  const ugx = Math.round(usd * 3700).toLocaleString('en-US')
  return `UGX ${ugx} <span style="color:${STEEL};font-size:13px">(USD ${usd})</span>`
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f4f2ee;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2ee;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid ${DUST};">
        <tr>
          <td style="background-color:${NAVY};padding:22px 32px;">
            <div style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:2px;">ALTONS HOTEL</div>
            <div style="color:${GOLD};font-size:12px;letter-spacing:3px;margin-top:2px;">STAY IN COMFORT</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:${NAVY};">${title}</h1>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background-color:${NAVY};padding:18px 32px;color:#cfd8de;font-size:12px;line-height:1.6;">
            Altons Hotel &middot; 123 Main Street, City<br>
            +1-555-0100 &middot; info@altonshotel.com
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function detailsTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${DUST};border-radius:6px;margin:0 0 20px;">
    ${rows}
  </table>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;border-bottom:1px solid ${DUST};color:${STEEL};font-size:13px;width:40%;">${label}</td>
    <td style="padding:10px 16px;border-bottom:1px solid ${DUST};color:${INK};font-size:14px;font-weight:bold;">${value}</td>
  </tr>`
}

const FOOTER_NOTE = `<p style="color:${STEEL};font-size:13px;line-height:1.6;margin:20px 0 0;">
  If you have any questions, reply to this email or contact us at +1-555-0100.
</p>`

export function bookingReceivedEmail(d: {
  guest_name: string
  booking_id: number
  room_type_name: string
  check_in_date: string
  check_out_date: string
  num_guests: number
  total: number
}): EmailContent {
  const subject = `Booking request received — #${d.booking_id}`
  const html = layout(
    'Booking Request Received',
    `<p style="color:${INK};font-size:14px;line-height:1.6;margin:0 0 20px;">Dear ${d.guest_name},</p>
     <p style="color:${INK};font-size:14px;line-height:1.6;margin:0 0 20px;">
       Thank you! We have received your booking request. Our team will review it and confirm shortly — you will receive another email once it is approved.
     </p>
     ${detailsTable(
       detailRow('Reference', `#${d.booking_id}`) +
       detailRow('Room type', d.room_type_name) +
       detailRow('Check-in', fmtDate(d.check_in_date) + ' &middot; from 14:00') +
       detailRow('Check-out', fmtDate(d.check_out_date) + ' &middot; by 12:00') +
       detailRow('Guests', String(d.num_guests)) +
       detailRow('Estimated total', fmtMoney(d.total))
     )}
     <div style="background-color:#fdf6e7;border-left:4px solid ${GOLD};padding:12px 16px;border-radius:4px;margin:0 0 8px;">
       <span style="color:${INK};font-size:13px;font-weight:bold;">Status: Pending review</span>
     </div>
     ${FOOTER_NOTE}`
  )
  return { subject, html }
}

export function bookingApprovedEmail(d: {
  guest_name: string
  booking_id: number
  room_type_name: string
  check_in_date: string
  check_out_date: string
  num_guests: number
  total: number
}): EmailContent {
  const subject = `Booking confirmed — #${d.booking_id}`
  const html = layout(
    'Your Booking is Confirmed',
    `<p style="color:${INK};font-size:14px;line-height:1.6;margin:0 0 20px;">Dear ${d.guest_name},</p>
     <p style="color:${INK};font-size:14px;line-height:1.6;margin:0 0 20px;">
       Great news — your booking request has been approved. We look forward to welcoming you!
     </p>
     ${detailsTable(
       detailRow('Reference', `#${d.booking_id}`) +
       detailRow('Room type', d.room_type_name) +
       detailRow('Check-in', fmtDate(d.check_in_date) + ' &middot; from 14:00') +
       detailRow('Check-out', fmtDate(d.check_out_date) + ' &middot; by 12:00') +
       detailRow('Guests', String(d.num_guests)) +
       detailRow('Total', fmtMoney(d.total))
     )}
     <div style="background-color:#eef6ee;border-left:4px solid #3f9d54;padding:12px 16px;border-radius:4px;margin:0 0 8px;">
       <span style="color:${INK};font-size:13px;font-weight:bold;">Status: Confirmed</span>
     </div>
     ${FOOTER_NOTE}`
  )
  return { subject, html }
}

export function bookingRejectedEmail(d: {
  guest_name: string
  booking_id: number
  room_type_name: string
  check_in_date: string
  check_out_date: string
  reason?: string | null
}): EmailContent {
  const subject = `Booking request update — #${d.booking_id}`
  const html = layout(
    'Booking Request Update',
    `<p style="color:${INK};font-size:14px;line-height:1.6;margin:0 0 20px;">Dear ${d.guest_name},</p>
     <p style="color:${INK};font-size:14px;line-height:1.6;margin:0 0 20px;">
       Unfortunately we are unable to accommodate your booking request for the selected dates. Please see the details below.
     </p>
     ${detailsTable(
       detailRow('Reference', `#${d.booking_id}`) +
       detailRow('Room type', d.room_type_name) +
       detailRow('Requested', `${fmtDate(d.check_in_date)} &rarr; ${fmtDate(d.check_out_date)}`) +
       (d.reason ? detailRow('Reason', d.reason) : '')
     )}
     <div style="background-color:#fdf0ee;border-left:4px solid #c0563f;padding:12px 16px;border-radius:4px;margin:0 0 8px;">
       <span style="color:${INK};font-size:13px;font-weight:bold;">Status: Not approved</span>
     </div>
     <p style="color:${INK};font-size:14px;line-height:1.6;margin:16px 0 0;">
       You are welcome to try alternative dates — we would be happy to help you find another stay.
     </p>
     ${FOOTER_NOTE}`
  )
  return { subject, html }
}
