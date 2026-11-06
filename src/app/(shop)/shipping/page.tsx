import { Container } from "@/components/layout/container"
import { Truck, RotateCcw, ShieldCheck, Clock, MapPin, PackageCheck } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Shipping & Return Policy | SN AttarWala",
  description: "Learn about SN AttarWala shipping times, delivery rates across Mumbai and Pan-India, our 7-day return policy, and secure transit packaging.",
}

export default function ShippingPage() {
  return (
    <div className="bg-background min-h-screen py-16 md:py-24">
      <Container>
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">Customer Care</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold">Shipping & Return Policy</h1>
          <p className="text-foreground/70 text-base md:text-lg leading-relaxed">
            Transparent, reliable, and secure fulfillment for every handcrafted fragrance from our Mumbai boutique to your doorstep.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold">Pan-India Shipping</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Fast delivery across India via BlueDart, Delhivery & DTDC Express. Free shipping on all orders above ₹999.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold">Mumbai Same-Day Express</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Orders placed before 2:00 PM IST qualify for same-day delivery across Mumbai. Standard delivery takes 1-2 days.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold">7-Day Return Policy</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Unopened items with seals intact are eligible for hassle-free returns or exchanges within 7 days of delivery.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="max-w-4xl mx-auto space-y-12 text-foreground/80 leading-relaxed">
          {/* Section 1: Shipping Rates & Delivery Time */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
              <PackageCheck className="w-6 h-6 text-accent" />
              1. Delivery Timelines & Shipping Rates
            </h2>
            <p>
              We process and dispatch orders Monday through Saturday (excluding national holidays). Every bottle is packed in protective, cushioned packaging designed specifically for glass perfume flacons and attar vials.
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse border border-border/60 text-sm">
                <thead>
                  <tr className="bg-secondary/40 text-foreground font-semibold">
                    <th className="p-3 border border-border/60">Region</th>
                    <th className="p-3 border border-border/60">Estimated Transit Time</th>
                    <th className="p-3 border border-border/60">Shipping Charge (Orders &lt; ₹999)</th>
                    <th className="p-3 border border-border/60">Orders ₹999+</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-border/60 font-medium">Mumbai Metro</td>
                    <td className="p-3 border border-border/60">Same-Day (Order before 2 PM) / 1-2 Days</td>
                    <td className="p-3 border border-border/60">₹99</td>
                    <td className="p-3 border border-border/60 text-emerald-600 font-semibold">FREE</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-border/60 font-medium">Rest of Maharashtra & Metros</td>
                    <td className="p-3 border border-border/60">2-4 Business Days</td>
                    <td className="p-3 border border-border/60">₹99</td>
                    <td className="p-3 border border-border/60 text-emerald-600 font-semibold">FREE</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-border/60 font-medium">Pan-India (Rest of India)</td>
                    <td className="p-3 border border-border/60">3-5 Business Days</td>
                    <td className="p-3 border border-border/60">₹99</td>
                    <td className="p-3 border border-border/60 text-emerald-600 font-semibold">FREE</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-foreground/60 mt-2">
              * Remote regional pin codes (e.g. Jammu & Kashmir, Northeast India, Lakshadweep) may require an additional 2-3 business days.
            </p>
          </section>

          {/* Section 2: Order Tracking */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-foreground">2. Tracking Your Order</h2>
            <p>
              Once your order has been dispatched from our Mumbai facility, you will receive an automated SMS and WhatsApp update containing your airway bill (AWB) number and live tracking link. You can also track your shipment anytime via our <Link href="/track" className="text-accent underline font-medium">Track Order</Link> page.
            </p>
          </section>

          {/* Section 3: Return & Refund Policy */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
              <RotateCcw className="w-6 h-6 text-accent" />
              3. Return & Refund Policy (7-Day Window)
            </h2>
            <p>
              We want you to be completely satisfied with your purchase. If you receive an incorrect item or change your mind prior to opening, we offer a <strong className="text-foreground">7-day return policy</strong> from the date of delivery.
            </p>
            <div className="space-y-3 bg-secondary/20 p-5 rounded-lg border border-border/60 text-sm">
              <p className="font-semibold text-foreground">Conditions for Returns:</p>
              <ul className="list-disc pl-5 space-y-1 text-foreground/75">
                <li>The item must be in its original outer box with protective plastic cellophane/security seal intact.</li>
                <li>The perfume bottle or attar vial must be completely unused, unapplied, and undamaged.</li>
                <li>All complimentary sample cards, inserts, and accessories must be returned.</li>
                <li>Due to hygiene and the artisanal nature of pure perfume oils, unsealed bottles cannot be accepted for return.</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Damaged or Defective Items */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-foreground">4. Damaged or Leaking Items in Transit</h2>
            <p>
              While we use reinforced, shock-absorbing packaging, transit accidents can occasionally happen. If your parcel arrives visibly damaged or leaking:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/80">
              <li>Take clear photos and an unboxing video showing the damaged flacon, outer packaging, and shipping label.</li>
              <li>Notify our support team within <strong>48 hours</strong> of delivery via WhatsApp at <strong>+91 90823 77314</strong> or email <strong>support@snattarwala.in</strong>.</li>
              <li>We will arrange a free immediate replacement or issue a 100% refund, including shipping fees.</li>
            </ol>
          </section>

          {/* Section 5: Refund Processing Timeline */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-foreground">5. Refund Processing Timeline</h2>
            <p>
              Once your returned item is received and inspected at our Mumbai store, your refund will be initiated within <strong>24-48 business hours</strong>. The funds will reflect in your original payment method (Credit/Debit Card, Net Banking, or UPI) within <strong>5-7 business days</strong> depending on your banking provider.
            </p>
          </section>

          {/* Section 6: Contact & Physical Location */}
          <section className="p-6 rounded-xl border border-accent/30 bg-accent/5 space-y-3">
            <h3 className="font-heading text-lg font-bold text-foreground">Need Assistance with a Shipment or Return?</h3>
            <p className="text-sm">
              Our customer concierge team is available Monday to Saturday, 10:00 AM – 8:00 PM IST:
            </p>
            <div className="text-sm space-y-1 text-foreground/80 font-medium">
              <p>WhatsApp & Phone: <a href="tel:+919082377314" className="text-accent hover:underline">+91 90823 77314</a></p>
              <p>Email: <a href="mailto:support@snattarwala.in" className="text-accent hover:underline">support@snattarwala.in</a></p>
              <p>Store Address: 137, Janjiker Street, Opp Central Restaurant, Near Crawford Market, Mumbai 400003</p>
            </div>
          </section>
        </div>
      </Container>
    </div>
  )
}

