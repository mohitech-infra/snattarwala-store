import { createClient } from "@/lib/supabase/client"

export function triggerAdminCountsSync() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sn:admin-counts-sync"))
  }
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  sku: string
  category: string
  gender: string
  fragranceFamily: string
  price: number
  costPrice: number
  salePrice?: number
  stock: number
  reservedStock: number
  reorderLevel: number
  salesCount: number
  revenue: number
  rating: number
  reviewsCount: number
  status: "Active" | "Draft" | "Low Stock" | "Out of Stock"
  imageUrl: string
  variants: { size: string; sku?: string; price: number; stock: number; compareAtPrice?: number | null; isDefault?: boolean }[]
  size?: string
  notes: { top: string[]; heart: string[]; base: string[] }
  isFeatured?: boolean
  isBestseller?: boolean
  isNewArrival?: boolean
  is_active?: boolean
  description?: string
  shortDescription?: string
  series?: "Golden Series" | "Diamond Series" | "Luxury Series" | string | null
}

export interface AdminOrder {
  id: string
  orderNumber: string
  customer: {
    id: string
    name: string
    email: string
    phone: string
    city: string
    state: string
    address: string
    avatar?: string
  }
  items: {
    productId: string
    name: string
    size: string
    price: number
    quantity: number
    imageUrl: string
  }[]
  subtotal: number
  discount: number
  couponCode?: string
  shipping: number
  tax: number
  total: number
  paymentMethod: string
  paymentStatus: "Paid" | "Pending" | "Failed" | "Refunded"
  transactionId: string
  orderStatus: "New" | "Confirmed" | "Processing" | "Packed" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled" | "Returned" | "Refunded"
  courier?: string
  trackingNumber?: string
  cancelReason?: string
  createdAt: string
  notes?: string
}

export interface AdminCustomer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  state: string
  segment: "VIP" | "High Value" | "Returning" | "New Customer" | "At Risk" | "Inactive"
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastPurchaseDate: string
  favoriteFamily?: string
  favoriteProducts?: string[]
  loyaltyPoints: number
  status: "Active" | "Inactive" | "Blocked"
  address?: string
  reviewsCount?: number
  purchaseHistory?: { orderId: string; date: string; items: number; total: number; status: string }[]
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  description: string
  imageUrl: string
  productsCount: number
  isActive: boolean
}

export interface AdminCoupon {
  id: string
  code: string
  type: "Percentage" | "Fixed" | "Free Shipping"
  value: number
  minOrderValue: number
  maxDiscount?: number
  usedCount: number
  maxUses: number
  validFrom: string
  validUntil: string
  status: "Active" | "Expired" | "Scheduled" | "Disabled"
  revenueGenerated: number
}

export interface AdminReview {
  id: string
  productId?: string
  productName: string
  customerName: string
  rating: number
  title: string
  comment: string
  date: string
  status: "Approved" | "Pending" | "Rejected"
  verifiedBuyer: boolean
  helpful: number
}

export interface AdminPayment {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  amount: number
  method: string
  status: "Paid" | "Pending" | "Failed" | "Refunded"
  transactionId: string
  gateway: string
  date: string
}

export interface AdminAbandonedCart {
  id: string
  customerName: string
  phone: string
  email: string
  items: { name: string; size: string; price: number; quantity: number; imageUrl: string }[]
  cartValue: number
  abandonedAt: string
  timeAgo: string
  recoveryStatus: "Not Contacted" | "WhatsApp Sent" | "Email Sent" | "Recovered"
  priority: "HIGH" | "MEDIUM" | "LOW"
}

// -------------------------------------------------------------
// Auto-seeder intentionally disabled to prevent recreating deleted products
// -------------------------------------------------------------
export async function ensureDatabaseSeeded(): Promise<void> {
  // Respect deletions by admin: do not automatically re-seed if table is empty.
  return
}

