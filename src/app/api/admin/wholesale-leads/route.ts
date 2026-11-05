import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminSupabase()
    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("category", "Wholesale")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: tickets || [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      fullName,
      businessName,
      businessType,
      email,
      phone,
      city,
      state,
      gstNumber,
      orderQuantity,
      productInterests,
      message,
      status = "New",
      priority = "High",
      estimatedValue = 50000,
      assignedTo = "SN AttarWala Wholesale Desk",
    } = body

    if (!fullName || !businessName || !phone) {
      return NextResponse.json(
        { success: false, error: "Full Name, Business Name, and Phone are required." },
        { status: 400 }
      )
    }

    const leadNumber = `WS-${Math.floor(100000 + Math.random() * 900000)}`
    const leadMeta = {
      leadNumber,
      fullName,
      businessName,
      businessType,
      email,
      phone,
      city,
      state,
      gstNumber,
      orderQuantity,
      productInterests: Array.isArray(productInterests) ? productInterests : [productInterests].filter(Boolean),
      message: message || "Direct wholesale inquiry",
      status,
      priority,
      estimatedValue: Number(estimatedValue) || 50000,
      assignedTo,
      internalNotes: [],
      createdAt: new Date().toISOString(),
    }

    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        ticket_number: leadNumber,
        subject: `Wholesale Inquiry: ${businessName} (${fullName})`,
        category: "Wholesale",
        customer_name: fullName,
        phone,
        email: email || null,
        message: message || `Wholesale inquiry from ${businessName}`,
        messages: [leadMeta],
        status: status === "Converted" ? "Resolved" : status === "Lost" ? "Closed" : status === "New" ? "Open" : "In Progress",
        priority: priority === "Urgent" ? "High" : (["Low", "Medium", "High"].includes(priority) ? priority : "Medium"),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, lead: data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, updates: directUpdates, ...rest } = body
    const updates = directUpdates || rest

    if (!id || (!updates || Object.keys(updates).length === 0)) {
      return NextResponse.json({ success: false, error: "Lead ID and updates are required." }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { data: ticket } = await supabase.from("support_tickets").select("*").eq("id", id).single()

    if (!ticket) {
      return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 })
    }

    const currentMeta = Array.isArray(ticket.messages) ? ticket.messages[0] || {} : {}
    const existingNotes = Array.isArray(currentMeta.internalNotes) ? currentMeta.internalNotes : []
    
    // Handle appending note if provided
    let updatedNotes = existingNotes
    if (updates.note) {
      updatedNotes = [
        ...existingNotes,
        {
          id: `note-${Date.now()}`,
          author: updates.author || "SN AttarWala Team",
          text: updates.note,
          createdAt: new Date().toISOString()
        }
      ]
    }

    const { note: _discardNote, ...metaFields } = updates
    const updatedMeta = { 
      ...currentMeta, 
      ...metaFields, 
      internalNotes: updatedNotes, 
      updatedAt: new Date().toISOString() 
    }

    const ticketUpdates: Record<string, any> = {
      messages: [updatedMeta],
      updated_at: new Date().toISOString(),
    }
    if (updates.priority) {
      ticketUpdates.priority = updates.priority === "Urgent" ? "High" : (["Low", "Medium", "High"].includes(updates.priority) ? updates.priority : "Medium")
    }
    if (updates.status === "Converted") ticketUpdates.status = "Resolved"
    else if (updates.status === "Lost") ticketUpdates.status = "Closed"
    else if (updates.status === "New") ticketUpdates.status = "Open"
    else if (updates.status) ticketUpdates.status = "In Progress"

    const { error } = await supabase.from("support_tickets").update(ticketUpdates).eq("id", id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updatedMeta })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Lead ID required" }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { error } = await supabase.from("support_tickets").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
