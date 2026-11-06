import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      shippingDetails,
      items,
      amount,
      couponCode,
      discountAmount,
      shippingAmount,
      userId: clientUserId,
    } = await req.json()
    
    const secret = process.env.RAZORPAY_KEY_SECRET
    
    if (!secret) {
      return NextResponse.json(
        { error: "Payment verification secret not configured" },
        { status: 500 }
      )
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters" },
        { status: 400 }
      )
    }

    // Verify Razorpay HMAC SHA256 signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    const isMatch =
      generated_signature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generated_signature, "utf-8"),
        Buffer.from(razorpay_signature, "utf-8")
      )

    if (!isMatch) {
      console.error("Razorpay signature mismatch:", {
        received: razorpay_signature,
        generated: generated_signature,
      })
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      )
    }

    // Generate unique order number
    const orderNumber = `ITR-${Date.now().toString().slice(-6)}`

    // Attempt to persist order in Supabase if database is configured
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = user?.id || clientUserId || null

      const fullName = (shippingDetails?.fullName || user?.user_metadata?.first_name || "Valued Customer").trim()
      const phone = (shippingDetails?.phone || user?.user_metadata?.phone || "").trim()
      const email = (shippingDetails?.email || user?.email || "").trim()
      const address1 = (shippingDetails?.address1 || "").trim()
      const address2 = (shippingDetails?.address2 || "").trim()
      const area = (shippingDetails?.area || "").trim()
      const fullAddress = [address1, address2, area].filter(Boolean).join(", ")
      const city = (shippingDetails?.city || "Mumbai").trim()
      const state = (shippingDetails?.state || "Maharashtra").trim()
      const pincode = (shippingDetails?.pincode || "").trim()

      const totalNum = Number(amount) || 0
      const discountNum = Number(discountAmount) || 0
      const shippingNum = Number(shippingAmount) || 0
      const subtotalNum = Math.max(0, totalNum - shippingNum + discountNum)

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: targetUserId,
          order_number: orderNumber,
          customer_name: fullName,
          customer_email: email || null,
          customer_phone: phone || null,
          customer_address: fullAddress || city,
          customer_city: city,
          customer_state: state,
          customer_pincode: pincode || null,
          items: Array.isArray(items) ? items : [],
          status: "Confirmed",
          subtotal: subtotalNum,
          discount_amount: discountNum,
          shipping_amount: shippingNum,
          total_amount: totalNum,
          coupon_code: couponCode || null,
          shipping_name: fullName,
          shipping_phone: phone,
          shipping_address_line1: address1,
          shipping_address_line2: address2,
          shipping_city: city,
          shipping_state: state,
          shipping_pincode: pincode,
          payment_method: "Razorpay",
          payment_status: "Paid",
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id,
        })
        .select()
        .single()

      if (orderError) {
        console.error("Supabase order insert error:", orderError)
      } else if (orderData && items && items.length > 0) {
        const isValidUuid = (val: any) => 
          typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

        const orderItems = items.map((item: any) => ({
          order_id: orderData.id,
          product_id: isValidUuid(item.productId) ? item.productId : null,
          product_name: item.name || "Fragrance",
          product_sku: item.sku || (typeof item.productId === "string" ? item.productId : null),
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.price) || 0,
          total_price: (Number(item.price) || 0) * (Number(item.quantity) || 1),
        }))

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
        if (itemsError) {
          console.error("Supabase order_items insert error:", itemsError)
        }
      }

      // Insert admin notification for new online order
      try {
        await supabase.from("notifications").insert({
          title: `New Online Order ${orderNumber.startsWith("#") ? orderNumber : `#${orderNumber}`}`,
          description: `${fullName} paid ₹${totalNum.toLocaleString('en-IN')} via Razorpay`,
          type: "order",
          is_read: false
        })
      } catch (notifErr) {
        console.warn("Failed to create admin notification:", notifErr)
      }
    } catch (dbError) {
      console.error("Database recording error:", dbError)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Payment verified successfully",
      orderNumber,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    })
  } catch (error: any) {
    console.error("Error verifying payment:", error)
    return NextResponse.json(
      { error: error?.message || "Error verifying payment" },
      { status: 500 }
    )
  }
}

