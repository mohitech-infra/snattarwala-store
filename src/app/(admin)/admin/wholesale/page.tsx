"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Building2, Plus, Search, Filter, Phone, Mail, 
  MessageCircle, ExternalLink, Calendar, CheckCircle2, 
  Clock, AlertCircle, ArrowUpRight, DollarSign, 
  Package, Users, Tag, ChevronDown, RefreshCw, 
  Trash2, X, Send, Eye, ShieldCheck, Sparkles,
  FileText, Briefcase, Landmark
} from "lucide-react"
import { 
  getWholesaleLeads, 
  createWholesaleLead, 
  updateWholesaleLead, 
  addWholesaleLeadNote, 
  deleteWholesaleLead, 
  WholesaleLead, 
  LeadStatus, 
  LeadPriority 
} from "@/lib/wholesale-leads-service"
import { ExportMenu } from "@/components/admin/export-menu"

const STATUS_CONFIG: Record<LeadStatus, { label: string; badge: string; border: string }> = {
  "New": {
    label: "New Inquiry",
    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
    border: "border-blue-500/30",
  },
  "Contacted": {
    label: "Contacted",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    border: "border-amber-500/30",
  },
  "Quote Sent": {
    label: "Quote Sent",
    badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30",
    border: "border-purple-500/30",
  },
  "Negotiation": {
    label: "In Negotiation",
    badge: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30",
    border: "border-orange-500/30",
  },
  "Converted": {
    label: "Converted (Won)",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    border: "border-emerald-500/30",
  },
  "Lost": {
    label: "Closed / Lost",
    badge: "bg-secondary text-foreground/50 border border-border",
    border: "border-border",
  },
}

const BUSINESS_TYPE_OPTIONS = [
  "Retail Perfume Store",
  "Boutique / Gift Store",
  "E-Commerce Reseller",
  "Corporate Gifting & Events",
  "Wholesale Distributor",
  "Salon & Luxury Spa",
  "Emerging Fragrance Brand",
  "Other",
]

const VOLUME_OPTIONS = [
  "Starter Wholesale (50 - 100 units)",
  "Medium Bulk (100 - 500 units)",
  "High Volume (500 - 2,000 units)",
  "Master Distributor (2,000+ units)",
  "Bulk Concentrates by KG / Liter",
]

const PRODUCT_INTEREST_OPTIONS = [
  "Attar Bottles (12ml, 24ml, 55ml)",
  "Bulk Concentrated Oils (KG / Liter)",
  "Eau De Parfum Sprays (30ml, 50ml, 100ml)",
  "Bakhoor & Incense Blends",
  "Private Label & Custom Packaging",
  "Corporate Gift Boxes",
]

