import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 })
    }

    // Validate mime type
    const validMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif"
    ]
    if (!file.type.startsWith("image/") && !validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file format. Please upload PNG, JPG, WEBP, or SVG." },
        { status: 400 }
      )
    }

    // Validate size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image file is too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate safe filename
    const ext = path.extname(file.name) || ".jpg"
    const baseName = path.basename(file.name, ext).toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-")
    const cleanFileName = `prod-${Date.now()}-${baseName || "fragrance"}${ext}`

    // Attempt to save to public/products directory
    try {
      const uploadDir = path.join(process.cwd(), "public", "products")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      const filePath = path.join(uploadDir, cleanFileName)
      fs.writeFileSync(filePath, buffer)

      const publicUrl = `/products/${cleanFileName}`
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName: cleanFileName,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        mimeType: file.type
      })
    } catch (diskError) {
      console.warn("Could not write to disk (e.g. read-only serverless filesystem), falling back to base64 Data URL:", diskError)
      // Fallback: return Base64 data URL so it never fails even on read-only environments
      const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`
      return NextResponse.json({
        success: true,
        url: base64Data,
        fileName: cleanFileName,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        mimeType: file.type
      })
    }
  } catch (error: any) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to upload image" },
      { status: 500 }
    )
  }
}
