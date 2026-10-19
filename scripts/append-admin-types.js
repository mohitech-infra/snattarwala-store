const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'lib', 'admin-data.ts');
const existing = fs.readFileSync(file, 'utf8');

if (existing.includes('AdminCoupon')) {
  console.log('Types already appended, skipping.');
  process.exit(0);
}

const append = `
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

export const INITIAL_COUPONS: AdminCoupon[] = [
  { id: "coup-1", code: "WELCOME10", type: "Percentage", value: 10, minOrderValue: 999, usedCount: 284, maxUses: 500, validFrom: "2026-01-01", validUntil: "2026-12-31", status: "Active", applicableCategories: ["All"], revenueGenerated: 124800 },
  { id: "coup-2", code: "VIPOUD", type: "Percentage", value: 15, minOrderValue: 5000, usedCount: 89, maxUses: 200, validFrom: "2026-06-01", validUntil: "2026-10-31", status: "Active", applicableCategories: ["Attars", "Perfumes"], revenueGenerated: 218400 },
  { id: "coup-3", code: "EID2026", type: "Percentage", value: 12, minOrderValue: 1500, usedCount: 142, maxUses: 1000, validFrom: "2026-03-01", validUntil: "2026-04-15", status: "Expired", applicableCategories: ["All"], revenueGenerated: 89600 },
  { id: "coup-4", code: "FREESHIP", type: "Fixed", value: 100, minOrderValue: 1500, usedCount: 512, maxUses: 2000, validFrom: "2026-01-01", validUntil: "2026-12-31", status: "Active", applicableCategories: ["All"], revenueGenerated: 51200 },
  { id: "coup-5", code: "MUMBAI15", type: "Percentage", value: 15, minOrderValue: 2500, usedCount: 0, maxUses: 300, validFrom: "2026-09-01", validUntil: "2026-09-30", status: "Scheduled", applicableCategories: ["All"], revenueGenerated: 0 }
];

export interface WhatsAppTemplate {
  id: string;
  name: string;
  trigger: string;
  message: string;
  status: "Active" | "Paused";
  metrics: { sent: number; delivered: number; read: number; replied: number };
}

export const INITIAL_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
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
`;

fs.writeFileSync(file, existing.trimEnd() + '\n' + append);
console.log('Success - types appended to admin-data.ts');
