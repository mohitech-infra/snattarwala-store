export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  galleryImages: string[];
  description: string;
  shortDescription: string;
  category: 'Attars' | 'Perfumes' | 'Bakhoor';
  subcategory?: string;
  gender?: 'Men' | 'Women' | 'Unisex';
  fragranceFamily?: string;
  fragranceNotes: string[];
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
  longevity?: string;
  rating: number;
  reviews: number;
  sizes: string[];
  inStock: boolean;
  sku: string;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isReplica?: boolean;
  series?: "Golden Series" | "Diamond Series" | "Luxury Series";
  tags: string[];
}

export const DUMMY_PRODUCTS: Product[] = [
  // ATTARS
  {
    id: "attar-1",
    name: "White Oudh",
    slug: "white-oudh-attar",
    brand: "SN Attarwala",
    price: 1500,
    compareAtPrice: 2000,
    imageUrl: "/products/white-oudh-attar.jpg",
    galleryImages: ["/products/white-oudh-attar.jpg"],
    description: "A unisex and traditional fragrance designed for everyday use. It has a creamy, musky character with a long-lasting aroma that keeps you feeling fresh throughout the day.",
    shortDescription: "A creamy, musky traditional fragrance for everyday use.",
    category: "Attars",
    gender: "Unisex",
    fragranceFamily: "Oud",
    fragranceNotes: ["Woody", "Amber", "Earthy", "Green", "Floral"],
    rating: 4.8,
    reviews: 124,
    sizes: ["6ml", "12ml"],
    inStock: true,
    sku: "SNA-WO-01",
    isFeatured: true,
    isBestseller: true,
    isNewArrival: false,
    series: "Luxury Series",
    tags: ["Woody", "Amber", "Earthy", "Green", "Floral"]
  },
  {
    id: "attar-2",
    name: "Khmrah",
    slug: "khmrah-attar",
    brand: "SN Attarwala",
    price: 1800,
    compareAtPrice: 2500,
    imageUrl: "/products/khmrah-attar.jpg",
    galleryImages: ["/products/khmrah-attar.jpg"],
    description: "A sweet, warm and woody fragrance combining vanilla, dates, amber and a musky-powdery character. It delivers a distinctive Middle Eastern-inspired aroma and is designed to be long-lasting.",
    shortDescription: "Sweet, warm and woody with vanilla and dates.",
    category: "Attars",
    gender: "Unisex",
    fragranceFamily: "Woody",
    fragranceNotes: ["Vanilla Beans", "Orange", "Musk", "Woody", "Powdery", "Dates", "Amber"],
    longevity: "Up to 36 hours",
    rating: 4.9,
    reviews: 89,
    sizes: ["6ml", "12ml"],
    inStock: true,
    sku: "SNA-KH-02",
    isFeatured: true,
    isBestseller: false,
    isNewArrival: true,
    series: "Diamond Series",
    tags: ["Vanilla", "Woody", "Musk", "Amber", "Powdery"]
  },
  {
    id: "attar-3",
    name: "Sabaya",
    slug: "sabaya-attar",
    brand: "SN Attarwala",
    price: 1200,
    compareAtPrice: 1500,
    imageUrl: "/products/sabaya-attar.jpg",
    galleryImages: ["/products/sabaya-attar.jpg"],
    description: "A pleasant floral fragrance specially created for women. Its multi-floral character gives the feeling of walking through a beautiful garden. Fresh, feminine and memorable.",
    shortDescription: "A pleasant, fresh and feminine multi-floral fragrance.",
    category: "Attars",
    gender: "Women",
    fragranceFamily: "Floral",
    fragranceNotes: ["Musky", "Floral", "Woody", "Citrus"],
    rating: 4.7,
    reviews: 215,
    sizes: ["6ml", "12ml"],
    inStock: true,
    sku: "SNA-SAB-03",
    isFeatured: false,
    isBestseller: true,
    isNewArrival: false,
    series: "Golden Series",
    tags: ["Floral", "Musk", "Woody", "Citrus"]
  },

  // PERFUMES
  {
    id: "perfume-1",
    name: "Summer Musk",
    slug: "summer-musk-perfume",
    brand: "SN Attarwala",
    price: 3200,
    compareAtPrice: 4000,
    imageUrl: "/products/summer-musk-perfume.jpg",
    galleryImages: ["/products/summer-musk-perfume.jpg"],
    description: "A refreshing summer fragrance with an expansive blend of forest-like balsam, wood, earthy elements and an animalic texture. Designed to create a deep, natural and immersive fragrance experience.",
    shortDescription: "Refreshing summer fragrance with deep natural elements.",
    category: "Perfumes",
    gender: "Unisex",
    fragranceFamily: "Musk",
    fragranceNotes: ["Musky", "Amber", "Woody", "Bergamot"],
    rating: 4.6,
    reviews: 67,
    sizes: ["50ml", "100ml"],
    inStock: true,
    sku: "SNA-SM-04",
    isFeatured: true,
    isBestseller: false,
    isNewArrival: false,
    tags: ["Musk", "Amber", "Woody", "Citrus"]
  },
  {
    id: "perfume-2",
    name: "Ocean Blue",
    slug: "ocean-blue-perfume",
    brand: "SN Attarwala",
    price: 2800,
    compareAtPrice: 3500,
    imageUrl: "/products/ocean-blue-perfume.jpg",
    galleryImages: ["/products/ocean-blue-perfume.jpg"],
    description: "A refreshing and cooling fragrance made for everyday use. Its fresh citrus and mint character makes it especially suitable for summer, keeping the fragrance experience cool, fresh and energetic throughout the day.",
    shortDescription: "A cool, fresh, and energetic everyday summer fragrance.",
    category: "Perfumes",
    gender: "Men",
    fragranceFamily: "Fresh",
    fragranceNotes: ["Bergamot", "Mint", "Citrus"],
    rating: 4.8,
    reviews: 142,
    sizes: ["50ml", "100ml"],
    inStock: true,
    sku: "SNA-OB-05",
    isFeatured: false,
    isBestseller: true,
    isNewArrival: false,
    tags: ["Fresh", "Citrus", "Green"]
  },
  {
    id: "perfume-3",
    name: "Purple Oud",
    slug: "purple-oud-perfume",
    brand: "SN Attarwala",
    price: 4500,
    compareAtPrice: 5500,
    imageUrl: "/products/purple-oud-perfume.jpg",
    galleryImages: ["/products/purple-oud-perfume.jpg"],
    description: "A unique combination of woody and floral notes with a juicy pear-fruit touch, beautifully layered with musk. A balanced fragrance offering a luxurious and distinctive aroma.",
    shortDescription: "Luxurious blend of woody, floral, and juicy pear notes.",
    category: "Perfumes",
    gender: "Unisex",
    fragranceFamily: "Woody",
    fragranceNotes: ["Woody", "Floral", "Pear", "Musk"],
    rating: 4.9,
    reviews: 53,
    sizes: ["50ml", "100ml"],
    inStock: true,
    sku: "SNA-PO-06",
    isFeatured: true,
    isBestseller: false,
    isNewArrival: true,
    tags: ["Woody", "Floral", "Fruity", "Musk"]
  },
  {
    id: "perfume-4",
    name: "CR7",
    slug: "cr7-perfume",
    brand: "SN Attarwala",
    price: 2500,
    compareAtPrice: 3200,
    imageUrl: "/products/cr7-perfume.jpg",
    galleryImages: ["/products/cr7-perfume.jpg"],
    description: "A combination of warm amber, musk and a fruity bouquet with a woody character. A strong, outstanding and long-lasting fragrance suitable for everyday wear.",
    shortDescription: "Strong, long-lasting warm amber, musk, and fruity bouquet.",
    category: "Perfumes",
    gender: "Unisex",
    fragranceFamily: "Woody",
    fragranceNotes: ["Amber", "Musk", "Fruity", "Woody"],
    rating: 4.7,
    reviews: 210,
    sizes: ["50ml", "100ml"],
    inStock: true,
    sku: "SNA-CR7-07",
    isFeatured: false,
    isBestseller: true,
    isNewArrival: false,
    tags: ["Amber", "Musk", "Fruity", "Woody"]
  },
  {
    id: "perfume-5",
    name: "Dunhill Red (Inspired)",
    slug: "dunhill-red-inspired-perfume",
    brand: "SN Attarwala",
    price: 2200,
    compareAtPrice: 3000,
    imageUrl: "/products/dunhill-red-inspired-perfume.jpg",
    galleryImages: ["/products/dunhill-red-inspired-perfume.jpg"],
    description: "An oriental woody fragrance that opens with crisp apple and bright citrus. It gradually transitions into a warm floral and woody heart before settling into a sweet, sensual base of vanilla and musk. \n\n*Note: This is a high-quality replica/inspired fragrance.*",
    shortDescription: "Oriental woody fragrance with crisp apple and a sweet base.",
    category: "Perfumes",
    gender: "Men",
    fragranceFamily: "Oriental",
    fragranceNotes: ["Apple", "Lemon", "Bergamot", "Rose", "Teak Wood", "Vanilla", "Musk"],
    topNotes: ["Apple", "Lemon", "Bergamot", "Orange Blossom"],
    middleNotes: ["Rose", "Teak Wood", "Patchouli"],
    baseNotes: ["Vanilla", "Musk", "Labdanum"],
    rating: 4.6,
    reviews: 184,
    sizes: ["50ml", "100ml"],
    inStock: true,
    sku: "SNA-DR-08",
    isFeatured: false,
    isBestseller: true,
    isNewArrival: false,
    isReplica: true,
    tags: ["Oriental", "Woody", "Fruity", "Vanilla", "Musk"]
  },

  // BAKHOOR
  {
    id: "bakhoor-1",
    name: "Ameer Al Oudh",
    slug: "ameer-al-oudh-bakhoor",
    brand: "SN Attarwala",
    price: 1800,
    compareAtPrice: 2200,
    imageUrl: "/products/ameer-al-oudh-bakhoor.jpg",
    galleryImages: ["/products/ameer-al-oudh-bakhoor.jpg"],
    description: "A woody, spicy and powdery bakhoor with a pleasant sweet aroma. Designed to keep your home smelling refreshing, warm and aromatic.",
    shortDescription: "Woody, spicy, and powdery bakhoor for a warm home.",
    category: "Bakhoor",
    fragranceFamily: "Woody",
    fragranceNotes: ["Woody", "Spicy", "Powdery", "Sweet"],
    rating: 4.8,
    reviews: 95,
    sizes: ["50g", "100g"],
    inStock: true,
    sku: "SNA-AAO-09",
    isFeatured: true,
    isBestseller: true,
    isNewArrival: false,
    tags: ["Woody", "Spicy", "Powdery", "Sweet"]
  },
  {
    id: "bakhoor-2",
    name: "Oudh Salwa",
    slug: "oudh-salwa-bakhoor",
    brand: "SN Attarwala",
    price: 2100,
    compareAtPrice: 2800,
    imageUrl: "/products/oudh-salwa-bakhoor.jpg",
    galleryImages: ["/products/oudh-salwa-bakhoor.jpg"],
    description: "A rich combination of oud, saffron, rose and amber that creates a peaceful and calming atmosphere at home. A soothing fragrance designed to create a warm and relaxing environment.",
    shortDescription: "Rich oud, saffron, rose, and amber for a calming atmosphere.",
    category: "Bakhoor",
    fragranceFamily: "Oriental",
    fragranceNotes: ["Oudh", "Saffron", "Rose", "Amber"],
    rating: 4.9,
    reviews: 112,
    sizes: ["50g", "100g"],
    inStock: true,
    sku: "SNA-OS-10",
    isFeatured: false,
    isBestseller: false,
    isNewArrival: true,
    tags: ["Oud", "Floral", "Spicy", "Amber"]
  },
  {
    id: "bakhoor-3",
    name: "Oudh Safeeq",
    slug: "oudh-safeeq-bakhoor",
    brand: "SN Attarwala",
    price: 1950,
    compareAtPrice: 2500,
    imageUrl: "/products/oudh-safeeq-bakhoor.jpg",
    galleryImages: ["/products/oudh-safeeq-bakhoor.jpg"],
    description: "A rich combination of sweet vanilla, oud and earthy fragrance notes. Creates a luxurious and aromatic environment and leaves a memorable impression.",
    shortDescription: "Sweet vanilla, oud, and earthy notes for a luxurious environment.",
    category: "Bakhoor",
    fragranceFamily: "Woody",
    fragranceNotes: ["Sweet Vanilla", "Oudh", "Earthy"],
    rating: 4.7,
    reviews: 88,
    sizes: ["50g", "100g"],
    inStock: true,
    sku: "SNA-OSF-11",
    isFeatured: false,
    isBestseller: true,
    isNewArrival: false,
    tags: ["Vanilla", "Oud", "Earthy"]
  }
];

