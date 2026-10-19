"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowUpRight,
  Check,
  Crown,
  Gem,
  MessageCircle,
  PackageCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { Container } from "@/components/layout/container"

type WholesaleView = "attar" | "perfume"

type AttarSeries = {
  name: string
  eyebrow: string
  description: string
  icon: LucideIcon
  accent: string
  prices: Array<{ size: string; price: number }>
}

const attarSeries: AttarSeries[] = [
  {
    name: "Golden Series",
    eyebrow: "Everyday luxury",
    description: "A polished collection for retailers who want accessible luxury with a premium feel.",
    icon: Crown,
    accent: "golden",
    prices: [
      { size: "12 ml", price: 300 },
      { size: "24 ml", price: 500 },
      { size: "55 ml", price: 999 },
    ],
  },
  {
    name: "Diamond Series",
    eyebrow: "Signature quality",
    description: "Elevated presentation and richer profiles for a fragrance shelf that stands out.",
    icon: Gem,
    accent: "diamond",
    prices: [
      { size: "12 ml", price: 549 },
      { size: "24 ml", price: 999 },
      { size: "55 ml", price: 1999 },
    ],
  },
  {
    name: "Luxury Series",
    eyebrow: "The collector's edit",
    description: "Our most indulgent attar range for boutiques, gifting and premium retail assortments.",
    icon: Sparkles,
    accent: "luxury",
    prices: [
      { size: "12 ml", price: 1099 },
      { size: "24 ml", price: 1899 },
      { size: "55 ml", price: 2999 },
    ],
  },
]

