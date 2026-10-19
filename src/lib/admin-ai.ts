// ATTARWALA AI Advisor & Business Intelligence System

export interface AIInsight {
  id: string;
  type: "CRITICAL" | "HIGH" | "MEDIUM" | "OPPORTUNITY";
  category: "Inventory" | "Sales" | "Marketing" | "Customer" | "Conversion";
  title: string;
  description: string;
  recommendedAction: string;
  actionButtonLabel: string;
  actionTarget: string;
  metric?: string;
  impact?: string;
}

export const ADMIN_AI_INSIGHTS: AIInsight[] = [
  {
    id: "ins-1",
    type: "HIGH",
    category: "Inventory",
    title: "Ameer Al Oudh Bakhoor Stock Depletion Risk",
    description: "Your Ameer Al Oudh Bakhoor is selling 34% faster than 30-day average. At current velocity of 4.2 units/day, remaining stock (5 units) will deplete in less than 36 hours.",
    recommendedAction: "Authorize immediate transfer of 30 units from Crawford Market warehouse and place supplier PO.",
    actionButtonLabel: "Restock Now",
    actionTarget: "/admin/inventory",
    metric: "36 hrs to stockout",
    impact: "+₹48,000 protected revenue"
  },
  {
    id: "ins-2",
    type: "OPPORTUNITY",
    category: "Marketing",
    title: "High Cart Cross-Sell Affinity: White Oudh + Sabaya",
    description: "Data shows that 68% of customers who purchase White Oudh also view Sabaya within 7 days. Creating a dual 'His & Her Royal Attar' bundle discount can boost AOV by +₹1,200.",
    recommendedAction: "Publish a 'Royal Couple Attar Set' coupon or homepage offer at ₹2,499 (10% bundled discount).",
    actionButtonLabel: "Create Coupon Offer",
    actionTarget: "/admin/coupons",
    metric: "+₹1,200 AOV lift",
    impact: "+22% basket size"
  },
  {
    id: "ins-3",
    type: "CRITICAL",
    category: "Conversion",
    title: "18 Abandoned High-Value Carts (₹48,200 Total)",
    description: "18 customers added premium fragrances (Purple Oud & Khmrah) in the past 24 hours but stopped at the shipping step. Most are from Metro Mumbai.",
    recommendedAction: "Review abandoned carts to identify high-dropoff products and adjust free shipping threshold.",
    actionButtonLabel: "Review Abandoned Carts",
    actionTarget: "/admin/abandoned-carts",
    metric: "₹48,200 at stake",
    impact: "18 sessions analyzed"
  },
  {
    id: "ins-4",
    type: "MEDIUM",
    category: "Customer",
    title: "Returning VIP Loyalty Velocity",
    description: "VIP customers (Farhan Ansari, Vikram Malhotra, etc.) now represent 41% of monthly store revenue while making up only 8% of customer count.",
    recommendedAction: "Issue exclusive store discount codes for returning VIPs to boost retention and lifetime value.",
    actionButtonLabel: "View VIP Segment",
    actionTarget: "/admin/customers",
    metric: "41% revenue share",
    impact: "+92% retention rate"
  }
];

