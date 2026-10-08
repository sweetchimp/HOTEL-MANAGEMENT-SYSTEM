import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { formatCurrency } from '../utils/currency'
import type { InvoiceDetail, InvoiceBalance } from '../types'

type RGB = [number, number, number]

const YALE_BLUE: RGB = [15, 59, 89]     // #0f3b59
const GOLDENROD: RGB = [219, 161, 44]    // #dba12c
const STEEL: RGB = [125, 146, 158]       // #7d929e
const DUST: RGB = [219, 212, 204]        // #dbd4cc
const INK: RGB = [26, 26, 26]            // #1a1a1a
const PAPER: RGB = [246, 245, 243]       // alternating row fill

const PAGE_MARGIN = 14
const PAGE_W = 210
const PAGE_H = 297
const HEADER_H = 26
const CONTENT_TOP = 36
const CONTENT_BOTTOM = 274

const STATUS_COLORS: Record<string, { text: RGB; bg: RGB }> = {
  PENDING: { text: [161, 98, 7], bg: [254, 243, 199] },
  PAID: { text: [22, 101, 52], bg: [220, 252, 231] },
  PARTIALLY_PAID: { text: [15, 59, 89], bg: [219, 234, 254] },
  CANCELLED: { text: [185, 28, 28], bg: [254, 226, 226] },
}

interface LogoAsset {
  dataUrl: string
  aspect: number
}

let logoPromise: Promise<LogoAsset | null> | null = null

function loadLogo(): Promise<LogoAsset | null> {
  if (!logoPromise) {
    logoPromise = (async () => {
      try {
        const res = await fetch('/AH_Logo.png')
        if (!res.ok) return null
        const blob = await res.blob()
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error('Failed to read logo'))
          reader.readAsDataURL(blob)
        })
        const aspect: number = await new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve(img.naturalWidth / Math.max(1, img.naturalHeight))
          img.onerror = () => resolve(1)
          img.src = dataUrl
        })
        return { dataUrl, aspect }
      } catch {
        return null
      }
    })()
  }
  return logoPromise
}

function drawHeader(doc: jsPDF, title: string, subtitle: string, logo: LogoAsset | null) {
  doc.setFillColor(...YALE_BLUE)
  doc.rect(0, 0, PAGE_W, HEADER_H, 'F')
  doc.setFillColor(...GOLDENROD)
  doc.rect(0, HEADER_H, PAGE_W, 1.2, 'F')

  let textX = PAGE_MARGIN
  if (logo) {
    const h = 15
    const w = h * logo.aspect
    doc.addImage(logo.dataUrl, 'PNG', PAGE_MARGIN, (HEADER_H - h) / 2, w, h)
    textX = PAGE_MARGIN + w + 6
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(title, textX, 13.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...DUST)
  doc.text(subtitle, textX, 19.5)

  doc.setFontSize(8)
  doc.text(`Generated ${new Date().toLocaleString()}`, PAGE_W - PAGE_MARGIN, 13.5, { align: 'right' })
}

function drawFooters(doc: jsPDF) {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setDrawColor(...DUST)
    doc.setLineWidth(0.3)
    doc.line(PAGE_MARGIN, PAGE_H - 9, PAGE_W - PAGE_MARGIN, PAGE_H - 9)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...STEEL)
    doc.text(`© ${new Date().getFullYear()} ALTONS Hotel · Management System`, PAGE_MARGIN, PAGE_H - 5.5)
    doc.text(`Page ${i} of ${total}`, PAGE_W - PAGE_MARGIN, PAGE_H - 5.5, { align: 'right' })
  }
}

function getLastTableFinalY(doc: jsPDF, fallback: number): number {
  const last = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
  return last && typeof last.finalY === 'number' ? last.finalY : fallback
}

function moveToLastPage(doc: jsPDF) {
  doc.setPage(doc.getNumberOfPages())
}

function rightAlignedColumnStyles(count: number): Record<number, { halign: 'right' }> {
  const styles: Record<number, { halign: 'right' }> = {}
  for (let i = 1; i < count; i++) styles[i] = { halign: 'right' }
  return styles
}

function tableDefaults() {
  return {
    theme: 'grid' as const,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2.4,
      textColor: INK,
      lineColor: DUST,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: YALE_BLUE,
      textColor: 255 as number,
      fontStyle: 'bold' as const,
    },
    alternateRowStyles: { fillColor: PAPER },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: CONTENT_TOP, bottom: 22 },
  }
}

export interface ReportPdfInput {
  title: string
  subtitle?: string
  filename: string
  columns: string[]
  rows: string[][]
}

export async function exportReportPdf(input: ReportPdfInput): Promise<void> {
  const logo = await loadLogo()
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  drawHeader(doc, input.title, input.subtitle || 'ALTONS Hotel · Management System', logo)

  const body = input.rows.length > 0
    ? input.rows
    : [['No data available', ...Array.from({ length: Math.max(0, input.columns.length - 1) }, () => '')]]

  autoTable(doc, {
    head: [input.columns],
    body,
    startY: CONTENT_TOP,
    ...tableDefaults(),
    columnStyles: rightAlignedColumnStyles(input.columns.length),
  })

  drawFooters(doc)
  doc.save(`${input.filename}.pdf`)
}