// -------------------------------------------------------------
// Products API
// -------------------------------------------------------------
export async function getAdminProducts(): Promise<AdminProduct[]> {
  const supabase = createClient()
  await ensureDatabaseSeeded()

  try {
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select(`
        id, name, slug, sku, price, compare_at_price, stock_quantity, size, variants,
        gender, fragrance_type, top_notes, middle_notes, base_notes,
        rating, review_count, featured, best_seller, new_arrival, is_active,
        image_url, description, short_description, tags,
        category:categories(name),
        images:product_images(image_url, is_primary)
      `)
      .order("created_at", { ascending: false })

    if (error || !dbProducts || dbProducts.length === 0) {
      return []
    }

    // Query real sales & revenue from order_items table in Supabase
    const salesStats: Record<string, { count: number; revenue: number }> = {}
    try {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, unit_price, total_price")

      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          const qty = Number(item.quantity) || 0
          const rev = Number(item.total_price) || (qty * (Number(item.unit_price) || 0))
          if (item.product_id) {
            if (!salesStats[item.product_id]) salesStats[item.product_id] = { count: 0, revenue: 0 }
            salesStats[item.product_id].count += qty
            salesStats[item.product_id].revenue += rev
          }
          if (item.product_name) {
            const nameKey = item.product_name.toLowerCase().trim()
            if (!salesStats[nameKey]) salesStats[nameKey] = { count: 0, revenue: 0 }
            salesStats[nameKey].count += qty
            salesStats[nameKey].revenue += rev
          }
        }
      }
    } catch (salesErr) {
      console.warn("Could not query order_items for sales count:", salesErr)
    }

    // Query real reserved stock from pending orders in Supabase
    const reservedStats: Record<string, number> = {}
    try {
      const { data: pendingOrders } = await supabase
        .from("orders")
        .select("id, status, items:order_items(product_id, quantity)")
        .in("status", ["New", "Confirmed", "Processing", "Pending"])

      if (pendingOrders && pendingOrders.length > 0) {
        for (const ord of pendingOrders) {
          if (Array.isArray(ord.items)) {
            for (const it of ord.items) {
              if (it.product_id) {
                reservedStats[it.product_id] = (reservedStats[it.product_id] || 0) + (Number(it.quantity) || 0)
              }
            }
          }
        }
      }
    } catch (resErr) {
      console.warn("Could not query pending reservations:", resErr)
    }

    return dbProducts.map((p: any) => {
      const primaryImg = p.images?.find((img: any) => img.is_primary)?.image_url 
        || p.images?.[0]?.image_url 
        || p.image_url 
        || "/products/white-oudh-attar.jpg"
      const stock = Number(p.stock_quantity) || 0
      const cost = Math.round(Number(p.price) * 0.35)
      
      const realSales = salesStats[p.id] || salesStats[p.name?.toLowerCase().trim()] || { count: 0, revenue: 0 }
      const realReserved = reservedStats[p.id] || 0

      let status: AdminProduct["status"] = "Active"
      if (!p.is_active) status = "Draft"
      else if (stock === 0) status = "Out of Stock"
      else if (stock <= 5) status = "Low Stock"

      return {
        id: p.id,
        name: p.name,
        slug: p.slug || p.name.toLowerCase().replace(/\s+/g, "-"),
        sku: p.sku || `SNA-${p.id.slice(0, 6)}`,
        category: p.category?.name || (p.fragrance_type?.includes("Attar") ? "Attars" : "Perfumes"),
        gender: p.gender || "Unisex",
        fragranceFamily: p.fragrance_family || (p.top_notes?.includes("Oud") ? "Oud" : p.top_notes?.includes("Musk") ? "Musk" : ""),
        price: Number(p.price) || 1500,
        costPrice: cost,
        salePrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
        stock: stock,
        reservedStock: realReserved,
        reorderLevel: 5,
        salesCount: realSales.count,
        revenue: realSales.revenue,
        rating: Number(p.rating) || 5.0,
        reviewsCount: Number(p.review_count) || 0,
        status: status,
        imageUrl: primaryImg,
        description: p.description || "",
        shortDescription: p.short_description || "",
        variants: Array.isArray(p.variants) && p.variants.length > 0
          ? p.variants.map((v: any, idx: number) => ({
              size: v.size || "Standard",
              sku: v.sku || `${p.sku || 'SKU'}-${v.size || idx}`,
              price: Number(v.price) || Number(p.price) || 1500,
              compareAtPrice: v.compareAtPrice !== undefined ? Number(v.compareAtPrice) : (p.compare_at_price ? Number(p.compare_at_price) : undefined),
              stock: Number(v.stock ?? v.stock_quantity) || 0,
              isDefault: Boolean(v.isDefault ?? (idx === 0))
            }))
          : (p.size ? p.size.split(",").map((s: string, idx: number) => ({
              size: s.trim(),
              sku: `${p.sku || 'SKU'}-${s.trim()}`,
              price: Number(p.price) || 1500,
              compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
              stock: stock,
              isDefault: idx === 0
            })) : [
              { size: p.fragrance_type?.includes("Attar") ? "12ml" : "100ml", sku: `${p.sku || 'SKU'}-STD`, price: Number(p.price) || 1500, stock, isDefault: true }
            ]),
        notes: {
          top: p.top_notes ? p.top_notes.split(",").map((s: string) => s.trim()) : ["Bergamot"],
          heart: p.middle_notes ? p.middle_notes.split(",").map((s: string) => s.trim()) : ["Rose", "Oud"],
          base: p.base_notes ? p.base_notes.split(",").map((s: string) => s.trim()) : ["Amber", "Musk"],
        },
        isFeatured: p.featured,
        isBestseller: p.best_seller,
        isNewArrival: p.new_arrival,
        is_active: p.is_active,
        series: p.series || (Array.isArray(p.tags) ? p.tags.find((t: string) => typeof t === "string" && t.includes("Series")) : null) || null,
      }
    })
  } catch (err) {
    console.error("Error fetching admin products:", err)
    return []
  }
}

