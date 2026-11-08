import { NextResponse } from "next/server"
import { getImportHistory } from "@/lib/catalog-import-service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const history = await getImportHistory()
    return NextResponse.json({
      success: true,
      history,
    })
  } catch (error: any) {
    console.error("Error fetching catalogue import history:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch import history", history: [] },
      { status: 500 }
    )
  }
}
