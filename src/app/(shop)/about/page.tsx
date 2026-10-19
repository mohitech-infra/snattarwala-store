import { Container } from "@/components/layout/container"
import { ShieldCheck, Droplet, Clock, Leaf } from "lucide-react"

export const metadata = {
  title: "About Us | Ittar",
  description: "Learn about SN Attarwala, our heritage, and our commitment to premium craftsmanship in Mumbai.",
}

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative py-32 bg-secondary text-center">
        <Container>
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-6">Our Heritage</h1>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto font-light">
            Born in the heart of Mumbai, SN Attarwala is dedicated to the ancient art of perfumery, blending tradition with modern elegance.
          </p>
        </Container>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="font-heading text-3xl md:text-4xl font-bold">The Art of Fragrance</h2>
              <p className="text-foreground/70 leading-relaxed text-lg">
                Perfume is more than just a scent; it is an invisible garment that dresses the soul. At SN Attarwala, we believe in the profound power of fragrance to evoke memories, shape identities, and elevate the everyday into the extraordinary.
              </p>
              <p className="text-foreground/70 leading-relaxed text-lg">
                Sourced from the finest ingredients across the globe and masterfully blended in Mumbai, our collections reflect a harmonious balance between timeless Middle Eastern attar traditions and contemporary French perfumery.
              </p>
            </div>
            <div className="aspect-square bg-secondary rounded-lg overflow-hidden relative">
               <img 
                 src="/images/about.png" 
                 alt="Perfume craftsmanship"
                 className="w-full h-full object-cover"
               />
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
