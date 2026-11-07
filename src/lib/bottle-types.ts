export interface BottleTypeOption {
  id: string
  name: string
  description?: string
  icon?: string
}

export const CATEGORY_BOTTLE_TYPES: Record<string, BottleTypeOption[]> = {
  "Attars": [
    { id: "roll-on", name: "Roll-On", description: "Smooth stainless roller ball for direct skin pulse application" },
    { id: "dipstick", name: "Glass Dipstick", description: "Traditional artisanal glass rod for classic ittar ritual" },
    { id: "crystal", name: "Crystal Decanter", description: "Hand-cut luxury crystal bottle for collectors" },
  ],
  "Perfumes": [
    { id: "spray", name: "Fine Mist Spray", description: "Even dispersion French-style atomizer spray" },
    { id: "travel-spray", name: "Pocket Atomizer", description: "Compact TSA-friendly travel pocket spray" },
    { id: "crystal", name: "Luxury Decanter", description: "Heavy-glass collector flacon" },
  ],
  "Bakhoor": [
    { id: "jar", name: "Airtight Glass Jar", description: "Seals in fresh oudwood and amber oils" },
    { id: "gift-box", name: "Gold Velvet Box", description: "Imperial gifting presentation" },
  ]
}

export const DEFAULT_BOTTLE_SIZES_BY_CATEGORY: Record<string, string[]> = {
  "Attars": ["3ml", "6ml", "12ml", "25ml"],
  "Perfumes": ["30ml", "50ml", "100ml"],
  "Bakhoor": ["40g", "50g", "100g", "250g"],
}

export function getAvailableBottleTypes(category?: string): BottleTypeOption[] {
  if (!category) return CATEGORY_BOTTLE_TYPES["Attars"]
  const cat = category.toLowerCase()
  if (cat.includes("perfume")) return CATEGORY_BOTTLE_TYPES["Perfumes"]
  if (cat.includes("bakhoor")) return CATEGORY_BOTTLE_TYPES["Bakhoor"]
  return CATEGORY_BOTTLE_TYPES["Attars"]
}

export function getDefaultBottleType(category?: string, size?: string): string {
  if (!category) return "Roll-On"
  const cat = category.toLowerCase()
  if (cat.includes("perfume")) {
    if (size && (size.includes("10ml") || size.includes("15ml") || size.includes("30ml"))) {
      return "Pocket Atomizer"
    }
    return "Fine Mist Spray"
  }
  if (cat.includes("bakhoor")) {
    return "Airtight Glass Jar"
  }
  if (size && (size.includes("25ml") || size.includes("50ml"))) {
    return "Crystal Decanter"
  }
  return "Roll-On"
}
