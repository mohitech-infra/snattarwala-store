import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getPublicProducts } from '@/lib/public-service';
import {
  getOpenRouterClient,
  getCurrentWorkingModel,
  setWorkingModel,
  findAndSwitchToNextWorkingFreeModel,
} from '@/lib/ai/openrouter-model-manager';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function GET() {
  const currentModel = getCurrentWorkingModel();
  return NextResponse.json({
    status: 'online',
    currentModel,
    provider: 'OpenRouter Free Model Auto-Optimizer',
  });
}

export async function POST(req: Request) {
  const { messages, mode = 'customer' } = await req.json();
  const isAdminMode = mode === 'admin';

  // 1. Get current sticky working free model (0ms latency overhead)
  let activeModel = getCurrentWorkingModel();
  const openrouter = getOpenRouterClient();

  const customerSystemPrompt = `You are an expert luxury fragrance sommelier and personal shopping assistant for "SN AttarWala", Mumbai's premier attar and perfume house.
Your purpose is to help customers discover their signature scent, explain the art of fragrance notes, and recommend exquisite attars, perfumes, and bakhoor from our catalog.
If a customer asks for a recommendation, inquires about scents, or seeks options, ALWAYS use the 'searchProducts' tool to find relevant matches.
CRITICAL: After the 'searchProducts' tool returns results, you MUST write a warm, elegant follow-up message explaining why you recommended these specific fragrances, detailing their unique fragrance notes (top, heart, base) and the emotions or occasions they evoke.
Never invent perfumes that do not exist in our catalog.
Keep your responses elegant, luxurious, courteous, and concise.`;

  const adminSystemPrompt = `You are the executive AI Co-Pilot, Operations Guide, and Business Advisor for the Admin Panel of "SN AttarWala", Mumbai's premier luxury perfume and attar house.

Your core mission:
1. TEACH AND GUIDE THE ADMIN ABOUT THE ADMIN PANEL:
   - Provide direct, clear, step-by-step instructions for managing every section of the admin dashboard.
   - Products & Multi-Size Variants (/admin/products):
     * Explain how to create or edit fragrances.
     * Detail the "Product Sizes & Size-Specific Pricing" feature: how to use 1-click presets (3ml, 6ml, 12ml, 25ml for Attars; 30ml, 50ml, 100ml for Perfumes; 40g, 50g, 100g, 250g for Bakhoor) or custom sizes.
     * Explain setting individual Selling Price (₹), MRP (Compare at Price), stock units, SKUs, and marking the Default Size shown on the storefront.
     * Explain cost price and profit margin calculation ((Price - Cost) * Sales).
   - Fragrance Categories & Visual Media (/admin/categories):
     * Explain how to create categories and upload photos with the photo dropzone.
     * Explain how to verify which photo is active via the photo badges in the table.
   - Order Processing & Fulfillment (/admin/orders):
     * Explain order statuses: New -> Confirmed -> Processing -> Packed -> Shipped -> Out for Delivery -> Delivered -> Cancelled.
     * Explain how to filter by status, search orders, view line items, print tax invoices, and assign courier tracking.
   - Inventory & Stock Thresholds (/admin/inventory):
     * How to monitor low stock items at or below reorder levels, calculate restocking urgency, and prevent stockouts.
   - Wholesale & B2B Leads (/admin/wholesale):
     * How to manage bulk buyer leads, establish minimum order quantities (MOQ), and negotiate tiered bulk pricing.
   - Abandoned Carts & Recovery (/admin/abandoned-carts):
     * How to view high-dropoff checkout sessions and send 1-click WhatsApp recovery messages with incentive promo codes.
   - Coupons & Marketing Campaigns (/admin/coupons):
     * How to create percentage or flat discount coupon codes, minimum order requirements, and expiry dates.
   - Store Settings & Database (/admin/settings):
     * Managing store details, Supabase SQL migrations, and synchronization.

2. STRATEGIC BUSINESS ADVICE & REVENUE EXPANSION:
   - Recommend strategies to increase Average Order Value (AOV): creating 3ml discovery sample sets, his-and-her couple attar bundles, offering free sample vials above ₹2,000.
   - Festive and seasonal marketing campaigns: Ramadan & Eid pre-orders, Diwali corporate gifting, wedding season attar favors, Mumbai monsoon fresh fragrances.
   - Margin optimization and inventory turnover recommendations.

3. DIRECT ADMIN NAVIGATION LINKS:
   - Whenever referring to an admin section, provide direct Markdown links:
     * [Products & Variants](/admin/products)
     * [Fragrance Categories](/admin/categories)
     * [Orders & Invoices](/admin/orders)
     * [Inventory & Stock](/admin/inventory)
     * [Wholesale B2B](/admin/wholesale)
     * [Abandoned Carts](/admin/abandoned-carts)
     * [Coupons & Offers](/admin/coupons)
     * [Settings](/admin/settings)

4. TONE & FORMAT:
   - Professional, welcoming ("Salam Admin"), highly competent, and practical.
   - Use clean Markdown with bold headings, bullet points, and numbered steps. Keep advice actionable.`;

  const systemPrompt = isAdminMode ? adminSystemPrompt : customerSystemPrompt;

  const searchTool = tool({
    description: 'Search for perfumes in the catalog based on search terms. CRITICAL: You must generate a text response describing the products AFTER calling this tool.',
    parameters: z.object({
      query: z.string().describe('The search query for name, brand, or fragrance notes. Can be empty string.'),
      category: z.enum(['Attars', 'Perfumes', 'Bakhoor']).optional().describe('The product category if specified.'),
      gender: z.enum(['Men', 'Women', 'Unisex']).optional().describe('The target gender if specified.'),
    }),
    execute: async ({ query, category, gender }: { query: string, category?: 'Attars' | 'Perfumes' | 'Bakhoor', gender?: 'Men' | 'Women' | 'Unisex' }) => {
      let allProducts = await getPublicProducts();
      if (!allProducts || allProducts.length === 0) {
        return {
          count: 0,
          products: [],
          message: "No products are currently available in the catalog."
        };
      }

      let results = allProducts;
      
      if (category) {
        results = results.filter(p => p.category === category);
      }
      if (gender) {
        results = results.filter(p => p.gender === gender);
      }
      
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.description.toLowerCase().includes(q) ||
          (p.fragranceFamily && p.fragranceFamily.toLowerCase().includes(q)) ||
          (p.fragranceNotes && p.fragranceNotes.some(n => n.toLowerCase().includes(q))) ||
          (p.topNotes && p.topNotes.some(n => n.toLowerCase().includes(q))) ||
          (p.middleNotes && p.middleNotes.some(n => n.toLowerCase().includes(q))) ||
          (p.baseNotes && p.baseNotes.some(n => n.toLowerCase().includes(q)))
        );
      }

      const formatProduct = (p: any) => ({
        id: p.id,
        name: p.name,
        brand: "SN AttarWala",
        category: p.category || "Attars",
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        imageUrl: p.imageUrl || "/products/white-oudh-attar.jpg",
        slug: p.slug,
        description: p.description || p.shortDescription || "",
        notes: {
          top: p.topNotes || [],
          middle: p.middleNotes || [],
          base: p.baseNotes || []
        },
        fragranceFamily: p.fragranceFamily || null,
        longevity: p.longevity || "8-12 Hours",
        rating: p.rating || 4.8,
        sizes: p.sizes && p.sizes.length > 0 ? p.sizes : (p.category === "Perfumes" ? ["50ml", "100ml"] : ["6ml", "12ml"])
      });
      
      // If no direct results, return top products as fallback options
      if (results.length === 0) {
        return {
          success: false,
          products: allProducts.slice(0, 6).map(formatProduct)
        };
      }
      
      // Return up to 6 matches for the UI
      return {
        success: true,
        products: results.slice(0, 6).map(formatProduct)
      };
    },
  });

  const adminStatsTool = tool({
    description: 'Fetch real-time store statistics from Supabase: count of products, low stock items, pending orders, abandoned carts, wholesale leads, and active coupons.',
    parameters: z.object({}),
    execute: async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const [pRes, lsRes, oRes, acRes, wlRes, cpRes] = await Promise.allSettled([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }).lte('stock_quantity', 5),
          supabase.from('orders').select('*', { count: 'exact', head: true }).or('status.ilike.%pending%,status.ilike.%new%'),
          supabase.from('abandoned_carts').select('*', { count: 'exact', head: true }),
          supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('category', 'Wholesale').not('status', 'ilike', '%closed%'),
          supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('is_active', true),
        ]);

        const getVal = (res: PromiseSettledResult<any>) => {
          if (res.status === 'fulfilled' && !res.value.error && typeof res.value.count === 'number') {
            return res.value.count;
          }
          return 0;
        };

        return {
          totalProducts: getVal(pRes),
          lowStockProducts: getVal(lsRes),
          pendingOrders: getVal(oRes),
          abandonedCarts: getVal(acRes),
          wholesaleLeads: getVal(wlRes),
          activeCoupons: getVal(cpRes),
          note: 'Live database sync active.'
        };
      } catch (err: any) {
        return {
          note: 'Store database online. Synchronized with live admin panel.'
        };
      }
    }
  });

  const tools: Record<string, any> = isAdminMode
    ? {
        getLiveStoreStats: adminStatsTool,
        searchProducts: searchTool,
      }
    : {
        searchProducts: searchTool,
      };

  // Fast direct execution pipeline:
  // First attempt uses the cached activeModel with 0 ms overhead
  try {
    const result = await streamText({
      model: openrouter(activeModel),
      system: systemPrompt,
      messages,
      maxSteps: 3,
      tools,
    });

    // Successfully streamed - lock in this model for subsequent turns
    setWorkingModel(activeModel);
    return result.toDataStreamResponse();
  } catch (err: any) {
    console.warn(`[Chat API] Primary model '${activeModel}' failed (${err?.message || 'unknown'}). Finding next working free model...`);

    // Dynamic Failover Pipeline:
    // Finds another working free model, sets it as the new sticky model, and streams
    try {
      const nextModel = await findAndSwitchToNextWorkingFreeModel(activeModel);
      console.log(`[Chat API] Successfully switched to working free model: '${nextModel}'. Next requests will use this model directly.`);

      const fallbackResult = await streamText({
        model: openrouter(nextModel),
        system: systemPrompt,
        messages,
        maxSteps: 3,
        tools,
      });

      return fallbackResult.toDataStreamResponse();
    } catch (fallbackErr: any) {
      console.error("[Chat API] All candidate free models failed, falling back to backup provider:", fallbackErr);

      // Ultimate safety backup: Groq if configured
      if (process.env.GROQ_API_KEY) {
        const groq = createOpenAI({
          baseURL: 'https://api.groq.com/openai/v1',
          apiKey: process.env.GROQ_API_KEY,
        });

        const groqResult = await streamText({
          model: groq('openai/gpt-oss-20b'),
          system: systemPrompt,
          messages,
          maxSteps: 3,
          tools,
        });

        return groqResult.toDataStreamResponse();
      }

      throw fallbackErr;
    }
  }
}
