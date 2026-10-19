"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Grid, ShoppingBag, User } from "lucide-react"
import { useCart } from "@/hooks/use-cart"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { cartCount, setIsCartOpen } = useCart()

  const navItems = [
    {
      label: "Home",
      icon: Home,
      href: "/",
      isActive: pathname === "/",
    },
    {
      label: "Collections",
      icon: Grid,
      href: "/shop",
      isActive: pathname === "/shop" || pathname.startsWith("/product/"),
    },
    {
      label: "Account",
      icon: User,
      href: "/account",
      isActive: pathname.startsWith("/account") || pathname === "/login",
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                item.isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide uppercase">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-wide uppercase">Cart</span>
        </button>
      </div>
    </div>
  )
}
