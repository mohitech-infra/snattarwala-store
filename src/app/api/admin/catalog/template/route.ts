import { NextResponse } from "next/server"
import { generateExcelTemplate } from "@/lib/catalog-import-service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const buffer = generateExcelTemplate()

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Attarwala_Catalogue_Upload_Template.xlsx"',
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("Error generating catalogue template:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate Excel template" },
      { status: 500 }
    )
  }
}
