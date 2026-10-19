import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

// POST /api/cart/abandon — called when user leaves checkout with items in cart
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerName, phone, email, items, cartValue } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items" }, { status: 400 })
    }

    const supabase = createClient()

    // Upsert based on phone or email
    const { error } = await supabase.from("abandoned_carts").upsert({
      customer_name: customerName || "Guest",
      phone: phone || null,
      email: email || null,
      items,
      cart_value: cartValue,
      recovery_status: "Not Contacted",
      priority: cartValue > 3000 ? "HIGH" : cartValue > 1500 ? "MEDIUM" : "LOW",
    }, {
      onConflict: "phone",
      ignoreDuplicates: false,
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
