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

    const body = await req.json()
    const { amount, currency = "INR", receipt, notes } = body

    if (!amount || Number(amount) < 100) {
      return NextResponse.json(
        { error: "Amount is required and must be at least 100 paise (₹1.00)" },
        { status: 400 }
      )
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    })

    const options = {
      amount: Math.round(Number(amount)),
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: key_id,
    })
  } catch (error: any) {
    console.error("Razorpay order creation error:", error)
    const statusCode = error?.statusCode === 401 ? 401 : (error?.statusCode || 500)
    return NextResponse.json(
      {
        error: error?.error?.description || error?.message || "Failed to create Razorpay order",
      },
      { status: statusCode }
    )
  }
}
