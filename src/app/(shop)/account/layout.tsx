"use client"

import { Container } from "@/components/layout/container"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { User, ShoppingBag, Heart, RotateCcw, MessageSquare, LogOut, MessageCircle } from "lucide-react"

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const navItems = [
    { name: "Dashboard", href: "/account", icon: User },
    { name: "My Orders", href: "/account/orders", icon: ShoppingBag },
    { name: "Wishlist", href: "/account/wishlist", icon: Heart },
    { name: "Returns & Refunds", href: "/account/returns", icon: RotateCcw },
    { name: "Support", href: "/account/support", icon: MessageSquare },
  ]

  return (
    <div className="py-12 bg-background min-h-[80vh]">
      <Container>
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <h1 className="font-heading text-2xl font-bold mb-8">My Account</h1>
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors ${
                      isActive 
                        ? "bg-secondary text-foreground font-medium" 
                        : "text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                )
              })}
              
              {/* WhatsApp Quick Help */}
              <a
                href="https://wa.me/919082377314?text=Hello! I need help with my order."
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors text-emerald-700 hover:bg-emerald-500/10 mt-2"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm">WhatsApp Support</span>
              </a>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors text-destructive/80 hover:bg-destructive/10 hover:text-destructive text-left mt-4"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </nav>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </Container>
    </div>
  )
}

