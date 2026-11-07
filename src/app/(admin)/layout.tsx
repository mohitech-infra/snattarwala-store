"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { AIChatDrawer } from "@/components/admin/ai-chat-drawer"
import { OmniSearchModal } from "@/components/admin/omni-search-modal"
import { usePathname } from "next/navigation"

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [timeRange, setTimeRange] = useState("30 Days")
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-slate-950">
        {children}
      </div>
    )
  }

  return (
    <div suppressHydrationWarning className="h-screen flex bg-background text-foreground overflow-hidden selection:bg-accent selection:text-slate-950">
      
      {/* Desktop Sidebar */}
      <div suppressHydrationWarning className="hidden lg:block shrink-0 h-full">
        <AdminSidebar onOpenAI={() => setIsAIOpen(true)} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div suppressHydrationWarning className="fixed inset-0 z-50 lg:hidden">
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-72 bg-card h-full animate-in slide-in-from-left duration-200 shadow-2xl">
              <AdminSidebar 
                onCloseMobile={() => setIsMobileSidebarOpen(false)} 
                onOpenAI={() => {
                  setIsMobileSidebarOpen(false)
                  setIsAIOpen(true)
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div suppressHydrationWarning className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto custom-scrollbar" data-lenis-prevent>
        <AdminHeader 
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAI={() => setIsAIOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
        />

        <main suppressHydrationWarning className="flex-1 p-6 md:p-8 lg:p-10 max-w-[1600px] w-full mx-auto space-y-8">
          {children}
        </main>
      </div>

      {/* Interactive AI Advisor Drawer */}
      <AIChatDrawer 
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />

      {/* Omni Search Dialog */}
      <OmniSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  )
}
