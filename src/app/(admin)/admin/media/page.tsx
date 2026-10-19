"use client"

import { useState, useEffect } from "react"
import { Image as ImageIcon, Upload, Search, Trash2, Copy, Check, Eye, Grid, List, HardDrive, RefreshCw } from "lucide-react"
import { getAdminProducts } from "@/lib/admin-service"

interface MediaFile {
  id: string
  name: string
  url: string
  size: string
  dimensions: string
  type: "product" | "banner" | "misc"
  usedIn: string
  uploadedAt: string
}

const STATIC_CATEGORY_IMAGES: MediaFile[] = [
  { id: "cat-attars",   name: "attars.jpg",   url: "/categories/attars.jpg",   size: "320 KB", dimensions: "600×600", type: "banner", usedIn: "Attars Category", uploadedAt: "Catalog" },
  { id: "cat-perfumes", name: "perfumes.jpg", url: "/categories/perfumes.jpg", size: "350 KB", dimensions: "600×600", type: "banner", usedIn: "Perfumes Category", uploadedAt: "Catalog" },
  { id: "cat-bakhoor",  name: "bakhoor.jpg",  url: "/categories/bakhoor.jpg",  size: "310 KB", dimensions: "600×600", type: "banner", usedIn: "Bakhoor Category", uploadedAt: "Catalog" },
]

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>(STATIC_CATEGORY_IMAGES)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const loadMedia = async () => {
    setLoading(true)
    try {
      const products = await getAdminProducts()
      const productImages: MediaFile[] = products
        .filter(p => p.imageUrl)
        .map(p => ({
          id: p.id,
          name: p.imageUrl.split("/").pop() || `${p.slug}.jpg`,
          url: p.imageUrl,
          size: "650 KB",
          dimensions: "800×800",
          type: "product" as const,
          usedIn: p.name,
          uploadedAt: "Catalog"
        }))
      setFiles([...productImages, ...STATIC_CATEGORY_IMAGES])
    } catch (err) {
      console.error("Failed to load product media:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedia()
  }, [])

  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    setIsUploading(true)
    const uploadedList: MediaFile[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (data.success) {
          uploadedList.push({
            id: `m-up-${Date.now()}-${i}`,
            name: data.fileName,
            url: data.url,
            size: data.size,
            dimensions: "800×800",
            type: "product",
            usedIn: "Newly Uploaded",
            uploadedAt: "Just now",
          })
        }
      } catch (err) {
        console.error("Failed to upload file:", file.name, err)
      }
    }

    setIsUploading(false)
    if (uploadedList.length > 0) {
      setFiles(prev => [...uploadedList, ...prev])
      alert(`✅ Successfully uploaded ${uploadedList.length} asset(s)!`)
    }
  }

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.usedIn.toLowerCase().includes(search.toLowerCase())
  )

  const totalSize = `${Math.max(0.3, Number((files.length * 0.62).toFixed(1)))} MB`
  
  const copyUrl = (file: MediaFile) => {
    navigator.clipboard.writeText(file.url).catch(() => {})
    setCopiedId(file.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const deleteSelected = () => {
    if (!confirm(`Delete ${selected.size} selected files?`)) return
    setFiles(prev => prev.filter(f => !selected.has(f.id)))
    setSelected(new Set())
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Assets</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Media Library</h1>
          <p className="text-sm text-foreground/60">Manage product images and media assets for your storefront.</p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              className="px-4 py-2.5 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-destructive/20 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selected.size})
            </button>
          )}
          <label className="px-5 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors flex items-center gap-2 shadow-sm cursor-pointer">
            <Upload className={`w-4 h-4 ${isUploading ? "animate-spin" : ""}`} />
            {isUploading ? "Uploading..." : "Upload Files"}
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Files", value: files.length.toString(), color: "text-foreground", icon: ImageIcon },
          { label: "Product Images", value: files.filter(f => f.type === "product").length.toString(), color: "text-accent", icon: ImageIcon },
          { label: "Storage Used", value: totalSize, color: "text-foreground", icon: HardDrive },
          { label: "Selected", value: selected.size.toString(), color: selected.size > 0 ? "text-accent" : "text-foreground/40", icon: Check },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">{stat.label}</p>
                <Icon className="w-4 h-4 text-foreground/30" />
              </div>
              <p className={`text-2xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename or product..."
            className="w-full bg-card border border-border rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent text-foreground"
          />
        </div>
        <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-sm border border-border/40">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-sm transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-sm transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(file => (
            <div
              key={file.id}
              onClick={() => toggleSelect(file.id)}
              className={`group relative bg-card border rounded-lg overflow-hidden cursor-pointer transition-all ${
                selected.has(file.id) ? "border-accent ring-2 ring-accent/30" : "border-border/60 hover:border-accent/40"
              }`}
            >
              <div className="aspect-square relative bg-secondary/20">
                <img src={file.url} alt={file.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "/products/white-oudh-attar.jpg" }} />
                {selected.has(file.id) && (
                  <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-slate-950" />
                    </div>
                  </div>
                )}
                <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); copyUrl(file) }}
                    className="w-6 h-6 bg-background/90 rounded-sm flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    {copiedId === file.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-semibold text-foreground truncate">{file.name}</p>
                <p className="text-[9px] text-foreground/50">{file.size} · {file.dimensions}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
              <tr>
                <th className="px-4 py-3.5 font-semibold">File</th>
                <th className="px-4 py-3.5 font-semibold">Used In</th>
                <th className="px-4 py-3.5 font-semibold">Size</th>
                <th className="px-4 py-3.5 font-semibold">Dimensions</th>
                <th className="px-4 py-3.5 font-semibold">Uploaded</th>
                <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map(file => (
                <tr key={file.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={file.url} alt={file.name} className="w-9 h-9 object-cover rounded-sm border border-border/50" onError={e => { (e.target as HTMLImageElement).src = "/products/white-oudh-attar.jpg" }} />
                      <span className="font-semibold text-foreground">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-foreground/70">{file.usedIn}</td>
                  <td className="px-4 py-3.5 text-foreground/70">{file.size}</td>
                  <td className="px-4 py-3.5 text-foreground/70">{file.dimensions}</td>
                  <td className="px-4 py-3.5 text-foreground/60">{file.uploadedAt}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => copyUrl(file)} className="p-1.5 hover:bg-secondary rounded-sm text-foreground/60 hover:text-accent transition-colors">
                        {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { if (confirm("Delete this file?")) setFiles(prev => prev.filter(f => f.id !== file.id)) }} className="p-1.5 hover:bg-destructive/10 rounded-sm text-foreground/60 hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}