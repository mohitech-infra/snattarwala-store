import * as XLSX from "xlsx"
import JSZip from "jszip"
import path from "path"
import fs from "fs"
import { createClient } from "@supabase/supabase-js"

// Supported standard bottle types
export const SUPPORTED_BOTTLE_TYPES = [
  "Roll-On",
  "Fine Mist Spray",
  "Glass Dipstick",
  "Pocket Atomizer",
  "Crystal Decanter",
  "Luxury Decanter",
  "Airtight Glass Jar",
  "Gold Velvet Box",
  "Custom"
] as const

export const SUPPORTED_CATEGORIES = ["Attars", "Perfumes", "Bakhoor"] as const
export const SUPPORTED_SERIES = ["Golden Series", "Diamond Series", "Luxury Series"] as const

export interface RawParentProduct {
  rowNumber: number
  sku: string
  name: string
  category: string
  series?: string
  gender?: string
  fragranceFamily?: string
  fragranceType?: string
  shortDescription?: string
  description?: string
  topNotes?: string
  heartNotes?: string
  baseNotes?: string
  brand?: string
  publishStatus?: string // 'Draft' or 'Active'
}

export interface RawVariant {
  rowNumber: number
  parentSku: string
  variantSku: string
  size: string
  sizeUnit?: string
  bottleType: string
  price: number
  compareAtPrice?: number | null
  costPrice?: number | null
  stock: number
  reorderLevel?: number
  isDefault?: boolean
  status?: string
}

export interface ExtractedImage {
  fileName: string
  path: string
  sku: string
  role: "primary" | "secondary" | "lifestyle" | "variant"
  bottleTypeMatch?: string
  sizeMatch?: string
  buffer: Buffer
  mimeType: string
  sizeBytes: number
}

export interface ValidationIssue {
  rowType: "Parent" | "Variant" | "Image"
  rowNumber?: number
  sku?: string
  name?: string
  severity: "ERROR" | "WARNING"
  field: string
  message: string
}

export interface ParsedCatalogue {
  parents: RawParentProduct[]
  variants: RawVariant[]
  imagesBySku: Record<string, ExtractedImage[]>
  totalImages: number
}

export interface ValidationResult {
  status: "READY" | "WARNING" | "ERROR"
  totalParents: number
  totalVariants: number
  totalImagesDetected: number
  matchedImages: number
  missingImages: number
  duplicateCount: number
  errorCount: number
  warningCount: number
  readyCount: number
  issues: ValidationIssue[]
  previewParents: Array<{
    parent: RawParentProduct
    variants: RawVariant[]
    images: Array<{ fileName: string; role: string; previewUrl?: string }>
    validationStatus: "READY" | "WARNING" | "ERROR"
    issues: ValidationIssue[]
  }>
}

export interface ImportExecutionResult {
  importId: string
  timestamp: string
  totalParents: number
  totalVariants: number
  totalImages: number
  successfulParents: number
  successfulVariants: number
  successfulImages: number
  failedCount: number
  status: "Completed" | "Completed with Warnings" | "Failed"
  errors: Array<{ sku: string; error: string }>
  importedProducts: Array<{ id: string; name: string; sku: string; slug: string }>
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
  return createClient(url, key)
}

/**
 * Normalizes header keys to standard names
 */
function cleanKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
}

