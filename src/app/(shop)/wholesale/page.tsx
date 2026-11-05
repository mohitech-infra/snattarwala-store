import { Container } from "@/components/layout/container"
import { WholesaleForm } from "@/components/wholesale/wholesale-form"
import {
  Package,
  Layers,
  Sparkles,
  Truck,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  HelpCircle,
  CheckCircle,
} from "lucide-react"

export const metadata = {
  title: "Wholesale & Bulk Fragrance Supply | SN AttarWala Mumbai",
  description:
    "Partner with SN AttarWala for authentic non-alcoholic attars, concentrated perfume oils, and artisanal Eau De Parfum at genuine manufacturer wholesale pricing.",
}

const WHOLESALE_BENEFITS = [
  {
    icon: Layers,
    title: "Direct Artisan Pricing",
    description:
      "Eliminate intermediate distributor markups. Enjoy tiered manufacturer rates with healthy 40%–60% retail margins for your business.",
  },
  {
    icon: Package,
    title: "Accessible Low MOQs",
    description:
      "Start small with starter packs from just 50 units across our attar and perfume lines, ideal for boutique owners and emerging fragrance brands.",
  },
  {
    icon: Sparkles,
    title: "Private Label & Custom Bottling",
    description:
      "Custom flacon shapes, gold/black screen-printing, bespoke box packaging, and exclusive fragrance formulation tailored to your brand identity.",
  },
  {
    icon: Truck,
    title: "Insured Pan-India & Global Dispatch",
    description:
      "Safely packaged, tamper-evident express shipping with official GST tax invoicing for seamless compliance and business tax credits.",
  },
]

const WHOLESALE_FAQS = [
  {
    q: "What is the minimum order quantity (MOQ)?",
    a: "Our starter wholesale minimum is only 50 units across our bottled series, or 500 ml / 1 kg for bulk concentrated perfume oils.",
  },
  {
    q: "Do you supply tester sample kits?",
    a: "Yes. Verified businesses and retailers can order a comprehensive Discovery Tester Pack to evaluate fragrance projection, sillage, and longevity before placing volume orders.",
  },
  {
    q: "Do all orders include official GST invoices?",
    a: "Yes. Every single order is dispatched with a valid GST tax invoice so your business can claim applicable input tax credit (ITC).",
  },
  {
    q: "Can you create custom blends or private label branding?",
    a: "Yes, our master perfumers in Mumbai work closely with private brands to formulate signature scents, bottle them into custom flacons, and package them in custom branded boxes.",
  },
]

export default function WholesalePage() {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919082377314"
  const cleanPhone = phoneNumber.replace(/\D/g, "")

  return (
    <div className="bg-background min-h-screen">
      {/* Header Banner */}
      <section className="relative py-20 md:py-28 bg-secondary/25 border-b border-border/50 text-center">
        <Container>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              <span className="h-px w-8 bg-accent" />
              B2B & Wholesale Partnership
              <span className="h-px w-8 bg-accent" />
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Wholesale & Bulk Fragrance Supply
            </h1>
            <p className="text-foreground/70 text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto pt-2">
              Supply your boutique, retail store, online brand, or corporate gifting program with authentic, 100% alcohol-free attars and luxury Eau De Parfum crafted in Mumbai.
            </p>
          </div>
        </Container>
      </section>

      {/* 4 Wholesale Pillars */}
      <section className="py-16 md:py-20 border-b border-border/50">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHOLESALE_BENEFITS.map((benefit, i) => (
              <div
                key={i}
                className="bg-background border border-border/60 rounded-sm p-6 shadow-xs hover:border-accent/60 transition-colors"
              >
                <div className="w-11 h-11 bg-secondary/50 rounded-sm flex items-center justify-center text-accent mb-5">
                  <benefit.icon className="w-5 h-5" />
                </div>
                <h2 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {benefit.title}
                </h2>
                <p className="text-foreground/65 text-xs sm:text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Main Section: Form & Info */}
      <section className="py-20 md:py-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.9fr] gap-12 lg:gap-16 items-start">
            {/* Form Column */}
            <div>
              <WholesaleForm />
            </div>

            {/* Sidebar / Contact Info Column */}
            <div className="space-y-8">
              {/* Direct WhatsApp Card */}
              <div className="bg-secondary/20 border border-border/60 rounded-sm p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-foreground">
                      Wholesale Desk
                    </h3>
                    <p className="text-xs text-foreground/60">Direct B2B Inquiries & Support</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed mb-6">
                  Prefer chatting directly? Message our wholesale desk on WhatsApp for instant catalog requests, bulk price sheets, or custom quotes.
                </p>
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    "Hello SN AttarWala, I am interested in exploring wholesale and bulk orders. Please share your B2B catalog and price list."
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#20ba59] py-3.5 px-5 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Wholesale Desk
                </a>
              </div>

              {/* Contact Details */}
              <div className="bg-background border border-border/60 rounded-sm p-7 space-y-5">
                <h3 className="font-heading font-semibold text-lg text-foreground border-b border-border/40 pb-3">
                  Direct B2B Contacts
                </h3>
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground block">+91 90823 77314</span>
                      <span className="text-foreground/50 text-[11px]">Mon–Sat: 10:00 AM – 9:00 PM IST</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground block">support@snattarwala.in</span>
                      <span className="text-foreground/50 text-[11px]">Guaranteed response within 24 hours</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground block">Dispatch Timeline</span>
                      <span className="text-foreground/50 text-[11px]">Ready catalog: 48-72h · Custom: 7-10 days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Tester Kit Box */}
              <div className="bg-secondary/15 border border-border/60 rounded-sm p-7">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-heading font-semibold text-base text-foreground mb-1">
                      Business Discovery Sample Packs
                    </h4>
                    <p className="text-xs text-foreground/65 leading-relaxed">
                      We offer curated sample discovery boxes for retail owners to test fragrance projection, bottle presentation, and wearability with zero risk before committing to large volumes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mumbai Showrooms */}
              <div className="bg-background border border-border/60 rounded-sm p-7 space-y-4">
                <h3 className="font-heading font-semibold text-lg text-foreground border-b border-border/40 pb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  Mumbai Showrooms & Pickups
                </h3>
                <div className="space-y-3 text-xs leading-relaxed text-foreground/75">
                  <div>
                    <strong className="text-foreground block font-medium">Store 1 (Crawford Market):</strong>
                    137, Janjiker street opp Central restaurant, Near Crawford Market, Masjid West, Mumbai 400003
                  </div>
                  <div>
                    <strong className="text-foreground block font-medium">Store 2 (Minara Masjid):</strong>
                    41, Mohd Ali Road, Minara Masjid, Near Zam Zam Sweet, Mumbai 400003
                  </div>
                </div>
              </div>

              {/* FAQ Accordion / Cards */}
              <div className="bg-background border border-border/60 rounded-sm p-7 space-y-4">
                <h3 className="font-heading font-semibold text-lg text-foreground border-b border-border/40 pb-3 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-accent" />
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4 text-xs">
                  {WHOLESALE_FAQS.map((faq, i) => (
                    <div key={i} className="border-b border-border/30 pb-3 last:border-b-0 last:pb-0">
                      <h4 className="font-semibold text-foreground mb-1">
                        {faq.q}
                      </h4>
                      <p className="text-foreground/65 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}
