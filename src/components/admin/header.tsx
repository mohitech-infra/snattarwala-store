"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  Search, 
  Sparkles, 
  Bell, 
  Store, 
  Menu, 
  ChevronDown, 
  Check, 
  AlertTriangle, 
  ShoppingBag, 
  Clock, 
  ShieldCheck, 
  LogOut,
  SlidersHorizontal,
  ExternalLink,
  RefreshCw,
  Trash2
} from "lucide-react"

import {
  getAdminNotifications,
  markAllAdminNotificationsRead,
  markAdminNotificationRead,
  clearReadAdminNotifications,
  AdminNotification
} from "@/lib/admin-service"

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenAI: () => void;
  onOpenSearch: () => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
}

export function AdminHeader({ 
  onOpenMobileSidebar, 
  onOpenAI, 
  onOpenSearch,
  timeRange,
  setTimeRange
}: HeaderProps) {
  const router = useRouter()
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)

  const loadNotifs = async () => {
    setLoadingNotifs(true)
    const data = await getAdminNotifications()
    setNotifications(data)
    setLoadingNotifs(false)
  }

  useEffect(() => {
    loadNotifs()
    const interval = setInterval(loadNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    await markAllAdminNotificationsRead()
  }

  const handleNotificationClick = async (n: AdminNotification) => {
    if (n.unread) {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item))
      await markAdminNotificationRead(n.id)
    }
    setIsNotifOpen(false)
    const titleLower = n.title.toLowerCase()
    const descLower = n.desc.toLowerCase()

    if (n.type === 'order' || titleLower.includes('order') || descLower.includes('order')) {
      router.push('/admin/orders')
    } else if (n.type === 'warning' || titleLower.includes('stock') || descLower.includes('inventory')) {
      router.push('/admin/inventory')
    } else if (titleLower.includes('return') || descLower.includes('return')) {
      router.push('/admin/returns')
    } else if (titleLower.includes('ticket') || titleLower.includes('support')) {
      router.push('/admin/support')
    } else if (titleLower.includes('review')) {
      router.push('/admin/reviews')
    }
  }

  const handleClearRead = async () => {
    setNotifications(prev => prev.filter(n => n.unread))
    await clearReadAdminNotifications()
  }

  const timeOptions = [
    { label: "Today", value: "Today" },
    { label: "Yesterday", value: "Yesterday" },
    { label: "Last 7 Days", value: "7 Days" },
    { label: "Last 30 Days", value: "30 Days" },
    { label: "This Year (2026)", value: "This Year" },
    { label: "Custom Range...", value: "Custom" }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header suppressHydrationWarning className="h-20 bg-card border-b border-border/50 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md bg-card/95">
      {/* Left: Mobile Toggle & Global Search */}
      <div suppressHydrationWarning className="flex items-center space-x-4 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-sm border border-border text-foreground hover:bg-secondary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div 
          suppressHydrationWarning
          onClick={onOpenSearch}
          className="relative w-full max-w-md cursor-pointer group"
        >
          <div suppressHydrationWarning className="flex items-center w-full bg-background border border-border/70 group-hover:border-accent rounded-sm py-2.5 pl-10 pr-4 text-xs text-foreground/60 transition-all shadow-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 group-hover:text-accent transition-colors" />
            <span className="truncate">Search products, orders, customers, SKUs...</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-secondary px-2 py-0.5 rounded border border-border text-foreground/60">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Actions, Filters, AI & Profile */}
      <div className="flex items-center space-x-3 md:space-x-4">
        
        {/* Time Selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
            className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider border border-border px-3.5 py-2.5 rounded-sm hover:border-accent hover:bg-accent/5 transition-all text-foreground"
          >
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-1" />
          </button>

          {isTimeDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border shadow-xl rounded-sm py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {timeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTimeRange(opt.value)
                    setIsTimeDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-secondary flex items-center justify-between transition-colors"
                >
                  <span className={timeRange === opt.value ? "font-semibold text-accent" : "text-foreground/80"}>
                    {opt.label}
                  </span>
                  {timeRange === opt.value && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Advisor Button */}
        <button
          onClick={onOpenAI}
          className="relative inline-flex items-center space-x-2 px-4 py-2.5 rounded-sm bg-gradient-to-r from-accent via-amber-400 to-accent text-slate-950 text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
        >
          <Sparkles className="w-4 h-4 fill-slate-950 animate-pulse" />
          <span className="hidden sm:inline">Ask AI Advisor</span>
          <span className="sm:hidden">AI</span>
        </button>

        {/* Storefront Link */}
        <Link
          href="/"
          target="_blank"
          title="Preview Live Storefront"
          className="hidden sm:flex items-center justify-center p-2.5 rounded-sm border border-border text-foreground/70 hover:text-accent hover:border-accent transition-colors"
        >
          <Store className="w-4 h-4" />
        </Link>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2.5 rounded-sm border border-border text-foreground/70 hover:text-accent hover:border-accent transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-card animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border shadow-2xl rounded-sm p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider">Alerts & Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadNotifs}
                    disabled={loadingNotifs}
                    className="p-1 text-foreground/50 hover:text-accent transition-colors"
                    title="Refresh notifications"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingNotifs ? "animate-spin text-accent" : ""}`} />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-accent font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Bell className="w-6 h-6 text-foreground/30 mx-auto" />
                    <p className="text-xs text-foreground/50">No notifications yet</p>
                    <p className="text-[10px] text-foreground/40">New orders, returns, and inventory alerts will appear here.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 rounded-sm border transition-all text-left cursor-pointer ${
                        n.unread
                          ? "bg-accent/5 border-accent/40 hover:bg-accent/10"
                          : "bg-secondary/20 border-border/40 hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          {n.type === 'order' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                          {n.type === 'info' && <Bell className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                          {n.type === 'ai' && <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />}
                          <h5 className={`text-xs leading-snug ${n.unread ? 'font-bold text-foreground' : 'font-semibold text-foreground/75'}`}>
                            {n.title}
                          </h5>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {n.unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          )}
                          <span className="text-[9px] text-foreground/40">{n.time}</span>
                        </div>
                      </div>
                      <p className={`text-[11px] mt-1 leading-relaxed ${n.unread ? 'text-foreground/90 font-medium' : 'text-foreground/60'}`}>
                        {n.desc}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {notifications.some(n => !n.unread) && (
                <div className="pt-3 border-t border-border/50 mt-3 flex items-center justify-between text-[10px]">
                  <span className="text-foreground/40">{notifications.length} total</span>
                  <button
                    onClick={handleClearRead}
                    className="text-foreground/50 hover:text-rose-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear read alerts</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Owner Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-sm hover:bg-secondary transition-colors"
          >
            <div className="w-9 h-9 rounded-sm bg-primary text-primary-foreground border border-accent/40 flex items-center justify-center font-heading font-bold text-xs shadow-sm">
              SNA
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-heading font-bold text-foreground leading-tight">SN Attarwala</p>
              <p className="text-[10px] text-accent uppercase tracking-widest font-semibold">Store Owner</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 hidden lg:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border shadow-2xl rounded-sm p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="pb-3 border-b border-border/50 mb-2">
                <p className="text-xs font-semibold text-foreground">SN Attarwala</p>
                <p className="text-[10px] text-foreground/50">owner@snattarwala.in</p>
                <span className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent/15 text-accent border border-accent/30 text-[9px] font-semibold uppercase tracking-wider rounded-sm">
                  <ShieldCheck className="w-3 h-3" /> Full Administrator Access
                </span>
              </div>
              <div className="space-y-1">
                <Link
                  href="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs rounded-sm hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Store Settings</span>
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-sm hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Store className="w-3.5 h-3.5" />
                    <span>View Customer Store</span>
                  </div>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </Link>
                <button
                  onClick={async () => {
                    setIsProfileOpen(false)
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push("/admin/login")
                    router.refresh()
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs rounded-sm hover:bg-destructive/10 text-destructive font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
