import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET() {
  try {
    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: any) {
    console.error("GET /api/admin/notifications error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getAdminSupabase()
    const body = await request.json()
    const { action, id } = body

    if (action === "mark_all_read") {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false)

      if (error) throw error
      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (id) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)

      if (error) throw error
      return NextResponse.json({ success: true, message: "Notification marked as read" })
    }

    return NextResponse.json({ error: "Invalid action or id" }, { status: 400 })
  } catch (err: any) {
    console.error("PATCH /api/admin/notifications error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getAdminSupabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const action = searchParams.get("action")

    if (action === "clear_read") {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("is_read", true)

      if (error) throw error
      return NextResponse.json({ success: true, message: "Read notifications cleared" })
    }

    if (id) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)

      if (error) throw error
      return NextResponse.json({ success: true, message: "Notification deleted" })
    }

    return NextResponse.json({ error: "id or action required" }, { status: 400 })
  } catch (err: any) {
    console.error("DELETE /api/admin/notifications error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getAdminSupabase()
    const body = await request.json()
    const { title, description, type } = body

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        title,
        description: description || "",
        type: type || "info",
        is_read: false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("POST /api/admin/notifications error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
