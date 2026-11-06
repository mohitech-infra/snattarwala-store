import { Container } from "@/components/layout/container"
import { Scale, FileCheck, HelpCircle } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Terms & Conditions | SN AttarWala",
  description: "Terms and conditions of sale, pricing in INR, authentic product guarantees, and governing jurisdiction for SN AttarWala Mumbai.",
}

export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen py-16 md:py-24">
      <Container>
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">Legal Agreement</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold">Terms of Service</h1>
          <p className="text-foreground/70 text-base md:text-lg leading-relaxed">
            Please review these terms and conditions carefully before placing an order on snattarwala.in.
          </p>
          <p className="text-xs text-foreground/50">Effective Date: November 2026</p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto space-y-10 text-foreground/80 leading-relaxed text-sm md:text-base">
          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">1. Introduction & General Agreement</h2>
            <p>
              This website (<strong>snattarwala.in</strong>) is owned and operated by <strong>SN AttarWala</strong>, having its flagship premises in Mumbai, Maharashtra, India. By accessing our site, browsing our fragrance collections, or purchasing any product, you agree to be bound by these Terms of Service and our associated <Link href="/privacy" className="text-accent underline">Privacy Policy</Link> and <Link href="/shipping" className="text-accent underline">Shipping & Return Policy</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">2. Authentic Artisanal Products & Natural Variations</h2>
            <p>
              SN AttarWala specializes in pure attars, oriental perfume oils, luxury Eau De Parfum sprays, and artisanal bakhoor. Our products incorporate natural botanical extracts, natural sandalwood, agarwood (oudh), rose, and rare aromatics:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/75">
              <li>Because natural essential oils are harvested across different seasons, minor vintage variations in colour, density, or top-note evolution may naturally occur.</li>
              <li>Product imagery displayed on the website accurately depicts our custom bottle designs, flacons, caps, and packaging. Minor design enhancements to flacons or atomizers may be introduced periodically.</li>
              <li>Every variant bottle size (e.g. 3ml, 6ml, 12ml, 24ml, 50ml, 100ml) is filled strictly according to stated metric volume.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">3. Pricing and Currency</h2>
            <p>
              All prices displayed on <strong>snattarwala.in</strong> are stated in <strong>Indian National Rupees (INR, ₹)</strong>. Prices are inclusive of all applicable Goods and Services Tax (GST).
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/75">
              <li>Prices are subject to revision without prior notice, but price updates will not impact previously placed and confirmed orders.</li>
              <li>In the rare event of a typographical or technical pricing error, we reserve the right to cancel affected orders and issue an immediate 100% refund.</li>
              <li>Shipping charges are calculated at checkout based on our published shipping policy (orders ₹999 and above receive complimentary shipping across India).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">4. Orders, Payment & Fulfillment</h2>
            <p>
              Upon completing checkout, you will receive an electronic confirmation containing your unique Order ID. We accept online payments through credit/debit cards, UPI, net banking, and Cash on Delivery (where available). Order dispatch occurs upon payment verification or COD confirmation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">5. Intellectual Property Rights</h2>
            <p>
              All materials on this website, including but not limited to brand logos, product names, bottle photographs, descriptive literature, site layout, and software scripts, are the exclusive intellectual property of SN AttarWala. Any unauthorized duplication, reproduction, or commercial exploitation is strictly prohibited under Indian copyright and trademark law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">6. Limitation of Liability</h2>
            <p>
              SN AttarWala shall not be held liable for any indirect, incidental, or consequential damages resulting from the use or inability to use any product. Perfume oils and attars are meant strictly for external topical application. We recommend performing a 24-hour patch test before extensive wear.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">7. Governing Law & Jurisdiction</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the substantive laws of India. Any legal dispute, controversy, or claim arising out of or in relation to this website or order shall be subject to the exclusive jurisdiction of the competent courts in <strong>Mumbai, Maharashtra, India</strong>.
            </p>
          </section>

          <section className="p-6 rounded-xl border border-border/60 bg-secondary/20 space-y-2">
            <h3 className="font-heading text-lg font-bold text-foreground">8. Questions or Notices</h3>
            <p className="text-sm">
              If you have any questions regarding our terms or wish to give formal legal notice:
            </p>
            <div className="text-sm space-y-1 text-foreground/80 mt-2 font-medium">
              <p>Business Name: SN AttarWala</p>
              <p>Email: <a href="mailto:support@snattarwala.in" className="text-accent hover:underline">support@snattarwala.in</a></p>
              <p>Customer Support Helpline: +91 90823 77314</p>
              <p>Store Address: 137, Janjiker Street, Opp Central Restaurant, Near Crawford Market, Mumbai 400003</p>
            </div>
          </section>
        </div>
      </Container>
    </div>
  )
}
