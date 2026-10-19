import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const { code, cartTotal } = await req.json()
    
    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check coupon in DB
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", code)
      .eq("is_active", true)
      .single()

    if (error || !coupon) {
      return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 400 })
    }

    // Check validity
    if (coupon.valid_until) {
      const validUntil = new Date(coupon.valid_until)
      if (validUntil < new Date()) {
        return NextResponse.json({ error: "Coupon has expired" }, { status: 400 })
      }
    }

    // Since usage is computed dynamically from orders, we can do a quick check if usage_limit exists
    if (coupon.usage_limit && coupon.usage_limit > 0) {
       // Ideally we would check orders, but for now just rely on DB usage_count if it exists
       if ((coupon.usage_count || 0) >= coupon.usage_limit) {
         return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 })
       }
    }

    const minOrder = Number(coupon.min_order_value ?? coupon.min_order_amount) || 0;
    if (minOrder > cartTotal) {
      return NextResponse.json({ 
        error: `Minimum order value of ₹${minOrder} required` 
      }, { status: 400 })
    }

    // Calculate discount
    let discount = 0
    const dType = coupon.discount_type?.toLowerCase()
    const dVal = Number(coupon.discount_value) || 0
    
    if (dType === "percentage") {
      discount = Math.round((cartTotal * dVal) / 100)
    } else {
      discount = dVal
    }

    // Cap discount
    discount = Math.min(discount, cartTotal)
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, Number(coupon.max_discount_amount))
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: dType === "fixed" ? "Fixed" : "Percentage",
        value: dVal,
        discount: discount
      }
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to validate coupon" }, { status: 500 })
  }
}
