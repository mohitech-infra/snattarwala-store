"use client"

import { useState, useRef, useEffect } from "react"
import { Download, FileSpreadsheet, FileCode, Printer, ChevronDown } from "lucide-react"
import { exportToCSV, exportToJSON, printData } from "@/lib/export-utils"

interface ExportMenuProps {
  filename: string
  title?: string
  data: Record<string, any>[]
  headers?: string[]
  printRows?: (string | number)[][]
  buttonLabel?: string
  className?: string
}

export function ExportMenu({
  filename,
  title,
  data,
  headers,
  printRows,
  buttonLabel = "Export",
  className = ""
}: ExportMenuProps) {
  const displayTitle = title || (filename ? filename.replace(/[_-]/g, " ").toUpperCase() : "ATTARWALA EXPORT")
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCSV = () => {
    setIsOpen(false)
    exportToCSV(filename, data)
  }

  const handleJSON = () => {
    setIsOpen(false)
    exportToJSON(filename, data)
  }

  const handlePrint = () => {
    setIsOpen(false)
    if (headers && printRows) {
      printData(displayTitle, headers, printRows)
    } else if (data.length > 0) {
      const derivedHeaders = Object.keys(data[0])
      const derivedRows = data.map(item => derivedHeaders.map(h => item[h]))
      printData(displayTitle, derivedHeaders, derivedRows)
    }
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 border border-border rounded-sm text-xs font-semibold uppercase tracking-wider hover:border-accent hover:text-accent transition-colors flex items-center gap-2 bg-card text-foreground shadow-sm"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download className="w-3.5 h-3.5 text-accent" />
        <span>{buttonLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border shadow-xl rounded-sm py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground/40 border-b border-border/40 mb-1">
            Export {title}
          </div>
          
          <button
            onClick={handleCSV}
            className="w-full text-left px-3 py-2 text-xs hover:bg-secondary flex items-center gap-2.5 text-foreground/80 hover:text-foreground transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="font-medium">Download CSV (.csv)</p>
              <p className="text-[10px] text-foreground/50">Excel, Google Sheets compatible</p>
            </div>
          </button>

          <button
            onClick={handleJSON}
            className="w-full text-left px-3 py-2 text-xs hover:bg-secondary flex items-center gap-2.5 text-foreground/80 hover:text-foreground transition-colors"
          >
            <FileCode className="w-4 h-4 text-blue-500" />
            <div>
              <p className="font-medium">Download JSON (.json)</p>
              <p className="text-[10px] text-foreground/50">Raw structured data</p>
            </div>
          </button>

          <button
            onClick={handlePrint}
            className="w-full text-left px-3 py-2 text-xs hover:bg-secondary flex items-center gap-2.5 text-foreground/80 hover:text-foreground transition-colors border-t border-border/30 mt-1"
          >
            <Printer className="w-4 h-4 text-accent" />
            <div>
              <p className="font-medium">Print / Save as PDF</p>
              <p className="text-[10px] text-foreground/50">Formatted printable view</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