export function getAIStoreResponse(query: string): {
  answer: string;
  dataPoints: { label: string; value: string }[];
  suggestedAction?: { label: string; href: string };
} {
  const q = query.toLowerCase();

  if (q.includes("promote") || q.includes("focus") || q.includes("today")) {
    return {
      answer: "Based on real-time traffic and seasonal monsoon demand in Mumbai, I recommend promoting **Ameer Al Oudh Bakhoor** and **Ocean Blue Perfume**. Ocean Blue is seeing a 42% surge in male buyer searches, while Bakhoor incense usage peaks during the festive & evening hours. Featuring these on your homepage hero can yield an estimated +18% conversion lift.",
      dataPoints: [
        { label: "Top Trending Scent", value: "Ocean Blue (245 units)" },
        { label: "Predicted Conversion Lift", value: "+18.4%" },
        { label: "Estimated Daily Revenue", value: "₹45,000 - ₹62,000" }
      ],
      suggestedAction: {
        label: "Create Coupon Offer",
        href: "/admin/coupons"
      }
    };
  }

  if (q.includes("why") || q.includes("sales fall") || q.includes("conversion")) {
    return {
      answer: "Yesterday's slight revenue dip (-4.2%) was primarily due to 2 out-of-stock SKUs (**Royal Oud** and **Khmrah 12ml**) which usually account for 14% of gross volume. Checkout page bounce rates increased from 18% to 29% when visitors saw 'Out of Stock' badges. Restocking these immediately will restore standard baseline revenue.",
      dataPoints: [
        { label: "Lost Opportunity Revenue", value: "₹18,400" },
        { label: "OOS Drop-off Rate", value: "29.1%" },
        { label: "Active Demand Waiting", value: "34 back-in-stock alerts" }
      ],
      suggestedAction: {
        label: "Manage Inventory",
        href: "/admin/inventory"
      }
    };
  }

  if (q.includes("best") || q.includes("top selling") || q.includes("bestseller")) {
    return {
      answer: "Your #1 best-selling product this month is **CR7 Perfume** (310 units, ₹7,75,000), followed closely by **White Oudh Attar** (384 units, ₹5,76,000) and **Ameer Al Oudh Bakhoor** (324 units, ₹5,83,200). Together, these 3 SKUs generate 54.8% of your store's total gross income.",
      dataPoints: [
        { label: "#1 Best Seller", value: "CR7 Perfume (₹7.75L)" },
        { label: "#2 Best Seller", value: "Ameer Al Oudh (₹5.83L)" },
        { label: "Concentration Ratio", value: "54.8% of Total" }
      ],
      suggestedAction: {
        label: "View Product Analytics",
        href: "/admin/analytics"
      }
    };
  }

  if (q.includes("stock") || q.includes("inventory") || q.includes("low")) {
    return {
      answer: "There are currently **3 critical low stock products**: **Ameer Al Oudh Bakhoor** (5 units left, ~36 hours remaining), **Purple Oud Perfume** (6 units left, ~4 days remaining), and **Khmrah Attar** (8 units left, ~5 days remaining). Total restock PO capital required is ₹32,400.",
      dataPoints: [
        { label: "Immediate Restock SKUs", value: "3 Products" },
        { label: "Capital Needed", value: "₹32,400" },
        { label: "Expected Gross Return", value: "₹94,800" }
      ],
      suggestedAction: {
        label: "Initiate Restock PO",
        href: "/admin/inventory"
      }
    };
  }

  if (q.includes("bundle") || q.includes("average order") || q.includes("aov")) {
    return {
      answer: "To increase your Average Order Value from ₹1,742 to ₹2,200+, implement a 3-tier 'Master Perfumer Discovery Trio' (6ml White Oudh + 50g Ameer Al Oudh + 50ml Ocean Blue) priced at ₹5,499. Customers frequently add incense alongside pure attars.",
      dataPoints: [
        { label: "Current AOV", value: "₹1,742" },
        { label: "Target AOV", value: "₹2,250" },
        { label: "Projected Gross Margin", value: "62.4%" }
      ],
      suggestedAction: {
        label: "Build Discovery Bundle",
        href: "/admin/products"
      }
    };
  }

  if (q.includes("eid") || q.includes("campaign") || q.includes("marketing") || q.includes("discount") || q.includes("offer")) {
    return {
      answer: "For your upcoming **Eid / Festive Promotion**, I recommend creating an exclusive promotional coupon 'EID2026' (15% off over ₹2,500) and announcing it on the homepage promotional bar. You can also offer a complimentary 3ml Royal Amber sample with all orders above ₹4,000.",
      dataPoints: [
        { label: "Recommended Promo Code", value: "EID2026" },
        { label: "Projected Promotion Revenue", value: "₹3,40,000" },
        { label: "Discount Tier", value: "15% off orders > ₹2,500" }
      ],
      suggestedAction: {
        label: "Create Eid Coupon",
        href: "/admin/coupons"
      }
    };
  }

  // Default intelligent analysis
  return {
    answer: `Store health is strong today. Revenue stands at **₹8,45,280** (+18.4% vs last period) with **1,284 total orders**. Customer lifetime value across Mumbai, Pune, and Hyderabad has expanded by +9.8%. Focus on recovering the 18 abandoned carts (₹48,200) and restock Ameer Al Oudh Bakhoor before tonight's peak shopping hours.`,
    dataPoints: [
      { label: "Today's Gross Sales", value: "₹8,45,280" },
      { label: "Cart Recovery Opportunity", value: "₹48,200" },
      { label: "Store Conversion Rate", value: "3.8%" }
    ],
    suggestedAction: {
      label: "View Executive Dashboard",
      href: "/admin"
    }
  };
}
