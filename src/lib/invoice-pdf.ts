/**
 * Pure TypeScript PDF Builder for SN AttarWala Tax Invoices.
 * Generates valid PDF 1.4 documents with vector styling, brand headers,
 * itemized tax tables, and customer dispatch details without external npm dependencies.
 */

export interface InvoiceOrder {
  order_number: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  payment_method?: string;
  payment_status?: string;
  razorpay_payment_id?: string;
  courier_partner?: string;
  subtotal?: number;
  discount_amount?: number;
  shipping_amount?: number;
  total_amount?: number;
  coupon_code?: string;
  items?: any[];
  order_items?: any[];
}

export function buildInvoicePdfBlob(order: InvoiceOrder): Blob {
  const items = (Array.isArray(order.order_items) && order.order_items.length > 0)
    ? order.order_items
    : (Array.isArray(order.items) && order.items.length > 0)
    ? order.items
    : [{ name: "Luxury Fragrance", quantity: 1, unit_price: order.total_amount || 0, total_price: order.total_amount || 0 }]

  const subtotal = Number(order.subtotal) || Number(order.total_amount) || 0
  const shipping = Number(order.shipping_amount) || 0
  const discount = Number(order.discount_amount) || 0
  const total = Number(order.total_amount) || 0
  const invoiceNum = `INV-${order.order_number?.replace(/[^0-9]/g, "") || "349701"}`
  const dateStr = new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const esc = (s: any) => String(s || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")

  let stream = ""
  function drawText(font: string, size: number, x: number, y: number, text: string, color: number[] = [0, 0, 0]) {
    stream += `${color[0]} ${color[1]} ${color[2]} rg\n`
    stream += `BT /${font} ${size} Tf ${x} ${y} Td (${esc(text)}) Tj ET\n`
  }

  function drawRect(x: number, y: number, w: number, h: number, fill: number[] | null = null, stroke: number[] | null = null, strokeWidth: number = 1) {
    stream += "q\n"
    if (stroke) {
      stream += `${strokeWidth} w ${stroke[0]} ${stroke[1]} ${stroke[2]} RG\n`
    }
    if (fill) {
      stream += `${fill[0]} ${fill[1]} ${fill[2]} rg\n`
    }
    stream += `${x} ${y} ${w} ${h} re ${fill && stroke ? "B" : fill ? "f" : "S"}\n`
    stream += "Q\n"
  }

  function drawLine(x1: number, y1: number, x2: number, y2: number, color: number[] = [0.8, 0.8, 0.8], width: number = 0.5) {
    stream += `q ${width} w ${color[0]} ${color[1]} ${color[2]} RG ${x1} ${y1} m ${x2} ${y2} l S Q\n`
  }

  // Header band
  drawRect(40, 735, 515, 70, [0.97, 0.96, 0.94], [0.85, 0.80, 0.70])
  drawText("F2", 18, 55, 780, "SN ATTARWALA", [0.1, 0.1, 0.1])
  drawText("F1", 8, 55, 766, "HOUSE OF LUXURY FRAGRANCES & PURE ATTARS", [0.65, 0.50, 0.15])
  drawText("F1", 7.5, 55, 750, "Shop 14, Royal Arcade, Mohammed Ali Road, Mumbai - 400003 | GSTIN: 27AABCS1429B1Z8", [0.35, 0.35, 0.35])

  // Invoice Title
  drawText("F2", 14, 430, 780, "TAX INVOICE", [0.75, 0.55, 0.15])
  drawText("F2", 10, 430, 765, invoiceNum, [0.1, 0.1, 0.1])
  drawText("F1", 8, 430, 750, `Date: ${dateStr}`, [0.35, 0.35, 0.35])

  // Customer & Details box
  drawRect(40, 640, 515, 85, [0.99, 0.99, 0.99], [0.88, 0.88, 0.88])
  drawText("F2", 8.5, 55, 708, "BILLED & SHIPPED TO:", [0.5, 0.5, 0.5])
  drawText("F2", 10, 55, 694, order.customer_name || order.shipping_name || "Valued Customer", [0.1, 0.1, 0.1])

  const fullAddr = order.customer_address || [
    order.shipping_address_line1,
    order.shipping_address_line2,
    order.shipping_city,
    order.shipping_state,
    order.shipping_pincode
  ].filter(Boolean).join(", ") || "Mumbai, Maharashtra"

  drawText("F1", 8, 55, 680, fullAddr.slice(0, 55), [0.3, 0.3, 0.3])
  const phone = order.customer_phone || order.shipping_phone || "Not provided"
  const email = order.customer_email || "Not provided"
  drawText("F1", 8, 55, 668, `Phone: ${phone} | Email: ${email}`, [0.3, 0.3, 0.3])

  drawText("F2", 8.5, 360, 708, "ORDER & PAYMENT DETAILS:", [0.5, 0.5, 0.5])
  drawText("F1", 8, 360, 694, `Order ID: #${order.order_number}`, [0.2, 0.2, 0.2])
  drawText("F1", 8, 360, 680, `Payment: ${order.payment_method || "Razorpay"} (Paid & Verified)`, [0.1, 0.6, 0.2])
  drawText("F1", 8, 360, 668, `Courier: ${order.courier_partner || "BlueDart Express"}`, [0.3, 0.3, 0.3])

  // Table Header
  drawRect(40, 605, 515, 22, [0.12, 0.12, 0.14])
  drawText("F2", 8, 50, 613, "#", [1, 1, 1])
  drawText("F2", 8, 75, 613, "PRODUCT DESCRIPTION", [1, 1, 1])
  drawText("F2", 8, 310, 613, "HSN", [1, 1, 1])
  drawText("F2", 8, 365, 613, "QTY", [1, 1, 1])
  drawText("F2", 8, 415, 613, "UNIT PRICE", [1, 1, 1])
  drawText("F2", 8, 495, 613, "TOTAL", [1, 1, 1])

  let curY = 582
  items.forEach((it: any, i: number) => {
    const pName = it.product_name || it.name || "Luxury Fragrance"
    const qty = Number(it.quantity) || 1
    const price = Number(it.unit_price || it.price) || 0
    const lineTotal = Number(it.total_price) || (qty * price)

    drawText("F1", 8, 50, curY, String(i + 1), [0.4, 0.4, 0.4])
    drawText("F2", 9, 75, curY, pName, [0.1, 0.1, 0.1])
    drawText("F1", 7, 75, curY - 10, `Size: ${it.size || "12ml"} | 100% Pure Concentrated Perfume Oil`, [0.5, 0.5, 0.5])
    drawText("F1", 8, 310, curY, "3303", [0.4, 0.4, 0.4])
    drawText("F1", 9, 370, curY, String(qty), [0.1, 0.1, 0.1])
    drawText("F1", 9, 415, curY, `INR ${price.toLocaleString("en-IN")}`, [0.2, 0.2, 0.2])
    drawText("F2", 9, 495, curY, `INR ${lineTotal.toLocaleString("en-IN")}`, [0.1, 0.1, 0.1])

    drawLine(40, curY - 16, 555, curY - 16, [0.9, 0.9, 0.9])
    curY -= 32
  })

  curY -= 10
  drawLine(340, curY + 15, 555, curY + 15, [0.8, 0.8, 0.8], 1)
  drawText("F1", 9, 360, curY, "Subtotal:", [0.4, 0.4, 0.4])
  drawText("F1", 9, 480, curY, `INR ${subtotal.toLocaleString("en-IN")}`, [0.2, 0.2, 0.2])

  if (discount > 0) {
    curY -= 16
    drawText("F1", 9, 360, curY, `Discount (${order.coupon_code || "PROMO"}):`, [0.1, 0.6, 0.2])
    drawText("F1", 9, 480, curY, `- INR ${discount.toLocaleString("en-IN")}`, [0.1, 0.6, 0.2])
  }

  curY -= 16
  drawText("F1", 9, 360, curY, "Shipping & Handling:", [0.4, 0.4, 0.4])
  drawText("F1", 9, 480, curY, shipping === 0 ? "FREE" : `INR ${shipping.toLocaleString("en-IN")}`, [0.2, 0.2, 0.2])

  curY -= 22
  drawRect(340, curY - 6, 215, 24, [0.97, 0.95, 0.90], [0.8, 0.7, 0.5])
  drawText("F2", 10, 350, curY + 1, "GRAND TOTAL:", [0.1, 0.1, 0.1])
  drawText("F2", 11, 465, curY + 1, `INR ${total.toLocaleString("en-IN")}`, [0.75, 0.55, 0.15])

  drawText("F2", 8, 45, curY, "Tax Information:", [0.3, 0.3, 0.3])
  drawText("F1", 7, 45, curY - 12, "Includes CGST (9%) and SGST (9%) under applicable HSN 3303.", [0.5, 0.5, 0.5])
  drawText("F1", 7, 45, curY - 22, "Computer generated tax invoice. No physical signature required.", [0.5, 0.5, 0.5])

  drawRect(420, 110, 135, 55, [0.98, 0.98, 0.98], [0.85, 0.85, 0.85])
  drawText("F2", 8, 435, 150, "SN ATTARWALA", [0.75, 0.55, 0.15])
  drawText("F1", 7, 435, 138, "Authorized Signatory", [0.4, 0.4, 0.4])
  drawText("F1", 6, 435, 120, "100% Pure Luxury Fragrances", [0.6, 0.6, 0.6])

  drawLine(40, 85, 555, 85, [0.85, 0.85, 0.85])
  drawText("F1", 7, 160, 72, "Thank you for choosing SN AttarWala! Need help? WhatsApp: +91 90823 77314", [0.5, 0.5, 0.5])

  const encoder = new TextEncoder()
  const streamBytes = encoder.encode(stream)
  const streamLength = streamBytes.length

  let pdfHead = "%PDF-1.4\n"
  const offsets: number[] = []

  function addObj(str: string) {
    offsets.push(encoder.encode(pdfHead).length)
    pdfHead += `${str}\n`
  }

  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj")
  addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj")
  addObj("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj")
  addObj(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj`)
  addObj("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj")
  addObj("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj")

  const startxref = encoder.encode(pdfHead).length
  let pdfTail = "xref\n0 7\n0000000000 65535 f \n"
  for (let i = 0; i < offsets.length; i++) {
    pdfTail += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`
  }
  pdfTail += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`

  const fullPdfString = pdfHead + pdfTail
  return new Blob([encoder.encode(fullPdfString)], { type: "application/pdf" })
}

/**
 * Directly downloads the PDF file to the user's computer.
 */
export function downloadInvoicePdf(order: InvoiceOrder, customFileName?: string) {
  if (typeof window === "undefined") return

  const blob = buildInvoicePdfBlob(order)
  const fileName = customFileName || `Invoice_${order.order_number || "Order"}.pdf`

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Prints the invoice and downloads the PDF file simultaneously.
 */
export function printAndDownloadInvoice(order: InvoiceOrder) {
  if (typeof window === "undefined") return

  // 1. Download PDF directly
  downloadInvoicePdf(order)

  // 2. Trigger print dialog
  setTimeout(() => {
    window.print()
  }, 300)
}
