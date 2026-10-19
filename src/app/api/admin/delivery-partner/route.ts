import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DEFAULT_DELIVERY_CONFIG, DeliveryPartnerConfig } from "@/lib/delivery-partner-service"

export const dynamic = "force-dynamic"

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
  return createClient(supabaseUrl, supabaseServiceKey)
}

// In-memory fallback if store_settings doesn't have custom delivery_partner_config column
let cachedDeliveryConfig: DeliveryPartnerConfig = { ...DEFAULT_DELIVERY_CONFIG }

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from("store_settings")
      .select("delivery_partner_config")
      .eq("id", "singleton")
      .maybeSingle()

    if (!error && data?.delivery_partner_config) {
      cachedDeliveryConfig = {
        ...DEFAULT_DELIVERY_CONFIG,
        ...(typeof data.delivery_partner_config === "string" 
          ? JSON.parse(data.delivery_partner_config) 
          : data.delivery_partner_config)
      }
    }

    return NextResponse.json({ success: true, config: cachedDeliveryConfig })
  } catch (err: any) {
    return NextResponse.json({ success: true, config: cachedDeliveryConfig })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    cachedDeliveryConfig = {
      ...DEFAULT_DELIVERY_CONFIG,
      ...body,
      lastUpdated: new Date().toISOString()
    }

    const supabase = getAdminClient()
    try {
      // Try to persist into store_settings if column exists
      await supabase
        .from("store_settings")
        .update({
          delivery_partner_config: cachedDeliveryConfig,
          updated_at: new Date().toISOString()
        })
        .eq("id", "singleton")
    } catch {
      // ignore column missing error
    }

    return NextResponse.json({ success: true, config: cachedDeliveryConfig })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update" }, { status: 500 })
  }
}
