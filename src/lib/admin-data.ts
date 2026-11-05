// ATTARWALA Admin Panel Master Data & State Layer

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  gender: string;
  fragranceFamily: string;
  price: number;
  costPrice: number;
  salePrice?: number;
  stock: number;
  reservedStock: number;
  reorderLevel: number;
  salesCount: number;
  revenue: number;
  rating: number;
  reviewsCount: number;
  status: "Active" | "Draft" | "Low Stock" | "Out of Stock";
  imageUrl: string;
  variants: { size: string; sku: string; price: number; stock: number }[];
  notes: { top: string[]; heart: string[]; base: string[] };
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  series?: "Golden Series" | "Diamond Series" | "Luxury Series" | string | null;
  tags?: string[];
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    address: string;
    avatar?: string;
  };
  items: {
    productId: string;
    name: string;
    size: string;
    price: number;
    quantity: number;
    imageUrl: string;
  }[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: "UPI" | "Credit Card" | "Debit Card" | "Net Banking" | "COD";
  paymentStatus: "Paid" | "Pending" | "Failed" | "Refunded";
  transactionId: string;
  orderStatus: "New" | "Confirmed" | "Processing" | "Packed" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled" | "Returned" | "Refunded";
  courier?: string;
  trackingNumber?: string;
  createdAt: string;
  notes?: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  segment: "VIP" | "High Value" | "Returning" | "New Customer" | "At Risk" | "Inactive";
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
  favoriteFamily: string;
  favoriteProducts: string[];
  loyaltyPoints: number;
  status: "Active" | "Inactive" | "Blocked";
}

export interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  status: "Approved" | "Pending" | "Featured" | "Rejected";
  verifiedBuyer: boolean;
  reply?: string;
}

export interface AbandonedCart {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  items: { name: string; size: string; price: number; quantity: number; imageUrl: string }[];
  cartValue: number;
  abandonedAt: string;
  timeAgo: string;
  recoveryStatus: "Not Contacted" | "WhatsApp Sent" | "Email Sent" | "Recovered";
  aiProbability: "High" | "Medium" | "Low";
}

export interface Coupon {
  id: string;
  code: string;
  type: "Percentage" | "Flat" | "Free Shipping" | "First Order";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageCount: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
  status: "Active" | "Expired" | "Scheduled" | "Disabled";
}

export interface Campaign {
  id: string;
  name: string;
  targetAudience: string;
  channels: string[];
  discount: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Draft" | "Scheduled";
  budget: number;
  revenueGenerated: number;
  roi: string;
  clicks: number;
  conversions: number;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  trigger: string;
  body: string;
  status: "Active" | "Paused";
  sentCount: number;
  deliveredRate: string;
  readRate: string;
  clickRate: string;
}

export interface SupportTicket {
  id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  orderNumber?: string;
  subject: string;
  category: "Shipping & Delivery" | "Damaged/Defective Item" | "Fragrance Consultation" | "Refund Request" | "General Query";
  priority: "Urgent" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Waiting for Customer" | "Resolved";
  assignedTo: string;
  createdAt: string;
  lastUpdated: string;
}

export interface AuditLogItem {
  id: string;
  user: string;
  role: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ip: string;
}

