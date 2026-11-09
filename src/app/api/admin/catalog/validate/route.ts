import { NextRequest, NextResponse } from "next/server"
import {
  parseSpreadsheet,
  parseImageZip,
  validateCatalogue,
  generateErrorReportCsv,
  ExtractedImage,
} from "@/lib/catalog-import-service"

export const dynamic = "force-dynamic"
export const maxDuration = 60

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
    const contentType = req.headers.get("content-type") || ""
    let spreadsheetBuffer: Buffer | null = null
    let imagesBySku: Record<string, ExtractedImage[]> = {}

    // MODE A: JSON PAYLOAD (Recommended - immune to Undici multipart bugs & body size limits)
    if (contentType.includes("application/json")) {
      const body = await req.json()
      if (body.spreadsheetBase64) {
        spreadsheetBuffer = Buffer.from(body.spreadsheetBase64, "base64")
      }

      if (Array.isArray(body.imageManifest)) {
        for (const item of body.imageManifest) {
          const sku = (item.sku || "").toUpperCase().trim()
          if (!sku) continue
          if (!imagesBySku[sku]) {
            imagesBySku[sku] = []
          }
          imagesBySku[sku].push({
            fileName: item.fileName,
            path: item.path || item.fileName,
            sku,
            role: item.role || "secondary",
            buffer: Buffer.alloc(0),
            mimeType: getMimeType(item.fileName),
            sizeBytes: item.sizeBytes || 0,
          })
        }
      }
    } else {
      // MODE B: MULTIPART FORM-DATA (Fallback)
      let formData: FormData
      try {
        formData = await req.formData()
      } catch (formParseErr: any) {
        console.warn("req.formData() parsing failed, possible size limit:", formParseErr)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to parse upload form data. Please ensure file sizes are within limits, or use the updated bulk uploader.",
          },
          { status: 400 }
        )
      }

      const spreadsheetFile = formData.get("spreadsheet") as File | null
      const imagesZipFile = formData.get("imagesZip") as File | null
      const looseImageFiles = formData.getAll("images") as File[]
      const imageManifestRaw = formData.get("imageManifest") as string | null

      if (spreadsheetFile) {
        spreadsheetBuffer = Buffer.from(await spreadsheetFile.arrayBuffer())
      }

      // Check for client-side imageManifest
      if (imageManifestRaw) {
        try {
          const manifest: Array<{ fileName: string; path?: string; sku: string; role?: string }> =
            JSON.parse(imageManifestRaw)
          for (const item of manifest) {
            const sku = (item.sku || "").toUpperCase().trim()
            if (!sku) continue
            if (!imagesBySku[sku]) imagesBySku[sku] = []
            imagesBySku[sku].push({
              fileName: item.fileName,
              path: item.path || item.fileName,
              sku,
              role: (item.role as any) || "secondary",
              buffer: Buffer.alloc(0),
              mimeType: getMimeType(item.fileName),
              sizeBytes: 0,
            })
          }
        } catch (err) {
          console.warn("Could not parse imageManifest JSON:", err)
        }
      }

      // Parse ZIP if provided and manifest wasn't passed
      if (Object.keys(imagesBySku).length === 0 && imagesZipFile && imagesZipFile.size > 0) {
        const zipBuffer = Buffer.from(await imagesZipFile.arrayBuffer())
        imagesBySku = await parseImageZip(zipBuffer)
      }

      // Parse loose images if provided and manifest wasn't passed
      if (Object.keys(imagesBySku).length === 0 && looseImageFiles && looseImageFiles.length > 0) {
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
    }

    if (!spreadsheetBuffer || spreadsheetBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please upload an Excel (.xlsx) or CSV (.csv) spreadsheet file." },
        { status: 400 }
      )
    }

    // 1. Parse spreadsheet
    const { parents, variants } = parseSpreadsheet(spreadsheetBuffer)

    const totalImages = Object.values(imagesBySku).reduce((sum, list) => sum + list.length, 0)

    // 2. Run full validation (async)
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
