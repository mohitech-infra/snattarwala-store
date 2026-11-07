import { NextResponse } from "next/server"
import Razorpay from "razorpay"

export async function POST(req: Request) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured in environment variables" },
        { status: 500 }
      )
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    })

    const body = await req.json()
    const { amount, currency = "INR", receipt, items, shippingAddress } = body

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount" },
        { status: 400 }
      )
    }

    // Razorpay accepts amount in paise (1 INR = 100 paise)
    // If already in paise (isPaise flag or amount >= 100 without items)
    const amountInPaise = body.isPaise 
      ? Math.round(Number(amount))
      : Math.round(Number(amount) * 100)

    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: "Minimum order amount is 100 paise (₹1.00)" },
        { status: 400 }
      )
    }

    const receiptId = receipt || `rcpt_${Date.now()}`

    const options: any = {
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: receiptId,
    }

    if (shippingAddress || items) {
      options.notes = {
        customer_name: shippingAddress?.fullName || "Valued Customer",
        customer_email: shippingAddress?.email || "",
        customer_phone: shippingAddress?.phone || "",
        city: shippingAddress?.city || "Mumbai",
        items_count: items?.length ? String(items.length) : "1",
      }
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: key_id,
      keyId: key_id,
    })
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error)
    const isAuthFailed = error?.statusCode === 401 || 
      error?.error?.description?.toLowerCase().includes("authentication failed") ||
      error?.message?.toLowerCase().includes("authentication failed")

    if (isAuthFailed) {
      return NextResponse.json(
        { 
          error: "Razorpay Gateway Authentication Failed: The RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is invalid or expired. Please generate a new key pair in your Razorpay Dashboard (Settings > API Keys) and update your .env file." 
        },
        { status: 401 }
      )
    }

    const statusCode = error?.statusCode || 500
    return NextResponse.json(
      { 
        error: error?.error?.description || error?.message || "Failed to create payment order" 
      },
      { status: statusCode }
    )
  }
}

