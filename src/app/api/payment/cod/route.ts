import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { 
      shippingDetails,
      items,
      amount,
      couponCode,
      discountAmount,
      shippingAmount,
      userId: clientUserId,
    } = await req.json()
    
    // Generate unique order number
    const orderNumber = `ITR-${Date.now().toString().slice(-6)}`

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
        status: "Pending", // COD usually starts as Pending until confirmed/shipped
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
        payment_method: "Cash on Delivery",
        payment_status: "Pending",
        razorpay_order_id: null,
        razorpay_payment_id: null,
      })
      .select()
      .single()

    if (orderError) {
      console.error("Supabase order insert error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    if (orderData && items && items.length > 0) {
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

    // Insert admin notification for new order
    try {
      await supabase.from("notifications").insert({
        title: `New COD Order ${orderNumber.startsWith("#") ? orderNumber : `#${orderNumber}`}`,
        description: `${fullName} placed a Cash on Delivery order for ₹${totalNum.toLocaleString('en-IN')}`,
        type: "order",
        is_read: false
      })
    } catch (notifErr) {
      console.warn("Failed to create admin notification:", notifErr)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Order placed successfully",
      orderNumber,
      paymentId: "COD",
      orderId: orderData.id,
    })
  } catch (error: any) {
    console.error("Error creating COD order:", error)
    return NextResponse.json(
      { error: error?.message || "Error creating order" },
      { status: 500 }
    )
  }
}