// Master Products
export const INITIAL_ADMIN_PRODUCTS: AdminProduct[] = [
  {
    id: "attar-1",
    name: "White Oudh",
    slug: "white-oudh-attar",
    sku: "SNA-WO-01",
    category: "Attars",
    gender: "Unisex",
    fragranceFamily: "Oud",
    price: 1500,
    costPrice: 520,
    salePrice: 1500,
    stock: 42,
    reservedStock: 4,
    reorderLevel: 15,
    salesCount: 384,
    revenue: 576000,
    rating: 4.8,
    reviewsCount: 124,
    status: "Active",
    imageUrl: "/products/white-oudh-attar.jpg",
    variants: [
      { size: "6ml", sku: "SNA-WO-01-6", price: 1500, stock: 24 },
      { size: "12ml", sku: "SNA-WO-01-12", price: 2800, stock: 18 }
    ],
    notes: {
      top: ["Bergamot", "White Saffron"],
      heart: ["Agarwood", "Cashmere Wood"],
      base: ["White Amber", "Crystal Musk"]
    },
    isFeatured: true,
    isBestseller: true,
    series: "Luxury Series"
  },
  {
    id: "attar-2",
    name: "Khmrah",
    slug: "khmrah-attar",
    sku: "SNA-KH-02",
    category: "Attars",
    gender: "Unisex",
    fragranceFamily: "Woody",
    price: 1800,
    costPrice: 650,
    stock: 8,
    reservedStock: 2,
    reorderLevel: 12,
    salesCount: 295,
    revenue: 531000,
    rating: 4.9,
    reviewsCount: 89,
    status: "Low Stock",
    imageUrl: "/products/khmrah-attar.jpg",
    variants: [
      { size: "6ml", sku: "SNA-KH-02-6", price: 1800, stock: 5 },
      { size: "12ml", sku: "SNA-KH-02-12", price: 3400, stock: 3 }
    ],
    notes: {
      top: ["Cinnamon", "Nutmeg", "Bergamot"],
      heart: ["Dates", "Praline", "Tuberose"],
      base: ["Vanilla Beans", "Tonka Bean", "Amberwood", "Myrrh"]
    },
    isFeatured: true,
    isNewArrival: true,
    series: "Diamond Series"
  },
  {
    id: "attar-3",
    name: "Sabaya",
    slug: "sabaya-attar",
    sku: "SNA-SAB-03",
    category: "Attars",
    gender: "Women",
    fragranceFamily: "Floral",
    price: 1200,
    costPrice: 380,
    stock: 35,
    reservedStock: 3,
    reorderLevel: 10,
    salesCount: 412,
    revenue: 494400,
    rating: 4.7,
    reviewsCount: 215,
    status: "Active",
    imageUrl: "/products/sabaya-attar.jpg",
    variants: [
      { size: "6ml", sku: "SNA-SAB-03-6", price: 1200, stock: 20 },
      { size: "12ml", sku: "SNA-SAB-03-12", price: 2200, stock: 15 }
    ],
    notes: {
      top: ["Taif Rose", "Green Apple"],
      heart: ["Jasmine Sambac", "Lily of the Valley"],
      base: ["Velvet Musk", "Cedarwood"]
    },
    isBestseller: true,
    series: "Golden Series"
  },
  {
    id: "perfume-1",
    name: "Summer Musk",
    slug: "summer-musk-perfume",
    sku: "SNA-SM-04",
    category: "Perfumes",
    gender: "Unisex",
    fragranceFamily: "Musk",
    price: 3200,
    costPrice: 1100,
    stock: 19,
    reservedStock: 1,
    reorderLevel: 10,
    salesCount: 168,
    revenue: 537600,
    rating: 4.6,
    reviewsCount: 67,
    status: "Active",
    imageUrl: "/products/summer-musk-perfume.jpg",
    variants: [
      { size: "50ml", sku: "SNA-SM-04-50", price: 3200, stock: 11 },
      { size: "100ml", sku: "SNA-SM-04-100", price: 5400, stock: 8 }
    ],
    notes: {
      top: ["Calabrian Bergamot", "Mandarin"],
      heart: ["Neroli", "Solar Flowers", "White Amber"],
      base: ["Clean White Musk", "Sandalwood"]
    },
    isFeatured: true
  },
  {
    id: "perfume-2",
    name: "Ocean Blue",
    slug: "ocean-blue-perfume",
    sku: "SNA-OB-05",
    category: "Perfumes",
    gender: "Men",
    fragranceFamily: "Fresh",
    price: 2800,
    costPrice: 950,
    stock: 28,
    reservedStock: 2,
    reorderLevel: 10,
    salesCount: 245,
    revenue: 686000,
    rating: 4.8,
    reviewsCount: 142,
    status: "Active",
    imageUrl: "/products/ocean-blue-perfume.jpg",
    variants: [
      { size: "50ml", sku: "SNA-OB-05-50", price: 2800, stock: 16 },
      { size: "100ml", sku: "SNA-OB-05-100", price: 4800, stock: 12 }
    ],
    notes: {
      top: ["Italian Bergamot", "Crushed Mint", "Marine Accord"],
      heart: ["Sea Salt", "Sage", "Lavender"],
      base: ["Driftwood", "Mineral Amber", "Musk"]
    },
    isBestseller: true,
    series: "Golden Series"
  },
  {
    id: "perfume-3",
    name: "Purple Oud",
    slug: "purple-oud-perfume",
    sku: "SNA-PO-06",
    category: "Perfumes",
    gender: "Unisex",
    fragranceFamily: "Woody",
    price: 4500,
    costPrice: 1650,
    stock: 6,
    reservedStock: 1,
    reorderLevel: 8,
    salesCount: 112,
    revenue: 504000,
    rating: 4.9,
    reviewsCount: 53,
    status: "Low Stock",
    imageUrl: "/products/purple-oud-perfume.jpg",
    variants: [
      { size: "50ml", sku: "SNA-PO-06-50", price: 4500, stock: 4 },
      { size: "100ml", sku: "SNA-PO-06-100", price: 7800, stock: 2 }
    ],
    notes: {
      top: ["Ripe Pear", "Saffron", "Pink Pepper"],
      heart: ["Damask Rose", "Violet Leaf"],
      base: ["Cambodian Oud", "Leather", "Ambergris"]
    },
    isFeatured: true,
    isNewArrival: true,
    series: "Diamond Series"
  },
  {
    id: "perfume-4",
    name: "CR7",
    slug: "cr7-perfume",
    sku: "SNA-CR7-07",
    category: "Perfumes",
    gender: "Men",
    fragranceFamily: "Woody",
    price: 2500,
    costPrice: 850,
    stock: 31,
    reservedStock: 3,
    reorderLevel: 10,
    salesCount: 310,
    revenue: 775000,
    rating: 4.7,
    reviewsCount: 210,
    status: "Active",
    imageUrl: "/products/cr7-perfume.jpg",
    variants: [
      { size: "50ml", sku: "SNA-CR7-07-50", price: 2500, stock: 18 },
      { size: "100ml", sku: "SNA-CR7-07-100", price: 4200, stock: 13 }
    ],
    notes: {
      top: ["Crisp Apple", "Cardamom", "Bergamot"],
      heart: ["Smoky Cinnamon", "Cedarwood", "Iris"],
      base: ["Dark Amber", "Vanilla", "Sandalwood"]
    },
    isBestseller: true,
    series: "Golden Series"
  },
  {
    id: "perfume-5",
    name: "Dunhill Red (Inspired)",
    slug: "dunhill-red-inspired-perfume",
    sku: "SNA-DR-08",
    category: "Perfumes",
    gender: "Men",
    fragranceFamily: "Oriental",
    price: 2200,
    costPrice: 750,
    stock: 24,
    reservedStock: 2,
    reorderLevel: 8,
    salesCount: 260,
    revenue: 572000,
    rating: 4.6,
    reviewsCount: 184,
    status: "Active",
    imageUrl: "/products/dunhill-red-inspired-perfume.jpg",
    variants: [
      { size: "50ml", sku: "SNA-DR-08-50", price: 2200, stock: 14 },
      { size: "100ml", sku: "SNA-DR-08-100", price: 3800, stock: 10 }
    ],
    notes: {
      top: ["Red Apple", "Lemon", "Orange Blossom"],
      heart: ["Rose", "Teak Wood", "Patchouli"],
      base: ["Vanilla", "Musk", "Labdanum"]
    }
  },
  {
    id: "bakhoor-1",
    name: "Ameer Al Oudh",
    slug: "ameer-al-oudh-bakhoor",
    sku: "SNA-AAO-09",
    category: "Bakhoor",
    gender: "Unisex",
    fragranceFamily: "Woody",
    price: 1800,
    costPrice: 600,
    stock: 5,
    reservedStock: 2,
    reorderLevel: 10,
    salesCount: 324,
    revenue: 583200,
    rating: 4.8,
    reviewsCount: 95,
    status: "Low Stock",
    imageUrl: "/products/ameer-al-oudh-bakhoor.jpg",
    variants: [
      { size: "50g", sku: "SNA-AAO-09-50", price: 1800, stock: 3 },
      { size: "100g", sku: "SNA-AAO-09-100", price: 3200, stock: 2 }
    ],
    notes: {
      top: ["Nutmeg", "Saffron"],
      heart: ["Agarwood Resin", "Sandalwood Chips"],
      base: ["Sweet Vanilla", "Frankincense", "Amber"]
    },
    isFeatured: true,
    isBestseller: true,
    series: "Luxury Series"
  },
  {
    id: "bakhoor-2",
    name: "Oudh Salwa",
    slug: "oudh-salwa-bakhoor",
    sku: "SNA-OS-10",
    category: "Bakhoor",
    gender: "Unisex",
    fragranceFamily: "Oriental",
    price: 2100,
    costPrice: 720,
    stock: 22,
    reservedStock: 1,
    reorderLevel: 8,
    salesCount: 175,
    revenue: 367500,
    rating: 4.9,
    reviewsCount: 112,
    status: "Active",
    imageUrl: "/products/oudh-salwa-bakhoor.jpg",
    variants: [
      { size: "50g", sku: "SNA-OS-10-50", price: 2100, stock: 14 },
      { size: "100g", sku: "SNA-OS-10-100", price: 3800, stock: 8 }
    ],
    notes: {
      top: ["Saffron", "Damask Rose"],
      heart: ["Assam Oud", "Benzoin Resin"],
      base: ["Golden Amber", "White Musk"]
    },
    isNewArrival: true
  },
  {
    id: "bakhoor-3",
    name: "Oudh Safeeq",
    slug: "oudh-safeeq-bakhoor",
    sku: "SNA-OSF-11",
    category: "Bakhoor",
    gender: "Unisex",
    fragranceFamily: "Woody",
    price: 1950,
    costPrice: 680,
    stock: 17,
    reservedStock: 1,
    reorderLevel: 8,
    salesCount: 142,
    revenue: 276900,
    rating: 4.7,
    reviewsCount: 88,
    status: "Active",
    imageUrl: "/products/oudh-safeeq-bakhoor.jpg",
    variants: [
      { size: "50g", sku: "SNA-OSF-11-50", price: 1950, stock: 10 },
      { size: "100g", sku: "SNA-OSF-11-100", price: 3500, stock: 7 }
    ],
    notes: {
      top: ["Sweet Bourbon Vanilla"],
      heart: ["Aged Oud", "Earth Accord"],
      base: ["Dry Cedar", "Amber Crystals"]
    },
    isBestseller: true
  }
];