export async function createAdminProduct(productData: Partial<AdminProduct>): Promise<{ success: boolean; data?: any; error?: string }> {
  // If in browser, use the dedicated API route to avoid stale client bundles
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })
      const result = await res.json()
      if (result && typeof result.success === "boolean") {
        return result
      }
    } catch (fetchErr) {
      console.warn("API route /api/admin/products failed, falling back to direct client:", fetchErr)
    }
  }

  const supabase = createClient()
  try {
    const slug = productData.slug || (productData.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    const categoryName = (productData.category && typeof productData.category === "string" && productData.category.trim())
      ? productData.category.trim()
      : "Attars"
    const categoryMap: Record<string, string> = {
      "Attars": "a2f36fbb-93e6-4d79-b32d-d5f357b641d7",
      "Perfumes": "d9a01723-6ba9-4b2a-8c48-d848c09a37d8",
      "Bakhoor": "e2cb2b9b-0a9f-406a-ae7e-a3719567829c",
    }
    const categoryId = categoryMap[categoryName] || categoryMap["Attars"]
    const imgUrl = productData.imageUrl || "/products/white-oudh-attar.jpg"

    const insertPayload: Record<string, any> = {
      name: productData.name,
      slug: slug,
      sku: productData.sku,
      category: categoryName,
      category_id: categoryId,
      image_url: imgUrl,
      description: productData.description || `Exquisite luxury fragrance crafted by SN AttarWala.`,
      short_description: productData.shortDescription || productData.name,
      price: productData.price || 1500,
      compare_at_price: productData.salePrice || null,
      stock_quantity: productData.stock || 20,
      gender: productData.gender || "Unisex",
      fragrance_type: categoryName === "Attars" ? "Attar Oil" : categoryName === "Bakhoor" ? "Incense Wood" : "Eau De Parfum",
      top_notes: Array.isArray(productData.notes?.top) ? productData.notes.top.join(", ") : (productData.notes?.top || "Bergamot"),
      middle_notes: Array.isArray(productData.notes?.heart) ? productData.notes.heart.join(", ") : (productData.notes?.heart || "Rose"),
      base_notes: Array.isArray(productData.notes?.base) ? productData.notes.base.join(", ") : (productData.notes?.base || "Oud"),
      featured: Boolean(productData.isFeatured),
      best_seller: Boolean(productData.isBestseller),
      new_arrival: Boolean(productData.isNewArrival),
      is_active: true,
      tags: productData.series ? [productData.series] : [],
    }
    if (productData.series) {
      insertPayload.series = productData.series
    }

    let { data: newProd, error } = await supabase
      .from("products")
      .insert(insertPayload)
      .select()
      .single()

    if (error && error.message?.includes("series")) {
      delete insertPayload.series
      const retry = await supabase.from("products").insert(insertPayload).select().single()
      newProd = retry.data
      error = retry.error
    }

    if (error) throw error

    if (newProd && imgUrl) {
      await supabase.from("product_images").insert({
        product_id: newProd.id,
        image_url: imgUrl,
        is_primary: true,
        display_order: 0,
      })
    }

    triggerAdminCountsSync()
    return { success: true, data: newProd }
  } catch (err: any) {
    console.error("Error creating product:", err)
    return { success: false, error: err.message || "Failed to create product" }
  }
}

export async function updateAdminProduct(id: string, updates: Partial<AdminProduct>): Promise<boolean> {
  // If in browser, use dedicated API route to avoid client RLS issues
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      const result = await res.json()
      if (result && result.success) {
        triggerAdminCountsSync()
        return true
      }
    } catch (fetchErr) {
      console.warn("API route PATCH /api/admin/products failed, falling back to direct client:", fetchErr)
    }
  }

  const supabase = createClient()
  try {
    const payload: any = {}
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.price !== undefined) payload.price = updates.price
    if (updates.stock !== undefined) payload.stock_quantity = updates.stock
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
    if (updates.imageUrl !== undefined) {
      payload.image_url = updates.imageUrl
    }
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.shortDescription !== undefined) payload.short_description = updates.shortDescription
    if (updates.is_active !== undefined) payload.is_active = updates.is_active
    if (updates.isFeatured !== undefined) payload.featured = updates.isFeatured
    if (updates.isBestseller !== undefined) payload.best_seller = updates.isBestseller
    if (updates.isNewArrival !== undefined) payload.new_arrival = updates.isNewArrival
    if (updates.series !== undefined) {
      payload.tags = updates.series ? [updates.series] : []
      payload.series = updates.series || null
    }

    let { error } = await supabase.from("products").update(payload).eq("id", id)
    if (error && error.message?.includes("series")) {
      delete payload.series
      const retry = await supabase.from("products").update(payload).eq("id", id)
      error = retry.error
    }
    if (error) {
      console.error("Error updating product:", error)
      return false
    }

    if (updates.imageUrl) {
      const { data: existingImg } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", id)
        .eq("is_primary", true)
        .limit(1)

      if (existingImg && existingImg.length > 0) {
        await supabase
          .from("product_images")
          .update({ image_url: updates.imageUrl })
          .eq("id", existingImg[0].id)
      } else {
        await supabase.from("product_images").insert({
          product_id: id,
          image_url: updates.imageUrl,
          is_primary: true,
          display_order: 0,
        })
      }
    }

    triggerAdminCountsSync()
    return true
  } catch (err) {
    console.error("Exception in updateAdminProduct:", err)
    return false
  }
}

export async function deleteAdminProduct(id: string): Promise<boolean> {
  // 1. If in browser, invoke dedicated server API with admin service role
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      const result = await res.json()
      if (result && result.success) {
        triggerAdminCountsSync()
        return true
      }
    } catch (fetchErr) {
      console.warn("API route DELETE /api/admin/products failed, falling back to direct client:", fetchErr)
    }
  }

  // 2. Direct client fallback with associated image cleanup
  const supabase = createClient()
  try {
    await supabase.from("product_images").delete().eq("product_id", id)
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (!error) {
      triggerAdminCountsSync()
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function clearAllAdminProducts(): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/products?all=true", { method: "DELETE" })
      const result = await res.json()
      if (result && result.success) {
        triggerAdminCountsSync()
        return true
      }
    } catch (e) {
      console.warn("API clear all products error:", e)
    }
  }
  const supabase = createClient()
  try {
    await supabase.from("product_images").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    triggerAdminCountsSync()
    return true
  } catch {
    return false
  }
}

