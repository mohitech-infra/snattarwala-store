import { NextResponse } from "next/server"
import Razorpay from "razorpay"

export async function POST(req: Request) {
  try {
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
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
    const { amount, items, shippingAddress } = body

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount" },
        { status: 400 }
      )
    }

    // Razorpay accepts amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100)
    const receiptId = `rcpt_${Date.now()}`

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        customer_name: shippingAddress?.fullName || "Valued Customer",
        customer_email: shippingAddress?.email || "",
        customer_phone: shippingAddress?.phone || "",
        city: shippingAddress?.city || "Mumbai",
        items_count: items?.length ? String(items.length) : "1",
      },
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id,
    })
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error)
    return NextResponse.json(
      { 
        error: error?.error?.description || error?.message || "Failed to create payment order" 
      },
      { status: 500 }
    )
  }
}