// Master Orders
export const INITIAL_ADMIN_ORDERS: AdminOrder[] = [
  {
    id: "ord-1048",
    orderNumber: "#ATW1048",
    customer: {
      id: "cust-1",
      name: "Rahul Sharma",
      email: "rahul.sharma@gmail.com",
      phone: "+91 98201 44521",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Flat 402, Sea Green Apts, Worli Sea Face, Mumbai 400018"
    },
    items: [
      { productId: "bakhoor-1", name: "Ameer Al Oudh Bakhoor", size: "50g", price: 1800, quantity: 1, imageUrl: "/products/ameer-al-oudh-bakhoor.jpg" },
      { productId: "attar-1", name: "White Oudh Attar", size: "6ml", price: 1500, quantity: 1, imageUrl: "/products/white-oudh-attar.jpg" }
    ],
    subtotal: 3300,
    discount: 330,
    couponCode: "WELCOME10",
    shipping: 0,
    tax: 0,
    total: 2970,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    transactionId: "pay_RzP9182390123",
    orderStatus: "Processing",
    courier: "BlueDart Express",
    trackingNumber: "BD-MUM-8920194",
    createdAt: "2026-08-29T11:42:00Z",
    notes: "Please pack with extra fragrance sample"
  },
  {
    id: "ord-1047",
    orderNumber: "#ATW1047",
    customer: {
      id: "cust-2",
      name: "Priya Mehta",
      email: "priya.mehta@yahoo.co.in",
      phone: "+91 98190 77312",
      city: "Mumbai",
      state: "Maharashtra",
      address: "12, Silver Oaks, Bandra West, Mumbai 400050"
    },
    items: [
      { productId: "attar-3", name: "Sabaya Attar", size: "12ml", price: 2200, quantity: 2, imageUrl: "/products/sabaya-attar.jpg" }
    ],
    subtotal: 4400,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 4400,
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    transactionId: "pay_RzP9182381284",
    orderStatus: "Packed",
    courier: "Delhivery",
    trackingNumber: "DLV992817234",
    createdAt: "2026-08-29T10:15:00Z"
  },
  {
    id: "ord-1046",
    orderNumber: "#ATW1046",
    customer: {
      id: "cust-3",
      name: "Farhan Ansari",
      email: "farhan.ansari@outlook.com",
      phone: "+91 97692 88410",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Shop 4, Crawford Market Arcade, Masjid Bunder, Mumbai 400003"
    },
    items: [
      { productId: "perfume-3", name: "Purple Oud Perfume", size: "100ml", price: 7800, quantity: 1, imageUrl: "/products/purple-oud-perfume.jpg" },
      { productId: "bakhoor-2", name: "Oudh Salwa Bakhoor", size: "100g", price: 3800, quantity: 1, imageUrl: "/products/oudh-salwa-bakhoor.jpg" }
    ],
    subtotal: 11600,
    discount: 1500,
    couponCode: "VIPOUD",
    shipping: 0,
    tax: 0,
    total: 10100,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    transactionId: "pay_RzP9182371923",
    orderStatus: "Shipped",
    courier: "BlueDart",
    trackingNumber: "BD-MUM-8920188",
    createdAt: "2026-08-29T08:30:00Z"
  },
  {
    id: "ord-1045",
    orderNumber: "#ATW1045",
    customer: {
      id: "cust-4",
      name: "Amit Verma",
      email: "amit.verma@techcorp.in",
      phone: "+91 99304 55192",
      city: "Pune",
      state: "Maharashtra",
      address: "B-601, Marvel Imperial, Koregaon Park, Pune 411001"
    },
    items: [
      { productId: "perfume-2", name: "Ocean Blue Perfume", size: "100ml", price: 4800, quantity: 1, imageUrl: "/products/ocean-blue-perfume.jpg" }
    ],
    subtotal: 4800,
    discount: 0,
    shipping: 100,
    tax: 0,
    total: 4900,
    paymentMethod: "Net Banking",
    paymentStatus: "Paid",
    transactionId: "pay_RzP9182361092",
    orderStatus: "Out for Delivery",
    courier: "Delhivery",
    trackingNumber: "DLV992815129",
    createdAt: "2026-08-28T16:20:00Z"
  },
  {
    id: "ord-1044",
    orderNumber: "#ATW1044",
    customer: {
      id: "cust-5",
      name: "Zoya Khan",
      email: "zoya.khan89@gmail.com",
      phone: "+91 98205 11984",
      city: "Hyderabad",
      state: "Telangana",
      address: "Villa 8, Jubilee Hills Road No 36, Hyderabad 500033"
    },
    items: [
      { productId: "attar-2", name: "Khmrah Attar", size: "12ml", price: 3400, quantity: 1, imageUrl: "/products/khmrah-attar.jpg" },
      { productId: "perfume-1", name: "Summer Musk Perfume", size: "50ml", price: 3200, quantity: 1, imageUrl: "/products/summer-musk-perfume.jpg" }
    ],
    subtotal: 6600,
    discount: 660,
    couponCode: "EID2026",
    shipping: 0,
    tax: 0,
    total: 5940,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    transactionId: "pay_RzP9182350812",
    orderStatus: "Delivered",
    courier: "BlueDart",
    trackingNumber: "BD-HYD-7718291",
    createdAt: "2026-08-28T12:10:00Z"
  },
  {
    id: "ord-1043",
    orderNumber: "#ATW1043",
    customer: {
      id: "cust-6",
      name: "Vikram Malhotra",
      email: "vikram.m@luxuryestate.com",
      phone: "+91 98110 33491",
      city: "New Delhi",
      state: "Delhi",
      address: "14 Golf Links, New Delhi 110003"
    },
    items: [
      { productId: "perfume-4", name: "CR7 Perfume", size: "100ml", price: 4200, quantity: 2, imageUrl: "/products/cr7-perfume.jpg" }
    ],
    subtotal: 8400,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 8400,
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    transactionId: "pay_RzP9182341908",
    orderStatus: "Delivered",
    courier: "BlueDart",
    trackingNumber: "BD-DEL-5519283",
    createdAt: "2026-08-27T14:45:00Z"
  },
  {
    id: "ord-1042",
    orderNumber: "#ATW1042",
    customer: {
      id: "cust-7",
      name: "Ananya Desai",
      email: "ananya.desai@gmail.com",
      phone: "+91 98208 99124",
      city: "Ahmedabad",
      state: "Gujarat",
      address: "704, Shivalik Heights, Bodakdev, Ahmedabad 380054"
    },
    items: [
      { productId: "bakhoor-3", name: "Oudh Safeeq Bakhoor", size: "50g", price: 1950, quantity: 1, imageUrl: "/products/oudh-safeeq-bakhoor.jpg" }
    ],
    subtotal: 1950,
    discount: 0,
    shipping: 100,
    tax: 0,
    total: 2050,
    paymentMethod: "COD",
    paymentStatus: "Pending",
    transactionId: "COD-MUM-1042",
    orderStatus: "New",
    createdAt: "2026-08-29T12:18:00Z"
  }
];

