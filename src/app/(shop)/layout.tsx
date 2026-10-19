import { OfferBar } from "@/components/layout/offer-bar"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <OfferBar />
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
