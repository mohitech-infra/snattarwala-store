import { createClient } from "@/lib/supabase/client"

export interface AttarSeriesRate {
  name: string
  eyebrow: string
  description: string
  prices: Array<{ size: string; price: number }>
}

export interface WholesaleRates {
  attarSeries: AttarSeriesRate[]
}

export const DEFAULT_WHOLESALE_RATES: WholesaleRates = {
  attarSeries: [
    {
      name: "Golden Series",
      eyebrow: "Everyday luxury",
      description: "A polished collection with accessible luxury and a premium feel.",
      prices: [
        { size: "12 ml", price: 300 },
        { size: "24 ml", price: 500 },
        { size: "55 ml", price: 999 },
      ],
    },
    {
      name: "Diamond Series",
      eyebrow: "Signature quality",
      description: "Elevated presentation and richer profiles for a fragrance shelf that stands out.",
      prices: [
        { size: "12 ml", price: 549 },
        { size: "24 ml", price: 999 },
        { size: "55 ml", price: 1999 },
      ],
    },
    {
      name: "Luxury Series",
      eyebrow: "The collector's edit",
      description: "Our most indulgent attar range for boutiques, gifting and premium retail assortments.",
      prices: [
        { size: "12 ml", price: 1099 },
        { size: "24 ml", price: 1899 },
        { size: "55 ml", price: 2999 },
      ],
    },
  ],
}

const STORAGE_KEY = "sn_attarwala_wholesale_rates"

export async function getWholesaleRates(): Promise<WholesaleRates> {
  // 1. Check local storage if in browser
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.attarSeries && Array.isArray(parsed.attarSeries) && parsed.attarSeries.length > 0) {
          return parsed
        }
      }
    } catch {}
  }

  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("wholesale_rates")
      .eq("id", "singleton")
      .maybeSingle()

    if (
      !error &&
      data &&
      (data as any).wholesale_rates &&
      Array.isArray((data as any).wholesale_rates.attarSeries) &&
      (data as any).wholesale_rates.attarSeries.length > 0
    ) {
      const rates = (data as any).wholesale_rates as WholesaleRates
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(rates))
        } catch {}
      }
      return rates
    }
  } catch {}

  return DEFAULT_WHOLESALE_RATES
}

export async function saveWholesaleRates(rates: WholesaleRates): Promise<{ success: boolean; error?: string }> {
  // Always persist to localStorage first
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rates))
    } catch {}
  }

  const supabase = createClient()
  try {
    const { error } = await supabase
      .from("store_settings")
      .update({ wholesale_rates: rates, updated_at: new Date().toISOString() })
      .eq("id", "singleton")

    if (error) {
      console.warn("Supabase update for wholesale_rates:", error.message)
    }
    return { success: true }
  } catch {
    return { success: true }
  }
}
