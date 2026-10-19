import { createClient } from "@/lib/supabase/client"

export interface StoreSettings {
  storeName: string
  tagline: string
  storeEmail: string
  storePhone: string
  whatsappNumber: string
  address: string
  gstNumber: string
  currency: string
  timezone: string
  freeShippingAbove: number
  defaultShippingRate: number
  lowStockThreshold: number
  razorpayEnabled: boolean
  codEnabled: boolean
  maintenanceMode: boolean
  instagramUrl: string
  facebookUrl: string
  twitterUrl: string
  store1Name: string
  store1Address: string
  store2Name: string
  store2Address: string
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "SN ATTARWALA",
  tagline: "Royal Fragrances of Arabia",
  storeEmail: "support@snattarwala.in",
  storePhone: "+91 90823 77314",
  whatsappNumber: "919082377314",
  address: "Crawford Market, Mumbai - 400001, Maharashtra",
  gstNumber: "27AAACS1234A1Z5",
  currency: "INR",
  timezone: "Asia/Kolkata",
  freeShippingAbove: 10000,
  defaultShippingRate: 500,
  lowStockThreshold: 5,
  razorpayEnabled: true,
  codEnabled: true,
  maintenanceMode: false,
  instagramUrl: "https://www.instagram.com/snattarwala",
  facebookUrl: "#",
  twitterUrl: "#",
  store1Name: "Store 1 (Janjiker Street)",
  store1Address: "137, Janjiker street opp Central restaurant, Near crowford Market, Masjid west, MUMBAI 400003",
  store2Name: "Store 2 (Minara Masjid)",
  store2Address: "41, Mohd Ali Road, Minara Masjid, Near Zam Zam Sweet, Mumbai - 400003",
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", "singleton")
      .maybeSingle()

    if (error || !data) return DEFAULT_STORE_SETTINGS

    return {
      storeName: data.store_name ?? DEFAULT_STORE_SETTINGS.storeName,
      tagline: data.tagline ?? DEFAULT_STORE_SETTINGS.tagline,
      storeEmail: data.store_email ?? DEFAULT_STORE_SETTINGS.storeEmail,
      storePhone: data.store_phone ?? DEFAULT_STORE_SETTINGS.storePhone,
      whatsappNumber: data.whatsapp_number ?? DEFAULT_STORE_SETTINGS.whatsappNumber,
      address: data.address ?? DEFAULT_STORE_SETTINGS.address,
      gstNumber: data.gst_number ?? DEFAULT_STORE_SETTINGS.gstNumber,
      currency: data.currency ?? DEFAULT_STORE_SETTINGS.currency,
      timezone: data.timezone ?? DEFAULT_STORE_SETTINGS.timezone,
      freeShippingAbove: Number(data.free_shipping_above) ?? DEFAULT_STORE_SETTINGS.freeShippingAbove,
      defaultShippingRate: Number(data.default_shipping_rate) ?? DEFAULT_STORE_SETTINGS.defaultShippingRate,
      lowStockThreshold: Number(data.low_stock_threshold) ?? DEFAULT_STORE_SETTINGS.lowStockThreshold,
      razorpayEnabled: data.razorpay_enabled ?? DEFAULT_STORE_SETTINGS.razorpayEnabled,
      codEnabled: data.cod_enabled ?? DEFAULT_STORE_SETTINGS.codEnabled,
      maintenanceMode: data.maintenance_mode ?? DEFAULT_STORE_SETTINGS.maintenanceMode,
      instagramUrl: data.instagram_url ?? DEFAULT_STORE_SETTINGS.instagramUrl,
      facebookUrl: data.facebook_url ?? DEFAULT_STORE_SETTINGS.facebookUrl,
      twitterUrl: data.twitter_url ?? DEFAULT_STORE_SETTINGS.twitterUrl,
      store1Name: data.store1_name ?? DEFAULT_STORE_SETTINGS.store1Name,
      store1Address: data.store1_address ?? DEFAULT_STORE_SETTINGS.store1Address,
      store2Name: data.store2_name ?? DEFAULT_STORE_SETTINGS.store2Name,
      store2Address: data.store2_address ?? DEFAULT_STORE_SETTINGS.store2Address,
    }
  } catch {
    return DEFAULT_STORE_SETTINGS
  }
}

export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const payload: any = { updated_at: new Date().toISOString() }
    if (settings.storeName !== undefined) payload.store_name = settings.storeName
    if (settings.tagline !== undefined) payload.tagline = settings.tagline
    if (settings.storeEmail !== undefined) payload.store_email = settings.storeEmail
    if (settings.storePhone !== undefined) payload.store_phone = settings.storePhone
    if (settings.whatsappNumber !== undefined) payload.whatsapp_number = settings.whatsappNumber
    if (settings.address !== undefined) payload.address = settings.address
    if (settings.gstNumber !== undefined) payload.gst_number = settings.gstNumber
    if (settings.currency !== undefined) payload.currency = settings.currency
    if (settings.freeShippingAbove !== undefined) payload.free_shipping_above = settings.freeShippingAbove
    if (settings.defaultShippingRate !== undefined) payload.default_shipping_rate = settings.defaultShippingRate
    if (settings.lowStockThreshold !== undefined) payload.low_stock_threshold = settings.lowStockThreshold
    if (settings.razorpayEnabled !== undefined) payload.razorpay_enabled = settings.razorpayEnabled
    if (settings.codEnabled !== undefined) payload.cod_enabled = settings.codEnabled
    if (settings.maintenanceMode !== undefined) payload.maintenance_mode = settings.maintenanceMode
    if (settings.instagramUrl !== undefined) payload.instagram_url = settings.instagramUrl
    if (settings.facebookUrl !== undefined) payload.facebook_url = settings.facebookUrl
    if (settings.twitterUrl !== undefined) payload.twitter_url = settings.twitterUrl
    if (settings.store1Name !== undefined) payload.store1_name = settings.store1Name
    if (settings.store1Address !== undefined) payload.store1_address = settings.store1Address
    if (settings.store2Name !== undefined) payload.store2_name = settings.store2Name
    if (settings.store2Address !== undefined) payload.store2_address = settings.store2Address

    const { error } = await supabase
      .from("store_settings")
      .update(payload)
      .eq("id", "singleton")

    if (error) {
      console.error("Error saving store settings:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    console.error("Exception saving store settings:", err)
    return { success: false, error: err?.message || "Failed to save settings" }
  }
}

export async function getPublicTestimonials(): Promise<{ id: string; customerName: string; customerCity: string; rating: number; text: string; source: string }[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("id, customer_name, customer_city, rating, review_text, source")
      .eq("is_approved", true)
      .order("display_order", { ascending: true })
      .limit(6)

    if (error || !data) return []

    return data.map((t: any) => ({
      id: t.id,
      customerName: t.customer_name,
      customerCity: t.customer_city || "Mumbai",
      rating: Number(t.rating) || 5,
      text: t.review_text,
      source: t.source || "Google",
    }))
  } catch {
    return []
  }
}