export async function seedCatalogProducts(): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = createClient()
  try {
    const { INITIAL_ADMIN_PRODUCTS } = await import("@/lib/admin-data")
    const categoryMap: Record<string, string> = {
      "Attars": "a2f36fbb-93e6-4d79-b32d-d5f357b641d7",
      "Perfumes": "d9a01723-6ba9-4b2a-8c48-d848c09a37d8",
      "Bakhoor": "e2cb2b9b-0a9f-406a-ae7e-a3719567829c",
    }

    let insertedCount = 0

    for (const p of INITIAL_ADMIN_PRODUCTS) {
      const catName = p.category || "Attars"
      const catId = categoryMap[catName] || categoryMap["Attars"]
      const imgUrl = p.imageUrl || "/products/white-oudh-attar.jpg"

      const { data: newProd, error } = await supabase
        .from("products")
        .insert({
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          category: catName,
          category_id: catId,
          image_url: imgUrl,
          description: `Exquisite luxury ${p.name} handcrafted by SN AttarWala.`,
          short_description: `${p.name} luxury fragrance.`,
          price: p.price,
          compare_at_price: p.salePrice || null,
          stock_quantity: p.stock,
          gender: p.gender || "Unisex",
          fragrance_type: catName === "Attars" ? "Attar Oil" : catName === "Bakhoor" ? "Incense Wood" : "Eau De Parfum",
          top_notes: p.notes?.top.join(", ") || "Bergamot",
          middle_notes: p.notes?.heart.join(", ") || "Rose",
          base_notes: p.notes?.base.join(", ") || "Oud",
          featured: Boolean(p.isFeatured),
          best_seller: Boolean(p.isBestseller),
          new_arrival: Boolean(p.isNewArrival),
          is_active: true,
          tags: p.series ? [p.series] : [],
        })
        .select()
        .single()

      if (!error && newProd) {
        insertedCount++
        await supabase.from("product_images").insert({
          product_id: newProd.id,
          image_url: imgUrl,
          is_primary: true,
          display_order: 0,
        })
      }
    }

    return { success: true, count: insertedCount }
  } catch (err: any) {
    console.error("Error seeding catalog products:", err)
    return { success: false, count: 0, error: err?.message || "Failed to seed products" }
  }
}

// -------------------------------------------------------------
// Orders API
// -------------------------------------------------------------
export async function getAdminOrders(): Promise<AdminOrder[]> {
  const formatOrder = (o: any): AdminOrder => {
    const orderStatusFormatted = (statusStr: string): AdminOrder["orderStatus"] => {
      const s = (statusStr || "").toLowerCase().trim()
      if (s === "confirmed") return "Confirmed"
      if (s === "processing") return "Processing"
      if (s === "packed") return "Packed"
      if (s === "shipped") return "Shipped"
      if (s === "out_for_delivery" || s === "out for delivery") return "Out for Delivery"
      if (s === "delivered") return "Delivered"
      if (s === "cancelled") return "Cancelled"
      return "New"
    }

    const items = (Array.isArray(o.items) && o.items.length > 0)
      ? o.items.map((item: any) => ({
          productId: item.productId || item.product_id || "prod-1",
          name: item.name || item.product_name || "Luxury Fragrance",
          size: item.size || "—",
          price: Number(item.price || item.unit_price) || 0,
          quantity: Number(item.quantity) || 1,
          imageUrl: item.imageUrl || item.image_url || "/products/white-oudh-attar.jpg"
        }))
      : (Array.isArray(o.order_items) && o.order_items.length > 0)
      ? o.order_items.map((item: any) => ({
          productId: item.product_id || "prod-1",
          name: item.product_name || "Luxury Fragrance",
          size: "—",
          price: Number(item.unit_price) || 0,
          quantity: Number(item.quantity) || 1,
          imageUrl: "/products/white-oudh-attar.jpg"
        }))
      : [
          { productId: "prod-1", name: "Luxury Fragrance", size: "—", price: Number(o.total_amount) || 0, quantity: 1, imageUrl: "/products/white-oudh-attar.jpg" }
        ]

    const fullAddr = o.customer_address || `${o.shipping_address_line1 || ''} ${o.shipping_address_line2 || ''}, ${o.shipping_city || o.customer_city || 'Mumbai'} ${o.shipping_pincode || o.customer_pincode || ''}`.trim()

    return {
      id: o.id,
      orderNumber: o.order_number?.startsWith("#") ? o.order_number : `#${o.order_number}`,
      customer: {
        id: o.user_id || o.id,
        name: o.shipping_name || o.customer_name || "Valued Customer",
        email: o.customer_email || "",
        phone: o.shipping_phone || o.customer_phone || "",
        city: o.shipping_city || o.customer_city || "Mumbai",
        state: o.shipping_state || o.customer_state || "Maharashtra",
        address: fullAddr || "Mumbai, Maharashtra",
      },
      items,
      subtotal: Number(o.subtotal) || Number(o.total_amount) || 0,
      discount: Number(o.discount_amount || o.discount) || 0,
      shipping: Number(o.shipping_amount || o.shipping_charge) || 0,
      tax: 0,
      total: Number(o.total_amount) || 0,
      paymentMethod: o.payment_method || "Razorpay",
      paymentStatus: (o.payment_status?.toLowerCase() === "paid" ? "Paid" : "Pending") as any,
      transactionId: o.razorpay_payment_id || "",
      orderStatus: orderStatusFormatted(o.status),
      courier: o.courier_partner || "",
      trackingNumber: o.tracking_number || "",
      cancelReason: o.cancel_reason || undefined,
      createdAt: o.created_at || new Date().toISOString(),
    }
  }

  // 1. Try API route first
  try {
    const res = await fetch("/api/admin/orders", { cache: "no-store" })
    if (res.ok) {
      const { success, data: dbOrders } = await res.json()
      if (success && Array.isArray(dbOrders) && dbOrders.length > 0) {
        return dbOrders.map(formatOrder)
      }
    }
  } catch (apiErr) {
    console.warn("API route /api/admin/orders failed, falling back to direct Supabase query:", apiErr)
  }

  // 2. Direct Supabase fallback
  try {
    const supabase = createClient()
    const { data: dbOrders, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, subtotal, discount_amount, shipping_amount, total_amount,
        shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
        shipping_city, shipping_state, shipping_pincode, payment_method, payment_status,
        razorpay_order_id, razorpay_payment_id, created_at, customer_email,
        tracking_number, courier_partner, cancel_reason,
        customer_name, customer_phone, customer_address, customer_city, customer_state, customer_pincode,
        items,
        user_id
      `)
      .order("created_at", { ascending: false })

    if (!error && Array.isArray(dbOrders)) {
      return dbOrders.map(formatOrder)
    }
  } catch (directErr) {
    console.error("Direct Supabase query for orders failed:", directErr)
  }

  return []
}

export async function updateAdminOrderStatus(
  orderId: string, 
  newStatus: string,
  extra?: { trackingNumber?: string; courierPartner?: string; cancelReason?: string }
): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        orderId, 
        status: newStatus,
        trackingNumber: extra?.trackingNumber,
        courierPartner: extra?.courierPartner,
        cancelReason: extra?.cancelReason
      }),
    })
    const result = await res.json()
    if (result?.success === true) {
      triggerAdminCountsSync()
      return true
    }
    return false
  } catch (err) {
    console.error("Error updating order status:", err)
    return false
  }
}

export async function deleteAdminOrder(orderId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/orders?orderId=${encodeURIComponent(orderId)}`, {
      method: "DELETE",
    })
    const result = await res.json()
    if (result?.success === true) {
      triggerAdminCountsSync()
      return true
    }
    return false
  } catch (err) {
    console.error("Error deleting order:", err)
    return false
  }
}

