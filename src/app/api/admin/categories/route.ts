import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  return createClient(url, key)
}

export async function GET() {
  try {
    const supabase = getAdminSupabase()
    const [
      { data: categories, error: catErr },
      { data: products, error: prodErr }
    ] = await Promise.all([
      supabase.from("categories").select("*").order("created_at", { ascending: true }),
      supabase.from("products").select("id, category_id, category")
    ])

    if (catErr) throw catErr

    const counts: Record<string, number> = {}
    if (products) {
      for (const p of products) {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1
        }
        if (p.category) {
          const lower = p.category.toLowerCase().trim()
          counts[lower] = (counts[lower] || 0) + 1
        }
      }
    }

    const data = (categories || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
      description: c.description || "",
      imageUrl: c.image_url || `/categories/${c.slug || "attars"}.jpg`,
      productsCount: counts[c.id] || counts[c.name.toLowerCase().trim()] || 0,
      isActive: c.is_active !== false,
      createdAt: c.created_at
    }))

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("GET /api/admin/categories error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, description, imageUrl } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Category name is required." }, { status: 400 })
    }

    const finalSlug = slug?.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    const finalImage = imageUrl?.trim() || `/categories/${finalSlug}.jpg`

    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || "",
        image_url: finalImage,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("POST /api/admin/categories error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, slug, description, imageUrl, isActive } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Category ID is required for update." }, { status: 400 })
    }

    const payload: Record<string, any> = {}
    if (name !== undefined) payload.name = name.trim()
    if (slug !== undefined) payload.slug = slug.trim()
    if (description !== undefined) payload.description = description.trim()
    if (imageUrl !== undefined) payload.image_url = imageUrl.trim()
    if (isActive !== undefined) payload.is_active = Boolean(isActive)

    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("PATCH /api/admin/categories error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Category ID is required." }, { status: 400 })
    }

    const supabase = getAdminSupabase()

    // Check if products are assigned
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id)

    if (count && count > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete this category because ${count} product(s) are currently assigned to it. Please reassign those products first.`
      }, { status: 400 })
    }

    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("DELETE /api/admin/categories error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

