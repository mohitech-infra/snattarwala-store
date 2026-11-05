"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Boxes, 
  ShoppingCart, 
  RotateCcw,
  Users, 
  Star, 
  Heart, 
  ShoppingCart as CartIcon,
  TicketPercent, 
  Megaphone, 
  MessageSquareShare, 
  LayoutTemplate, 
  Image as ImageIcon,
  BarChart3, 
  Truck, 
  CreditCard, 
  LifeBuoy, 
  ShieldAlert, 
  ScrollText, 
  Settings, 
  Store,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Briefcase
} from "lucide-react"

interface SidebarProps {
  onCloseMobile?: () => void;
  onOpenAI: () => void;
}

import { createClient } from "@/lib/supabase/client"
import { getAdminSidebarCounts } from "@/lib/admin-service"
import { useEffect, useState } from "react"

export function AdminSidebar({ onCloseMobile, onOpenAI }: SidebarProps) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>("customer")
  const [counts, setCounts] = useState<{
    products: number;
    lowStock: number;
    pendingOrders: number;
    abandonedCarts: number;
    customers: number;
    pendingReviews: number;
    activeCoupons: number;
    wholesaleLeads: number;
  }>({
    products: 0,
    lowStock: 0,
    pendingOrders: 0,
    abandonedCarts: 0,
    customers: 0,
    pendingReviews: 0,
    activeCoupons: 0,
    wholesaleLeads: 0
  })

  useEffect(() => {
    const fetchRoleAndCounts = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile) setUserRole(profile.role)
      }

      // Fetch live sidebar counters
      try {
        const liveCounts = await getAdminSidebarCounts()
        setCounts(liveCounts)
      } catch (err) {
        console.error("Failed to load sidebar counts", err)
      }
    }
    fetchRoleAndCounts()
  }, [])

  const allNavSections = [
    {
      title: "OVERVIEW",
      items: [
        { name: "Executive Dashboard", href: "/admin", icon: LayoutDashboard }
      ],
      allowedRoles: ["admin", "store_manager"]
    },
    {
      title: "SHOP MANAGEMENT",
      items: [
        { 
          name: "Products", 
          href: "/admin/products", 
          icon: Package, 
          badge: counts.products > 0 ? String(counts.products) : undefined 
        },
        { name: "Categories", href: "/admin/categories", icon: FolderTree },
        { 
          name: "Inventory", 
          href: "/admin/inventory", 
          icon: Boxes, 
          badge: counts.lowStock > 0 ? `${counts.lowStock} Low` : undefined, 
          badgeColor: "text-amber-500 bg-amber-500/10" 
        },
        { 
          name: "Orders", 
          href: "/admin/orders", 
          icon: ShoppingCart, 
          badge: counts.pendingOrders > 0 ? `${counts.pendingOrders} New` : undefined, 
          badgeColor: "text-emerald-500 bg-emerald-500/10" 
        },
        { name: "Returns & Refunds", href: "/admin/returns", icon: RotateCcw }
      ],
      allowedRoles: ["admin", "store_manager"]
    },
    {
      title: "B2B & WHOLESALE",
      items: [
        { 
          name: "Wholesale Leads", 
          href: "/admin/wholesale", 
          icon: Briefcase,
          badge: counts.wholesaleLeads > 0 ? `${counts.wholesaleLeads} New` : undefined,
          badgeColor: "text-amber-500 bg-amber-500/10"
        }
      ],
      allowedRoles: ["admin", "store_manager"]
    },
    {
      title: "CUSTOMERS & CRM",
      items: [
        { 
          name: "Customers", 
          href: "/admin/customers", 
          icon: Users, 
          badge: counts.customers > 0 ? String(counts.customers) : undefined 
        },
        { 
          name: "Reviews", 
          href: "/admin/reviews", 
          icon: Star, 
          badge: counts.pendingReviews > 0 ? `${counts.pendingReviews} New` : undefined,
          badgeColor: "text-amber-400 bg-amber-400/10"
        },
        { name: "Wishlist & Trends", href: "/admin/wishlist", icon: Heart },
        { 
          name: "Abandoned Carts", 
          href: "/admin/abandoned-carts", 
          icon: CartIcon, 
          badge: counts.abandonedCarts > 0 ? String(counts.abandonedCarts) : undefined, 
          badgeColor: "text-rose-500 bg-rose-500/10" 
        }
      ],
      allowedRoles: ["admin", "store_manager"]
    },
    {
      title: "MARKETING & GROWTH",
      items: [
        { 
          name: "Coupons & Discounts", 
          href: "/admin/coupons", 
          icon: TicketPercent,
          badge: counts.activeCoupons > 0 ? `${counts.activeCoupons} Active` : undefined,
          badgeColor: "text-accent bg-accent/10"
        }
      ],
      allowedRoles: ["admin"]
    },
    {
      title: "WEBSITE & CONTENT",
      items: [
        { name: "Homepage Builder", href: "/admin/content", icon: LayoutTemplate },
        { name: "Media Library", href: "/admin/media", icon: ImageIcon }
      ],
      allowedRoles: ["admin"]
    },
    {
      title: "INTELLIGENCE & METRICS",
      items: [
        { name: "Deep Analytics", href: "/admin/analytics", icon: BarChart3 }
      ],
      allowedRoles: ["admin"]
    },
    {
      title: "OPERATIONS & LOGISTICS",
      items: [
        { name: "Shipping & Courier", href: "/admin/shipping", icon: Truck },
        { name: "Payments & Gateway", href: "/admin/payments", icon: CreditCard },
        { name: "Support Tickets", href: "/admin/support", icon: LifeBuoy }
      ],
      allowedRoles: ["admin", "store_manager"]
    },
    {
      title: "SYSTEM & GOVERNANCE",
      items: [
        { name: "Team & Roles", href: "/admin/team", icon: Users },
        { name: "Audit Trail", href: "/admin/audit-logs", icon: ScrollText },
        { name: "Store Settings", href: "/admin/settings", icon: Settings }
      ],
      allowedRoles: ["admin"]
    }
  ]

  const navSections = allNavSections.filter(section => section.allowedRoles.includes(userRole))

  return (
    <aside className="w-72 bg-card border-r border-border/50 flex flex-col shrink-0 h-full overflow-hidden select-none">
      {/* Brand Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-background/50 flex items-center justify-between">
        <Link href="/admin" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded-sm bg-primary text-primary-foreground border border-accent/40 flex items-center justify-center font-heading font-bold text-sm shadow-[0_0_15px_rgba(212,175,55,0.25)] group-hover:border-accent transition-colors">
            AW
          </div>
          <div>
            <span className="font-heading font-bold text-sm tracking-[0.2em] uppercase text-foreground block">
              ATTARWALA
            </span>
            <span className="text-[9px] uppercase tracking-widest text-accent font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Owner Control Center
            </span>
          </div>
        </Link>
      </div>

      {/* Quick AI Trigger Card */}
      <div className="px-3 py-2 border-b border-border/30 bg-accent/5">
        <button
          onClick={onOpenAI}
          className="w-full px-3 py-2 rounded-sm bg-gradient-to-r from-accent/15 via-accent/10 to-transparent border border-accent/30 hover:border-accent flex items-center justify-between text-left transition-all duration-300 group"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-sm bg-accent text-slate-950 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] font-heading font-bold text-foreground group-hover:text-accent transition-colors">
              Attarwala AI Advisor
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-accent transform group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain py-2 px-2 space-y-3 custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <h4 className="px-2 text-[9px] font-bold tracking-widest text-foreground/35 uppercase mb-1 pt-1">
              {section.title}
            </h4>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin")
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-sm text-[11px] font-medium transition-all group ${
                    isActive
                      ? "bg-primary text-primary-foreground border-l-2 border-accent shadow-sm"
                      : "text-foreground/75 hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? "text-accent" : "text-foreground/50 group-hover:text-accent"}`} />
                    <span className="tracking-wide leading-none">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${item.badgeColor || (isActive ? "bg-accent/20 text-accent" : "bg-secondary text-foreground/60")}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer / Storefront Link */}
      <div className="px-3 py-2.5 border-t border-border/50 bg-background/40">
        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-sm border border-border/60 bg-secondary/30 text-[11px] font-medium text-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Store className="w-3.5 h-3.5 text-accent" />
            <span className="uppercase tracking-widest text-[10px] font-semibold">Live Storefront</span>
          </div>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>
        <div className="mt-1.5 px-1 flex items-center justify-between text-[9px] text-foreground/40">
          <span>Version 2.4 PRO</span>
          <span className="text-emerald-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Mumbai Server OK
          </span>
        </div>
      </div>
    </aside>
  )
}
