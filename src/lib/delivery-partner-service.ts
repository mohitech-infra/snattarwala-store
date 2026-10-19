export type DeliveryPartner = "none" | "delhivery" | "shiprocket" | "bluedart" | "custom"

export interface DeliveryPartnerConfig {
  partner: DeliveryPartner
  partnerName: string
  apiKey: string
  apiSecret?: string
  clientId?: string
  environment: "sandbox" | "production"
  isEnabled: boolean
  webhookUrl?: string
  lastTested?: string | null
}

export const DEFAULT_DELIVERY_CONFIG: DeliveryPartnerConfig = {
  partner: "none",
  partnerName: "Manual Fulfillment (No API)",
  apiKey: "",
  apiSecret: "",
  clientId: "",
  environment: "sandbox",
  isEnabled: false,
  webhookUrl: "",
  lastTested: null
}

const STORAGE_KEY = "sn_attarwala_delivery_partner_config"

export async function getDeliveryPartnerConfig(): Promise<DeliveryPartnerConfig> {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        return { ...DEFAULT_DELIVERY_CONFIG, ...JSON.parse(cached) }
      }
    } catch {
      // ignore parse error
    }

    try {
      const res = await fetch("/api/admin/delivery-partner")
      if (res.ok) {
        const json = await res.json()
        if (json?.success && json?.config) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.config))
          return json.config
        }
      }
    } catch (err) {
      console.warn("Could not fetch delivery partner config from API:", err)
    }
  }

  return DEFAULT_DELIVERY_CONFIG
}

export async function saveDeliveryPartnerConfig(
  config: Partial<DeliveryPartnerConfig>
): Promise<{ success: boolean; config: DeliveryPartnerConfig }> {
  const current = await getDeliveryPartnerConfig()
  const updated: DeliveryPartnerConfig = {
    ...current,
    ...config,
    partnerName: getPartnerDisplayName(config.partner ?? current.partner),
    lastTested: config.lastTested !== undefined ? config.lastTested : current.lastTested
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}

    try {
      const res = await fetch("/api/admin/delivery-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.config) {
          return { success: true, config: data.config }
        }
      }
    } catch (err) {
      console.warn("Could not save delivery partner config to API, saved locally:", err)
    }
  }

  return { success: true, config: updated }
}

export function isDeliveryApiIntegrated(config?: DeliveryPartnerConfig | null): boolean {
  if (!config) return false
  return Boolean(
    config.isEnabled && 
    config.partner !== "none" && 
    config.apiKey && 
    config.apiKey.trim().length > 0
  )
}

export function getPartnerDisplayName(partner: DeliveryPartner): string {
  switch (partner) {
    case "delhivery":
      return "Delhivery Logistics Express API"
    case "shiprocket":
      return "Shiprocket All-In-One API"
    case "bluedart":
      return "BlueDart Express API"
    case "custom":
      return "Custom Courier Webhook API"
    case "none":
    default:
      return "Manual Fulfillment (No API Connected)"
  }
}
