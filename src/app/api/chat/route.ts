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
  const { messages } = await req.json();

  // 1. Get current sticky working free model (0ms latency overhead)
  let activeModel = getCurrentWorkingModel();
  const openrouter = getOpenRouterClient();

  const systemPrompt = `You are an expert luxury fragrance sommelier and personal shopping assistant for "SN AttarWala", Mumbai's premier attar and perfume house.
Your purpose is to help customers discover their signature scent, explain the art of fragrance notes, and recommend exquisite attars, perfumes, and bakhoor from our catalog.
If a customer asks for a recommendation, inquires about scents, or seeks options, ALWAYS use the 'searchProducts' tool to find relevant matches.
CRITICAL: After the 'searchProducts' tool returns results, you MUST write a warm, elegant follow-up message explaining why you recommended these specific fragrances, detailing their unique fragrance notes (top, heart, base) and the emotions or occasions they evoke.
Never invent perfumes that do not exist in our catalog.
Keep your responses elegant, luxurious, courteous, and concise.`;

  const searchTool = tool({
    description: 'Search for perfumes in the catalog based on search terms. CRITICAL: You must generate a text response describing the products AFTER calling this tool.',
    parameters: z.object({
      query: z.string().describe('The search query for name, brand, or fragrance notes. Can be empty string.'),
      category: z.enum(['Attars', 'Perfumes', 'Bakhoor']).optional().describe('The product category if specified.'),
      gender: z.enum(['Men', 'Women', 'Unisex']).optional().describe('The target gender if specified.'),
    }),
    execute: async ({ query, category, gender }: { query: string, category?: 'Attars' | 'Perfumes' | 'Bakhoor', gender?: 'Men' | 'Women' | 'Unisex' }) => {
      const allProducts = await getPublicProducts();
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
      
      // If no direct results, return top products as fallback options
      if (results.length === 0) {
        return {
          success: false,
          products: allProducts.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            brand: "SN AttarWala",
            price: p.price,
            imageUrl: p.imageUrl,
            slug: p.slug
          }))
        };
      }
      
      // Return up to 3 matches for the UI
      return {
        success: true,
        products: results.slice(0, 3).map(p => ({
          id: p.id,
          name: p.name,
          brand: "SN AttarWala",
          price: p.price,
          imageUrl: p.imageUrl,
          slug: p.slug
        }))
      };
    },
  });

  // Fast direct execution pipeline:
  // First attempt uses the cached activeModel with 0 ms overhead
  try {
    const result = await streamText({
      model: openrouter(activeModel),
      system: systemPrompt,
      messages,
      maxSteps: 3,
      tools: {
        searchProducts: searchTool,
      },
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
        tools: {
          searchProducts: searchTool,
        },
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
          model: groq('llama-3.3-70b-versatile'),
          system: systemPrompt,
          messages,
          maxSteps: 3,
          tools: {
            searchProducts: searchTool,
          },
        });

        return groqResult.toDataStreamResponse();
      }

      throw fallbackErr;
    }
  }
}
