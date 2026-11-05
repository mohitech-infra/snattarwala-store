import { Container } from "@/components/layout/container"
import { ShieldCheck, Droplet, Clock, Leaf, Sparkles, MapPin } from "lucide-react"

export const metadata = {
  title: "About Us | SN Attarwala",
  description: "Learn about SN Attarwala, our Mumbai heritage, pure sandalwood, oudh, and our commitment to artisanal perfumery.",
}

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative py-28 md:py-36 bg-secondary/30 text-center border-b border-border/50">
        <Container>
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold mb-3 inline-block">
            Boutique & Artisanal Heritage
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-6 tracking-tight">Our Heritage</h1>
          <p className="text-lg md:text-xl text-foreground/75 max-w-3xl mx-auto font-light leading-relaxed">
            Born in the heart of Mumbai, <span className="font-semibold text-foreground">S.N. Attarwala</span> is dedicated to the ancient craft of pure perfumery, blending time-honored oriental traditions with contemporary luxury.
          </p>
        </Container>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                The Essence of S.N. Attarwala
              </div>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Sandal, Oudh & Master Artisanal Perfumery
              </h2>
              <p className="text-foreground/80 leading-relaxed text-base md:text-lg">
                Step inside our flagship Mumbai boutique and experience the intoxicating aroma of centuries-old perfumery traditions. At <strong className="text-foreground">S.N. Attarwala</strong>, perfume is not merely a fragrance — it is an art of intimacy, memory, and dignity.
              </p>
              <p className="text-foreground/70 leading-relaxed text-base md:text-lg">
                From pure Indian sandalwood (Chandan) and wild-harvested Assam dehn al oudh, to royal bakhoor and bespoke artisanal Eau De Parfum sprays, every blend is crafted with uncompromising reverence for quality. We welcome perfume enthusiasts, wedding gifting clients, and wholesale partners to experience fragrances blended right before their eyes.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                <span className="flex items-center gap-1.5 bg-secondary/40 px-3 py-1.5 rounded-sm border border-border/60">
                  <MapPin className="w-3.5 h-3.5 text-accent" /> Mumbai Flagship Store
                </span>
                <span className="flex items-center gap-1.5 bg-secondary/40 px-3 py-1.5 rounded-sm border border-border/60">
                  <Droplet className="w-3.5 h-3.5 text-accent" /> 100% Non-Alcoholic Oils
                </span>
                <span className="flex items-center gap-1.5 bg-secondary/40 px-3 py-1.5 rounded-sm border border-border/60">
                  <Sparkles className="w-3.5 h-3.5 text-accent" /> Rare Cambodian & Assam Oudh
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-accent/25 bg-secondary/10 group aspect-[3/4] sm:aspect-[4/5] max-h-[640px] mx-auto">
                <img 
                  src="/images/about.png" 
                  alt="S.N. Attarwala Flagship Store - Sandal, Oudh & Perfumes Mumbai"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white">
                  <p className="font-heading font-bold text-sm tracking-widest uppercase text-accent">
                    S.N. ATTARWALA BOUTIQUE
                  </p>
                  <p className="text-xs text-white/80 mt-0.5">
                    Authentic Mumbai Perfumery • Sandal, Oudh & Bespoke Blends
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-secondary/30">
        <Container>
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold mb-4">The Ittar Promise</h2>
            <p className="text-foreground/60 max-w-xl mx-auto">We hold ourselves to the highest standards of quality, ensuring every bottle delivers an unparalleled experience.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Droplet, title: "Pure Ingredients", desc: "Sourced globally, prioritizing natural and sustainable oils." },
              { icon: Clock, title: "Long Lasting", desc: "High concentration extraits designed to linger for 12+ hours." },
              { icon: ShieldCheck, title: "Cruelty Free", desc: "Ethically produced without any animal testing." },
              { icon: Leaf, title: "Artisan Crafted", desc: "Blended and bottled by hand with meticulous care." },
            ].map((value, i) => (
              <div key={i} className="bg-background p-8 rounded-lg text-center shadow-sm border border-border/50">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-accent">
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">{value.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  )
}