// ====================================================================
// 1. EXCEL TEMPLATE GENERATOR (PHASE 1 & 2)
// ====================================================================
export function generateExcelTemplate(): Buffer {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Parent Products
  const parentHeaders = [
    "Product SKU",
    "Fragrance Name",
    "Category",
    "Fragrance Series",
    "Gender",
    "Fragrance Family",
    "Short Description",
    "Full Description",
    "Top Notes",
    "Heart Notes",
    "Base Notes",
    "Brand",
    "Publish Status"
  ]

  const sampleParents = [
    [
      "GLD-PER-001",
      "Royal Taif Rose",
      "Attars",
      "Golden Series",
      "Unisex",
      "Floral",
      "Artisanal hydro-distilled Saudi Taif Rose with amber nectar.",
      "An olfactory journey to the highland gardens of Taif. Pure mountain rose blossoms hydro-distilled into golden amber.",
      "Taif Rose, Sicilian Bergamot",
      "Damask Rose, Persian Saffron",
      "Cambodian Agarwood, White Amber",
      "SN AttarWala",
      "Draft"
    ],
    [
      "GLD-PER-002",
      "Imperial Assam Oud",
      "Attars",
      "Luxury Series",
      "Unisex",
      "Oud",
      "Aged vintage Assam black oudh with smoky leather notes.",
      "Harvested from wild 40-year-old Aquilaria trees in Upper Assam. Deep, animalic, and majestic longevity.",
      "Incense Smoke, Black Pepper",
      "Aged Oud Heart, Leather",
      "Assam Oud Resin, Mysore Sandalwood",
      "SN AttarWala",
      "Draft"
    ]
  ]

  const wsParents = XLSX.utils.aoa_to_sheet([parentHeaders, ...sampleParents])
  wsParents["!cols"] = [
    { wch: 16 }, // SKU
    { wch: 24 }, // Name
    { wch: 14 }, // Category
    { wch: 18 }, // Series
    { wch: 12 }, // Gender
    { wch: 18 }, // Family
    { wch: 35 }, // Short Desc
    { wch: 45 }, // Full Desc
    { wch: 25 }, // Top
    { wch: 25 }, // Heart
    { wch: 25 }, // Base
    { wch: 16 }, // Brand
    { wch: 14 }  // Status
  ]

  // Sheet 2: Product Variants
  const variantHeaders = [
    "Parent Product SKU",
    "Include Variant",
    "Variant SKU",
    "Size",
    "Size Unit",
    "Bottle Type",
    "Selling Price",
    "MRP",
    "Cost Price",
    "Stock",
    "Low Stock Alert",
    "Default Variant",
    "Variant Status"
  ]

  const sampleVariants = [
    [
      "GLD-PER-001",
      "Yes",
      "GLD-PER-001-6ML-ROL",
      "6ml",
      "ml",
      "Roll-On",
      1500,
      1800,
      500,
      25,
      5,
      "Yes",
      "Active"
    ],
    [
      "GLD-PER-001",
      "Yes",
      "GLD-PER-001-12ML-DIP",
      "12ml",
      "ml",
      "Glass Dipstick",
      2800,
      3400,
      900,
      15,
      3,
      "No",
      "Active"
    ],
    [
      "GLD-PER-001",
      "Yes",
      "GLD-PER-001-25ML-DEC",
      "25ml",
      "ml",
      "Crystal Decanter",
      5500,
      6500,
      1800,
      8,
      2,
      "No",
      "Active"
    ],
    [
      "GLD-PER-002",
      "Yes",
      "GLD-PER-002-3ML-ROL",
      "3ml",
      "ml",
      "Roll-On",
      2400,
      2900,
      800,
      15,
      3,
      "Yes",
      "Active"
    ],
    [
      "GLD-PER-002",
      "Yes",
      "GLD-PER-002-6ML-DIP",
      "6ml",
      "ml",
      "Glass Dipstick",
      4500,
      5400,
      1500,
      10,
      2,
      "No",
      "Active"
    ]
  ]

  const wsVariants = XLSX.utils.aoa_to_sheet([variantHeaders, ...sampleVariants])
  wsVariants["!cols"] = [
    { wch: 18 }, // Parent SKU
    { wch: 14 }, // Include
    { wch: 24 }, // Variant SKU
    { wch: 12 }, // Size
    { wch: 10 }, // Size Unit
    { wch: 20 }, // Bottle Type
    { wch: 14 }, // Selling Price
    { wch: 12 }, // MRP
    { wch: 12 }, // Cost Price
    { wch: 10 }, // Stock
    { wch: 15 }, // Low Stock
    { wch: 15 }, // Default
    { wch: 14 }  // Status
  ]

  // Sheet 3: Instructions & Reference
  const instructions = [
    ["ATTARWALA BULK CATALOGUE UPLOAD GUIDE"],
    [""],
    ["1. SHEETS OVERVIEW"],
    ["  - 'Parent Products': Contains master fragrance identity, notes pyramid, categories, and descriptions."],
    ["  - 'Product Variants': Multiple sizes/bottles for each parent product linked by 'Parent Product SKU'."],
    [""],
    ["2. PRODUCT PHOTOGRAPHY ZIP ARCHIVE STRUCTURE"],
    ["  You can upload a ZIP archive alongside this Excel file with product images organized by SKU:"],
    ["  products/"],
    ["    GLD-PER-001/"],
    ["      01-front-hero.jpg       <- Matched as Primary storefront image"],
    ["      02-angled-view.jpg      <- Matched as Secondary gallery image"],
    ["      03-lifestyle.jpg        <- Matched as Lifestyle/Packaging image"],
    ["    GLD-PER-002/"],
    ["      01-front-hero.jpg"],
    ["      02-angled-view.jpg"],
    [""],
    ["3. SUPPORTED BOTTLE TYPES"],
    ["  - Roll-On"],
    ["  - Fine Mist Spray"],
    ["  - Glass Dipstick"],
    ["  - Pocket Atomizer"],
    ["  - Crystal Decanter"],
    ["  - Luxury Decanter"],
    ["  - Airtight Glass Jar"],
    ["  - Gold Velvet Box"],
    ["  - Custom (Enter any custom bottle name)"],
    [""],
    ["4. SAFETY & RULES"],
    ["  - Never leave Fragrance Name or Parent SKU empty."],
    ["  - Selling Price must be greater than 0."],
    ["  - Imported products are set to 'Draft' status by default so you can review them before publishing."]
  ]

  const wsGuide = XLSX.utils.aoa_to_sheet(instructions)
  wsGuide["!cols"] = [{ wch: 100 }]

  XLSX.utils.book_append_sheet(wb, wsParents, "Parent Products")
  XLSX.utils.book_append_sheet(wb, wsVariants, "Product Variants")
  XLSX.utils.book_append_sheet(wb, wsGuide, "Instructions")

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
}

