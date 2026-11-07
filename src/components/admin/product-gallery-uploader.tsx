"use client"

import React, { useState, useRef } from "react"
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Check, 
  X, 
  RefreshCw, 
  Star, 
  Plus, 
  Trash2, 
  Link as LinkIcon,
  Layers,
  Sparkles
} from "lucide-react"

interface ProductGalleryUploaderProps {
  images: string[]
  primaryImage: string
  onChangeImages: (images: string[]) => void
  onSetPrimary: (url: string) => void
  label?: string
  helpText?: string
}

export function ProductGalleryUploader({
  images = [],
  primaryImage,
  onChangeImages,
  onSetPrimary,
  label = "Fragrance Photography & Bottle Gallery",
  helpText = "Upload multiple photos (e.g. Roll-on bottle, spray bottle, crystal decanter, gift box). You can link each photo to its specific bottle type below."
}: ProductGalleryUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showManualUrl, setShowManualUrl] = useState(false)
  const [manualUrl, setManualUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadSingleFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Failed to upload ${file.name}`)
    }
    return data.url
  }

  const handleUploadFiles = async (fileList: FileList | File[]) => {
    setUploadError(null)
    const validFiles: File[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (file.type.startsWith("image/")) {
        if (file.size <= 10 * 1024 * 1024) {
          validFiles.push(file)
        } else {
          setUploadError(`File ${file.name} exceeds 10MB limit and was skipped.`)
        }
      }
    }

    if (validFiles.length === 0) {
      if (!uploadError) setUploadError("Please select valid image files (PNG, JPG, WEBP).")
      return
    }

    try {
      setIsUploading(true)
      const uploadedUrls: string[] = []

      // Upload files in parallel
      const results = await Promise.allSettled(validFiles.map(f => uploadSingleFile(f)))

      for (const res of results) {
        if (res.status === "fulfilled" && res.value) {
          uploadedUrls.push(res.value)
        }
      }

      if (uploadedUrls.length > 0) {
        const nextImages = [...images]
        for (const url of uploadedUrls) {
          if (!nextImages.includes(url)) {
            nextImages.push(url)
          }
        }
        onChangeImages(nextImages)

        // If there was no primary, set the first uploaded one as primary
        if (!primaryImage && nextImages.length > 0) {
          onSetPrimary(nextImages[0])
        }
      }
    } catch (err: any) {
      console.error("Gallery upload error:", err)
      setUploadError(err.message || "Failed to upload images.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files)
    }
  }

  const handleAddManualUrl = () => {
    const trimmed = manualUrl.trim()
    if (!trimmed) return

    if (!images.includes(trimmed)) {
      const nextImages = [...images, trimmed]
      onChangeImages(nextImages)
      if (!primaryImage) {
        onSetPrimary(trimmed)
      }
    }
    setManualUrl("")
    setUploadError(null)
  }

  const handleRemoveImage = (indexToRemove: number) => {
    const removedUrl = images[indexToRemove]
    const nextImages = images.filter((_, i) => i !== indexToRemove)
    onChangeImages(nextImages)

    // If removing the primary image, reassign primary to first remaining image
    if (primaryImage === removedUrl) {
      onSetPrimary(nextImages[0] || "")
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{label} *</span>
          </label>
          <p className="text-[11px] text-foreground/60 mt-0.5">{helpText}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="text-[11px] text-accent hover:underline flex items-center gap-1 transition-colors"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showManualUrl ? "Upload File" : "Paste Image URL"}</span>
          </button>
        </div>
      </div>

      {/* Manual URL Input */}
      {showManualUrl && (
        <div className="flex gap-2 p-3 bg-secondary/20 rounded-md border border-border/60">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="Paste image URL (e.g. /products/taif-rose.jpg or https://...)"
            className="flex-1 bg-background border border-border rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddManualUrl()
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddManualUrl}
            className="px-4 py-1.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors"
          >
            + Add URL
          </button>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-accent bg-accent/10 scale-[0.99]"
            : "border-border/80 hover:border-accent/60 bg-secondary/10 hover:bg-secondary/20"
        } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
            {isUploading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-foreground">
              {isUploading ? (
                "Uploading fragrance photos to store storage..."
              ) : (
                <>
                  <span className="text-accent underline font-bold">Click to browse</span> or drag & drop multiple bottle photos
                </>
              )}
            </p>
            <p className="text-[10px] text-foreground/50 mt-1">
              Supports PNG, JPG, WEBP (up to 10MB per image) • Select multiple files at once
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{uploadError}</span>
        </div>
      )}

      {/* Gallery Cards Grid */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <span>Uploaded Gallery ({images.length} Photos)</span>
            <span className="text-[10px] text-accent lowercase tracking-normal">
              Click ⭐ to set the main storefront cover photo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((imgUrl, idx) => {
              const isCover = primaryImage === imgUrl || (!primaryImage && idx === 0)

              return (
                <div
                  key={`${imgUrl}-${idx}`}
                  className={`group relative rounded-md overflow-hidden border transition-all ${
                    isCover
                      ? "border-accent ring-2 ring-accent/40 shadow-md bg-accent/5"
                      : "border-border bg-card hover:border-accent/50"
                  }`}
                >
                  {/* Image Thumbnail */}
                  <div className="aspect-square relative bg-secondary/30 overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={`Product photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Cover Badge */}
                    {isCover && (
                      <div className="absolute top-1.5 left-1.5 bg-accent text-slate-950 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-slate-950" />
                        <span>Cover</span>
                      </div>
                    )}

                    {/* Remove Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveImage(idx)
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                      title="Remove this photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Card Footer: Set As Cover Action */}
                  <div className="p-2 bg-background/80 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-foreground/50 truncate max-w-[80px]">
                      Photo #{idx + 1}
                    </span>

                    {!isCover ? (
                      <button
                        type="button"
                        onClick={() => onSetPrimary(imgUrl)}
                        className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                        title="Set this photo as the storefront cover image"
                      >
                        <Star className="w-2.5 h-2.5" />
                        <span>Set Cover</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-accent">★ Primary</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