// -------------------------------------------------------------
// Customers API
// -------------------------------------------------------------
export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  const supabase = createClient()
  try {
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone, role, created_at")

    const { data: orders, error: ordErr } = await supabase
      .from("orders")
      .select(`
        id, user_id, 
        customer_name, customer_email, customer_phone, customer_city, customer_state, customer_address,
        shipping_name, shipping_phone, shipping_city, shipping_state, shipping_address_line1, 
        total_amount, created_at, status
      `)

    if (profErr && ordErr) return []

    // Aggregate customers from orders + profiles
    const customerMap = new Map<string, AdminCustomer>()

    // Profiles
    if (profiles) {
      profiles.forEach((p: any) => {
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || "Customer"
        customerMap.set(p.id, {
          id: p.id,
          name,
          email: "",
          phone: p.phone || "",
          city: "Mumbai",
          state: "Maharashtra",
          segment: "New Customer",
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastPurchaseDate: "Recently",
          loyaltyPoints: 0,
          status: "Active",
          reviewsCount: 0,
        })
      })
    }

    // Orders
    if (orders) {
      orders.forEach((ord: any) => {
        const key = ord.user_id || ord.customer_email || ord.customer_phone || ord.shipping_phone || ord.shipping_name || ord.id
        const existing = customerMap.get(key)
        const amount = Number(ord.total_amount) || 0
        const custName = ord.customer_name || ord.shipping_name || "Valued Customer"
        const custEmail = ord.customer_email || ""
        const custPhone = ord.customer_phone || ord.shipping_phone || ""
        const custCity = ord.customer_city || ord.shipping_city || "Mumbai"
        const custState = ord.customer_state || ord.shipping_state || "Maharashtra"
        const custAddress = ord.customer_address || ord.shipping_address_line1 || ""

        if (existing) {
          existing.totalOrders += 1
          existing.totalSpent += amount
          existing.averageOrderValue = Math.round(existing.totalSpent / existing.totalOrders)
          if (!existing.email && custEmail) existing.email = custEmail
          if (!existing.phone && custPhone) existing.phone = custPhone
          if (custCity) existing.city = custCity
          if (custState) existing.state = custState
          if (custAddress) existing.address = custAddress
          existing.loyaltyPoints = Math.round(existing.totalSpent * 0.1)
          if (existing.totalSpent > 15000) existing.segment = "VIP"
          else if (existing.totalSpent > 8000) existing.segment = "High Value"
          else if (existing.totalOrders > 1) existing.segment = "Returning"
        } else {
          customerMap.set(key, {
            id: ord.user_id || ord.id,
            name: custName,
            email: custEmail,
            phone: custPhone,
            city: custCity,
            state: custState,
            address: custAddress,
            segment: amount > 15000 ? "VIP" : amount > 8000 ? "High Value" : "New Customer",
            totalOrders: 1,
            totalSpent: amount,
            averageOrderValue: amount,
            lastPurchaseDate: ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-IN") : "Recently",
            loyaltyPoints: Math.round(amount * 0.1),
            status: "Active",
            reviewsCount: 0,
          })
        }
      })
    }

    return Array.from(customerMap.values())
  } catch (err) {
    console.error("Error fetching customers:", err)
    return []
  }
}

// -------------------------------------------------------------
// Team Management (RBAC)
// -------------------------------------------------------------
export interface AdminProfile {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: string
  created_at: string
}

export async function getAdminProfiles(): Promise<AdminProfile[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return []
  }
}

export async function updateProfileRole(userId: string, role: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error updating profile role:", error)
    return false
  }
}

