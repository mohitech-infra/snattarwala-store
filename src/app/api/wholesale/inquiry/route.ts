import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fullName = body.fullName || body.contact_person || body.name
    const businessName = body.businessName || body.company_name || body.business_name
    const email = body.email
    const phone = body.phone
    const city = body.city || (body.state ? `${body.city || ""}, ${body.state}` : "")
    const businessType = body.businessType || body.business_type
    const productInterests = body.productInterests || body.product_interests || []
    const orderQuantity = body.orderQuantity || body.estimated_volume || body.order_quantity
    const gstNumber = body.gstNumber || body.gstin || body.gst_number
    const message = body.message || body.notes

    if (!fullName || !businessName || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required fields (Name, Business Name, Phone, and Email)." },
        { status: 400 }
      )
    }

    const ticketNumber = `WS-${Math.floor(100000 + Math.random() * 900000)}`
    const productList = Array.isArray(productInterests) ? productInterests.join(", ") : String(productInterests || "Not specified")

    const fullDetails = [
      `Business Name: ${businessName}`,
      `Contact Person: ${fullName}`,
      `Business Type: ${businessType || "Not specified"}`,
      `City & State: ${city || "Not specified"}`,
      `Estimated Order Volume: ${orderQuantity || "Not specified"}`,
      `Products of Interest: ${productList}`,
      `GST / Tax ID: ${gstNumber || "None provided"}`,
      "",
      "Requirements & Notes:",
      message || "None provided",
    ].join("\n")

    const supabase = getAdminSupabase()

    const leadMeta = {
      leadNumber: ticketNumber,
      fullName,
      businessName,
      businessType: businessType || "Retail Perfume Store",
      email,
      phone,
      city: city || "Mumbai",
      gstNumber: gstNumber || null,
      orderQuantity: orderQuantity || "Starter Wholesale (50 - 100 units)",
      productInterests: Array.isArray(productInterests) ? productInterests : [productInterests].filter(Boolean),
      message: message || "Website Wholesale Inquiry",
      status: "New",
      priority: "High",
      estimatedValue: orderQuantity?.includes("2,000") ? 500000 : orderQuantity?.includes("500") ? 200000 : 75000,
      assignedTo: "SN AttarWala Wholesale Desk",
      internalNotes: [],
      createdAt: new Date().toISOString(),
    }

    // 1. Insert into support_tickets table
    try {
      await supabase.from("support_tickets").insert({
        ticket_number: ticketNumber,
        subject: `Wholesale Inquiry: ${businessName} (${fullName})`,
        category: "Wholesale",
        customer_name: fullName,
        phone,
        email,
        message: fullDetails,
        messages: [leadMeta],
        status: "Open",
        priority: "High",
      })
    } catch (dbErr) {
      console.warn("Could not insert wholesale ticket into support_tickets:", dbErr)
    }

    // 2. Insert into notifications table
    try {
      await supabase.from("notifications").insert({
        title: `New Wholesale Inquiry: ${businessName}`,
        description: `${fullName} (${phone}) requested wholesale supply details for ${orderQuantity || "bulk orders"}.`,
        type: "wholesale",
        is_read: false,
      })
    } catch (notifErr) {
      console.warn("Could not insert wholesale notification:", notifErr)
    }

    return NextResponse.json({
      success: true,
      ticketNumber,
      message: "Wholesale inquiry received successfully.",
    })
  } catch (err: any) {
    console.error("Error in /api/wholesale/inquiry:", err)
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to process wholesale inquiry" },
      { status: 500 }
    )
  }
}

