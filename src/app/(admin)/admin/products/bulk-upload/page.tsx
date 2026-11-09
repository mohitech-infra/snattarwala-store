"use client"

import { useState, useRef, useTransition } from "react"
import Link from "next/link"
import JSZip from "jszip"
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileArchive, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Eye, 
  Layers, 
  Package, 
  History, 
  Sparkles, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight,
  Info,
  Boxes,
  Image as ImageIcon,
  ExternalLink,
  Search,
  Filter
} from "lucide-react"
import { 
  ValidationResult, 
  ValidationIssue, 
  ImportExecutionResult 
} from "@/lib/catalog-import-service"

type WorkflowStep = "upload" | "validate" | "preview" | "import"

export default function BulkUploadPage() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload")

  // File states
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [looseImages, setLooseImages] = useState<File[]>([])
  const [isSpreadsheetDragging, setIsSpreadsheetDragging] = useState(false)
  const [isZipDragging, setIsZipDragging] = useState(false)

  // Validation & Processing states
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [errorCsvContent, setErrorCsvContent] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Preview filtering states
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "READY" | "WARNING" | "ERROR">("ALL")
  const [previewSearch, setPreviewSearch] = useState("")
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({})

  // Import execution states
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<{
    percent: number
    stage: string
    productsProcessed: number
    variantsProcessed: number
    imagesUploaded: number
  }>({
    percent: 0,
    stage: "Preparing upload...",
    productsProcessed: 0,
    variantsProcessed: 0,
    imagesUploaded: 0,
  })
  const [importResult, setImportResult] = useState<ImportExecutionResult | null>(null)

  // Refs for hidden inputs
  const spreadsheetInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const looseImagesInputRef = useRef<HTMLInputElement>(null)

  // =========================================================================
  // TEMPLATE DOWNLOAD
  // =========================================================================
  const handleDownloadTemplate = () => {
    window.open("/api/admin/catalog/template", "_blank")
  }

  // =========================================================================
  // FILE HANDLING & DRAG AND DROP
  // =========================================================================
  const handleSpreadsheetDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsSpreadsheetDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext === "xlsx" || ext === "xls" || ext === "csv") {
        setSpreadsheetFile(file)
        setErrorMessage(null)
      } else {
        setErrorMessage("Please drop a valid .xlsx, .xls, or .csv spreadsheet file.")
      }
    }
  }

  const handleZipDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsZipDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext === "zip") {
        setZipFile(file)
        setLooseImages([])
        setErrorMessage(null)
      } else {
        setErrorMessage("Please drop a valid .zip image archive file.")
      }
    }
  }

  // Helper to convert File to pure Base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.includes(",") ? result.split(",")[1] : result
        resolve(base64)
      }
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })
  }

  // =========================================================================
  // STEP 2: VALIDATE FILES (IMMUNE TO FORMDATA SIZE LIMITS & UNDICI BUGS)
  // =========================================================================
  const handleValidate = async () => {
    if (!spreadsheetFile) {
      setErrorMessage("Please upload a spreadsheet file before validating.")
      return
    }

    setIsValidating(true)
    setErrorMessage(null)

    try {
      // 1. Read spreadsheet as Base64 (lightweight, ~50KB-200KB)
      const spreadsheetBase64 = await fileToBase64(spreadsheetFile)

      // 2. Extract image manifest and local preview thumbnails in the browser
      // This completely avoids sending 20MB-100MB of raw image binaries to the validator!
      const imageManifest: Array<{ fileName: string; path: string; sku: string; role: string }> = []
      const localThumbnailsBySku: Record<string, string> = {}

      if (zipFile) {
        const zip = await JSZip.loadAsync(zipFile)
        for (const [rawPath, zipEntry] of Object.entries(zip.files)) {
          if (zipEntry.dir) continue
          const cleanPath = rawPath.replace(/^(\.\.[\/\\])+/, "")
          const ext = cleanPath.split(".").pop()?.toLowerCase() || ""
          if (!["jpg", "jpeg", "png", "webp"].includes(ext)) continue

          const parts = cleanPath.split(/[\/\\]/).filter(Boolean)
          let sku = ""
          if (parts.length >= 2) {
            const folderCandidate = parts[parts.length - 2].toUpperCase()
            if (folderCandidate !== "PRODUCTS" && folderCandidate !== "IMAGES") {
              sku = folderCandidate
            } else if (parts.length >= 3) {
              sku = parts[parts.length - 2].toUpperCase()
            }
          }
          if (!sku) {
            const fileNameOnly = parts[parts.length - 1] || ""
            const match = fileNameOnly.match(/^([A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+)/i)
            if (match) {
              sku = match[1].toUpperCase()
            } else {
              const flatParts = fileNameOnly.split(/[-_]/)
              if (flatParts.length >= 2) {
                sku = flatParts[0].toUpperCase()
              }
            }
          }

          if (sku) {
            const lowerName = cleanPath.toLowerCase()
            let role: "primary" | "secondary" | "lifestyle" | "variant" = "secondary"
            if (
              lowerName.includes("01") ||
              lowerName.includes("hero") ||
              lowerName.includes("front") ||
              lowerName.includes("primary")
            ) {
              role = "primary"
            } else if (
              lowerName.includes("lifestyle") ||
              lowerName.includes("03") ||
              lowerName.includes("context")
            ) {
              role = "lifestyle"
            }

            const fileName = parts[parts.length - 1]
            imageManifest.push({
              fileName,
              path: cleanPath,
              sku,
              role,
            })

            // Generate thumbnail for preview table
            if (!localThumbnailsBySku[sku] || role === "primary") {
              try {
                const b64 = await zipEntry.async("base64")
                const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"
                localThumbnailsBySku[sku] = `data:${mime};base64,${b64}`
              } catch {
                // Ignore individual thumbnail extraction issues
              }
            }
          }
        }
      } else if (looseImages.length > 0) {
        for (const file of looseImages) {
          const lowerName = file.name.toLowerCase()
          const ext = file.name.split(".").pop()?.toLowerCase() || ""
          if (!["jpg", "jpeg", "png", "webp"].includes(ext)) continue

          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
          const parts = nameWithoutExt.split(/[-_]/)
          let sku = ""
          if (parts.length >= 3 && parts[0].length >= 2 && parts[1].length >= 2) {
            sku = `${parts[0]}-${parts[1]}-${parts[2]}`.toUpperCase()
          } else if (parts.length >= 2) {
            sku = `${parts[0]}-${parts[1]}`.toUpperCase()
          } else {
            sku = parts[0].toUpperCase()
          }

          let role: "primary" | "secondary" | "lifestyle" | "variant" = "secondary"
          if (
            lowerName.includes("front") ||
            lowerName.includes("hero") ||
            lowerName.includes("01") ||
            lowerName.includes("primary")
          ) {
            role = "primary"
          } else if (
            lowerName.includes("lifestyle") ||
            lowerName.includes("03") ||
            lowerName.includes("context")
          ) {
            role = "lifestyle"
          }

          imageManifest.push({
            fileName: file.name,
            path: file.name,
            sku,
            role,
          })

          if (!localThumbnailsBySku[sku] || role === "primary") {
            localThumbnailsBySku[sku] = URL.createObjectURL(file)
          }
        }
      }

      // 3. Send clean JSON payload (100% immune to Undici FormData multipart size & encoding crashes)
      const res = await fetch("/api/admin/catalog/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetBase64,
          spreadsheetFileName: spreadsheetFile.name,
          imageManifest,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to validate catalogue file.")
      }

      // Attach client-side local thumbnails to preview records
      if (data.validation?.previewParents) {
        data.validation.previewParents.forEach((p: any) => {
          const sku = (p.parent?.sku || "").toUpperCase()
          if (localThumbnailsBySku[sku] && p.images && p.images.length > 0) {
            p.images[0].previewUrl = localThumbnailsBySku[sku]
          }
        })
      }

      setValidationResult(data.validation)
      setErrorCsvContent(data.errorCsv || "")
      setCurrentStep("validate")
    } catch (err: any) {
      console.error("Validation error:", err)
      setErrorMessage(err.message || "An unexpected error occurred during validation.")
    } finally {
      setIsValidating(false)
    }
  }

  // =========================================================================
  // DOWNLOAD ERROR CSV REPORT
  // =========================================================================
  const handleDownloadErrorReport = () => {
    if (!errorCsvContent) return
    const blob = new Blob([errorCsvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `catalogue_validation_issues_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // =========================================================================
  // STEP 4: EXECUTE CATALOGUE IMPORT (RESILIENT CHUNKED IMAGE PIPELINE)
  // =========================================================================
  const handleExecuteImport = async () => {
    if (!spreadsheetFile) return

    setIsImporting(true)
    setCurrentStep("import")
    setErrorMessage(null)
    setImportProgress({
      percent: 5,
      stage: "Preparing catalogue upload...",
      productsProcessed: 0,
      variantsProcessed: 0,
      imagesUploaded: 0,
    })

    try {
      const spreadsheetBase64 = await fileToBase64(spreadsheetFile)
      const imageUrlsBySku: Record<string, Array<{ url: string; role: string; isPrimary: boolean }>> = {}

      // A. Extract and upload images individually/in small batches to avoid multipart payload crashes
      if (zipFile) {
        setImportProgress({
          percent: 15,
          stage: "Extracting photography from ZIP archive...",
          productsProcessed: 0,
          variantsProcessed: 0,
          imagesUploaded: 0,
        })

        const zip = await JSZip.loadAsync(zipFile)
        const entriesToUpload: Array<{ sku: string; fileName: string; role: string; entry: any }> = []

        for (const [rawPath, zipEntry] of Object.entries(zip.files)) {
          if (zipEntry.dir) continue
          const cleanPath = rawPath.replace(/^(\.\.[\/\\])+/, "")
          const ext = cleanPath.split(".").pop()?.toLowerCase() || ""
          if (!["jpg", "jpeg", "png", "webp"].includes(ext)) continue

          const parts = cleanPath.split(/[\/\\]/).filter(Boolean)
          let sku = ""
          if (parts.length >= 2) {
            const folderCandidate = parts[parts.length - 2].toUpperCase()
            if (folderCandidate !== "PRODUCTS" && folderCandidate !== "IMAGES") {
              sku = folderCandidate
            } else if (parts.length >= 3) {
              sku = parts[parts.length - 2].toUpperCase()
            }
          }
          if (!sku) {
            const fileNameOnly = parts[parts.length - 1] || ""
            const match = fileNameOnly.match(/^([A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+)/i)
            if (match) sku = match[1].toUpperCase()
          }

          if (sku) {
            const lower = cleanPath.toLowerCase()
            let role: "primary" | "secondary" | "lifestyle" = "secondary"
            if (lower.includes("01") || lower.includes("hero") || lower.includes("front") || lower.includes("primary")) {
              role = "primary"
            } else if (lower.includes("lifestyle") || lower.includes("03")) {
              role = "lifestyle"
            }
            entriesToUpload.push({
              sku,
              fileName: parts[parts.length - 1],
              role,
              entry: zipEntry,
            })
          }
        }

        let uploadedCount = 0
        for (const item of entriesToUpload) {
          try {
            const blob = await item.entry.async("blob")
            const file = new File([blob], item.fileName, { type: blob.type || "image/jpeg" })
            const form = new FormData()
            form.append("file", file)

            const uploadRes = await fetch("/api/admin/upload", {
              method: "POST",
              body: form,
            })
            const uploadData = await uploadRes.json()
            if (uploadRes.ok && uploadData.success && uploadData.url) {
              if (!imageUrlsBySku[item.sku]) imageUrlsBySku[item.sku] = []
              imageUrlsBySku[item.sku].push({
                url: uploadData.url,
                role: item.role,
                isPrimary: item.role === "primary" || imageUrlsBySku[item.sku].length === 0,
              })
              uploadedCount++
            }
          } catch (uploadErr) {
            console.warn("Image upload warning:", item.fileName, uploadErr)
          }

          const pct = Math.round(15 + (uploadedCount / Math.max(entriesToUpload.length, 1)) * 55)
          setImportProgress({
            percent: pct,
            stage: `Uploading product photography (${uploadedCount} of ${entriesToUpload.length})...`,
            productsProcessed: 0,
            variantsProcessed: 0,
            imagesUploaded: uploadedCount,
          })
        }
      } else if (looseImages.length > 0) {
        let uploadedCount = 0
        for (const file of looseImages) {
          const lower = file.name.toLowerCase()
          const ext = file.name.split(".").pop()?.toLowerCase() || ""
          if (!["jpg", "jpeg", "png", "webp"].includes(ext)) continue

          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
          const parts = nameWithoutExt.split(/[-_]/)
          let sku = ""
          if (parts.length >= 3 && parts[0].length >= 2 && parts[1].length >= 2) {
            sku = `${parts[0]}-${parts[1]}-${parts[2]}`.toUpperCase()
          } else if (parts.length >= 2) {
            sku = `${parts[0]}-${parts[1]}`.toUpperCase()
          } else {
            sku = parts[0].toUpperCase()
          }

          let role: "primary" | "secondary" | "lifestyle" = "secondary"
          if (lower.includes("front") || lower.includes("hero") || lower.includes("01") || lower.includes("primary")) {
            role = "primary"
          } else if (lower.includes("lifestyle") || lower.includes("03")) {
            role = "lifestyle"
          }

          try {
            const form = new FormData()
            form.append("file", file)
            const uploadRes = await fetch("/api/admin/upload", {
              method: "POST",
              body: form,
            })
            const uploadData = await uploadRes.json()
            if (uploadRes.ok && uploadData.success && uploadData.url) {
              if (!imageUrlsBySku[sku]) imageUrlsBySku[sku] = []
              imageUrlsBySku[sku].push({
                url: uploadData.url,
                role,
                isPrimary: role === "primary" || imageUrlsBySku[sku].length === 0,
              })
              uploadedCount++
            }
          } catch (uploadErr) {
            console.warn("Loose image upload warning:", file.name, uploadErr)
          }

          const pct = Math.round(15 + (uploadedCount / Math.max(looseImages.length, 1)) * 55)
          setImportProgress({
            percent: pct,
            stage: `Uploading product photography (${uploadedCount} of ${looseImages.length})...`,
            productsProcessed: 0,
            variantsProcessed: 0,
            imagesUploaded: uploadedCount,
          })
        }
      }

      // B. Upsert parent products and variants in database
      setImportProgress((prev) => ({
        ...prev,
        percent: 75,
        stage: "Upserting parent fragrances and creating size variants...",
      }))

      const res = await fetch("/api/admin/catalog/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetBase64,
          spreadsheetFileName: spreadsheetFile.name,
          imageUrlsBySku,
          adminEmail: "admin@snattarwala.com",
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Import failed.")
      }

      setImportProgress({
        percent: 100,
        stage: "Catalogue import completed successfully!",
        productsProcessed: data.result.successfulParents,
        variantsProcessed: data.result.successfulVariants,
        imagesUploaded: data.result.successfulImages,
      })

      setImportResult(data.result)
    } catch (err: any) {
      console.error("Import error:", err)
      setErrorMessage(err.message || "Failed to execute catalogue import.")
      setImportProgress((prev) => ({
        ...prev,
        stage: "Import halted due to an error.",
      }))
    } finally {
      setIsImporting(false)
    }
  }

  // =========================================================================
  // RESET ALL
  // =========================================================================
  const handleReset = () => {
    setCurrentStep("upload")
    setSpreadsheetFile(null)
    setZipFile(null)
    setLooseImages([])
    setValidationResult(null)
    setErrorCsvContent("")
    setErrorMessage(null)
    setImportResult(null)
    setImportProgress({
      percent: 0,
      stage: "Preparing upload...",
      productsProcessed: 0,
      variantsProcessed: 0,
      imagesUploaded: 0,
    })
  }

  const toggleParentExpand = (sku: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }))
  }

  // Filtered preview parent list
  const filteredPreviewParents = (validationResult?.previewParents || []).filter((item) => {
    const matchesSearch =
      item.parent.name.toLowerCase().includes(previewSearch.toLowerCase()) ||
      item.parent.sku.toLowerCase().includes(previewSearch.toLowerCase()) ||
      item.parent.category.toLowerCase().includes(previewSearch.toLowerCase())

    if (!matchesSearch) return false

    if (previewFilter === "READY") return item.validationStatus === "READY"
    if (previewFilter === "WARNING") return item.validationStatus === "WARNING"
    if (previewFilter === "ERROR") return item.validationStatus === "ERROR"

    return true
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" suppressHydrationWarning>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-accent mb-1">
            <span>Catalogue Management</span>
            <span>/</span>
            <span className="text-foreground/70">Bulk Product Upload</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <UploadCloud className="w-8 h-8 text-accent shrink-0" />
            Bulk Product Catalogue Upload
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Upload your Excel/CSV catalogue and product photography ZIP archive to validate, preview, and batch-import fragrances.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-sm bg-accent/10 border border-accent/40 hover:bg-accent/20 text-accent font-medium text-xs transition-colors shadow-xs"
            title="Download the standardized multi-sheet Excel catalogue template"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel Template</span>
          </button>

          <Link
            href="/admin/products/import-history"
            className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/80 border border-border/60 hover:bg-secondary text-foreground text-xs font-medium transition-colors"
          >
            <History className="w-4 h-4 text-accent" />
            <span>Import History</span>
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/80 border border-border/60 hover:bg-secondary text-foreground text-xs font-medium transition-colors"
          >
            <Package className="w-4 h-4 text-accent" />
            <span>All Products</span>
          </Link>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-card border border-border/60 rounded-sm p-4 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: "upload", label: "1. Upload Files", desc: "Spreadsheet & Images" },
            { id: "validate", label: "2. Validate Data", desc: "Integrity & Matches" },
            { id: "preview", label: "3. Preview Catalogue", desc: "Review Fragrances" },
            { id: "import", label: "4. Import Products", desc: "Batch Database Save" },
          ].map((step, idx) => {
            const stepOrder: WorkflowStep[] = ["upload", "validate", "preview", "import"]
            const currentIdx = stepOrder.indexOf(currentStep)
            const isCompleted = currentIdx > idx
            const isCurrent = currentStep === step.id

            return (
              <div
                key={step.id}
                className={`p-3 rounded-sm border transition-all ${
                  isCurrent
                    ? "bg-accent/10 border-accent text-foreground shadow-xs"
                    : isCompleted
                    ? "bg-emerald-500/5 border-emerald-500/40 text-foreground/80"
                    : "bg-background/40 border-border/40 text-foreground/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isCurrent ? "text-accent" : isCompleted ? "text-emerald-500" : "text-foreground/50"}`}>
                    {step.label}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  ) : null}
                </div>
                <p className="text-[11px] text-foreground/60">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-sm bg-destructive/10 border border-destructive/40 text-destructive flex items-start justify-between gap-3 text-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider">Catalogue Issue Detected</p>
              <p className="mt-0.5 text-xs text-destructive/90">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-destructive/70 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: UPLOAD FILES (PHASE 1)                                            */}
      {/* ========================================================================= */}
      {currentStep === "upload" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* A. SPREADSHEET UPLOAD */}
            <div className="bg-card border border-border/70 rounded-sm p-5 space-y-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-accent" />
                    <h3 className="font-heading font-bold text-base text-foreground">
                      A. Upload Catalogue Spreadsheet
                    </h3>
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">
                    Upload your product data in Excel (.xlsx) or CSV (.csv) format.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
                  Required
                </span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsSpreadsheetDragging(true)
                }}
                onDragLeave={() => setIsSpreadsheetDragging(false)}
                onDrop={handleSpreadsheetDrop}
                onClick={() => spreadsheetInputRef.current?.click()}
                className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
                  isSpreadsheetDragging
                    ? "border-accent bg-accent/10"
                    : spreadsheetFile
                    ? "border-emerald-500/60 bg-emerald-500/5"
                    : "border-border hover:border-accent/60 hover:bg-secondary/40"
                }`}
              >
                <input
                  ref={spreadsheetInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSpreadsheetFile(e.target.files[0])
                      setErrorMessage(null)
                    }
                  }}
                />

                {spreadsheetFile ? (
                  <div className="space-y-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground max-w-[280px] truncate mx-auto">
                        {spreadsheetFile.name}
                      </p>
                      <p className="text-[11px] text-foreground/50">
                        {(spreadsheetFile.size / 1024).toFixed(1)} KB • Click or drop to replace
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSpreadsheetFile(null)
                      }}
                      className="text-[11px] text-destructive hover:underline flex items-center gap-1 mx-auto mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Drag & Drop your catalogue spreadsheet here
                      </p>
                      <p className="text-[11px] text-foreground/50 mt-0.5">
                        Supports Excel (.xlsx, .xls) and CSV (.csv) up to 25MB
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-sm bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border/80 transition-colors"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
              </div>

              {/* Quick instructions pill */}
              <div className="p-3 bg-secondary/30 rounded-sm border border-border/40 text-[11px] text-foreground/70 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-accent" />
                  Spreadsheet Format:
                </p>
                <p>
                  Supports multi-sheet workbooks (Sheet 1: <strong>Parent Products</strong>, Sheet 2: <strong>Product Variants</strong>) or single consolidated sheets.
                </p>
              </div>
            </div>

            {/* B. PRODUCT IMAGES UPLOAD */}
            <div className="bg-card border border-border/70 rounded-sm p-5 space-y-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileArchive className="w-5 h-5 text-accent" />
                    <h3 className="font-heading font-bold text-base text-foreground">
                      B. Upload Product Images
                    </h3>
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">
                    Upload a ZIP archive or multiple image files matched by product SKU.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/70 font-semibold">
                  Optional
                </span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsZipDragging(true)
                }}
                onDragLeave={() => setIsZipDragging(false)}
                onDrop={handleZipDrop}
                onClick={() => zipInputRef.current?.click()}
                className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
                  isZipDragging
                    ? "border-accent bg-accent/10"
                    : zipFile
                    ? "border-emerald-500/60 bg-emerald-500/5"
                    : looseImages.length > 0
                    ? "border-accent/60 bg-accent/5"
                    : "border-border hover:border-accent/60 hover:bg-secondary/40"
                }`}
              >
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setZipFile(e.target.files[0])
                      setLooseImages([])
                      setErrorMessage(null)
                    }
                  }}
                />

                {zipFile ? (
                  <div className="space-y-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground max-w-[280px] truncate mx-auto">
                        {zipFile.name}
                      </p>
                      <p className="text-[11px] text-foreground/50">
                        {(zipFile.size / (1024 * 1024)).toFixed(2)} MB • ZIP Archive Ready
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setZipFile(null)
                      }}
                      className="text-[11px] text-destructive hover:underline flex items-center gap-1 mx-auto mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove ZIP
                    </button>
                  </div>
                ) : looseImages.length > 0 ? (
                  <div className="space-y-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {looseImages.length} Image Files Selected
                      </p>
                      <p className="text-[11px] text-foreground/50">
                        Direct multi-file upload active
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLooseImages([])
                      }}
                      className="text-[11px] text-destructive hover:underline flex items-center gap-1 mx-auto mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Images
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Drag & Drop your product images .ZIP file
                      </p>
                      <p className="text-[11px] text-foreground/50 mt-0.5">
                        Matches folders: <code>products/SKU/01-front-hero.jpg</code>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 justify-center pt-1">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-sm bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border/80 transition-colors"
                      >
                        Browse ZIP
                      </button>
                      <span className="text-[11px] text-foreground/40">or</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          looseImagesInputRef.current?.click()
                        }}
                        className="px-3 py-1.5 rounded-sm bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border/80 transition-colors"
                      >
                        Browse Loose Images
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={looseImagesInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setLooseImages(Array.from(e.target.files))
                      setZipFile(null)
                      setErrorMessage(null)
                    }
                  }}
                />
              </div>

              {/* Image Structure Guide */}
              <div className="p-3 bg-secondary/30 rounded-sm border border-border/40 text-[11px] text-foreground/70 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-accent" />
                  Recommended ZIP Structure:
                </p>
                <code className="block bg-background/80 p-2 rounded text-[10px] text-accent/90 border border-border/40 font-mono">
                  products/GLD-PER-001/01-front-hero.jpg<br />
                  products/GLD-PER-001/02-angled-view.jpg<br />
                  products/GLD-PER-001/03-lifestyle.jpg
                </code>
              </div>
            </div>

          </div>

          {/* Validation Trigger Action Bar */}
          <div className="flex items-center justify-between p-4 bg-card border border-border/60 rounded-sm shadow-xs">
            <div className="text-xs text-foreground/60">
              {spreadsheetFile ? (
                <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Ready to parse: {spreadsheetFile.name}
                  {zipFile ? ` with ${zipFile.name}` : looseImages.length > 0 ? ` with ${looseImages.length} images` : " (without images)"}
                </span>
              ) : (
                <span>Please select a catalogue spreadsheet file to proceed.</span>
              )}
            </div>

            <button
              onClick={handleValidate}
              disabled={!spreadsheetFile || isValidating}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-sm font-semibold text-xs tracking-wider uppercase transition-all shadow-sm ${
                spreadsheetFile && !isValidating
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 border border-accent/40"
                  : "bg-muted text-muted-foreground cursor-not-allowed border border-border/40"
              }`}
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                  <span>Validating Catalogue...</span>
                </>
              ) : (
                <>
                  <span>Validate & Review Catalogue</span>
                  <ArrowRight className="w-4 h-4 text-accent" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: VALIDATE DATA (PHASE 3)                                           */}
      {/* ========================================================================= */}
      {currentStep === "validate" && validationResult && (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div
            className={`p-5 rounded-sm border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              validationResult.status === "READY"
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : validationResult.status === "WARNING"
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                : "bg-destructive/10 border-destructive/40 text-destructive"
            }`}
          >
            <div className="flex items-start gap-3">
              {validationResult.status === "READY" ? (
                <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 text-emerald-500" />
              ) : validationResult.status === "WARNING" ? (
                <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-amber-500" />
              ) : (
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-destructive" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-lg text-foreground">
                    Catalogue Validation:
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      validationResult.status === "READY"
                        ? "bg-emerald-500 text-slate-950"
                        : validationResult.status === "WARNING"
                        ? "bg-amber-500 text-slate-950"
                        : "bg-destructive text-white"
                    }`}
                  >
                    {validationResult.status}
                  </span>
                </div>
                <p className="text-xs text-foreground/70 mt-1">
                  {validationResult.status === "READY"
                    ? "All parent products and variants are valid and verified. Ready to import!"
                    : validationResult.status === "WARNING"
                    ? "Some non-critical issues were detected (such as missing optional photos or secondary notes). You can proceed or fix them."
                    : "Critical issues detected (missing required fields, duplicate SKUs, or invalid prices). Review issues before importing."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {validationResult.issues.length > 0 && (
                <button
                  onClick={handleDownloadErrorReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-card border border-border/80 text-foreground text-xs font-semibold hover:border-accent transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-accent" />
                  <span>Download Error Report (CSV)</span>
                </button>
              )}
            </div>
          </div>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-card border border-border/60 rounded-sm">
              <span className="text-[11px] text-foreground/50 block">Total Parent Products</span>
              <span className="font-heading font-bold text-xl text-foreground mt-0.5 block">
                {validationResult.totalParents}
              </span>
            </div>

            <div className="p-3.5 bg-card border border-border/60 rounded-sm">
              <span className="text-[11px] text-foreground/50 block">Total Variant Rows</span>
              <span className="font-heading font-bold text-xl text-foreground mt-0.5 block">
                {validationResult.totalVariants}
              </span>
            </div>

            <div className="p-3.5 bg-card border border-border/60 rounded-sm">
              <span className="text-[11px] text-foreground/50 block">Images Detected / Matched</span>
              <span className="font-heading font-bold text-xl text-accent mt-0.5 block">
                {validationResult.matchedImages} / {validationResult.totalImagesDetected}
              </span>
            </div>

            <div className="p-3.5 bg-card border border-border/60 rounded-sm">
              <span className="text-[11px] text-foreground/50 block">Missing Images</span>
              <span className={`font-heading font-bold text-xl mt-0.5 block ${validationResult.missingImages > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {validationResult.missingImages}
              </span>
            </div>

            <div className="p-3.5 bg-card border border-border/60 rounded-sm">
              <span className="text-[11px] text-foreground/50 block">Duplicate SKUs</span>
              <span className={`font-heading font-bold text-xl mt-0.5 block ${validationResult.duplicateCount > 0 ? "text-destructive" : "text-emerald-500"}`}>
                {validationResult.duplicateCount}
              </span>
            </div>

            <div className="p-3.5 bg-card border border-border/60 rounded-sm">
              <span className="text-[11px] text-foreground/50 block">Invalid Entries (Errors)</span>
              <span className={`font-heading font-bold text-xl mt-0.5 block ${validationResult.errorCount > 0 ? "text-destructive" : "text-emerald-500"}`}>
                {validationResult.errorCount}
              </span>
            </div>

            <div className="p-3.5 bg-card border border-border/60 rounded-sm">
              <span className="text-[11px] text-foreground/50 block">Warnings</span>
              <span className="font-heading font-bold text-xl text-amber-500 mt-0.5 block">
                {validationResult.warningCount}
              </span>
            </div>

            <div className="p-3.5 bg-card border border-emerald-500/40 bg-emerald-500/5 rounded-sm">
              <span className="text-[11px] text-emerald-500 font-semibold block">Ready to Import</span>
              <span className="font-heading font-bold text-xl text-emerald-400 mt-0.5 block">
                {validationResult.readyCount}
              </span>
            </div>
          </div>

          {/* Validation Issues Table (if any) */}
          {validationResult.issues.length > 0 && (
            <div className="bg-card border border-border/60 rounded-sm overflow-hidden shadow-xs">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Validation Issues ({validationResult.issues.length})
                  </h3>
                  <p className="text-[11px] text-foreground/50">
                    Row-by-row breakdown of integrity checks and image matches
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/50 text-foreground/60 uppercase tracking-wider text-[10px] sticky top-0 border-b border-border/40">
                    <tr>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Field</th>
                      <th className="py-2.5 px-3">Issue Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {validationResult.issues.slice(0, 100).map((issue, idx) => (
                      <tr key={idx} className="hover:bg-secondary/20">
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              issue.severity === "ERROR"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-amber-500/15 text-amber-500"
                            }`}
                          >
                            {issue.severity === "ERROR" ? (
                              <AlertCircle className="w-3 h-3" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {issue.severity}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-foreground/70">{issue.rowType}</td>
                        <td className="py-2 px-3 text-foreground/50">{issue.rowNumber || "-"}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-accent">{issue.sku || "-"}</td>
                        <td className="py-2 px-3 text-foreground/70">{issue.field}</td>
                        <td className="py-2 px-3 text-foreground/80">{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-card border border-border/60 rounded-sm shadow-xs">
            <button
              onClick={() => setCurrentStep("upload")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Re-upload / Change Files</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep("preview")}
                disabled={validationResult.readyCount === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-sm font-semibold text-xs tracking-wider uppercase transition-all shadow-sm ${
                  validationResult.readyCount > 0
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 border border-accent/40"
                    : "bg-muted text-muted-foreground cursor-not-allowed border border-border/40"
                }`}
              >
                <span>Continue to Catalogue Preview</span>
                <ArrowRight className="w-4 h-4 text-accent" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: PREVIEW CATALOGUE (PHASE 4)                                       */}
      {/* ========================================================================= */}
      {currentStep === "preview" && validationResult && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="p-4 bg-card border border-border/60 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-foreground/40 shrink-0" />
              <input
                type="text"
                placeholder="Search preview by fragrance name or SKU..."
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-sm py-1.5 px-3 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-foreground/50">Filter:</span>
              {(["ALL", "READY", "WARNING", "ERROR"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPreviewFilter(filter)}
                  className={`px-2.5 py-1 rounded-sm text-xs font-semibold transition-colors ${
                    previewFilter === filter
                      ? "bg-accent text-slate-950"
                      : "bg-secondary text-foreground/70 hover:bg-secondary/80"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Fragrances Preview Table */}
          <div className="bg-card border border-border/60 rounded-sm overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Catalogue Preview ({filteredPreviewParents.length} Fragrances)
                </h3>
                <p className="text-[11px] text-foreground/50">
                  Review parent products, bottle variants, and matched images before committing to database
                </p>
              </div>

              <span className="text-xs text-accent font-semibold">
                Import Mode: Saved as Draft
              </span>
            </div>

            <div className="divide-y divide-border/40">
              {filteredPreviewParents.length === 0 ? (
                <div className="p-8 text-center text-foreground/40 text-xs">
                  No fragrance records match the selected filter.
                </div>
              ) : (
                filteredPreviewParents.map(({ parent, variants, images, validationStatus, issues }) => {
                  const isExpanded = !!expandedParents[parent.sku]

                  return (
                    <div key={parent.sku} className="p-4 transition-colors hover:bg-secondary/10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-start gap-3.5">
                          {/* Image preview */}
                          <div className="w-14 h-14 rounded-sm border border-border/60 bg-secondary/50 overflow-hidden flex items-center justify-center shrink-0">
                            {images.length > 0 && images[0].previewUrl ? (
                              <img
                                src={images[0].previewUrl}
                                alt={parent.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-foreground/30" />
                            )}
                          </div>

                          {/* Fragrance Meta */}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-heading font-bold text-sm text-foreground">
                                {parent.name}
                              </h4>
                              <span className="font-mono text-[11px] text-accent font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                                {parent.sku}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/70">
                                {parent.category}
                              </span>
                              {parent.gender && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/70">
                                  {parent.gender}
                                </span>
                              )}
                            </div>

                            {/* Olfactory Notes Pill */}
                            <div className="flex items-center gap-1.5 text-[11px] text-foreground/60 mt-1 flex-wrap">
                              {parent.topNotes && <span>Top: <strong className="text-foreground/80">{parent.topNotes}</strong></span>}
                              {parent.heartNotes && <span>• Heart: <strong className="text-foreground/80">{parent.heartNotes}</strong></span>}
                              {parent.baseNotes && <span>• Base: <strong className="text-foreground/80">{parent.baseNotes}</strong></span>}
                            </div>

                            {/* Images and Variants Count */}
                            <div className="flex items-center gap-3 text-[11px] text-foreground/50 mt-1">
                              <span>{variants.length} Bottle Variant(s)</span>
                              <span>•</span>
                              <span>{images.length} Image(s) Matched</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Status & Expand Button */}
                        <div className="flex items-center gap-3 justify-between md:justify-end">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              validationStatus === "READY"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : validationStatus === "WARNING"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-destructive/15 text-destructive border border-destructive/30"
                            }`}
                          >
                            {validationStatus}
                          </span>

                          <button
                            onClick={() => toggleParentExpand(parent.sku)}
                            className="flex items-center gap-1 text-xs text-foreground/60 hover:text-accent font-medium px-2.5 py-1 rounded border border-border/50 transition-colors"
                          >
                            <span>{isExpanded ? "Hide Details" : "View Variants"}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Variants & Images Subtable */}
                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-border/40 space-y-3 bg-secondary/15 p-3 rounded-sm">
                          {/* Bottle Variants Table */}
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/60 block mb-1.5">
                              Associated Bottle Variants ({variants.length})
                            </span>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-background/80 text-[10px] uppercase text-foreground/50 border-b border-border/40">
                                  <tr>
                                    <th className="py-1.5 px-2">Variant SKU</th>
                                    <th className="py-1.5 px-2">Size</th>
                                    <th className="py-1.5 px-2">Bottle Type</th>
                                    <th className="py-1.5 px-2">Price (₹)</th>
                                    <th className="py-1.5 px-2">MRP (₹)</th>
                                    <th className="py-1.5 px-2">Stock</th>
                                    <th className="py-1.5 px-2">Default</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                  {variants.map((v, vIdx) => (
                                    <tr key={vIdx} className="hover:bg-background/50">
                                      <td className="py-1.5 px-2 font-mono text-accent">{v.variantSku}</td>
                                      <td className="py-1.5 px-2 font-semibold text-foreground">{v.size}</td>
                                      <td className="py-1.5 px-2 text-foreground/70">{v.bottleType}</td>
                                      <td className="py-1.5 px-2 font-bold text-foreground">₹{v.price}</td>
                                      <td className="py-1.5 px-2 text-foreground/50">
                                        {v.compareAtPrice ? `₹${v.compareAtPrice}` : "-"}
                                      </td>
                                      <td className="py-1.5 px-2 text-foreground/80">{v.stock} units</td>
                                      <td className="py-1.5 px-2">
                                        {v.isDefault ? (
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">
                                            Default
                                          </span>
                                        ) : (
                                          <span className="text-foreground/30">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Matched Images */}
                          {images.length > 0 && (
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/60 block mb-1.5">
                                Matched Product Photography ({images.length})
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                {images.map((img, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    className="flex items-center gap-1.5 p-1.5 rounded bg-background/80 border border-border/50 text-[11px]"
                                  >
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent uppercase">
                                      {img.role}
                                    </span>
                                    <span className="text-foreground/80 truncate max-w-[150px]">{img.fileName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Item issues if any */}
                          {issues.length > 0 && (
                            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-400 space-y-1">
                              {issues.map((iss, iIdx) => (
                                <p key={iIdx} className="flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{iss.message}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-card border border-border/60 rounded-sm shadow-xs">
            <button
              onClick={() => setCurrentStep("validate")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Validation</span>
            </button>

            <button
              onClick={handleExecuteImport}
              className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-accent text-slate-950 font-bold text-xs tracking-wider uppercase hover:bg-accent/90 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Execute Catalogue Import ({validationResult.readyCount} Fragrances)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: IMPORT EXECUTION & LIVE PROGRESS (PHASE 5 & 6)                    */}
      {/* ========================================================================= */}
      {currentStep === "import" && (
        <div className="space-y-6">
          {/* Progress / Completion Card */}
          <div className="bg-card border border-border/60 rounded-sm p-6 space-y-6 shadow-xs">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <div className="w-14 h-14 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto shadow-inner">
                {isImporting ? (
                  <RefreshCw className="w-7 h-7 animate-spin" />
                ) : importResult ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-destructive" />
                )}
              </div>

              <h2 className="font-heading font-bold text-2xl text-foreground">
                {isImporting
                  ? "Importing Catalogue into Database..."
                  : importResult
                  ? "Catalogue Import Completed"
                  : "Import Failed"}
              </h2>

              <p className="text-xs text-foreground/60">{importProgress.stage}</p>
            </div>

            {/* Live Progress Bar */}
            <div className="max-w-xl mx-auto space-y-2">
              <div className="flex items-center justify-between text-xs text-foreground/70 font-semibold">
                <span>Progress</span>
                <span>{importProgress.percent}%</span>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden border border-border/40">
                <div
                  className="h-full bg-gradient-to-r from-accent via-amber-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${importProgress.percent}%` }}
                />
              </div>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
              <div className="p-3 bg-secondary/30 rounded-sm border border-border/40 text-center">
                <span className="text-[10px] text-foreground/50 block">Fragrances Processed</span>
                <span className="font-heading font-bold text-lg text-foreground mt-0.5 block">
                  {importResult ? importResult.successfulParents : validationResult?.readyCount || 0}
                </span>
              </div>

              <div className="p-3 bg-secondary/30 rounded-sm border border-border/40 text-center">
                <span className="text-[10px] text-foreground/50 block">Variants Saved</span>
                <span className="font-heading font-bold text-lg text-foreground mt-0.5 block">
                  {importResult ? importResult.successfulVariants : validationResult?.totalVariants || 0}
                </span>
              </div>

              <div className="p-3 bg-secondary/30 rounded-sm border border-border/40 text-center">
                <span className="text-[10px] text-foreground/50 block">Photos Uploaded</span>
                <span className="font-heading font-bold text-lg text-accent mt-0.5 block">
                  {importResult ? importResult.successfulImages : validationResult?.matchedImages || 0}
                </span>
              </div>

              <div className="p-3 bg-secondary/30 rounded-sm border border-border/40 text-center">
                <span className="text-[10px] text-foreground/50 block">Failed Records</span>
                <span className={`font-heading font-bold text-lg mt-0.5 block ${importResult && importResult.failedCount > 0 ? "text-destructive" : "text-emerald-500"}`}>
                  {importResult ? importResult.failedCount : 0}
                </span>
              </div>
            </div>

            {/* Safety Guarantee Callout */}
            <div className="p-3 bg-accent/10 border border-accent/30 rounded-sm max-w-2xl mx-auto text-xs text-foreground/80 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-accent">Safe Draft Import Guarantee:</p>
                <p className="text-[11px] text-foreground/70 mt-0.5">
                  All imported fragrances are securely saved with status <strong>Draft</strong> (inactive). They will not be visible on the customer storefront until an admin reviews and publishes them.
                </p>
              </div>
            </div>

            {/* Completion Actions */}
            {importResult && (
              <div className="flex items-center justify-center gap-3 flex-wrap pt-4 border-t border-border/40">
                <Link
                  href="/admin/products"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-primary-foreground font-semibold text-xs tracking-wider uppercase hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Package className="w-4 h-4 text-accent" />
                  <span>View in Product Manager</span>
                </Link>

                <Link
                  href="/admin/products/import-history"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-secondary text-foreground font-medium text-xs hover:bg-secondary/80 border border-border/60 transition-colors"
                >
                  <History className="w-4 h-4 text-accent" />
                  <span>View Import History</span>
                </Link>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-secondary text-foreground font-medium text-xs hover:bg-secondary/80 border border-border/60 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Start Another Import</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