function sectionLabel(doc: jsPDF, label: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...STEEL)
  doc.text(label.toUpperCase(), x, y)
}

function metaValue(doc: jsPDF, value: string, x: number, y: number, bold = false) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK)
  doc.text(value, x, y)
}

export async function exportInvoicePdf(
  detail: InvoiceDetail,
  balance: InvoiceBalance | null,
): Promise<void> {
  const logo = await loadLogo()
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const inv = detail.invoice
  drawHeader(doc, `INVOICE #${inv.invoice_id}`, 'ALTONS Hotel · Management System', logo)

  const statusKey = inv.status
  const status = STATUS_COLORS[statusKey] || { text: INK, bg: PAPER }
  const statusLabel = statusKey.replace(/_/g, ' ')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  const pillW = doc.getTextWidth(statusLabel) + 8
  doc.setFillColor(...status.bg)
  doc.roundedRect(PAGE_W - PAGE_MARGIN - pillW, 36, pillW, 7, 3.5, 3.5, 'F')
  doc.setTextColor(...status.text)
  doc.text(statusLabel, PAGE_W - PAGE_MARGIN - pillW / 2, 40.6, { align: 'center' })

  const guest = inv.guest
  const guestName = guest ? `${guest.first_name} ${guest.last_name}`.trim() : '—'

  sectionLabel(doc, 'Billed To', PAGE_MARGIN, 50)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text(guestName, PAGE_MARGIN, 56)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...STEEL)
  if (guest?.email) doc.text(guest.email, PAGE_MARGIN, 61)
  if (guest?.phone) doc.text(guest.phone, PAGE_MARGIN, 65.5)

  const metaX = 115
  sectionLabel(doc, 'Invoice Details', metaX, 50)
  metaValue(doc, `Invoice #: ${inv.invoice_id}`, metaX, 56)
  metaValue(doc, `Date: ${new Date(inv.created_at).toLocaleDateString()}`, metaX, 61)
  metaValue(doc, `Booking ID: ${inv.booking ? inv.booking.booking_id : '—'}`, metaX, 65.5)

  autoTable(doc, {
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: detail.items.length > 0
      ? detail.items.map((item) => [
          item.description,
          String(item.quantity),
          formatCurrency(Number(item.unit_price)),
          formatCurrency(Number(item.total)),
        ])
      : [['No items added', '', '', '']],
    startY: 74,
    ...tableDefaults(),
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  })

  moveToLastPage(doc)
  let itemsEnd = getLastTableFinalY(doc, 74)
  if (itemsEnd + 64 > CONTENT_BOTTOM) {
    doc.addPage()
    itemsEnd = 24
  }
  const paymentsStart = itemsEnd + 14

  autoTable(doc, {
    head: [['Date', 'Method', 'Amount', 'Reference']],
    body: detail.payments.length > 0
      ? detail.payments.map((p) => [
          new Date(p.payment_date).toLocaleDateString(),
          p.payment_method.replace(/_/g, ' '),
          formatCurrency(Number(p.amount)),
          p.reference_number || '—',
        ])
      : [['No payments recorded.', '', '', '']],
    startY: paymentsStart,
    ...tableDefaults(),
    columnStyles: { 2: { halign: 'right' } },
  })

  moveToLastPage(doc)
  const paymentsEnd = getLastTableFinalY(doc, paymentsStart)
  const totalAmount = Number(inv.total_amount)
  const totalPaid = balance ? Number(balance.total_paid) : detail.payments.reduce((s, p) => s + Number(p.amount), 0)
  const remaining = balance ? Number(balance.balance) : totalAmount - totalPaid

  let totalsY = paymentsEnd + 12
  if (totalsY + 34 > CONTENT_BOTTOM) {
    doc.addPage()
    totalsY = 30
  }

  const valueX = PAGE_W - PAGE_MARGIN
  const labelX = 120

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...STEEL)
  doc.text('Total', labelX, totalsY)
  doc.setTextColor(...INK)
  doc.text(formatCurrency(totalAmount), valueX, totalsY, { align: 'right' })

  doc.setTextColor(...STEEL)
  doc.text('Total Paid', labelX, totalsY + 6)
  doc.setTextColor(...INK)
  doc.text(formatCurrency(totalPaid), valueX, totalsY + 6, { align: 'right' })

  doc.setDrawColor(...GOLDENROD)
  doc.setLineWidth(0.6)
  doc.line(labelX, totalsY + 9.5, valueX, totalsY + 9.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text('Balance Due', labelX, totalsY + 16)
  doc.text(formatCurrency(remaining), valueX, totalsY + 16, { align: 'right' })

  drawFooters(doc)
  doc.save(`invoice-${inv.invoice_id}.pdf`)
}
