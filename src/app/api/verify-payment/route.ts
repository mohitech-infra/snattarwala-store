import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_secret) {
      return NextResponse.json(
        { error: "Razorpay secret key not configured in environment variables" },
        { status: 500 }
      )
    }

    const body = await req.json()
    const order_id = body.razorpay_order_id || body.order_id
    const payment_id = body.razorpay_payment_id || body.payment_id
    const signature = body.razorpay_signature || body.signature

    if (!order_id || !payment_id || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required payment fields (order_id, payment_id, signature)",
        },
        { status: 400 }
      )
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${order_id}|${payment_id}`)
      .digest("hex")

    const isMatch =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(signature, "utf-8")
      )

    if (!isMatch) {
      console.warn("Razorpay signature mismatch:", {
        order_id,
        payment_id,
        received_signature: signature,
        expected_signature: expectedSignature,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed: signature mismatch",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Payment signature verified successfully",
      order_id,
      payment_id,
    })
  } catch (error: any) {
    console.error("Razorpay signature verification error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error verifying signature",
      },
      { status: 500 }
    )
  }
}
