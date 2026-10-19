import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET() {
  try {
    const adminSupabase = getAdminClient()

    const { data: dbOrders, error } = await adminSupabase
      .from("orders")
      .select(`
        id, order_number, status, subtotal, discount_amount, shipping_amount, total_amount,
        shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
        shipping_city, shipping_state, shipping_pincode, payment_method, payment_status,
        razorpay_order_id, razorpay_payment_id, created_at, customer_email,
        tracking_number, courier_partner, cancel_reason,
        customer_name, customer_phone, customer_address, customer_city, customer_state, customer_pincode,
        items,
        order_items(product_id, product_name, quantity, unit_price, total_price),
        user_id
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase select error in /api/admin/orders:", error)
      throw error
    }

    return NextResponse.json({ success: true, data: dbOrders || [] })
  } catch (error: any) {
    console.error("Error fetching admin orders via API:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch orders" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { orderId, status, trackingNumber, courierPartner, cancelReason } = body

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: "orderId and status are required" }, { status: 400 })
    }

    // Map to exact casing expected by database check constraint:
    // check (status in ('Pending','Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Refunded'))
    const statusMap: Record<string, string> = {
      "new": "Pending",
      "pending": "Pending",
      "confirmed": "Confirmed",
      "processing": "Processing",
      "packed": "Packed",
      "shipped": "Shipped",
      "out for delivery": "Out for Delivery",
      "out_for_delivery": "Out for Delivery",
      "delivered": "Delivered",
      "cancelled": "Cancelled",
      "refunded": "Refunded",
    }
    const normalized = (status || "").trim().toLowerCase().replace(/_/g, " ")
    const dbStatus = statusMap[normalized] || status

    const payload: any = { status: dbStatus, updated_at: new Date().toISOString() }
    if (trackingNumber !== undefined) payload.tracking_number = trackingNumber
    if (courierPartner !== undefined) payload.courier_partner = courierPartner
    if (cancelReason !== undefined) payload.cancel_reason = cancelReason

    const adminSupabase = getAdminClient()
    const { error } = await adminSupabase
      .from("orders")
      .update(payload)
      .eq("id", orderId)

    if (error) {
      console.error("Supabase update error in /api/admin/orders:", error)
      throw error
    }

    if (dbStatus === "Cancelled") {
      try {
        await adminSupabase.from("notifications").insert({
          title: "Order Cancelled",
          description: cancelReason ? `Order cancelled: ${cancelReason}` : "An order was marked as cancelled",
          type: "warning",
          is_read: false
        })
      } catch (notifErr) {
        console.warn("Could not insert cancellation notification:", notifErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to update order" }, { status: 500 })
  }
}
