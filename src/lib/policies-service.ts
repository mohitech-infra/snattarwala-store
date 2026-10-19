export interface StorePolicies {
  shippingPolicy: string
  returnPolicy: string
  expressDeliveryMumbai: string
  panIndiaDelivery: string
  freeShippingThreshold: number
  lastUpdated?: string
}

export const DEFAULT_STORE_POLICIES: StorePolicies = {
  shippingPolicy: "Standard delivery within Mumbai takes 1-2 business days. Express same-day delivery is available for orders placed before 2 PM. For orders outside Mumbai across India, expect delivery within 3-5 business days. Free shipping on all prepaid orders above ₹999.",
  returnPolicy: "We offer a 7-day return policy for unused products in their original luxury packaging with seal intact. Handcrafted attars and opened perfumes cannot be returned once unsealed due to hygiene and artisanal standards. Contact our customer care team to initiate a return or exchange.",
  expressDeliveryMumbai: "Same-Day / 1-2 Business Days",
  panIndiaDelivery: "3-5 Business Days (BlueDart & Delhivery Express)",
  freeShippingThreshold: 999,
  lastUpdated: new Date().toISOString()
}

const STORAGE_KEY = "sn_attarwala_store_policies"

export async function getStorePolicies(): Promise<StorePolicies> {
  // If browser, check localStorage first for instant snappy response
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...DEFAULT_STORE_POLICIES, ...JSON.parse(stored) }
      }
    } catch {
      // ignore JSON parse error
    }

    // Try fetching from API
    try {
      const res = await fetch("/api/policies")
      if (res.ok) {
        const data = await res.json()
        if (data && data.policies) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.policies))
          return data.policies
        }
      }
    } catch {
      // fallback to default
    }
  }

  return DEFAULT_STORE_POLICIES
}

export async function saveStorePolicies(policies: Partial<StorePolicies>): Promise<{ success: boolean; policies: StorePolicies }> {
  const current = await getStorePolicies()
  const updated: StorePolicies = {
    ...current,
    ...policies,
    lastUpdated: new Date().toISOString()
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}

    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        const data = await res.json()
        return { success: true, policies: data.policies || updated }
      }
    } catch (err) {
      console.warn("Could not save to API, saved locally:", err)
    }
  }

  return { success: true, policies: updated }
}
