import { Container } from "@/components/layout/container"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "Our Collections | Ittar",
  description: "Explore our premium fragrance collections for him, for her, and unisex.",
}

const collections = [
  {
    name: "For Him",
    slug: "for-him",
    description: "Bold, masculine, and commanding. Discover fragrances featuring oud, leather, and rich woods designed for the modern gentleman.",
    image: "/images/for-him.png",
  },
  {
    name: "For Her",
    slug: "for-her",
    description: "Elegant, soft, and mesmerizing. A symphony of florals, sweet fruits, and delicate musk tailored for grace and sophistication.",
    image: "/images/for-her.png",
  },
  {
    name: "Unisex",
    slug: "unisex",
    description: "Balanced, modern, and versatile. Unique blends of citrus, spices, and amber that transcend traditional boundaries.",
    image: "/images/unisex.png",
  }
]

export default function CollectionsPage() {
  return (
    <div className="bg-background min-h-screen py-24">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-6">
          <h1 className="font-heading text-4xl md:text-5xl font-bold">Our Collections</h1>
          <p className="text-foreground/70 text-lg">
            Immerse yourself in the world of SN Attarwala. Carefully curated selections representing the pinnacle of olfactory craftsmanship.
          </p>
        </div>

        <div className="space-y-24">
          {collections.map((collection, index) => (
            <div 
              key={collection.name}
              className={`flex flex-col md:flex-row gap-12 items-center ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
            >
              <div className="w-full md:w-1/2 aspect-[4/3] relative bg-secondary rounded-lg overflow-hidden group">
                <Link href={`/shop?category=${collection.slug}`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors z-10" />
                  <img 
                    src={collection.image} 
                    alt={collection.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                  />
                </Link>
              </div>
              
              <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
                <h2 className="font-heading text-3xl font-bold">{collection.name}</h2>
                <p className="text-foreground/70 text-lg leading-relaxed max-w-md mx-auto md:mx-0">
                  {collection.description}
                </p>
                <div className="pt-4">
                  <Link 
                    href={`/shop?category=${collection.slug}`}
                    className="inline-flex items-center space-x-2 text-accent font-medium hover:text-primary transition-colors uppercase tracking-widest text-sm"
                  >
                    <span>Explore Collection</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
