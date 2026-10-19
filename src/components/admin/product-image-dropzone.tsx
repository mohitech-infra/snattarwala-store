"use client"

import React, { useState, useRef } from "react"
import { UploadCloud, Image as ImageIcon, Check, X, RefreshCw, AlertCircle, Link as LinkIcon, ExternalLink } from "lucide-react"

interface ProductImageDropzoneProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  helpText?: string
}

export function ProductImageDropzone({
  value,
  onChange,
  label = "Product Photo",
  helpText = "Drag & drop your fragrance photo here (PNG, JPG, WEBP up to 10MB)"
}: ProductImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showManualUrl, setShowManualUrl] = useState(false)
  const [manualUrl, setManualUrl] = useState(value || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadFile = async (file: File) => {
    setUploadError(null)

    // Validate type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WEBP, or SVG).")
      return
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image size exceeds 10MB limit. Please upload a smaller file.")
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image.")
      }

      onChange(data.url)
      setManualUrl(data.url)
    } catch (err: any) {
      console.error("Image upload failed:", err)
      setUploadError(err.message || "Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleUploadFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUploadFile(files[0])
    }
  }

  const handleManualApply = () => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim())
      setUploadError(null)
    }
  }

  const handleRemoveImage = () => {
    onChange("")
    setManualUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block">
          {label} *
        </label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] text-accent hover:underline flex items-center gap-1 transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          {showManualUrl ? "Switch to Drag & Drop" : "Paste Image URL instead"}
        </button>
      </div>

      {showManualUrl ? (
        /* Manual URL Input Mode */
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="e.g. /products/white-oudh-attar.jpg or https://..."
              className="flex-1 bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
            />
            <button
              type="button"
              onClick={handleManualApply}
              className="px-4 py-2 bg-secondary text-foreground hover:text-accent border border-border rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Apply
            </button>
          </div>
          {value && (
            <div className="flex items-center gap-3 p-2 bg-secondary/30 rounded-sm border border-border/50 text-xs">
              <img
                src={value}
                alt="Preview"
                className="w-10 h-10 object-cover rounded-sm border border-border shrink-0"
              />
              <span className="text-foreground/70 truncate flex-1 font-mono text-[10px]">{value}</span>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1 hover:text-destructive text-foreground/50 transition-colors"
                title="Remove Image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div>
          {value ? (
            /* Uploaded Image Preview */
            <div className="relative p-3 bg-secondary/20 border border-border/70 rounded-md flex items-center justify-between gap-4 group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-background border border-border/70 shrink-0 shadow-sm">
                  <img
                    src={value}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>Photo Uploaded</span>
                  </div>
                  <p className="text-[11px] font-mono text-foreground/60 truncate mt-0.5 max-w-[280px] sm:max-w-xs">
                    {value}
                  </p>
                  <p className="text-[10px] text-foreground/40 mt-0.5">
                    Ready to publish with fragrance listing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-sm text-xs font-semibold text-foreground/80 hover:text-accent transition-colors flex items-center gap-1.5"
                  title="Replace image"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-sm hover:bg-destructive/10 text-foreground/50 hover:text-destructive transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Hidden file input for replacement */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml, image/avif"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            /* Dropzone Box */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-accent bg-accent/10 scale-[1.01]"
                  : "border-border/70 hover:border-accent/60 bg-secondary/15 hover:bg-secondary/25"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml, image/avif"
                className="hidden"
                onChange={handleFileSelect}
              />

              {isUploading ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-2">
                  <RefreshCw className="w-8 h-8 text-accent animate-spin" />
                  <p className="text-xs font-semibold text-foreground">Uploading product image...</p>
                  <p className="text-[10px] text-foreground/50">Processing and optimizing asset</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className={`p-3 rounded-full ${isDragging ? "bg-accent/20 text-accent" : "bg-secondary text-foreground/60 group-hover:text-accent"} transition-colors`}>
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      <span className="text-accent underline font-bold">Click to browse</span> or drag and drop image here
                    </p>
                    <p className="text-[10px] text-foreground/50 mt-1">
                      {helpText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs text-destructive mt-1 bg-destructive/10 p-2 rounded-sm border border-destructive/20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  )
}