export default function AdminWholesaleLeadsPage() {
  const [leads, setLeads] = useState<WholesaleLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [typeFilter, setTypeFilter] = useState<string>("All")
  
  // Modals & Drawers
  const [selectedLead, setSelectedLead] = useState<WholesaleLead | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newNoteText, setNewNoteText] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  
  // New Lead Form State
  const [newLeadForm, setNewLeadForm] = useState({
    fullName: "",
    businessName: "",
    businessType: "Retail Perfume Store",
    phone: "",
    email: "",
    city: "Mumbai",
    state: "Maharashtra",
    gstNumber: "",
    orderQuantity: "Starter Wholesale (50 - 100 units)",
    productInterests: ["Attar Bottles (12ml, 24ml, 55ml)"],
    estimatedValue: 75000,
    priority: "High" as LeadPriority,
    status: "New" as LeadStatus,
    message: "",
  })

  const loadLeads = async () => {
    setLoading(true)
    const data = await getWholesaleLeads()
    setLeads(data)
    setLoading(false)
  }

  useEffect(() => {
    loadLeads()
  }, [])

  // KPI Calculations
  const totalLeads = leads.length
  const newLeadsCount = leads.filter(l => l.status === "New").length
  const activePipelineCount = leads.filter(l => ["Contacted", "Quote Sent", "Negotiation"].includes(l.status)).length
  const convertedCount = leads.filter(l => l.status === "Converted").length
  const pipelineValue = leads
    .filter(l => l.status !== "Lost")
    .reduce((sum, l) => sum + (l.estimatedValue || 0), 0)

  // Filtering
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = 
        !q ||
        lead.businessName.toLowerCase().includes(q) ||
        lead.fullName.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.city.toLowerCase().includes(q) ||
        (lead.gstNumber && lead.gstNumber.toLowerCase().includes(q)) ||
        lead.leadNumber.toLowerCase().includes(q)

      const matchesStatus = statusFilter === "All" || lead.status === statusFilter
      const matchesType = typeFilter === "All" || lead.businessType === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [leads, searchQuery, statusFilter, typeFilter])

  // Status Update Handler
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const success = await updateWholesaleLead(leadId, { status: newStatus })
    if (success) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null)
      }
    }
  }

  // Priority Update Handler
  const handlePriorityChange = async (leadId: string, newPriority: LeadPriority) => {
    const success = await updateWholesaleLead(leadId, { priority: newPriority })
    if (success) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, priority: newPriority } : l))
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, priority: newPriority } : null)
      }
    }
  }

  // Add Internal Note Handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead || !newNoteText.trim()) return

    setIsAddingNote(true)
    const success = await addWholesaleLeadNote(selectedLead.id, newNoteText.trim())
    if (success) {
      const updatedNote = {
        id: `note-${Date.now()}`,
        text: newNoteText.trim(),
        author: "Admin",
        createdAt: new Date().toISOString()
      }
      setSelectedLead(prev => prev ? {
        ...prev,
        internalNotes: [...(prev.internalNotes || []), updatedNote]
      } : null)
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? {
        ...l,
        internalNotes: [...(l.internalNotes || []), updatedNote]
      } : l))
      setNewNoteText("")
    }
    setIsAddingNote(false)
  }

  // Delete Lead
  const handleDeleteLead = async (leadId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to delete the wholesale lead for "${businessName}"?`)) return
    const success = await deleteWholesaleLead(leadId)
    if (success) {
      setLeads(prev => prev.filter(l => l.id !== leadId))
      if (selectedLead?.id === leadId) setSelectedLead(null)
    }
  }

  // Create Manual Lead Submit
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadForm.fullName || !newLeadForm.businessName || !newLeadForm.phone) {
      alert("Please fill in Contact Person, Business Name, and Phone number.")
      return
    }

    const res = await createWholesaleLead(newLeadForm)
    if (res.success && res.data) {
      setLeads(prev => [res.data!, ...prev])
      setIsAddModalOpen(false)
      setNewLeadForm({
        fullName: "",
        businessName: "",
        businessType: "Retail Perfume Store",
        phone: "",
        email: "",
        city: "Mumbai",
        state: "Maharashtra",
        gstNumber: "",
        orderQuantity: "Starter Wholesale (50 - 100 units)",
        productInterests: ["Attar Bottles (12ml, 24ml, 55ml)"],
        estimatedValue: 75000,
        priority: "High",
        status: "New",
        message: "",
      })
      alert(`✅ Wholesale lead for "${res.data.businessName}" created successfully!`)
    } else {
      alert(`Error creating lead: ${res.error || "Please check details"}`)
    }
  }

  const getWhatsAppLink = (lead: WholesaleLead) => {
    const cleanPhone = lead.phone.replace(/\D/g, "")
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`
    const greeting = `Hello ${lead.fullName}, thank you for your wholesale inquiry for ${lead.businessName} with SN AttarWala Mumbai. We have reviewed your request for ${lead.orderQuantity} and would like to share our official bulk rates catalog.`
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(greeting)}`
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-accent block">
              B2B & Enterprise Portal
            </span>
            <span className="px-2 py-0.5 rounded-xs bg-accent/15 text-accent text-[9px] font-bold uppercase tracking-wider">
              Live Pipeline
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Wholesale Leads & Inquiries
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage bulk buyers, fragrance boutiques, distributors, and customized gifting inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportMenu
            filename="sn_attarwala_wholesale_leads"
            title="Wholesale Leads & Inquiries"
            data={filteredLeads.map(l => ({
              "Lead #": l.leadNumber,
              "Business Name": l.businessName,
              "Contact Person": l.fullName,
              "Phone": l.phone,
              "Email": l.email,
              "City": l.city,
              "Type": l.businessType,
              "Order Volume": l.orderQuantity,
              "Est. Value": `₹${l.estimatedValue.toLocaleString('en-IN')}`,
              "Status": l.status,
              "Priority": l.priority,
              "Date": new Date(l.createdAt).toLocaleDateString("en-IN")
            }))}
            headers={["Lead #", "Business Name", "Contact Person", "Phone", "Email", "City", "Type", "Order Volume", "Est. Value", "Status", "Priority", "Date"]}
            printRows={filteredLeads.map(l => [
              l.leadNumber,
              l.businessName,
              l.fullName,
              l.phone,
              l.email,
              l.city,
              l.businessType,
              l.orderQuantity,
              `₹${l.estimatedValue.toLocaleString('en-IN')}`,
              l.status,
              l.priority,
              new Date(l.createdAt).toLocaleDateString("en-IN")
            ])}
          />

          <button
            onClick={loadLeads}
            className="p-2.5 rounded-sm border border-border hover:border-accent text-foreground/60 hover:text-accent transition-colors cursor-pointer"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add B2B Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Pipeline Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border/60 shadow-xs">
          <div className="flex items-center justify-between text-foreground/60 text-xs">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-heading font-bold text-foreground mt-2">{totalLeads}</p>
          <span className="text-[10px] text-foreground/50 mt-1 block">Inbound & manual entries</span>
        </div>

        <div className="bg-card p-4 rounded-lg border border-blue-500/30 shadow-xs bg-blue-500/5">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <span>New Inquiries</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-heading font-bold text-blue-600 dark:text-blue-400 mt-2">{newLeadsCount}</p>
          <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-1 block">Awaiting initial outreach</span>
        </div>

        <div className="bg-card p-4 rounded-lg border border-purple-500/30 shadow-xs bg-purple-500/5">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-semibold">
            <span>Active Pipeline</span>
            <Briefcase className="w-4 h-4" />
          </div>
          <p className="text-2xl font-heading font-bold text-purple-600 dark:text-purple-400 mt-2">{activePipelineCount}</p>
          <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70 mt-1 block">Quotes sent & negotiation</span>
        </div>

        <div className="bg-card p-4 rounded-lg border border-emerald-500/30 shadow-xs bg-emerald-500/5">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>Converted Partners</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-heading font-bold text-emerald-600 dark:text-emerald-400 mt-2">{convertedCount}</p>
          <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1 block">Active wholesale accounts</span>
        </div>

        <div className="bg-card p-4 rounded-lg border border-accent/40 shadow-xs bg-accent/5 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-accent text-xs font-semibold">
            <span>Pipeline Value</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-2xl font-heading font-bold text-accent mt-2">
            ₹{pipelineValue.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-foreground/60 mt-1 block">Estimated deal volume</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card p-4 rounded-lg border border-border/50 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 border-b lg:border-b-0 border-border/40 pb-2 lg:pb-0 overflow-x-auto">
            {["All", "New", "Contacted", "Quote Sent", "Negotiation", "Converted", "Lost"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === st 
                    ? "bg-primary text-primary-foreground font-bold" 
                    : "text-foreground/60 hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                {st} {st === "All" ? `(${leads.length})` : `(${leads.filter(l => l.status === st).length})`}
              </button>
            ))}
          </div>

          {/* Search & Type Filter */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search business, contact, city..."
                className="w-full bg-background border border-border rounded-sm pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-accent text-foreground"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-background border border-border rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-accent text-foreground cursor-pointer"
            >
              <option value="All">All Business Types</option>
              {BUSINESS_TYPE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-foreground/60 uppercase font-semibold tracking-wider text-[10px] border-b border-border/50">
              <tr>
                <th className="px-5 py-3.5">Business & Contact</th>
                <th className="px-5 py-3.5">Category & Volume</th>
                <th className="px-5 py-3.5">Est. Deal Value</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Quick Outreach</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-foreground/50">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-heading font-medium">No wholesale inquiries found matching your filters.</p>
                    <button
                      onClick={() => { setSearchQuery(""); setStatusFilter("All"); setTypeFilter("All"); }}
                      className="mt-2 text-accent text-xs font-semibold underline hover:opacity-80"
                    >
                      Clear search & filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const statusMeta = STATUS_CONFIG[lead.status] || STATUS_CONFIG["New"]
                  return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-secondary/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      {/* Business & Contact */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-sm bg-accent/10 text-accent shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-heading font-bold text-sm text-foreground">
                                {lead.businessName}
                              </span>
                              <span className="text-[10px] font-mono text-foreground/50">
                                {lead.leadNumber}
                              </span>
                            </div>
                            <p className="text-foreground/75 font-medium mt-0.5">
                              {lead.fullName} • <span className="text-foreground/50">{lead.city}</span>
                            </p>
                            {lead.gstNumber && (
                              <span className="text-[9px] font-mono text-accent/80 block mt-0.5">
                                GST: {lead.gstNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Business Type & Volume */}
                      <td className="px-5 py-4">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-xs bg-secondary text-foreground/70 mb-1">
                          {lead.businessType}
                        </span>
                        <p className="text-foreground/80 font-medium text-[11px]">
                          {lead.orderQuantity}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lead.productInterests?.slice(0, 2).map((prod, i) => (
                            <span key={i} className="text-[9px] text-foreground/50 bg-secondary/40 px-1.5 py-0.5 rounded-xs">
                              {prod.split("(")[0].trim()}
                            </span>
                          ))}
                          {(lead.productInterests?.length || 0) > 2 && (
                            <span className="text-[9px] text-accent">+{lead.productInterests.length - 2} more</span>
                          )}
                        </div>
                      </td>

                      {/* Deal Value & Priority */}
                      <td className="px-5 py-4">
                        <p className="font-heading font-bold text-sm text-accent">
                          ₹{lead.estimatedValue.toLocaleString("en-IN")}
                        </p>
                        <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs ${
                          lead.priority === "High" ? "bg-rose-500/15 text-rose-600" :
                          lead.priority === "Medium" ? "bg-amber-500/15 text-amber-600" :
                          "bg-secondary text-foreground/50"
                        }`}>
                          {lead.priority} Priority
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm cursor-pointer border ${statusMeta.badge}`}
                        >
                          <option value="New">New Inquiry</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Quote Sent">Quote Sent</option>
                          <option value="Negotiation">In Negotiation</option>
                          <option value="Converted">Converted (Won)</option>
                          <option value="Lost">Closed / Lost</option>
                        </select>
                      </td>

                      {/* Quick Outreach */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getWhatsAppLink(lead)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-sm bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                            title="WhatsApp Chat"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1.5 rounded-sm bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                              title="Call Lead"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}?subject=${encodeURIComponent(`SN AttarWala Wholesale Catalog: ${lead.businessName}`)}`}
                              className="p-1.5 rounded-sm bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors"
                              title="Email Lead"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="p-1.5 rounded-sm hover:bg-secondary text-foreground/60 hover:text-accent transition-colors"
                            title="View Full Lead Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id, lead.businessName)}
                            className="p-1.5 rounded-sm hover:bg-destructive/10 text-foreground/50 hover:text-destructive transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEAD DETAILS SLIDE-OVER DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            onClick={() => setSelectedLead(null)} 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" 
          />

          <div className="relative w-full max-w-xl bg-card border-l border-border h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-border/50 bg-background/50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-mono text-accent">
                    {selectedLead.leadNumber}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs ${STATUS_CONFIG[selectedLead.status]?.badge}`}>
                    {selectedLead.status}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xl text-foreground mt-1">
                  {selectedLead.businessName}
                </h3>
                <p className="text-xs text-foreground/60">
                  Contact: <strong className="text-foreground">{selectedLead.fullName}</strong> • {selectedLead.city}, {selectedLead.state || "India"}
                </p>
              </div>

              <button 
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-secondary rounded-sm text-foreground/60 hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

              {/* Direct Actions Strip */}
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={getWhatsAppLink(selectedLead)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-border hover:border-foreground text-foreground rounded-sm font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Lead</span>
                </a>

                <a
                  href={`mailto:${selectedLead.email}?subject=${encodeURIComponent(`SN AttarWala Wholesale Quotation: ${selectedLead.businessName}`)}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-border hover:border-foreground text-foreground rounded-sm font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Email</span>
                </a>
              </div>

              {/* Status & Priority Management */}
              <div className="p-4 bg-secondary/30 rounded-lg border border-border/50 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">
                    Lead Status
                  </label>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusChange(selectedLead.id, e.target.value as LeadStatus)}
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-semibold"
                  >
                    <option value="New">New Inquiry</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Quote Sent">Quote Sent</option>
                    <option value="Negotiation">In Negotiation</option>
                    <option value="Converted">Converted (Won)</option>
                    <option value="Lost">Closed / Lost</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={selectedLead.priority}
                    onChange={(e) => handlePriorityChange(selectedLead.id, e.target.value as LeadPriority)}
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-semibold"
                  >
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">⚪ Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Inquiry Specifications */}
              <div className="space-y-3">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-accent border-b border-border/40 pb-2">
                  Order & Business Specifications
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-card border border-border/50 rounded-sm">
                    <span className="text-[10px] text-foreground/50 uppercase block">Business Type</span>
                    <strong className="text-foreground mt-0.5 block">{selectedLead.businessType}</strong>
                  </div>

                  <div className="p-3 bg-card border border-border/50 rounded-sm">
                    <span className="text-[10px] text-foreground/50 uppercase block">Requested Volume</span>
                    <strong className="text-foreground mt-0.5 block">{selectedLead.orderQuantity}</strong>
                  </div>

                  <div className="p-3 bg-card border border-border/50 rounded-sm">
                    <span className="text-[10px] text-foreground/50 uppercase block">Estimated Deal Size</span>
                    <strong className="text-accent font-heading font-bold mt-0.5 block">
                      ₹{selectedLead.estimatedValue.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="p-3 bg-card border border-border/50 rounded-sm">
                    <span className="text-[10px] text-foreground/50 uppercase block">GST / Tax ID</span>
                    <strong className="text-foreground font-mono mt-0.5 block">
                      {selectedLead.gstNumber || "Not Provided"}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-card border border-border/50 rounded-sm">
                  <span className="text-[10px] text-foreground/50 uppercase block mb-1.5">Products of Interest</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLead.productInterests?.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-xs bg-secondary text-foreground text-xs font-medium">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Buyer Message */}
                <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                  <span className="text-[10px] text-foreground/50 uppercase font-semibold block mb-1">
                    Buyer Note / Special Requirements
                  </span>
                  <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {selectedLead.message || "No special requirements entered."}
                  </p>
                </div>
              </div>

              {/* Internal Notes & Follow-up Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-accent border-b border-border/40 pb-2">
                  Internal Follow-up & Activity Log
                </h4>

                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add follow-up notes (e.g. Sent sample box of 12ml attars to showroom, offered 15% tier discount)..."
                    rows={2}
                    className="w-full bg-background border border-border rounded-sm p-3 text-xs focus:outline-none focus:border-accent text-foreground resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingNote || !newNoteText.trim()}
                      className="px-4 py-1.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
                    >
                      {isAddingNote ? "Saving..." : "Log Note"}
                    </button>
                  </div>
                </form>

                <div className="space-y-2.5 mt-3">
                  {selectedLead.internalNotes && selectedLead.internalNotes.length > 0 ? (
                    selectedLead.internalNotes.slice().reverse().map((note) => (
                      <div key={note.id} className="p-3 bg-secondary/30 rounded-sm border border-border/40 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-foreground/50 mb-1">
                          <span className="font-semibold text-accent">{note.author}</span>
                          <span>{new Date(note.createdAt).toLocaleString("en-IN")}</span>
                        </div>
                        <p className="text-foreground/90">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-foreground/50 italic text-center py-4 bg-secondary/10 rounded-sm">
                      No internal notes recorded yet. Add one above to keep team members synced.
                    </p>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* CREATE WHOLESALE LEAD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
          <div onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />

          <div className="relative w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left my-8 z-10">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border/50 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-accent block">
                  New B2B Partner Lead
                </span>
                <h3 className="font-heading font-bold text-xl">Create Wholesale Inquiry</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-secondary rounded-sm cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateLead} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto overscroll-contain custom-scrollbar">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.fullName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, fullName: e.target.value })}
                    placeholder="e.g. Zaid Merchant"
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1">
                    Business / Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.businessName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, businessName: e.target.value })}
                    placeholder="e.g. Al-Mansoor Perfume Emporium"
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1">
                    Phone Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="+91 98200 00000"
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1">
                    Business Email
                  </label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="procurement@store.com"
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1">
                    City & State
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.city}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1">
                    Business Type
                  </label>
                  <select
                    value={newLeadForm.businessType}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, businessType: e.target.value })}
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  >
                    {BUSINESS_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1">
                    GST / Tax ID
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.gstNumber}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, gstNumber: e.target.value })}
                    placeholder="27AAACS1234A1Z5"
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1">
                    Order Volume
                  </label>
                  <select
                    value={newLeadForm.orderQuantity}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, orderQuantity: e.target.value })}
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  >
                    {VOLUME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1">
                    Estimated Deal Size (₹)
                  </label>
                  <input
                    type="number"
                    value={newLeadForm.estimatedValue}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedValue: Number(e.target.value) || 0 })}
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">
                  Products of Interest
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {PRODUCT_INTEREST_OPTIONS.map((prod) => {
                    const checked = newLeadForm.productInterests.includes(prod)
                    return (
                      <label 
                        key={prod} 
                        className={`flex items-center gap-2 p-2 rounded-sm border cursor-pointer transition-colors ${
                          checked ? "bg-accent/10 border-accent/60 text-foreground" : "border-border/60 hover:border-foreground/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setNewLeadForm(prev => ({
                              ...prev,
                              productInterests: checked 
                                ? prev.productInterests.filter(p => p !== prod)
                                : [...prev.productInterests, prod]
                            }))
                          }}
                          className="accent-accent"
                        />
                        <span className="text-[11px] leading-tight">{prod}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1">
                  Inquiry Message / Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={newLeadForm.message}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                  placeholder="Notes regarding requested fragrances, delivery timeline, private labelling..."
                  className="w-full bg-background border border-border rounded-sm p-3 text-xs focus:outline-none focus:border-accent text-foreground resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 shadow-sm cursor-pointer"
                >
                  Save Wholesale Lead
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