// Master Customers
export const INITIAL_ADMIN_CUSTOMERS: AdminCustomer[] = [
  {
    id: "cust-1",
    name: "Rahul Sharma",
    email: "rahul.sharma@gmail.com",
    phone: "+91 98201 44521",
    city: "Mumbai",
    state: "Maharashtra",
    segment: "VIP",
    totalOrders: 9,
    totalSpent: 38400,
    averageOrderValue: 4266,
    lastPurchaseDate: "Today",
    favoriteFamily: "Oud",
    favoriteProducts: ["Ameer Al Oudh Bakhoor", "White Oudh Attar"],
    loyaltyPoints: 3840,
    status: "Active"
  },
  {
    id: "cust-2",
    name: "Priya Mehta",
    email: "priya.mehta@yahoo.co.in",
    phone: "+91 98190 77312",
    city: "Mumbai",
    state: "Maharashtra",
    segment: "High Value",
    totalOrders: 6,
    totalSpent: 26800,
    averageOrderValue: 4466,
    lastPurchaseDate: "Today",
    favoriteFamily: "Floral",
    favoriteProducts: ["Sabaya Attar", "Summer Musk Perfume"],
    loyaltyPoints: 2680,
    status: "Active"
  },
  {
    id: "cust-3",
    name: "Farhan Ansari",
    email: "farhan.ansari@outlook.com",
    phone: "+91 97692 88410",
    city: "Mumbai",
    state: "Maharashtra",
    segment: "VIP",
    totalOrders: 14,
    totalSpent: 84500,
    averageOrderValue: 6035,
    lastPurchaseDate: "Today",
    favoriteFamily: "Oud",
    favoriteProducts: ["Purple Oud Perfume", "Oudh Salwa Bakhoor", "White Oudh Attar"],
    loyaltyPoints: 8450,
    status: "Active"
  },
  {
    id: "cust-4",
    name: "Amit Verma",
    email: "amit.verma@techcorp.in",
    phone: "+91 99304 55192",
    city: "Pune",
    state: "Maharashtra",
    segment: "Returning",
    totalOrders: 3,
    totalSpent: 12200,
    averageOrderValue: 4066,
    lastPurchaseDate: "Yesterday",
    favoriteFamily: "Fresh",
    favoriteProducts: ["Ocean Blue Perfume"],
    loyaltyPoints: 1220,
    status: "Active"
  },
  {
    id: "cust-5",
    name: "Zoya Khan",
    email: "zoya.khan89@gmail.com",
    phone: "+91 98205 11984",
    city: "Hyderabad",
    state: "Telangana",
    segment: "High Value",
    totalOrders: 5,
    totalSpent: 31500,
    averageOrderValue: 6300,
    lastPurchaseDate: "2 days ago",
    favoriteFamily: "Woody",
    favoriteProducts: ["Khmrah Attar", "Summer Musk Perfume"],
    loyaltyPoints: 3150,
    status: "Active"
  },
  {
    id: "cust-6",
    name: "Vikram Malhotra",
    email: "vikram.m@luxuryestate.com",
    phone: "+91 98110 33491",
    city: "New Delhi",
    state: "Delhi",
    segment: "VIP",
    totalOrders: 11,
    totalSpent: 62000,
    averageOrderValue: 5636,
    lastPurchaseDate: "3 days ago",
    favoriteFamily: "Woody",
    favoriteProducts: ["CR7 Perfume", "Purple Oud Perfume"],
    loyaltyPoints: 6200,
    status: "Active"
  },
  {
    id: "cust-7",
    name: "Ananya Desai",
    email: "ananya.desai@gmail.com",
    phone: "+91 98208 99124",
    city: "Ahmedabad",
    state: "Gujarat",
    segment: "New Customer",
    totalOrders: 1,
    totalSpent: 2050,
    averageOrderValue: 2050,
    lastPurchaseDate: "Today",
    favoriteFamily: "Woody",
    favoriteProducts: ["Oudh Safeeq Bakhoor"],
    loyaltyPoints: 205,
    status: "Active"
  },
  {
    id: "cust-8",
    name: "Rohan Kapoor",
    email: "rohan.k@finserve.com",
    phone: "+91 98330 12894",
    city: "Bangalore",
    state: "Karnataka",
    segment: "At Risk",
    totalOrders: 4,
    totalSpent: 16400,
    averageOrderValue: 4100,
    lastPurchaseDate: "94 days ago",
    favoriteFamily: "Oud",
    favoriteProducts: ["White Oudh Attar"],
    loyaltyPoints: 1640,
    status: "Active"
  }
];

