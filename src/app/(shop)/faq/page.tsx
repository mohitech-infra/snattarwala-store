import { Container } from "@/components/layout/container"
import { HelpCircle, ChevronDown } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Frequently Asked Questions (FAQ) | SN AttarWala",
  description: "Find answers about attar application, alcohol-free fragrance oils, delivery across India, and return policies at SN AttarWala.",
}

const FAQS = [
  {
    q: "What is the difference between Attar and Perfume (EDP)?",
    a: "Traditional Attar (Ittar) is a 100% concentrated, pure botanical perfume oil crafted without any alcohol. It sits intimately on the pulse points and develops with body heat over 12-24 hours. Perfume (EDP) is formulated with perfumer's organic solvent to create an expansive projection and sillage in an aerosol mist spray."
  },
  {
    q: "Are SN AttarWala attars 100% alcohol-free?",
    a: "Yes. All our pure attars, rolls-ons, and concentrated perfume oils are 100% alcohol-free, halal-friendly, and safe for sensitive skin and prayer/namaz wear."
  },
  {
    q: "How long do the fragrances last?",
    a: "Our artisanal attars typically provide 12 to 24+ hours of longevity on skin and multiple days on natural fabrics (cotton, wool, silk). Our luxury Eau De Parfum sprays project for 8 to 12 hours."
  },
  {
    q: "What bottle sizes are available?",
    a: "Depending on the fragrance collection, we offer: 3ml, 6ml, 12ml, and 24ml pure crystal glass attar roll-on bottles, and 50ml or 100ml luxury Eau De Parfum flacons with premium mist atomizers."
  },
  {
    q: "What are your shipping charges and delivery times?",
    a: "We offer Free Shipping across India on all prepaid orders ₹999 and above. For orders below ₹999, flat ₹99 shipping applies. Mumbai orders placed before 2 PM qualify for same-day delivery or 1-2 days. Pan-India orders are delivered within 3-5 business days via BlueDart and Delhivery."
  },
  {
    q: "Can I return or exchange my perfume?",
    a: "Yes, we provide a 7-day return policy for unopened items with unbroken packaging seals. Due to hygiene standards and the sensitive nature of natural aromatic oils, opened or applied bottles cannot be returned."
  },
  {
    q: "Do you have physical stores in Mumbai where I can test perfumes?",
    a: "Yes! You are welcome to visit our boutique at 137 Janjiker Street, Crawford Market, Mumbai 400003, or our Minara Masjid boutique at 41 Mohd Ali Road. Our master perfumers will help you sample notes and custom blends."
  }
]

export default function FAQPage() {
  return (
    <div className="bg-background min-h-screen py-16 md:py-24">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">Help & FAQ</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold">Frequently Asked Questions</h1>
          <p className="text-foreground/70 text-base md:text-lg leading-relaxed">
            Everything you need to know about our handcrafted fragrances, bottle sizes, shipping timelines, and artisanal heritage.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="p-6 rounded-xl border border-border/60 bg-secondary/15 space-y-3">
              <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-accent shrink-0" />
                {faq.q}
              </h3>
              <p className="text-sm md:text-base text-foreground/75 leading-relaxed pl-8">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 p-8 rounded-xl border border-accent/20 bg-accent/5 max-w-2xl mx-auto space-y-3">
          <h4 className="font-heading text-xl font-bold">Still have a question?</h4>
          <p className="text-sm text-foreground/70">
            Our fragrance specialists are happy to advise you on scent profiles and gifting sets.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link href="/contact" className="px-5 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity">
              Contact Us
            </Link>
            <a href="https://wa.me/919082377314" target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-lg border border-border hover:bg-secondary text-foreground font-medium text-sm transition-colors">
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </Container>
    </div>
  )
}

