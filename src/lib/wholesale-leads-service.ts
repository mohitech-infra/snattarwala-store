import { createClient } from "@/lib/supabase/client"

export type LeadStatus = "New" | "Contacted" | "Quote Sent" | "Negotiation" | "Converted" | "Lost"
export type LeadPriority = "High" | "Medium" | "Low"

export interface LeadInternalNote {
  id: string
  text: string
  author: string
  createdAt: string
}

export interface WholesaleLead {
  id: string
  leadNumber: string
  fullName: string
  businessName: string
  businessType: string
  email: string
  phone: string
  city: string
  state?: string
  gstNumber?: string
  orderQuantity: string
  productInterests: string[]
  message: string
  status: LeadStatus
  priority: LeadPriority
  estimatedValue: number
  assignedTo?: string
  internalNotes: LeadInternalNote[]
  createdAt: string
  updatedAt: string
}

export const INITIAL_WHOLESALE_LEADS: WholesaleLead[] = [
  {
    id: "ws-lead-101",
    leadNumber: "WS-492108",
    fullName: "Zaid Al-Mansoor",
    businessName: "Oud Royale Luxury Boutique",
    businessType: "Retail Perfume Store",
    email: "zaid@oudroyale.in",
    phone: "+91 98200 88219",
    city: "Mumbai, Bandra West",
    state: "Maharashtra",
    gstNumber: "27AABCO1234F1Z8",
    orderQuantity: "High Volume (500 - 2,000 units)",
    productInterests: [
      "Attar Bottles (12ml, 24ml, 55ml)",
      "Eau De Parfum Sprays (30ml, 50ml, 100ml)",
    ],
    message: "We operate 3 boutique fragrance stores in Bandra and Juhu. Looking to stock your Luxury Series and Diamond Series attars under distributor pricing.",
    status: "Quote Sent",
    priority: "High",
    estimatedValue: 240000,
    assignedTo: "SN AttarWala Wholesale Desk",
    internalNotes: [
      {
        id: "note-1",
        text: "Sent catalog and wholesale price tier sheet for 500 units on WhatsApp.",
        author: "Admin",
        createdAt: "2026-11-04T11:30:00Z",
      },
    ],
    createdAt: "2026-11-03T09:15:00Z",
    updatedAt: "2026-11-04T11:30:00Z",
  },
  {
    id: "ws-lead-102",
    leadNumber: "WS-492109",
    fullName: "Meera Singhania",
    businessName: "Royal Heritage Wedding Planners",
    businessType: "Corporate Gifting & Events",
    email: "meera@royalheritageevents.com",
    phone: "+91 98110 44210",
    city: "New Delhi, Vasant Vihar",
    state: "Delhi",
    gstNumber: "07AAACR9981K1Z2",
    orderQuantity: "Medium Bulk (100 - 500 units)",
    productInterests: [
      "Corporate Gift Boxes",
      "Private Label & Custom Packaging",
      "Attar Bottles (12ml, 24ml, 55ml)",
    ],
    message: "Require 350 customized velvet gift boxes containing White Oudh & Sabaya attars with custom metallic gold foil sleeves for an upcoming royal destination wedding in Udaipur.",
    status: "Negotiation",
    priority: "High",
    estimatedValue: 185000,
    assignedTo: "Sales Representative",
    internalNotes: [
      {
        id: "note-2",
        text: "Sample velvet box dispatched via BlueDart express to Delhi office.",
        author: "Admin",
        createdAt: "2026-11-04T15:20:00Z",
      },
    ],
    createdAt: "2026-11-02T14:40:00Z",
    updatedAt: "2026-11-04T15:20:00Z",
  },
  {
    id: "ws-lead-103",
    leadNumber: "WS-492110",
    fullName: "Farhan Qureshi",
    businessName: "Arabian Essence Online",
    businessType: "E-Commerce Reseller",
    email: "farhan@arabianessence.in",
    phone: "+91 99001 77334",
    city: "Bengaluru, Indiranagar",
    state: "Karnataka",
    gstNumber: "29AABCA5543M1ZG",
    orderQuantity: "Starter Wholesale (50 - 100 units)",
    productInterests: [
      "Attar Bottles (12ml, 24ml, 55ml)",
      "Bakhoor & Incense Blends",
    ],
    message: "Looking for starter batch of 100 units across White Oudh, Khmrah, and Ameer Al Oudh Bakhoor. Please share MOQs and delivery lead times to Bangalore.",
    status: "New",
    priority: "Medium",
    estimatedValue: 55000,
    assignedTo: "Unassigned",
    internalNotes: [],
    createdAt: "2026-11-05T08:20:00Z",
    updatedAt: "2026-11-05T08:20:00Z",
  },
  {
    id: "ws-lead-104",
    leadNumber: "WS-492111",
    fullName: "Priya Deshmukh",
    businessName: "Sultana Ayurvedic Spa & Wellness",
    businessType: "Salon & Luxury Spa",
    email: "priya@sultanaspa.com",
    phone: "+91 97654 32109",
    city: "Pune, Koregaon Park",
    state: "Maharashtra",
    gstNumber: "27AADCS8821B1Z4",
    orderQuantity: "Bulk Concentrates by KG / Liter",
    productInterests: [
      "Bulk Concentrated Oils (KG / Liter)",
      "Bakhoor & Incense Blends",
    ],
    message: "We need 5 KG of pure sandalwood and oud aromatic oils for our signature aromatherapy and hammam treatments. We order monthly.",
    status: "Converted",
    priority: "Medium",
    estimatedValue: 120000,
    assignedTo: "Store Manager",
    internalNotes: [
      {
        id: "note-3",
        text: "Client placed first order of 5 KG concentrate. Advance received via NEFT.",
        author: "Manager",
        createdAt: "2026-11-04T16:00:00Z",
      },
    ],
    createdAt: "2026-10-28T10:00:00Z",
    updatedAt: "2026-11-04T16:00:00Z",
  },
  {
    id: "ws-lead-105",
    leadNumber: "WS-492112",
    fullName: "Tariq Siddiqui",
    businessName: "Gulf Coast Traders FZE",
    businessType: "Wholesale Distributor",
    email: "tariq@gulfcoasttrade.com",
    phone: "+91 98980 11223",
    city: "Ahmedabad, SG Highway",
    state: "Gujarat",
    gstNumber: "24AACCG4421P1Z9",
    orderQuantity: "Master Distributor (2,000+ units)",
    productInterests: [
      "Attar Bottles (12ml, 24ml, 55ml)",
      "Eau De Parfum Sprays (30ml, 50ml, 100ml)",
      "Bakhoor & Incense Blends",
    ],
    message: "Distributor covering 40 retail perfume outlets across Gujarat. Seeking exclusive distribution pricing for 2,500 units quarterly.",
    status: "Contacted",
    priority: "High",
    estimatedValue: 650000,
    assignedTo: "SN AttarWala Wholesale Desk",
    internalNotes: [
      {
        id: "note-4",
        text: "Introductory phone call completed. Meeting scheduled at Crawford Market showroom next Tuesday.",
        author: "Admin",
        createdAt: "2026-11-05T09:30:00Z",
      },
    ],
    createdAt: "2026-11-04T16:45:00Z",
    updatedAt: "2026-11-05T09:30:00Z",
  },
]

