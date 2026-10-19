import { NextRequest, NextResponse } from "next/server"
import { DEFAULT_STORE_POLICIES, StorePolicies } from "@/lib/policies-service"

export const dynamic = "force-dynamic"

let cachedPolicies: StorePolicies = { ...DEFAULT_STORE_POLICIES }

export async function GET() {
  return NextResponse.json({
    success: true,
    policies: cachedPolicies
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    cachedPolicies = {
      ...cachedPolicies,
      ...body,
      lastUpdated: new Date().toISOString()
    }
    return NextResponse.json({
      success: true,
      policies: cachedPolicies
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to update policies" }, { status: 500 })
  }
}
