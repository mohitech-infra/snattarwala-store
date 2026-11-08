import { NextRequest, NextResponse } from "next/server"
import {
  parseSpreadsheet,
  parseImageZip,
  validateCatalogue,
  generateErrorReportCsv,
  ExtractedImage,
} from "@/lib/catalog-import-service"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // 60s timeout for large uploads

function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "webp":
      return "image/webp"
    default:
      return "application/octet-stream"
  }
}

function parseLooseImageFile(file: File, buffer: Buffer): ExtractedImage | null {
  const cleanName = file.name.trim()
  const lower = cleanName.toLowerCase()
  const validExts = [".jpg", ".jpeg", ".png", ".webp"]
  if (!validExts.some((ext) => lower.endsWith(ext))) {
    return null
  }

  const nameWithoutExt = cleanName.replace(/\.[^/.]+$/, "")
  const parts = nameWithoutExt.split(/[-_]/)

  let skuCandidate = ""
  if (parts.length >= 3 && parts[0].length >= 2 && parts[1].length >= 2) {
    skuCandidate = `${parts[0]}-${parts[1]}-${parts[2]}`.toUpperCase()
  } else if (parts.length >= 2) {
    skuCandidate = `${parts[0]}-${parts[1]}`.toUpperCase()
  } else {
    skuCandidate = parts[0].toUpperCase()
  }

  let role: "primary" | "secondary" | "lifestyle" | "variant" = "secondary"
  if (lower.includes("front") || lower.includes("hero") || lower.includes("01") || lower.includes("primary")) {
    role = "primary"
  } else if (lower.includes("lifestyle") || lower.includes("03") || lower.includes("context")) {
    role = "lifestyle"
  } else if (lower.includes("variant") || lower.includes("bottle")) {
    role = "variant"
  }

  return {
    fileName: cleanName,
    path: cleanName,
    sku: skuCandidate,
    role,
    buffer,
    mimeType: getMimeType(cleanName),
    sizeBytes: buffer.length,
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const spreadsheetFile = formData.get("spreadsheet") as File | null
    const imagesZipFile = formData.get("imagesZip") as File | null
    const looseImageFiles = formData.getAll("images") as File[]

    if (!spreadsheetFile) {
      return NextResponse.json(
        { success: false, error: "Please upload an Excel (.xlsx) or CSV (.csv) spreadsheet file." },
        { status: 400 }
      )
    }

    // 1. Parse spreadsheet
    const spreadsheetBuffer = Buffer.from(await spreadsheetFile.arrayBuffer())
    const { parents, variants } = parseSpreadsheet(spreadsheetBuffer)

    // 2. Parse images (either ZIP or loose images)
    let imagesBySku: Record<string, ExtractedImage[]> = {}

    if (imagesZipFile && imagesZipFile.size > 0) {
      const zipBuffer = Buffer.from(await imagesZipFile.arrayBuffer())
      imagesBySku = await parseImageZip(zipBuffer)
    }

    // Also include any loose uploaded images
    if (looseImageFiles && looseImageFiles.length > 0) {
      for (const imgFile of looseImageFiles) {
        if (!imgFile || imgFile.size === 0) continue
        const imgBuf = Buffer.from(await imgFile.arrayBuffer())
        const parsedImg = parseLooseImageFile(imgFile, imgBuf)
        if (parsedImg) {
          if (!imagesBySku[parsedImg.sku]) {
            imagesBySku[parsedImg.sku] = []
          }
          if (!imagesBySku[parsedImg.sku].some((x) => x.fileName === parsedImg.fileName)) {
            imagesBySku[parsedImg.sku].push(parsedImg)
          }
        }
      }
    }

    const totalImages = Object.values(imagesBySku).reduce((sum, list) => sum + list.length, 0)

    // 3. Run full validation (async)
    const validation = await validateCatalogue(parents, variants, imagesBySku)
    const errorCsv = generateErrorReportCsv(validation.issues)

    return NextResponse.json({
      success: true,
      validation,
      errorCsv,
      counts: {
        parents: parents.length,
        variants: variants.length,
        images: totalImages,
      },
    })
  } catch (error: any) {
    console.error("Error validating catalogue upload:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate catalogue file" },
      { status: 500 }
    )
  }
}