const perfumeSizes = ["30 ml", "50 ml", "100 ml"]

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`
}

function getWhatsAppLink(message: string) {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919082377314").replace(/\D/g, "")
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function WholesaleSection() {
  const [activeView, setActiveView] = useState<WholesaleView>("attar")

  const wholesaleDeskLink = getWhatsAppLink(
    "Hello, I would like to explore wholesale fragrances from SN AttarWala. Please share the catalogue and order details.",
  )

  return (
    <section
      id="wholesale"
      aria-labelledby="wholesale-heading"
      className="relative scroll-mt-24 overflow-hidden bg-[#201813] py-24 text-[#fff9ed] md:py-32"
    >
      <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#8b5e3c]/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(115deg,transparent_0%,transparent_45%,#fff_46%,transparent_47%,transparent_100%)] [background-size:26px_26px]" />

      <Container className="relative z-10">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <div className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#d4af37]">
              <span className="h-px w-10 bg-[#d4af37]" />
              Wholesale program
            </div>
            <h2 id="wholesale-heading" className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              Make room for a more memorable shelf.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-[#f6ead8]/70 md:text-base">
              Stock signature attars in three distinctive series, or ask our wholesale desk about the right perfume bottle format for your range.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-[#fff9ed]/15 bg-[#fff9ed]/[0.06] p-5 backdrop-blur-sm">
              <PackageCheck className="mb-5 h-5 w-5 text-[#d4af37]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f6ead8]/55">Attar sizes</p>
              <p className="mt-2 font-heading text-2xl">12 ml · 24 ml · 55 ml</p>
            </div>
            <div className="border border-[#fff9ed]/15 bg-[#fff9ed]/[0.06] p-5 backdrop-blur-sm">
              <Sparkles className="mb-5 h-5 w-5 text-[#d4af37]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f6ead8]/55">Perfume bottles</p>
              <p className="mt-2 font-heading text-2xl">30 ml · 50 ml · 100 ml</p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-y border-[#fff9ed]/15 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f6ead8]/50">Choose your wholesale format</p>
            <p className="mt-2 text-sm text-[#f6ead8]/70">Clear rates for attars. Quick quotes for perfume bottles.</p>
          </div>
          <div className="flex w-full rounded-full border border-[#fff9ed]/15 bg-black/15 p-1 sm:w-auto">
            <button
              type="button"
              aria-pressed={activeView === "attar"}
              onClick={() => setActiveView("attar")}
              className={`flex-1 rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors sm:flex-none ${
                activeView === "attar" ? "bg-[#d4af37] text-[#201813]" : "text-[#f6ead8]/65 hover:text-white"
              }`}
            >
              Attar rates
            </button>
            <button
              type="button"
              aria-pressed={activeView === "perfume"}
              onClick={() => setActiveView("perfume")}
              className={`flex-1 rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors sm:flex-none ${
                activeView === "perfume" ? "bg-[#d4af37] text-[#201813]" : "text-[#f6ead8]/65 hover:text-white"
              }`}
            >
              Perfume bottles
            </button>
          </div>
        </div>

        {activeView === "attar" ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {attarSeries.map((series, index) => {
              const Icon = series.icon
              const seriesLink = getWhatsAppLink(
                `Hello, I am interested in the ${series.name} wholesale range. Please share availability and ordering details for 12 ml, 24 ml and 55 ml attars.`,
              )

              return (
                <motion.article
                  key={series.name}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.08, duration: 0.55 }}
                  className={`group flex flex-col border bg-[#fff9ed]/[0.06] p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7 ${
                    series.accent === "golden"
                      ? "border-[#d4af37]/45"
                      : series.accent === "diamond"
                        ? "border-[#b8d7e8]/35"
                        : "border-[#e7b5a4]/35"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f6ead8]/50">{series.eyebrow}</p>
                      <h3 className="mt-3 text-2xl font-bold text-[#fff9ed]">{series.name}</h3>
                    </div>
                    <div className="rounded-full border border-[#d4af37]/30 p-3 text-[#d4af37]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <p className="mt-5 min-h-14 text-sm leading-6 text-[#f6ead8]/65">{series.description}</p>

                  <div className="mt-7 divide-y divide-[#fff9ed]/10 border-y border-[#fff9ed]/10">
                    {series.prices.map((item) => (
                      <div key={item.size} className="flex items-center justify-between py-4">
                        <span className="flex items-center gap-2 text-sm text-[#f6ead8]/75">
                          <Check className="h-4 w-4 text-[#d4af37]" />
                          {item.size}
                        </span>
                        <span className="font-heading text-xl text-[#fff9ed]">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>

                  <a
                    href={seriesLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-7 inline-flex items-center justify-between border border-[#fff9ed]/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fff9ed] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
                  >
                    Ask for this series
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </motion.article>
              )
            })}
          </div>
        ) : (
          <motion.div
            key="perfume-bottles"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-10"
          >
            <div className="grid gap-5 md:grid-cols-3">
              {perfumeSizes.map((size, index) => {
                const sizeLink = getWhatsAppLink(
                  `Hello, I need wholesale pricing for ${size} perfume bottles. Please share available fragrances, packaging options and order details.`,
                )

                return (
                  <motion.article
                    key={size}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.45 }}
                    className="border border-[#fff9ed]/15 bg-[#fff9ed]/[0.06] p-7 transition-colors hover:border-[#d4af37]/60"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f6ead8]/50">Perfume bottle</p>
                    <p className="mt-5 font-heading text-5xl text-[#fff9ed]">{size}</p>
                    <p className="mt-4 text-sm leading-6 text-[#f6ead8]/65">Wholesale pricing shared on request based on fragrance and order requirements.</p>
                    <a
                      href={sizeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d4af37] hover:text-white"
                    >
                      Ask for pricing
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </motion.article>
                )
              })}
            </div>
            <p className="mt-6 text-xs leading-6 text-[#f6ead8]/50">
              Perfume bottle rates are intentionally quote-based so the wholesale desk can match the right fragrance, packaging and quantity to your business.
            </p>
          </motion.div>
        )}

        <div className="mt-12 flex flex-col gap-5 border border-[#d4af37]/35 bg-[#d4af37]/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[#25d366]/15 p-3 text-[#66e08e]">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-xl text-[#fff9ed]">Need a tailored wholesale quote?</p>
              <p className="mt-1 text-sm text-[#f6ead8]/60">Send your preferred sizes and our team will guide you.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={wholesaleDeskLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25d366] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#102517] transition-colors hover:bg-[#62e58d]"
            >
              WhatsApp wholesale desk
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 border border-[#fff9ed]/20 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fff9ed] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Explore fragrances
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