// -------------------------------------------------------------
// Categories API
// -------------------------------------------------------------
export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = createClient()
  try {
    const [
      { data: cats, error },
      { data: products }
    ] = await Promise.all([
      supabase.from("categories").select("id, name, slug, description, image_url, created_at"),
      supabase.from("products").select("id, category, category_id")
    ])

    if (error || !cats || cats.length === 0) {
      return []
    }

    const prodList = products || []
    return cats.map((c: any) => {
      const count = prodList.filter((p: any) => 
        p.category_id === c.id || 
        (p.category && p.category.toLowerCase() === c.name.toLowerCase())
      ).length

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        imageUrl: c.image_url || "/products/white-oudh-attar.jpg",
        productsCount: count,
        isActive: true,
      }
    })
  } catch (err) {
    console.error("Error fetching categories:", err)
    return []
  }
}

export async function createAdminCategory(category: { name: string; slug?: string; description?: string; imageUrl?: string }): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      })
      const result = await res.json()
      if (result && result.success) return true
    } catch (apiErr) {
      console.warn("API route POST /api/admin/categories failed, falling back:", apiErr)
    }
  }

  const supabase = createClient()
  try {
    const { error } = await supabase.from("categories").insert({
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/\s+/g, "-"),
      description: category.description || "",
      image_url: category.imageUrl || `/categories/${category.slug || "attars"}.jpg`
    })
    return !error
  } catch {
    return false
  }
}

export async function updateAdminCategory(id: string, updates: { name?: string; slug?: string; description?: string; imageUrl?: string; isActive?: boolean }): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      const result = await res.json()
      if (result && result.success) return true
    } catch (apiErr) {
      console.warn("API route PATCH /api/admin/categories failed, falling back:", apiErr)
    }
  }

  const supabase = createClient()
  try {
    const payload: any = {}
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.slug !== undefined) payload.slug = updates.slug
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl
    if (updates.isActive !== undefined) payload.is_active = updates.isActive
    const { error } = await supabase.from("categories").update(payload).eq("id", id)
    return !error
  } catch {
    return false
  }
}

export async function deleteAdminCategory(id: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      const result = await res.json()
      if (result?.success) return { success: true }
      return { success: false, error: result?.error || "Failed to delete category" }
    } catch (apiErr) {
      console.warn("API route DELETE /api/admin/categories failed, falling back:", apiErr)
    }
  }

  const supabase = createClient()
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete category" }
  }
}

// -------------------------------------------------------------
// Coupons API
// -------------------------------------------------------------
export async function getAdminCoupons(): Promise<AdminCoupon[]> {
  const supabase = createClient()
  try {
    const [
      { data: dbCoupons, error },
      { data: orderUsages }
    ] = await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("coupon_code, total_amount").not("coupon_code", "is", null)
    ])

    if (error || !dbCoupons || dbCoupons.length === 0) {
      return []
    }

    return dbCoupons.map((c: any) => {
      // Calculate real usage and revenue from real orders in Supabase
      const matchingOrders = (orderUsages || []).filter(
        (o: any) => o.coupon_code && o.coupon_code.trim().toUpperCase() === c.code.trim().toUpperCase()
      )
      const realRevenue = matchingOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)
      const realRedemptions = (Number(c.usage_count) || 0) + matchingOrders.length

      const safeDate = (d?: string | null) => {
        if (!d) return ""
        try {
          const parsed = new Date(d)
          return isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0]
        } catch {
          return ""
        }
      }

      return {
        id: c.id,
        code: c.code,
        type: c.discount_type === "fixed" ? "Fixed" : "Percentage",
        value: Number(c.discount_value),
        minOrderValue: Number(c.min_order_value ?? c.min_order_amount) || 0,
        maxDiscount: c.max_discount_amount ? Number(c.max_discount_amount) : undefined,
        usedCount: realRedemptions,
        maxUses: c.usage_limit ?? 0,
        validFrom: safeDate(c.valid_from),
        validUntil: safeDate(c.valid_until),
        status: c.is_active ? "Active" : "Disabled",
        revenueGenerated: realRevenue,
      }
    })
  } catch {
    return []
  }
}

export async function createAdminCoupon(coupon: { 
  code: string; 
  type: string; 
  value: number; 
  minOrderValue: number; 
  validFrom?: string; 
  validUntil?: string;
  maxUses?: number;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const payload: any = {
      code: coupon.code.toUpperCase().trim(),
      discount_type: coupon.type.toLowerCase() === "fixed" ? "fixed" : "percentage",
      discount_value: coupon.value,
      min_order_value: coupon.minOrderValue,
      usage_limit: coupon.maxUses && coupon.maxUses > 0 ? coupon.maxUses : null,
      is_active: true,
    }
    if (coupon.validFrom) payload.valid_from = new Date(coupon.validFrom).toISOString()
    if (coupon.validUntil) payload.valid_until = new Date(coupon.validUntil).toISOString()

    const { error } = await supabase.from("coupons").insert(payload)
    if (error) {
      console.error("Error creating coupon in Supabase:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    console.error("Exception creating coupon:", err)
    return { success: false, error: err?.message || "Unknown error occurred" }
  }
}

export async function toggleAdminCoupon(id: string, active: boolean): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("coupons").update({ is_active: active }).eq("id", id)
    return !error
  } catch {
    return false
  }
}

export async function deleteAdminCoupon(id: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("coupons").delete().eq("id", id)
    return !error
  } catch {
    return false
  }
}

