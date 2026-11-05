import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = (body.name || "").trim()

    if (!name) {
      return NextResponse.json({ success: false, error: "Fragrance Name is required." }, { status: 400 })
    }

    const category = (body.category && typeof body.category === "string" && body.category.trim()) ? body.category.trim() : "Attars"
    const slug = body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    const sku = (body.sku && typeof body.sku === "string" && body.sku.trim()) 
      ? body.sku.trim() 
      : `SNA-${name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`

    const categoryMap: Record<string, string> = {
      "Attars": "a2f36fbb-93e6-4d79-b32d-d5f357b641d7",
      "Perfumes": "d9a01723-6ba9-4b2a-8c48-d848c09a37d8",
      "Bakhoor": "e2cb2b9b-0a9f-406a-ae7e-a3719567829c",
    }
    const category_id = categoryMap[category] || categoryMap["Attars"]
    const image_url = body.imageUrl || body.image_url || "/products/white-oudh-attar.jpg"
    const price = Number(body.price) || 1500

    const topNotes = Array.isArray(body.notes?.top) ? body.notes.top.join(", ") : (body.top_notes || "Bergamot")
    const heartNotes = Array.isArray(body.notes?.heart) ? body.notes.heart.join(", ") : (body.middle_notes || "Rose")
    const baseNotes = Array.isArray(body.notes?.base) ? body.notes.base.join(", ") : (body.base_notes || "Oud")

    const supabase = getSupabase()

    const insertPayload: Record<string, any> = {
      name,
      slug,
      sku,
      category, // Guarantees NOT NULL constraint is always satisfied
      category_id,
      image_url,
      price,
      compare_at_price: body.salePrice || body.compare_at_price || null,
      stock_quantity: Number(body.stock ?? body.stock_quantity) || 20,
      gender: body.gender || "Unisex",
      fragrance_type: category === "Attars" ? "Attar Oil" : category === "Bakhoor" ? "Incense Wood" : "Eau De Parfum",
      top_notes: topNotes,
      middle_notes: heartNotes,
      base_notes: baseNotes,
      description: body.description || `Exquisite luxury ${name} crafted by SN AttarWala.`,
      short_description: body.shortDescription || body.short_description || name,
      featured: Boolean(body.isFeatured),
      best_seller: Boolean(body.isBestseller),
      new_arrival: Boolean(body.isNewArrival),
      is_active: true,
      tags: body.series ? [body.series] : (Array.isArray(body.tags) ? body.tags : []),
    }
    if (body.series) {
      insertPayload.series = body.series
    }

    let { data: newProd, error } = await supabase
      .from("products")
      .insert(insertPayload)
      .select()
      .single()

    // If 'series' column is not yet added to the schema, gracefully retry without it (series is preserved in tags)
    if (error && error.message?.includes("series")) {
      delete insertPayload.series
      const retry = await supabase.from("products").insert(insertPayload).select().single()
      newProd = retry.data
      error = retry.error
    }

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (newProd && image_url) {
      await supabase.from("product_images").insert({
        product_id: newProd.id,
        image_url,
        is_primary: true,
        display_order: 0,
      })
    }

    return NextResponse.json({ success: true, data: newProd })
  } catch (err: any) {
    console.error("Exception in POST /api/admin/products:", err)
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required for update." }, { status: 400 })
    }

    const payload: Record<string, any> = {}
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.price !== undefined) payload.price = Number(updates.price)
    if (updates.stock !== undefined || updates.stock_quantity !== undefined) {
      payload.stock_quantity = Number(updates.stock ?? updates.stock_quantity)
    }
    if (updates.sku !== undefined) payload.sku = updates.sku
    if (updates.gender !== undefined) payload.gender = updates.gender
    if (updates.category !== undefined) {
      payload.category = updates.category
      const categoryMap: Record<string, string> = {
        "Attars": "a2f36fbb-93e6-4d79-b32d-d5f357b641d7",
        "Perfumes": "d9a01723-6ba9-4b2a-8c48-d848c09a37d8",
        "Bakhoor": "e2cb2b9b-0a9f-406a-ae7e-a3719567829c",
      }
      if (categoryMap[updates.category]) {
        payload.category_id = categoryMap[updates.category]
      }
    }
    if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
      payload.image_url = updates.imageUrl || updates.image_url
    }
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.shortDescription !== undefined || updates.short_description !== undefined) {
      payload.short_description = updates.shortDescription ?? updates.short_description
    }
    if (updates.is_active !== undefined) payload.is_active = updates.is_active
    if (updates.isFeatured !== undefined) payload.featured = updates.isFeatured
    if (updates.featured !== undefined) payload.featured = updates.featured
    if (updates.isBestseller !== undefined) payload.best_seller = updates.isBestseller
    if (updates.best_seller !== undefined) payload.best_seller = updates.best_seller
    if (updates.isNewArrival !== undefined) payload.new_arrival = updates.isNewArrival
    if (updates.new_arrival !== undefined) payload.new_arrival = updates.new_arrival
    if (updates.series !== undefined) {
      payload.tags = updates.series ? [updates.series] : []
      payload.series = updates.series || null
    }

    const supabase = getSupabase()
    let { data: updated, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error && error.message?.includes("series")) {
      delete payload.series
      const retry = await supabase.from("products").update(payload).eq("id", id).select().single()
      updated = retry.data
      error = retry.error
    }

    if (error) {
      console.error("Supabase update error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const img = updates.imageUrl || updates.image_url
    if (img) {
      const { data: existingImg } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", id)
        .eq("is_primary", true)
        .limit(1)

      if (existingImg && existingImg.length > 0) {
        await supabase.from("product_images").update({ image_url: img }).eq("id", existingImg[0].id)
      } else {
        await supabase.from("product_images").insert({
          product_id: id,
          image_url: img,
          is_primary: true,
          display_order: 0,
        })
      }
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error("Exception in PATCH /api/admin/products:", err)
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 })
  }
}