// ====================================================================
// 2. SPREADSHEET PARSER (PHASE 2)
// ====================================================================
export function parseSpreadsheet(buffer: Buffer): { parents: RawParentProduct[]; variants: RawVariant[] } {
  const wb = XLSX.read(buffer, { type: "buffer" })
  const sheetNames = wb.SheetNames

  let parents: RawParentProduct[] = []
  let variants: RawVariant[] = []

  // Check if workbook contains separate "Parent Products" / "Product Variants" sheets
  const parentSheetName = sheetNames.find(n => n.toLowerCase().includes("parent") || n.toLowerCase().includes("product"))
  const variantSheetName = sheetNames.find(n => n.toLowerCase().includes("variant") || n.toLowerCase().includes("size"))

  if (parentSheetName && variantSheetName && parentSheetName !== variantSheetName) {
    // Mode A: Multi-sheet workbook
    const parentSheet = wb.Sheets[parentSheetName]
    const rawParentRows: any[] = XLSX.utils.sheet_to_json(parentSheet, { defval: "" })

    parents = rawParentRows.map((row, idx) => {
      const keys = Object.keys(row).reduce((acc, k) => {
        acc[cleanKey(k)] = row[k]
        return acc
      }, {} as Record<string, any>)

      const sku = String(keys["productsku"] || keys["sku"] || keys["parentsku"] || "").trim()
      const name = String(keys["fragrancename"] || keys["name"] || keys["productname"] || "").trim()

      return {
        rowNumber: idx + 2,
        sku,
        name,
        category: String(keys["category"] || "Attars").trim(),
        series: String(keys["fragranceseries"] || keys["series"] || "").trim() || undefined,
        gender: String(keys["gender"] || "Unisex").trim(),
        fragranceFamily: String(keys["fragrancefamily"] || keys["family"] || "").trim() || undefined,
        shortDescription: String(keys["shortdescription"] || keys["tagline"] || "").trim() || undefined,
        description: String(keys["fulldescription"] || keys["description"] || "").trim() || undefined,
        topNotes: String(keys["topnotes"] || keys["top"] || "").trim() || undefined,
        heartNotes: String(keys["heartnotes"] || keys["middle"] || keys["heart"] || "").trim() || undefined,
        baseNotes: String(keys["basenotes"] || keys["base"] || "").trim() || undefined,
        brand: String(keys["brand"] || "SN AttarWala").trim(),
        publishStatus: String(keys["publishstatus"] || keys["status"] || "Draft").trim()
      }
    }).filter(p => p.sku || p.name)

    const variantSheet = wb.Sheets[variantSheetName]
    const rawVariantRows: any[] = XLSX.utils.sheet_to_json(variantSheet, { defval: "" })

    variants = rawVariantRows.map((row, idx) => {
      const keys = Object.keys(row).reduce((acc, k) => {
        acc[cleanKey(k)] = row[k]
        return acc
      }, {} as Record<string, any>)

      const parentSku = String(keys["parentproductsku"] || keys["parentsku"] || keys["productsku"] || "").trim()
      const variantSku = String(keys["variantsku"] || keys["sku"] || "").trim()
      const size = String(keys["size"] || "").trim()
      const bottleType = String(keys["bottletype"] || keys["bottle"] || "Roll-On").trim()
      const price = Number(keys["sellingprice"] || keys["price"] || 0)
      const compareAtPrice = keys["mrp"] || keys["compareatprice"] ? Number(keys["mrp"] || keys["compareatprice"]) : null
      const costPrice = keys["costprice"] ? Number(keys["costprice"]) : null
      const stock = Number(keys["stock"] || keys["quantity"] || 0)
      const lowStockAlert = keys["lowstockalert"] || keys["reorderlevel"] ? Number(keys["lowstockalert"] || keys["reorderlevel"]) : 5
      const isDefault = String(keys["defaultvariant"] || keys["isdefault"] || "").toLowerCase().startsWith("y")

      return {
        rowNumber: idx + 2,
        parentSku,
        variantSku: variantSku || `${parentSku}-${size}-${bottleType.slice(0, 3).toUpperCase()}`,
        size: size || "6ml",
        sizeUnit: String(keys["sizeunit"] || "ml").trim(),
        bottleType: bottleType || "Roll-On",
        price,
        compareAtPrice,
        costPrice,
        stock: isNaN(stock) ? 0 : stock,
        reorderLevel: isNaN(lowStockAlert) ? 5 : lowStockAlert,
        isDefault,
        status: String(keys["variantstatus"] || "Active").trim()
      }
    }).filter(v => v.parentSku || v.size)

  } else {
    // Mode B: Single-sheet CSV / Excel
    const sheet = wb.Sheets[sheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" })

    const parentsMap: Record<string, RawParentProduct> = {}

    rows.forEach((row, idx) => {
      const keys = Object.keys(row).reduce((acc, k) => {
        acc[cleanKey(k)] = row[k]
        return acc
      }, {} as Record<string, any>)

      const parentSku = String(keys["parentsku"] || keys["productsku"] || keys["sku"] || "").trim()
      const name = String(keys["fragrancename"] || keys["name"] || keys["productname"] || "").trim()

      if (parentSku && !parentsMap[parentSku]) {
        parentsMap[parentSku] = {
          rowNumber: idx + 2,
          sku: parentSku,
          name: name || parentSku,
          category: String(keys["category"] || "Attars").trim(),
          series: String(keys["fragranceseries"] || keys["series"] || "").trim() || undefined,
          gender: String(keys["gender"] || "Unisex").trim(),
          fragranceFamily: String(keys["fragrancefamily"] || keys["family"] || "").trim() || undefined,
          shortDescription: String(keys["shortdescription"] || "").trim() || undefined,
          description: String(keys["description"] || keys["fulldescription"] || "").trim() || undefined,
          topNotes: String(keys["topnotes"] || keys["top"] || "").trim() || undefined,
          heartNotes: String(keys["heartnotes"] || keys["middle"] || "").trim() || undefined,
          baseNotes: String(keys["basenotes"] || keys["base"] || "").trim() || undefined,
          brand: String(keys["brand"] || "SN AttarWala").trim(),
          publishStatus: String(keys["publishstatus"] || "Draft").trim()
        }
      }

      // If variant fields exist on the row
      const size = String(keys["size"] || "6ml").trim()
      const price = Number(keys["sellingprice"] || keys["price"] || 0)
      if (parentSku && (size || price > 0)) {
        const bottleType = String(keys["bottletype"] || keys["bottle"] || "Roll-On").trim()
        const variantSku = String(keys["variantsku"] || "").trim() || `${parentSku}-${size}-${bottleType.slice(0, 3).toUpperCase()}`
        variants.push({
          rowNumber: idx + 2,
          parentSku,
          variantSku,
          size,
          sizeUnit: String(keys["sizeunit"] || "ml").trim(),
          bottleType,
          price,
          compareAtPrice: keys["mrp"] ? Number(keys["mrp"]) : null,
          costPrice: keys["costprice"] ? Number(keys["costprice"]) : null,
          stock: Number(keys["stock"] || 20),
          reorderLevel: 5,
          isDefault: variants.filter(v => v.parentSku === parentSku).length === 0,
          status: "Active"
        })
      }
    })

    parents = Object.values(parentsMap)
  }

  // If a parent product has no explicit variants, synthesize a default variant
  parents.forEach(p => {
    const parentVars = variants.filter(v => v.parentSku === p.sku)
    if (parentVars.length === 0) {
      variants.push({
        rowNumber: p.rowNumber,
        parentSku: p.sku,
        variantSku: `${p.sku}-6ML-ROL`,
        size: "6ml",
        sizeUnit: "ml",
        bottleType: p.category === "Perfumes" ? "Fine Mist Spray" : "Roll-On",
        price: 1500,
        compareAtPrice: 1800,
        stock: 20,
        reorderLevel: 5,
        isDefault: true,
        status: "Active"
      })
    }
  })

  return { parents, variants }
}

// ====================================================================
// 3. ZIP IMAGE EXTRACTOR & MATCHING (PHASE 1 & 4)
// ====================================================================
export async function parseImageZip(zipBuffer: Buffer): Promise<Record<string, ExtractedImage[]>> {
  const zip = await JSZip.loadAsync(zipBuffer)
  const imagesBySku: Record<string, ExtractedImage[]> = {}

  const validExts = [".jpg", ".jpeg", ".png", ".webp"]

  for (const [rawPath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue

    // SECURITY CHECK (Phase 8): Path traversal prevention
    const normalized = path.normalize(rawPath).replace(/^(\.\.[\/\\])+/, "")
    if (normalized.includes("..") || path.isAbsolute(normalized)) {
      console.warn("Blocked potentially unsafe ZIP path traversal:", rawPath)
      continue
    }

    const ext = path.extname(normalized).toLowerCase()
    if (!validExts.includes(ext)) continue

    const baseName = path.basename(normalized, ext).toLowerCase()
    const parts = normalized.split(/[\/\\]/).filter(Boolean)

    // Expected structure:
    // products/GLD-PER-001/01-front-hero.jpg  OR
    // GLD-PER-001/01-front-hero.jpg          OR
    // GLD-PER-001-hero.jpg
    let sku = ""
    if (parts.length >= 2) {
      // Folder based: find folder segment that looks like SKU
      const folderCandidate = parts[parts.length - 2].toUpperCase()
      if (folderCandidate !== "PRODUCTS" && folderCandidate !== "IMAGES") {
        sku = folderCandidate
      } else if (parts.length >= 3) {
        sku = parts[parts.length - 2].toUpperCase()
      }
    }

    if (!sku) {
      // Flat naming: extract SKU from filename prefix before '-' or '_'
      const match = path.basename(normalized).match(/^([A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+)/i)
      if (match) {
        sku = match[1].toUpperCase()
      } else {
        // Fallback: take first part before underscore
        const flatParts = path.basename(normalized).split(/[-_]/)
        if (flatParts.length >= 2) {
          sku = flatParts[0].toUpperCase()
        }
      }
    }

    if (!sku) continue

    const buffer = await zipEntry.async("nodebuffer")
    const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg"

    // Role detection
    let role: "primary" | "secondary" | "lifestyle" | "variant" = "secondary"
    if (
      baseName.includes("01") ||
      baseName.includes("hero") ||
      baseName.includes("front") ||
      baseName.includes("primary") ||
      baseName.includes("cover")
    ) {
      role = "primary"
    } else if (baseName.includes("lifestyle") || baseName.includes("03") || baseName.includes("box")) {
      role = "lifestyle"
    }

    // Check if filename specifies a bottle type or size
    let bottleTypeMatch: string | undefined
    for (const bt of SUPPORTED_BOTTLE_TYPES) {
      if (baseName.toLowerCase().includes(bt.toLowerCase().replace(/[^a-z]/g, ""))) {
        bottleTypeMatch = bt
        break
      }
    }

    if (!imagesBySku[sku]) {
      imagesBySku[sku] = []
    }

    imagesBySku[sku].push({
      fileName: path.basename(normalized),
      path: normalized,
      sku,
      role,
      bottleTypeMatch,
      buffer,
      mimeType,
      sizeBytes: buffer.length
    })
  }

  // Ensure each SKU has at least one primary image if images exist
  Object.keys(imagesBySku).forEach(sku => {
    const list = imagesBySku[sku]
    if (list.length > 0 && !list.some(img => img.role === "primary")) {
      list[0].role = "primary"
    }
  })

  return imagesBySku
}

// ====================================================================
// 4. CATALOGUE VALIDATION ENGINE (PHASE 3)
// ====================================================================
export async function validateCatalogue(
  parents: RawParentProduct[],
  variants: RawVariant[],
  imagesBySku: Record<string, ExtractedImage[]> = {}
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  const supabase = getSupabase()

  // Fetch existing SKUs from DB to detect duplicates or updates
  let existingDbSkus: Set<string> = new Set()
  try {
    const { data: dbProducts } = await supabase.from("products").select("sku")
    if (dbProducts) {
      existingDbSkus = new Set(dbProducts.map(p => (p.sku || "").toUpperCase()))
    }
  } catch (err) {
    console.warn("Could not query DB SKUs for validation:", err)
  }

  const seenParentSkus = new Set<string>()
  const parentSkuSet = new Set<string>()

  // Validate Parent Products
  parents.forEach(p => {
    if (!p.sku) {
      issues.push({
        rowType: "Parent",
        rowNumber: p.rowNumber,
        field: "Product SKU",
        severity: "ERROR",
        message: "Missing Product SKU."
      })
    } else {
      const upperSku = p.sku.toUpperCase()
      if (seenParentSkus.has(upperSku)) {
        issues.push({
          rowType: "Parent",
          rowNumber: p.rowNumber,
          sku: p.sku,
          field: "Product SKU",
          severity: "ERROR",
          message: `Duplicate Product SKU '${p.sku}' found within spreadsheet.`
        })
      } else {
        seenParentSkus.add(upperSku)
        parentSkuSet.add(upperSku)
      }

      if (existingDbSkus.has(upperSku)) {
        issues.push({
          rowType: "Parent",
          rowNumber: p.rowNumber,
          sku: p.sku,
          field: "Product SKU",
          severity: "WARNING",
          message: `Product SKU '${p.sku}' already exists in database. Existing entry will be updated safely (no duplicate created).`
        })
      }
    }

    if (!p.name) {
      issues.push({
        rowType: "Parent",
        rowNumber: p.rowNumber,
        sku: p.sku,
        field: "Fragrance Name",
        severity: "ERROR",
        message: "Fragrance Name is required."
      })
    }

    // Check images
    const skuImages = p.sku ? imagesBySku[p.sku.toUpperCase()] : undefined
    if (!skuImages || skuImages.length === 0) {
      issues.push({
        rowType: "Parent",
        rowNumber: p.rowNumber,
        sku: p.sku,
        name: p.name,
        field: "Product Images",
        severity: "WARNING",
        message: `No matching images found for SKU '${p.sku}'. Default luxury placeholder will be assigned.`
      })
    }
  })

  // Validate Variants
  const seenVariantSkus = new Set<string>()

  variants.forEach(v => {
    if (!v.parentSku) {
      issues.push({
        rowType: "Variant",
        rowNumber: v.rowNumber,
        field: "Parent SKU",
        severity: "ERROR",
        message: "Variant row is missing Parent Product SKU reference."
      })
    } else if (!parentSkuSet.has(v.parentSku.toUpperCase())) {
      issues.push({
        rowType: "Variant",
        rowNumber: v.rowNumber,
        sku: v.parentSku,
        field: "Parent SKU",
        severity: "ERROR",
        message: `Parent SKU '${v.parentSku}' referenced by variant does not exist in Parent Products sheet.`
      })
    }

    if (!v.variantSku) {
      issues.push({
        rowType: "Variant",
        rowNumber: v.rowNumber,
        sku: v.parentSku,
        field: "Variant SKU",
        severity: "ERROR",
        message: "Missing Variant SKU."
      })
    } else {
      const upperVarSku = v.variantSku.toUpperCase()
      if (seenVariantSkus.has(upperVarSku)) {
        issues.push({
          rowType: "Variant",
          rowNumber: v.rowNumber,
          sku: v.variantSku,
          field: "Variant SKU",
          severity: "ERROR",
          message: `Duplicate Variant SKU '${v.variantSku}' found within spreadsheet.`
        })
      } else {
        seenVariantSkus.add(upperVarSku)
      }
    }

    if (!v.size) {
      issues.push({
        rowType: "Variant",
        rowNumber: v.rowNumber,
        sku: v.variantSku,
        field: "Size",
        severity: "ERROR",
        message: "Bottle size is required (e.g. 6ml, 12ml, 50ml)."
      })
    }

    if (!v.price || v.price <= 0 || isNaN(v.price)) {
      issues.push({
        rowType: "Variant",
        rowNumber: v.rowNumber,
        sku: v.variantSku,
        field: "Selling Price",
        severity: "ERROR",
        message: `Invalid selling price (₹${v.price}). Must be greater than 0.`
      })
    }

    if (v.compareAtPrice && v.compareAtPrice < v.price) {
      issues.push({
        rowType: "Variant",
        rowNumber: v.rowNumber,
        sku: v.variantSku,
        field: "MRP",
        severity: "WARNING",
        message: `MRP (₹${v.compareAtPrice}) is lower than Selling Price (₹${v.price}).`
      })
    }

    if (v.stock < 0 || isNaN(v.stock)) {
      issues.push({
        rowType: "Variant",
        rowNumber: v.rowNumber,
        sku: v.variantSku,
        field: "Stock",
        severity: "ERROR",
        message: `Invalid stock quantity (${v.stock}). Cannot be negative.`
      })
    }
  })

  // Summary Metrics
  const errorCount = issues.filter(i => i.severity === "ERROR").length
  const warningCount = issues.filter(i => i.severity === "WARNING").length

  let matchedImages = 0
  parents.forEach(p => {
    if (p.sku && imagesBySku[p.sku.toUpperCase()]?.length > 0) {
      matchedImages += imagesBySku[p.sku.toUpperCase()].length
    }
  })

  const totalImagesDetected = Object.values(imagesBySku).reduce((sum, list) => sum + list.length, 0)
  const missingImages = parents.filter(p => !p.sku || !imagesBySku[p.sku.toUpperCase()]?.length).length
  const duplicateCount = issues.filter(i => i.message.includes("Duplicate")).length
  const readyCount = errorCount === 0 ? parents.length : 0

  const status: "READY" | "WARNING" | "ERROR" =
    errorCount > 0 ? "ERROR" : warningCount > 0 ? "WARNING" : "READY"

  // Build Preview List
  const previewParents = parents.map(p => {
    const parentVars = variants.filter(v => v.parentSku.toUpperCase() === p.sku.toUpperCase())
    const pImages = (imagesBySku[p.sku.toUpperCase()] || []).map(img => ({
      fileName: img.fileName,
      role: img.role,
      previewUrl: `data:${img.mimeType};base64,${img.buffer.toString("base64")}`
    }))
    const pIssues = issues.filter(i => i.sku?.toUpperCase() === p.sku.toUpperCase())
    const pStatus: "READY" | "WARNING" | "ERROR" = pIssues.some(i => i.severity === "ERROR")
      ? "ERROR"
      : pIssues.some(i => i.severity === "WARNING")
      ? "WARNING"
      : "READY"

    return {
      parent: p,
      variants: parentVars,
      images: pImages,
      validationStatus: pStatus,
      issues: pIssues
    }
  })

  return {
    status,
    totalParents: parents.length,
    totalVariants: variants.length,
    totalImagesDetected,
    matchedImages,
    missingImages,
    duplicateCount,
    errorCount,
    warningCount,
    readyCount,
    issues,
    previewParents
  }
}

// ====================================================================
// 5. ERROR REPORT CSV GENERATOR (PHASE 3)
// ====================================================================
export function generateErrorReportCsv(issues: ValidationIssue[]): string {
  const headers = ["Row Type", "Row Number", "SKU", "Product / Variant", "Severity", "Field", "Error Description"]
  const rows = issues.map(i => [
    `"${i.rowType}"`,
    i.rowNumber ? `"${i.rowNumber}"` : '""',
    `"${(i.sku || "").replace(/"/g, '""')}"`,
    `"${(i.name || "").replace(/"/g, '""')}"`,
    `"${i.severity}"`,
    `"${(i.field || "").replace(/"/g, '""')}"`,
    `"${(i.message || "").replace(/"/g, '""')}"`
  ])

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n")
}

// ====================================================================
// 6. SAFE DATABASE IMPORT EXECUTION ENGINE (PHASE 5)
// ====================================================================
export async function executeCatalogueImport(
  parents: RawParentProduct[],
  variants: RawVariant[],
  imagesBySku: Record<string, ExtractedImage[]> = {},
  options: {
    adminEmail?: string
    adminUserId?: string
    fileName?: string
    fileSizeBytes?: number
  } = {}
): Promise<ImportExecutionResult> {
  const supabase = getSupabase()
  const importId = `imp_${Date.now()}`

  let successfulParents = 0
  let successfulVariants = 0
  let successfulImages = 0
  const errors: Array<{ sku: string; error: string }> = []
  const importedProducts: Array<{ id: string; name: string; sku: string; slug: string }> = []

  const categoryMap: Record<string, string> = {
    "Attars": "a2f36fbb-93e6-4d79-b32d-d5f357b641d7",
    "Perfumes": "d9a01723-6ba9-4b2a-8c48-d848c09a37d8",
    "Bakhoor": "e2cb2b9b-0a9f-406a-ae7e-a3719567829c"
  }

  // Ensure upload directory exists for image persistence
  const uploadDir = path.join(process.cwd(), "public", "products")
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true })
    } catch (err) {
      console.warn("Could not create public/products directory:", err)
    }
  }

  for (const parent of parents) {
    try {
      const parentSku = parent.sku.trim().toUpperCase()
      const parentVars = variants.filter(v => v.parentSku.trim().toUpperCase() === parentSku)

      // Find default variant or lowest price
      const defaultVar = parentVars.find(v => v.isDefault) || parentVars[0]
      const price = defaultVar ? defaultVar.price : 1500
      const compareAtPrice = defaultVar?.compareAtPrice ?? null
      const costPrice = defaultVar?.costPrice ?? 500
      const totalStock = parentVars.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      const sizeStr = parentVars.map(v => v.size).filter(Boolean).join(", ")

      // Save & Upload Images for this SKU
      const skuImages = imagesBySku[parentSku] || []
      const savedImageUrls: Array<{ url: string; isPrimary: boolean; role: string }> = []

      for (let imgIdx = 0; imgIdx < skuImages.length; imgIdx++) {
        const img = skuImages[imgIdx]
        const cleanName = `prod-${Date.now()}-${parentSku.toLowerCase()}-${img.role}-${imgIdx}${path.extname(img.fileName) || ".jpg"}`
        const filePath = path.join(uploadDir, cleanName)

        let finalUrl = ""
        try {
          fs.writeFileSync(filePath, img.buffer)
          finalUrl = `/products/${cleanName}`
          successfulImages++
        } catch {
          // Serverless fallback: compact data url
          finalUrl = `data:${img.mimeType};base64,${img.buffer.toString("base64")}`
          successfulImages++
        }

        savedImageUrls.push({
          url: finalUrl,
          isPrimary: img.role === "primary" || imgIdx === 0,
          role: img.role
        })
      }

      // If no images provided, fall back to default
      const primaryImageUrl = savedImageUrls.find(i => i.isPrimary)?.url ||
        savedImageUrls[0]?.url ||
        "/products/white-oudh-attar.jpg"

      const allGalleryUrls = savedImageUrls.map(i => i.url)

      // Map variant items with images if available
      const mappedVariants = parentVars.map(v => ({
        sku: v.variantSku,
        size: v.size,
        bottleType: v.bottleType,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? null,
        costPrice: v.costPrice ?? null,
        stock: v.stock,
        reorderLevel: v.reorderLevel ?? 5,
        isDefault: Boolean(v.isDefault),
        status: v.status || "Active",
        imageUrl: savedImageUrls[0]?.url || primaryImageUrl
      }))

      // Generate clean collision-proof slug
      const baseSlug = (parent.name || parentSku).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "fragrance"
      let slug = baseSlug

      // Check if product already exists by SKU to update instead of duplicate
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id, slug")
        .eq("sku", parentSku)
        .maybeSingle()

      const topNotes = parent.topNotes || "Bergamot, Floral Accents"
      const heartNotes = parent.heartNotes || "Damask Rose, Amber"
      const baseNotes = parent.baseNotes || "Cambodian Oud, Musk"

      const category = parent.category || "Attars"
      const categoryId = categoryMap[category] || categoryMap["Attars"]

      const payload: Record<string, any> = {
        name: parent.name,
        category,
        category_id: categoryId,
        gender: parent.gender || "Unisex",
        fragrance_family: parent.fragranceFamily || "Oud",
        fragrance_type: category === "Attars" ? "Attar Oil" : category === "Bakhoor" ? "Incense Wood" : "Eau De Parfum",
        price,
        compare_at_price: compareAtPrice,
        cost_price: costPrice,
        stock_quantity: totalStock,
        size: sizeStr || "6ml",
        variants: mappedVariants,
        top_notes: topNotes,
        middle_notes: heartNotes,
        base_notes: baseNotes,
        short_description: parent.shortDescription || parent.name,
        description: parent.description || `Exquisite luxury ${parent.name} crafted by SN AttarWala.`,
        tags: parent.series ? [parent.series] : [],
        is_active: false, // PHASE 5 RULE: Set imported products to Draft by default
        status: "Draft"
      }

      if (allGalleryUrls.length > 0) {
        payload.image_url = primaryImageUrl
        payload.images = allGalleryUrls
      }

      let targetProductId = ""

      if (existingProduct) {
        // UPDATE existing product
        slug = existingProduct.slug
        const { data: updated, error: updateErr } = await supabase
          .from("products")
          .update(payload)
          .eq("id", existingProduct.id)
          .select("id, name, sku, slug")
          .single()

        if (updateErr) {
          throw updateErr
        }
        targetProductId = updated.id
        importedProducts.push(updated)
      } else {
        // INSERT new product
        // Check for existing slug collision
        const { data: slugCheck } = await supabase.from("products").select("slug").ilike("slug", `${baseSlug}%`)
        if (slugCheck && slugCheck.length > 0) {
          const set = new Set(slugCheck.map(s => s.slug?.toLowerCase()))
          if (set.has(slug)) {
            let cnt = 2
            while (set.has(`${baseSlug}-${cnt}`)) cnt++
            slug = `${baseSlug}-${cnt}`
          }
        }

        payload.sku = parentSku
        payload.slug = slug

        let { data: inserted, error: insertErr } = await supabase
          .from("products")
          .insert(payload)
          .select("id, name, sku, slug")
          .single()

        if (insertErr && (insertErr.message.includes("products_slug_key") || insertErr.message.includes("unique"))) {
          payload.slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`
          const retry = await supabase.from("products").insert(payload).select("id, name, sku, slug").single()
          inserted = retry.data
          insertErr = retry.error
        }

        if (insertErr || !inserted) {
          throw insertErr || new Error("Failed to insert product")
        }

        targetProductId = inserted.id
        importedProducts.push(inserted)
      }

      // Associate product images in product_images table
      if (targetProductId && savedImageUrls.length > 0) {
        const imageInserts = savedImageUrls.map((img, idx) => ({
          product_id: targetProductId,
          image_url: img.url,
          alt_text: `${parent.name} - Photo ${idx + 1}`,
          display_order: idx,
          is_primary: img.isPrimary
        }))
        await supabase.from("product_images").insert(imageInserts)
      }

      successfulParents++
      successfulVariants += mappedVariants.length
    } catch (err: any) {
      console.error(`Import failed for SKU ${parent.sku}:`, err)
      errors.push({
        sku: parent.sku,
        error: err?.message || String(err)
      })
    }
  }

  const failedCount = errors.length
  const finalStatus: "Completed" | "Completed with Warnings" | "Failed" =
    failedCount === 0 ? "Completed" : successfulParents > 0 ? "Completed with Warnings" : "Failed"

  // Save Import History session (PHASE 7)
  const historyRecord = {
    id: importId,
    file_name: options.fileName || "catalogue-import.xlsx",
    file_size: options.fileSizeBytes || 0,
    admin_email: options.adminEmail || "admin@attarwala.com",
    admin_user_id: options.adminUserId || null,
    total_products: parents.length,
    total_variants: variants.length,
    total_images: Object.values(imagesBySku).reduce((s, a) => s + a.length, 0),
    successful_records: successfulParents,
    failed_records: failedCount,
    status: finalStatus,
    error_report: errors,
    summary: {
      importedProducts: importedProducts.map(p => ({ sku: p.sku, name: p.name })),
      successfulVariants,
      successfulImages
    },
    created_at: new Date().toISOString()
  }

  // Try writing to Supabase catalog_imports table; fallback to local JSON
  try {
    await supabase.from("catalog_imports").insert({
      file_name: historyRecord.file_name,
      file_size: historyRecord.file_size,
      admin_email: historyRecord.admin_email,
      admin_user_id: historyRecord.admin_user_id,
      total_products: historyRecord.total_products,
      total_variants: historyRecord.total_variants,
      total_images: historyRecord.total_images,
      successful_records: historyRecord.successful_records,
      failed_records: historyRecord.failed_records,
      status: historyRecord.status,
      error_report: historyRecord.error_report,
      summary: historyRecord.summary
    })
  } catch (dbErr) {
    console.warn("Could not insert to catalog_imports table, writing to local file fallback:", dbErr)
  }

  saveLocalImportHistory(historyRecord)

  return {
    importId,
    timestamp: new Date().toISOString(),
    totalParents: parents.length,
    totalVariants: variants.length,
    totalImages: Object.values(imagesBySku).reduce((s, a) => s + a.length, 0),
    successfulParents,
    successfulVariants,
    successfulImages,
    failedCount,
    status: finalStatus,
    errors,
    importedProducts
  }
}

// Local fallback store for import history
function getHistoryFilePath(): string {
  const dir = path.join(process.cwd(), ".data")
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }) } catch {}
  }
  return path.join(dir, "catalog-imports.json")
}

export function saveLocalImportHistory(record: any) {
  try {
    const filePath = getHistoryFilePath()
    let records: any[] = []
    if (fs.existsSync(filePath)) {
      records = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    }
    records.unshift(record)
    fs.writeFileSync(filePath, JSON.stringify(records.slice(0, 50), null, 2))
  } catch (err) {
    console.warn("Could not write local import history:", err)
  }
}

export async function getImportHistory(): Promise<any[]> {
  const supabase = getSupabase()

  // First try querying Supabase table
  try {
    const { data, error } = await supabase
      .from("catalog_imports")
      .select("*")
      .order("created_at", { ascending: false })

    if (data && data.length > 0 && !error) {
      return data
    }
  } catch {}

  // Fallback to local file store
  try {
    const filePath = getHistoryFilePath()
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"))
    }
  } catch {}

  return []
}
