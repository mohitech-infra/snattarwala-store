import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getPublicProducts } from '@/lib/public-service';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: groq('openai/gpt-oss-20b'), // Reliable and fast for function calling
    system: `You are an expert luxury fragrance assistant for "SN AttarWala".
Your job is to help customers find their signature scent, explain fragrance notes, and recommend perfumes from the catalog.
If a customer asks for a recommendation, is looking for a specific type of perfume, or you want to show them options, ALWAYS use the 'searchProducts' tool to find relevant matches and present them.
CRITICAL: After the 'searchProducts' tool returns results, you MUST write a follow-up message explaining why you recommended these specific perfumes, detailing their unique fragrance notes (top, heart, base) and the feeling they evoke. Do not just blindly show the products without a luxurious description.
Never invent products that are not in the catalog.
Keep your responses elegant, concise, and luxurious.`,
    messages,
    tools: {
      searchProducts: tool({
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
          
          // If no results, return fallbacks
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
      }),
    },
  });

  return result.toDataStreamResponse();
}
