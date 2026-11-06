import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const revalidate = 0

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET() {
  try {
    const supabase = getAdminSupabase()

    const [
      pRes,
      lsRes,
      oRes,
      acRes,
      profRes,
      ordCustRes,
      rRes,
      cpRes,
      wlRes
    ] = await Promise.allSettled([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).lte("stock_quantity", 5),
      supabase.from("orders").select("*", { count: "exact", head: true }).or("status.ilike.%pending%,status.ilike.%new%"),
      supabase.from("abandoned_carts").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("id"),
      supabase.from("orders").select("user_id, customer_email, customer_phone"),
      supabase.from("reviews").select("*", { count: "exact", head: true }).eq("is_approved", false),
      supabase.from("coupons").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("category", "Wholesale").not("status", "ilike", "%closed%")
    ])

    const getVal = (res: PromiseSettledResult<any>) => {
      if (res.status === "fulfilled" && !res.value.error && typeof res.value.count === "number") {
        return res.value.count
      }
      return 0
    }

    // Aggregate unique customer count exactly matching Customers Module
    const customerKeys = new Set<string>()
    if (profRes.status === "fulfilled" && Array.isArray(profRes.value.data)) {
      profRes.value.data.forEach((p: any) => {
        if (p.id) customerKeys.add(p.id)
      })
    }
    if (ordCustRes.status === "fulfilled" && Array.isArray(ordCustRes.value.data)) {
      ordCustRes.value.data.forEach((o: any) => {
        const key = o.user_id || o.customer_email || o.customer_phone
        if (key) customerKeys.add(key)
      })
    }

    const counts = {
      products: getVal(pRes),
      lowStock: getVal(lsRes),
      pendingOrders: getVal(oRes),
      abandonedCarts: getVal(acRes),
      customers: customerKeys.size,
      pendingReviews: getVal(rRes),
      activeCoupons: getVal(cpRes),
      wholesaleLeads: getVal(wlRes)
    }

    return NextResponse.json({ success: true, counts }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    })
  } catch (err: any) {
    console.error("Error fetching admin counts:", err)
    return NextResponse.json({
      success: false,
      error: err.message,
      counts: {
        products: 0,
        lowStock: 0,
        pendingOrders: 0,
        abandonedCarts: 0,
        customers: 0,
        pendingReviews: 0,
        activeCoupons: 0,
        wholesaleLeads: 0
      }
    })
  }
}