const LOCAL_STORAGE_KEY = "sn_attarwala_wholesale_leads_v1"

function parseLeadFromTicket(ticket: any): WholesaleLead {
  let meta: any = {}
  if (Array.isArray(ticket.messages) && ticket.messages.length > 0) {
    meta = ticket.messages[0] || {}
  } else if (ticket.message && typeof ticket.message === "string") {
    // Attempt parse if stored as JSON string
    try {
      meta = JSON.parse(ticket.message)
    } catch {
      meta = {}
    }
  }

  // Parse notes if array
  const internalNotes: LeadInternalNote[] = Array.isArray(meta.internalNotes)
    ? meta.internalNotes
    : []

  const statusMap: Record<string, LeadStatus> = {
    Open: "New",
    "In Progress": "Contacted",
    "Waiting on Customer": "Quote Sent",
    Resolved: "Converted",
    Closed: "Lost",
  }

  const rawStatus = meta.leadStatus || meta.status || statusMap[ticket.status] || "New"
  const validStatus: LeadStatus = [
    "New",
    "Contacted",
    "Quote Sent",
    "Negotiation",
    "Converted",
    "Lost",
  ].includes(rawStatus)
    ? rawStatus
    : "New"

  const validPriority: LeadPriority = ticket.priority === "High" ? "High" : ticket.priority === "Low" ? "Low" : "Medium"

  return {
    id: ticket.id,
    leadNumber: ticket.ticket_number || `WS-${ticket.id.slice(0, 6).toUpperCase()}`,
    fullName: meta.fullName || ticket.customer_name || "Valued Lead",
    businessName: meta.businessName || ticket.subject?.replace(/^Wholesale Inquiry:\s*/i, "").split("(")[0]?.trim() || "Retail Partner",
    businessType: meta.businessType || "Retail Perfume Store",
    email: meta.email || ticket.email || "",
    phone: meta.phone || ticket.phone || "",
    city: meta.city || "Mumbai",
    state: meta.state || "Maharashtra",
    gstNumber: meta.gstNumber || undefined,
    orderQuantity: meta.orderQuantity || "Starter Wholesale (50 - 100 units)",
    productInterests: Array.isArray(meta.productInterests)
      ? meta.productInterests
      : ["Attar Bottles (12ml, 24ml, 55ml)"],
    message: meta.message || ticket.message || "Wholesale inquiry received.",
    status: validStatus,
    priority: validPriority,
    estimatedValue: Number(meta.estimatedValue) || 50000,
    assignedTo: meta.assignedTo || ticket.assigned_to || "Unassigned",
    internalNotes,
    createdAt: ticket.created_at || new Date().toISOString(),
    updatedAt: ticket.updated_at || ticket.created_at || new Date().toISOString(),
  }
}