// Abandoned Carts
export const INITIAL_ABANDONED_CARTS: AbandonedCart[] = [
  {
    id: "cart-891",
    customerName: "Karan Joharwal",
    phone: "+91 98200 48192",
    email: "karan.j@gmail.com",
    items: [
      { name: "Purple Oud Perfume (100ml)", size: "100ml", price: 7800, quantity: 1, imageUrl: "/products/purple-oud-perfume.jpg" },
      { name: "Ameer Al Oudh Bakhoor (100g)", size: "100g", price: 3200, quantity: 1, imageUrl: "/products/ameer-al-oudh-bakhoor.jpg" }
    ],
    cartValue: 11000,
    abandonedAt: "2026-08-29T10:45:00Z",
    timeAgo: "2 hours ago",
    recoveryStatus: "Not Contacted",
    aiProbability: "High"
  },
  {
    id: "cart-890",
    customerName: "Meera Singhania",
    phone: "+91 98118 73291",
    email: "meera.singhania@gmail.com",
    items: [
      { name: "Sabaya Attar (12ml)", size: "12ml", price: 2200, quantity: 2, imageUrl: "/products/sabaya-attar.jpg" },
      { name: "Summer Musk Perfume (50ml)", size: "50ml", price: 3200, quantity: 1, imageUrl: "/products/summer-musk-perfume.jpg" }
    ],
    cartValue: 7600,
    abandonedAt: "2026-08-29T09:12:00Z",
    timeAgo: "3.5 hours ago",
    recoveryStatus: "WhatsApp Sent",
    aiProbability: "High"
  },
  {
    id: "cart-889",
    customerName: "Tariq Siddiqui",
    phone: "+91 97690 19283",
    email: "tariq.s@rediffmail.com",
    items: [
      { name: "White Oudh Attar (12ml)", size: "12ml", price: 2800, quantity: 1, imageUrl: "/products/white-oudh-attar.jpg" }
    ],
    cartValue: 2800,
    abandonedAt: "2026-08-29T06:30:00Z",
    timeAgo: "6 hours ago",
    recoveryStatus: "Not Contacted",
    aiProbability: "Medium"
  }
];