// -------------------------------------------------------------
// Reviews API
// -------------------------------------------------------------
export async function getAdminReviews(): Promise<AdminReview[]> {
  const supabase = createClient()
  try {
    const { data: dbReviews, error } = await supabase
      .from("reviews")
      .select(`
        id, rating, title, content, is_approved, created_at, helpful_count, customer_name,
        product:products(name),
        profile:profiles(first_name, last_name)
      `)
      .order("created_at", { ascending: false })

    if (error || !dbReviews || dbReviews.length === 0) {
      return []
    }

    return dbReviews.map((r: any) => ({
      id: r.id,
      productName: r.product?.name || "Luxury Fragrance",
      customerName: r.profile ? `${r.profile.first_name || ''} ${r.profile.last_name || ''}`.trim() : (r.customer_name || "Verified Customer"),
      rating: Number(r.rating) || 5,
      title: r.title || "Customer Review",
      comment: r.content || "",
      date: new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      status: r.is_approved ? "Approved" : "Pending",
      verifiedBuyer: true,
      helpful: Number(r.helpful_count) || 0,
    }))
  } catch {
    return []
  }
}

export async function updateAdminReviewStatus(id: string, isApproved: boolean): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("reviews").update({ is_approved: isApproved }).eq("id", id)
    return !error
  } catch {
    return false
  }
}

export async function deleteAdminReview(id: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("reviews").delete().eq("id", id)
    return !error
  } catch {
    return false
  }
}

// -------------------------------------------------------------
// Payments / Transactions API
// -------------------------------------------------------------
export async function getAdminPayments(): Promise<AdminPayment[]> {
  const orders = await getAdminOrders()
  return orders.map(o => ({
    id: `pay-${o.id.slice(0, 8)}`,
    orderId: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customer.name,
    amount: o.total,
    method: o.paymentMethod,
    status: o.paymentStatus,
    transactionId: o.transactionId || (o.paymentMethod === "Cash on Delivery" ? "COD" : "—"),
    gateway: o.paymentMethod === "Cash on Delivery" ? "Cash on Delivery" : "Razorpay PG",
    date: o.createdAt,
  }))
}

// -------------------------------------------------------------
// Abandoned Carts API
// -------------------------------------------------------------
export async function getAdminAbandonedCarts(): Promise<AdminAbandonedCart[]> {
  const supabase = createClient()
  try {
    // Try to fetch from real abandoned_carts table first
    const { data: dbCarts, error } = await supabase
      .from("abandoned_carts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (!error && dbCarts && dbCarts.length > 0) {
      return dbCarts.map((c: any) => ({
        id: c.id,
        customerName: c.customer_name || "Unknown",
        phone: c.phone || "+91 98200 00000",
        email: c.email || "",
        items: c.items || [],
        cartValue: Number(c.cart_value) || 0,
        abandonedAt: c.created_at ? new Date(c.created_at).toLocaleString("en-IN") : "Recently",
        timeAgo: c.created_at ? getTimeAgo(new Date(c.created_at)) : "Recently",
        recoveryStatus: (c.recovery_status || "Not Contacted") as AdminAbandonedCart["recoveryStatus"],
        priority: (c.priority || "MEDIUM") as AdminAbandonedCart["priority"],
      }))
    }
  } catch {
    // Table may not exist yet, fall through to fallback
  }

  return []
}

function getTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${Math.floor(diffHrs / 24)}d ago`
}

// -------------------------------------------------------------
// Notifications API
// -------------------------------------------------------------
export interface AdminNotification {
  id: string
  title: string
  desc: string
  time: string
  type: string
  unread: boolean
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  try {
    const res = await fetch("/api/admin/notifications", { cache: "no-store" })
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        return json.data.map((n: any) => ({
          id: n.id,
          title: n.title,
          desc: n.description || "",
          time: getTimeAgo(new Date(n.created_at)),
          type: n.type || "info",
          unread: !n.is_read
        }))
      }
    }
  } catch (apiErr) {
    console.warn("Notifications API fetch failed, falling back to direct Supabase:", apiErr)
  }

  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)

    if (error || !data) return []

    return data.map((n: any) => ({
      id: n.id,
      title: n.title,
      desc: n.description || "",
      time: getTimeAgo(new Date(n.created_at)),
      type: n.type || "info",
      unread: !n.is_read
    }))
  } catch (err) {
    return []
  }
}

export async function markAllAdminNotificationsRead(): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" })
    })
    if (res.ok) return true
  } catch {}

  try {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false)
    return !error
  } catch {
    return false
  }
}

export async function markAdminNotificationRead(id: string): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })
    if (res.ok) return true
  } catch {}

  try {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
    return !error
  } catch {
    return false
  }
}

export async function clearReadAdminNotifications(): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/notifications?action=clear_read", {
      method: "DELETE"
    })
    if (res.ok) return true
  } catch {}

  try {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("is_read", true)
    return !error
  } catch {
    return false
  }
}

// -------------------------------------------------------------
// Audit Logs API
// -------------------------------------------------------------
export interface AdminAuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  admin: string
  adminRole: string
  details: string
  ip: string
  timestamp: string
  severity: "info" | "warning" | "critical" | "success"
}

export async function getAdminAuditLogs(): Promise<AdminAuditLog[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error || !data) return []

    return data.map((l: any) => ({
      id: l.id,
      action: l.action,
      entity: l.entity || "System",
      entityId: l.entity_id || "-",
      admin: l.admin_name || "Unknown",
      adminRole: "Admin", // Assuming all are admins for now
      details: l.details || "",
      ip: l.ip_address || "0.0.0.0",
      timestamp: l.created_at,
      severity: l.severity || "info"
    }))
  } catch (err) {
    return []
  }
}

// -------------------------------------------------------------
// Dashboard Metrics API
// -------------------------------------------------------------
export async function getAdminDashboardMetrics() {
  const products = await getAdminProducts()
  const orders = await getAdminOrders()
  const customers = await getAdminCustomers()

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const totalCustomers = customers.length
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0
  const lowStockCount = products.filter(p => p.stock <= p.reorderLevel).length

  return {
    products,
    orders,
    customers,
    totalSales,
    totalOrders,
    totalCustomers,
    averageOrderValue,
    lowStockCount
  }
}

// -------------------------------------------------------------
// Campaigns Marketing API
// -------------------------------------------------------------
export interface AdminCampaign {
  id: string
  name: string
  type: "WhatsApp Blast" | "Email" | "SMS" | "Discount"
  segment: string
  status: "Active" | "Scheduled" | "Completed" | "Draft" | "Paused"
  startDate: string
  endDate: string
  reach: number
  opens: number
  conversions: number
  revenue: number
  couponCode?: string
  message: string
  createdAt?: string
}

export async function getAdminCampaigns(): Promise<AdminCampaign[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data || data.length === 0) {
      return []
    }

    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type || "WhatsApp Blast",
      segment: c.segment || "All Customers",
      status: c.status || "Draft",
      startDate: c.start_date ? new Date(c.start_date).toISOString().split("T")[0] : "",
      endDate: c.end_date ? new Date(c.end_date).toISOString().split("T")[0] : "",
      reach: Number(c.reach) || 0,
      opens: Number(c.opens) || 0,
      conversions: Number(c.conversions) || 0,
      revenue: Number(c.revenue) || 0,
      couponCode: c.coupon_code || "",
      message: c.message || "",
      createdAt: c.created_at
    }))
  } catch (err) {
    console.error("Error fetching campaigns:", err)
    return []
  }
}

export async function createAdminCampaign(campaign: Partial<AdminCampaign>): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        name: campaign.name,
        type: campaign.type || "WhatsApp Blast",
        segment: campaign.segment || "All Customers",
        status: campaign.status || "Active",
        start_date: campaign.startDate || new Date().toISOString(),
        end_date: campaign.endDate || null,
        coupon_code: campaign.couponCode || null,
        message: campaign.message || "",
        reach: campaign.reach || 0,
        opens: campaign.opens || 0,
        conversions: campaign.conversions || 0,
        revenue: campaign.revenue || 0
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    console.error("Error creating campaign:", err)
    return { success: false, error: err.message || "Failed to create campaign" }
  }
}

export async function deleteAdminCampaign(id: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("campaigns").delete().eq("id", id)
    return !error
  } catch {
    return false
  }
}

export async function updateCampaignStatus(id: string, status: AdminCampaign["status"]): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", id)
    return !error
  } catch {
    return false
  }
}

// -------------------------------------------------------------
// Live Sidebar Dynamic Badges Counter
// -------------------------------------------------------------
export async function getAdminSidebarCounts() {
  // 1. First priority: High-speed server API route
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/counts", { 
        cache: "no-store",
        headers: { "Pragma": "no-cache" }
      })
      if (res.ok) {
        const json = await res.json()
        if (json?.success && json.counts) {
          return json.counts
        }
      }
    } catch (apiErr) {
      console.warn("API route /api/admin/counts failed, falling back to direct client query:", apiErr)
    }
  }

  // 2. Direct client query fallback using resilient Promise.allSettled
  const supabase = createClient()
  try {
    const [
      pRes,
      lsRes,
      oRes,
      acRes,
      profRes,
      ordCustRes,
      rRes,
      cpRes,
      wlRes
    ] = await Promise.allSettled([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).lte("stock_quantity", 5),
      supabase.from("orders").select("*", { count: "exact", head: true }).or("status.ilike.%pending%,status.ilike.%new%"),
      supabase.from("abandoned_carts").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("id"),
      supabase.from("orders").select("user_id, customer_email, customer_phone"),
      supabase.from("reviews").select("*", { count: "exact", head: true }).eq("is_approved", false),
      supabase.from("coupons").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("category", "Wholesale").not("status", "ilike", "%closed%")
    ])

    const getVal = (res: PromiseSettledResult<any>) => {
      if (res.status === "fulfilled" && !res.value.error && typeof res.value.count === "number") {
        return res.value.count
      }
      return 0
    }

    // Aggregate unique customer count exactly matching Customers Module
    const customerKeys = new Set<string>()
    if (profRes.status === "fulfilled" && Array.isArray(profRes.value.data)) {
      profRes.value.data.forEach((p: any) => {
        if (p.id) customerKeys.add(p.id)
      })
    }
    if (ordCustRes.status === "fulfilled" && Array.isArray(ordCustRes.value.data)) {
      ordCustRes.value.data.forEach((o: any) => {
        const key = o.user_id || o.customer_email || o.customer_phone
        if (key) customerKeys.add(key)
      })
    }

    return {
      products: getVal(pRes),
      lowStock: getVal(lsRes),
      pendingOrders: getVal(oRes),
      abandonedCarts: getVal(acRes),
      customers: customerKeys.size,
      pendingReviews: getVal(rRes),
      activeCoupons: getVal(cpRes),
      wholesaleLeads: getVal(wlRes)
    }
  } catch {
    return {
      products: 0,
      lowStock: 0,
      pendingOrders: 0,
      abandonedCarts: 0,
      customers: 0,
      pendingReviews: 0,
      activeCoupons: 0,
      wholesaleLeads: 0
    }
  }
}

// End of admin-service.ts