export async function getWholesaleLeads(): Promise<WholesaleLead[]> {
  const supabase = createClient()
  try {
    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("category", "Wholesale")
      .order("created_at", { ascending: false })

    if (!error && Array.isArray(tickets) && tickets.length > 0) {
      const parsed = tickets.map(parseLeadFromTicket)
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed))
        } catch {}
      }
      return parsed
    }
  } catch (err) {
    console.warn("Could not query support_tickets for wholesale leads:", err)
  }

  // Fallback to local storage or initial seed
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
  }

  return INITIAL_WHOLESALE_LEADS
}

export async function createWholesaleLead(
  leadData: Partial<WholesaleLead>
): Promise<{ success: boolean; data?: WholesaleLead; error?: string }> {
  const leadNumber = `WS-${Math.floor(100000 + Math.random() * 900000)}`
  const now = new Date().toISOString()

  const fullLead: WholesaleLead = {
    id: `ws-${Date.now()}`,
    leadNumber,
    fullName: leadData.fullName || "Prospective Partner",
    businessName: leadData.businessName || "Fragrance Retailer",
    businessType: leadData.businessType || "Retail Perfume Store",
    email: leadData.email || "",
    phone: leadData.phone || "",
    city: leadData.city || "Mumbai",
    state: leadData.state || "Maharashtra",
    gstNumber: leadData.gstNumber,
    orderQuantity: leadData.orderQuantity || "Starter Wholesale (50 - 100 units)",
    productInterests: leadData.productInterests || ["Attar Bottles (12ml, 24ml, 55ml)"],
    message: leadData.message || "Manual wholesale lead created in admin panel.",
    status: leadData.status || "New",
    priority: leadData.priority || "High",
    estimatedValue: Number(leadData.estimatedValue) || 75000,
    assignedTo: leadData.assignedTo || "SN AttarWala Wholesale Desk",
    internalNotes: leadData.internalNotes || [],
    createdAt: now,
    updatedAt: now,
  }

  // Save to Supabase support_tickets
  const supabase = createClient()
  try {
    const { data: inserted, error } = await supabase
      .from("support_tickets")
      .insert({
        ticket_number: leadNumber,
        subject: `Wholesale Inquiry: ${fullLead.businessName} (${fullLead.fullName})`,
        category: "Wholesale",
        customer_name: fullLead.fullName,
        phone: fullLead.phone,
        email: fullLead.email,
        message: fullLead.message,
        messages: [fullLead],
        status: fullLead.status === "Converted" ? "Resolved" : fullLead.status === "Lost" ? "Closed" : fullLead.status === "New" ? "Open" : "In Progress",
        priority: (["Low", "Medium", "High"].includes(fullLead.priority as string) ? fullLead.priority : "Medium") as "Low" | "Medium" | "High",
      })
      .select()
      .single()

    if (!error && inserted) {
      fullLead.id = inserted.id
    }
  } catch (err: any) {
    console.warn("Could not insert lead to Supabase:", err?.message)
  }

  // Cache in localStorage
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      const currentList: WholesaleLead[] = cached ? JSON.parse(cached) : INITIAL_WHOLESALE_LEADS
      const updated = [fullLead, ...currentList.filter((l) => l.id !== fullLead.id)]
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  return { success: true, data: fullLead }
}