// Coupons
export const INITIAL_COUPONS: Coupon[] = [
  {
    id: "coup-1",
    code: "EID2026",
    type: "Percentage",
    discountValue: 15,
    minOrderValue: 2500,
    maxDiscount: 1500,
    usageCount: 142,
    usageLimit: 500,
    startDate: "2026-08-15",
    endDate: "2026-09-15",
    status: "Active"
  },
  {
    id: "coup-2",
    code: "WELCOME10",
    type: "Percentage",
    discountValue: 10,
    minOrderValue: 1000,
    maxDiscount: 500,
    usageCount: 384,
    usageLimit: 1000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "Active"
  },
  {
    id: "coup-3",
    code: "VIPOUD",
    type: "Flat",
    discountValue: 1500,
    minOrderValue: 8000,
    usageCount: 29,
    usageLimit: 100,
    startDate: "2026-08-01",
    endDate: "2026-09-30",
    status: "Active"
  },
  {
    id: "coup-4",
    code: "FREESHIP",
    type: "Free Shipping",
    discountValue: 100,
    minOrderValue: 1500,
    usageCount: 512,
    usageLimit: 2000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "Active"
  }
];

// WhatsApp Templates
export const INITIAL_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "wa-1",
    name: "Order Confirmation",
    trigger: "Immediate on payment success",
    body: "Salam {{customer_name}}, thank you for choosing SN AttarWala! Your order {{order_id}} of {{order_total}} has been confirmed and is being prepared with olfactory care at our Mumbai boutique. Tracking link: {{tracking_url}}",
    status: "Active",
    sentCount: 1284,
    deliveredRate: "99.4%",
    readRate: "94.2%",
    clickRate: "62.1%"
  },
  {
    id: "wa-2",
    name: "Out for Delivery Alert",
    trigger: "Courier status changes to out_for_delivery",
    body: "Your signature fragrance parcel from SN AttarWala is out for delivery today with courier {{courier_name}} (OTP: {{delivery_otp}}). Please ensure someone is available at {{delivery_address}}.",
    status: "Active",
    sentCount: 1190,
    deliveredRate: "99.8%",
    readRate: "96.5%",
    clickRate: "48.3%"
  },
  {
    id: "wa-3",
    name: "Abandoned Cart 1-Click Recovery",
    trigger: "2 hours after checkout drop-off",
    body: "Hello {{customer_name}}, you left {{item_name}} in your bag! As a special treat from SN AttarWala, use code 'SCENT10' to complete your order with 10% off. Tap here to finish checkout: {{checkout_url}}",
    status: "Active",
    sentCount: 342,
    deliveredRate: "98.7%",
    readRate: "88.9%",
    clickRate: "41.5%"
  },
  {
    id: "wa-4",
    name: "Back in Stock VIP Notification",
    trigger: "Restock of wishlisted/viewed item",
    body: "Exciting news! {{product_name}} is back in stock at SN AttarWala in limited quantities. Secure your bottle before it sells out again: {{product_url}}",
    status: "Active",
    sentCount: 89,
    deliveredRate: "100%",
    readRate: "92.1%",
    clickRate: "58.4%"
  }
];

