// ATTARWALA AI Advisor & Business Intelligence System
// Live Operational Intelligence & Store Management Engine

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
    id: "ins-catalog",
    type: "HIGH",
    category: "Inventory",
    title: "Catalog Multi-Size Pricing & SKU Management",
    description: "Every fragrance listed supports multiple bottle sizes (3ml, 6ml, 12ml, 25ml, 50ml, 100ml) with independent pricing, compare-at discounts, and stock levels.",
    recommendedAction: "Review catalog products and configure size variants in the Products tab.",
    actionButtonLabel: "Manage Products",
    actionTarget: "/admin/products",
    metric: "Multi-size enabled",
    impact: "Maximizes AOV"
  },
  {
    id: "ins-google",
    type: "OPPORTUNITY",
    category: "Marketing",
    title: "Google Shopping & Merchant Center Synchronization",
    description: "Your dynamic RSS 2.0 XML product feed publishes every sellable size variant to Google Shopping in compliance with Indian INR pricing specifications.",
    recommendedAction: "Check feed readiness scores and verify variant IDs in the Google Shopping tab.",
    actionButtonLabel: "View Shopping Feed",
    actionTarget: "/admin/google-shopping",
    metric: "Dynamic XML active",
    impact: "Pan-India reach"
  }
];

export function getAIStoreResponse(query: string): {
  answer: string;
  dataPoints: { label: string; value: string }[];
  suggestedAction?: { label: string; href: string };
} {
  const q = query.toLowerCase();

  if (q.includes("variant") || q.includes("size") || q.includes("add product") || q.includes("price")) {
    return {
      answer: "To add **multi-size variants & size-specific pricing**:\n\n1. Go to [Products](/admin/products) and click **Add New Fragrance**.\n2. In the **Product Sizes & Size-Specific Pricing** section, choose standard presets (e.g. `3ml, 6ml, 12ml` for Attars or `30ml, 50ml, 100ml` for Perfumes).\n3. Enter individual **Selling Price (₹)**, **Compare at Price (₹)**, and **Stock** for each size.\n4. Click **Set Default** on the primary size you wish to feature on the storefront.\n5. Save the product to sync it live to your storefront and Google Shopping feed.",
      dataPoints: [
        { label: "Variant Support", value: "3ml to 100ml" },
        { label: "Price Control", value: "Per-size Independent" },
        { label: "Google Feed Sync", value: "Automatic" }
      ],
      suggestedAction: {
        label: "Go to Products",
        href: "/admin/products"
      }
    };
  }

  if (q.includes("category") || q.includes("photo") || q.includes("cover") || q.includes("image")) {
    return {
      answer: "To manage **Fragrance Categories & Cover Photos**:\n\n1. Navigate to [Categories](/admin/categories).\n2. When adding or editing a category, use the **Upload Category Cover Photo** dropzone to drag & drop or upload luxury imagery.\n3. The table displays a thumbnail preview and photo status badge (`Photo Active` in emerald or `No Photo` in amber).\n4. Category photos automatically update across your homepage grid and navigation menus.",
      dataPoints: [
        { label: "Supported Formats", value: "JPG, PNG, WEBP" },
        { label: "Recommended Ratio", value: "1:1 Square / 4:5" },
        { label: "Active Sections", value: "Homepage & Menus" }
      ],
      suggestedAction: {
        label: "Manage Categories",
        href: "/admin/categories"
      }
    };
  }

  if (q.includes("order") || q.includes("invoice") || q.includes("fulfill") || q.includes("shipping")) {
    return {
      answer: "To process **Customer Orders & Invoices**:\n\n1. Visit [Orders](/admin/orders).\n2. Filter orders by status: `New`, `Confirmed`, `Processing`, `Packed`, `Shipped`, or `Delivered`.\n3. Click on any Order ID to view customer delivery details, selected bottle sizes, and payment method.\n4. Generate and print GST-compliant tax invoices with 1 click.\n5. Update tracking numbers for BlueDart or Delhivery dispatch.",
      dataPoints: [
        { label: "Order Pipeline", value: "Real-time Synced" },
        { label: "Invoicing", value: "Printable PDF" },
        { label: "Courier Integration", value: "BlueDart / Delhivery" }
      ],
      suggestedAction: {
        label: "View Orders",
        href: "/admin/orders"
      }
    };
  }

  if (q.includes("google") || q.includes("feed") || q.includes("merchant")) {
    return {
      answer: "To inspect your **Google Shopping Feed**:\n\n1. Go to [Google Shopping Feed](/admin/google-shopping).\n2. Review the live readiness counters (Ready %, Missing SKU, Out of Stock).\n3. Use the filterable audit table to verify each variant before exporting.\n4. Click the code icon on any item to preview its exact `<item>` XML snippet.\n5. Copy your live feed URL (`https://snattarwala.in/feeds/google-shopping.xml`) and register it in Google Merchant Center.",
      dataPoints: [
        { label: "Feed Format", value: "RSS 2.0 / Google XML" },
        { label: "Currency", value: "INR (Indian Rupee)" },
        { label: "Update Frequency", value: "Live / Scheduled Daily" }
      ],
      suggestedAction: {
        label: "Open Shopping Dashboard",
        href: "/admin/google-shopping"
      }
    };
  }

  if (q.includes("stock") || q.includes("inventory") || q.includes("reorder")) {
    return {
      answer: "To track **Inventory & Reorder Levels**:\n\n1. Open [Inventory](/admin/inventory).\n2. Review items flagged as `Low Stock` or `Out of Stock`.\n3. Update unit counts or reorder thresholds directly.\n4. Stock counts sync immediately to customer cart checks and Google Shopping availability.",
      dataPoints: [
        { label: "Stock Sync", value: "Real-Time" },
        { label: "Out of Stock Rule", value: "Prevents Overselling" }
      ],
      suggestedAction: {
        label: "Manage Inventory",
        href: "/admin/inventory"
      }
    };
  }

  // Default intelligent assistant response
  return {
    answer: "Salam Admin! I am your live **SN AttarWala Business Advisor & Operations Co-Pilot**.\n\nI monitor your store's live Supabase database, variant inventory, order fulfillment, and Google Shopping feed.\n\nYou can ask me about:\n• Adding products with multi-size variants & prices\n• Uploading category photos\n• Processing pending orders & invoices\n• Managing wholesale inquiries\n• Optimizing average order value (AOV)",
    dataPoints: [
      { label: "Database", value: "Connected to Supabase" },
      { label: "Google Feed", value: "Live Dynamic XML" },
      { label: "AI Engine", value: "Active & Real-Time" }
    ],
    suggestedAction: {
      label: "Go to Products",
      href: "/admin/products"
    }
  };
}