export async function updateWholesaleLead(
  id: string,
  updates: Partial<WholesaleLead>
): Promise<boolean> {
  const supabase = createClient()
  try {
    // If id is a valid UUID, update in Supabase
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (isUuid) {
      const { data: currentTicket } = await supabase
        .from("support_tickets")
        .select("messages, status, priority")
        .eq("id", id)
        .maybeSingle()

      if (currentTicket) {
        const currentMeta = Array.isArray(currentTicket.messages) ? currentTicket.messages[0] || {} : {}
        const mergedMeta = { ...currentMeta, ...updates, updatedAt: new Date().toISOString() }

        const ticketUpdates: Record<string, any> = {
          messages: [mergedMeta],
          updated_at: new Date().toISOString(),
        }
        if (updates.priority) {
          const p = String(updates.priority)
          ticketUpdates.priority = p === "Urgent" ? "High" : (["Low", "Medium", "High"].includes(p) ? p : "Medium")
        }
        if (updates.status === "Converted") ticketUpdates.status = "Resolved"
        else if (updates.status === "Lost") ticketUpdates.status = "Closed"
        else if (updates.status === "New") ticketUpdates.status = "Open"
        else if (updates.status) ticketUpdates.status = "In Progress"

        await supabase.from("support_tickets").update(ticketUpdates).eq("id", id)
      }
    }
  } catch (err) {
    console.warn("Could not update lead in Supabase:", err)
  }

  // Always update localStorage
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      const currentList: WholesaleLead[] = cached ? JSON.parse(cached) : INITIAL_WHOLESALE_LEADS
      const updated = currentList.map((lead) => {
        if (lead.id === id) {
          return {
            ...lead,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        }
        return lead
      })
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  return true
}

export async function addWholesaleLeadNote(
  id: string,
  noteText: string,
  author = "Admin"
): Promise<boolean> {
  const newNote: LeadInternalNote = {
    id: `note-${Date.now()}`,
    text: noteText.trim(),
    author,
    createdAt: new Date().toISOString(),
  }

  // Fetch current leads
  const leads = await getWholesaleLeads()
  const currentLead = leads.find((l) => l.id === id)
  if (!currentLead) return false

  const updatedNotes = [...(currentLead.internalNotes || []), newNote]
  return await updateWholesaleLead(id, { internalNotes: updatedNotes })
}

export async function deleteWholesaleLead(id: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (isUuid) {
      await supabase.from("support_tickets").delete().eq("id", id)
    }
  } catch {}

  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        const currentList: WholesaleLead[] = JSON.parse(cached)
        const filtered = currentList.filter((l) => l.id !== id)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered))
      }
    } catch {}
  }

  return true
}