// Audit Logs
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "log-1",
    user: "SN Attarwala",
    role: "Super Admin",
    action: "Updated Product Price",
    module: "Shop / Products",
    details: "Changed White Oudh 12ml price from ₹2,600 to ₹2,800",
    timestamp: "2026-08-29 12:42 PM",
    ip: "103.21.144.92"
  },
  {
    id: "log-2",
    user: "Murtaza Attarwala",
    role: "Store Manager",
    action: "Stock In / Restock",
    module: "Shop / Inventory",
    details: "Restocked 20 units of Sabaya Attar 6ml",
    timestamp: "2026-08-29 11:38 AM",
    ip: "103.21.144.92"
  },
  {
    id: "log-3",
    user: "Sameer Sheikh",
    role: "Warehouse Operations",
    action: "Order Status Updated",
    module: "Shop / Orders",
    details: "Marked order #ATW1046 as Shipped via BlueDart",
    timestamp: "2026-08-29 10:21 AM",
    ip: "103.21.144.95"
  },
  {
    id: "log-4",
    user: "SN Attarwala",
    role: "Super Admin",
    action: "Created Campaign",
    module: "Marketing / Campaigns",
    details: "Launched 'Mumbai Monsoon Oud Festival' WhatsApp blast",
    timestamp: "2026-08-28 04:50 PM",
    ip: "103.21.144.92"
  },
  {
    id: "log-5",
    user: "Fatima Merchant",
    role: "Customer Support",
    action: "Resolved Support Ticket",
    module: "Operations / Support",
    details: "Resolved ticket #TCK-881 (Address correction for #ATW1045)",
    timestamp: "2026-08-28 02:15 PM",
    ip: "103.21.144.96"
  }
];

// ─── UI-compatible aliases & extended types added for admin pages ───────────

export interface AdminCoupon {
  id: string;
  code: string;
  type: "Percentage" | "Fixed";
  value: number;
  minOrderValue: number;
  usedCount: number;
  maxUses: number;
  validFrom: string;
  validUntil: string;
  status: "Active" | "Inactive" | "Expired" | "Scheduled";
  applicableCategories: string[];
  revenueGenerated: number;
}

export const ADMIN_COUPONS: AdminCoupon[] = [
  { id: "coup-1", code: "WELCOME10", type: "Percentage", value: 10, minOrderValue: 999, usedCount: 284, maxUses: 500, validFrom: "2026-01-01", validUntil: "2026-12-31", status: "Active", applicableCategories: ["All"], revenueGenerated: 124800 },
  { id: "coup-2", code: "VIPOUD", type: "Percentage", value: 15, minOrderValue: 5000, usedCount: 89, maxUses: 200, validFrom: "2026-06-01", validUntil: "2026-10-31", status: "Active", applicableCategories: ["Attars", "Perfumes"], revenueGenerated: 218400 },
  { id: "coup-3", code: "EID2026", type: "Percentage", value: 12, minOrderValue: 1500, usedCount: 142, maxUses: 1000, validFrom: "2026-03-01", validUntil: "2026-04-15", status: "Expired", applicableCategories: ["All"], revenueGenerated: 89600 },
  { id: "coup-4", code: "FREESHIP", type: "Fixed", value: 100, minOrderValue: 1500, usedCount: 512, maxUses: 2000, validFrom: "2026-01-01", validUntil: "2026-12-31", status: "Active", applicableCategories: ["All"], revenueGenerated: 51200 },
  { id: "coup-5", code: "MUMBAI15", type: "Percentage", value: 15, minOrderValue: 2500, usedCount: 0, maxUses: 300, validFrom: "2026-09-01", validUntil: "2026-09-30", status: "Scheduled", applicableCategories: ["All"], revenueGenerated: 0 }
];

/** WhatsApp template UI shape with metrics sub-object (used by whatsapp page) */
export interface WhatsAppTemplateUI {
  id: string;
  name: string;
  trigger: string;
  message: string;
  status: "Active" | "Paused";
  metrics: { sent: number; delivered: number; read: number; replied: number };
}

export const ADMIN_WA_TEMPLATES: WhatsAppTemplateUI[] = [
  { id: "wa-1", name: "Order Confirmation", trigger: "On payment success", message: "Salam {{customer_name}}, your ATTARWALA order {{order_id}} is confirmed! We are packaging your premium fragrance with care. Track: {{tracking_url}}", status: "Active", metrics: { sent: 1284, delivered: 1277, read: 1209, replied: 798 } },
  { id: "wa-2", name: "Out for Delivery Alert", trigger: "Courier OFD status", message: "Your fragrance parcel from ATTARWALA is out for delivery today via {{courier_name}}! OTP: {{delivery_otp}}. Please ensure someone is available.", status: "Active", metrics: { sent: 1190, delivered: 1188, read: 1149, replied: 575 } },
  { id: "wa-3", name: "Abandoned Cart Recovery", trigger: "2 hrs after checkout drop-off", message: "Salam! You left {{item_name}} in your ATTARWALA cart. Use code COMEBACK10 for 10% off - valid for 24 hours only! Complete your order: {{checkout_url}}", status: "Active", metrics: { sent: 342, delivered: 338, read: 304, replied: 142 } },
  { id: "wa-4", name: "Back In Stock VIP Alert", trigger: "On product restock", message: "Great news! {{product_name}} is back in stock at ATTARWALA in limited quantities. Secure your bottle now: {{product_url}}", status: "Active", metrics: { sent: 89, delivered: 89, read: 82, replied: 52 } }
];

export interface AdminCustomerExtended {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  segment: string;
  ordersCount: number;
  totalSpent: number;
  reviewsCount: number;
  lastPurchase: string;
  address?: string;
  favouriteFragrances?: string[];
  purchaseHistory?: { orderId: string; date: string; items: number; total: number; status: string }[];
}

export const INITIAL_ADMIN_CUSTOMERS_EXT: AdminCustomerExtended[] = INITIAL_ADMIN_CUSTOMERS.map((c, i) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  city: c.city,
  state: c.state,
  segment: c.segment === "New Customer" ? "New" : c.segment,
  ordersCount: c.totalOrders,
  totalSpent: c.totalSpent,
  reviewsCount: Math.floor(c.totalOrders * 0.6),
  lastPurchase: c.lastPurchaseDate,
  address: c.city + ", " + c.state,
  favouriteFragrances: c.favoriteProducts,
  purchaseHistory: Array.from({ length: Math.min(c.totalOrders, 3) }, (_, j) => ({
    orderId: "#ATW" + String(1048 - i - j),
    date: j === 0 ? c.lastPurchaseDate : String(j * 7) + " days ago",
    items: 1 + (j % 2),
    total: Math.round(c.averageOrderValue * 0.9),
    status: j === 0 ? "Processing" : "Delivered"
  }))
}));

export interface AbandonedCartExtended {
  id: string;
  customer: { name: string; phone: string; email: string; city: string };
  items: { name: string; size: string; price: number; quantity: number; imageUrl: string }[];
  cartValue: number;
  abandonedAt: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export const INITIAL_ABANDONED_CARTS_EXT: AbandonedCartExtended[] = INITIAL_ABANDONED_CARTS.map((c, i) => ({
  id: c.id,
  customer: { name: c.customerName, phone: c.phone, email: c.email, city: ["Mumbai", "Pune", "Hyderabad", "Delhi"][i % 4] },
  items: c.items,
  cartValue: c.cartValue,
  abandonedAt: c.timeAgo,
  priority: (c.aiProbability === "High" ? "HIGH" : c.aiProbability === "Medium" ? "MEDIUM" : "LOW") as "HIGH" | "MEDIUM" | "LOW"
}));
