const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const contentFile = 'C:\\Users\\Anishhh\\.gemini\\antigravity-ide\\brain\\cb28f627-4526-421a-9663-48b6c1310e26\\.system_generated\\steps\\378\\content.md';
const content = fs.readFileSync(contentFile, 'utf8');

// Strip out the metadata at the top of content.md to just get HTML
const htmlStart = content.indexOf('<!DOCTYPE html>');
const html = htmlStart !== -1 ? content.slice(htmlStart) : content;

const $ = cheerio.load(html);
const products = [];

$('ul.products li.product').each((i, el) => {
  const $el = $(el);
  const name = $el.find('h2.woocommerce-loop-product__title').text().trim();
  
  // Try to find image
  let imageUrl = $el.find('img.attachment-woocommerce_thumbnail').attr('src');
  if (!imageUrl) {
    imageUrl = $el.find('img').attr('src');
  }

  // Parse price (remove currency symbol and commas)
  const priceHtml = $el.find('span.price').html() || '';
  let price = 0;
  let compareAtPrice = 0;
  
  if ($el.find('span.price ins').length > 0) {
    const saleStr = $el.find('span.price ins .woocommerce-Price-amount bdi').text().replace(/[^0-9.]/g, '');
    const regStr = $el.find('span.price del .woocommerce-Price-amount bdi').text().replace(/[^0-9.]/g, '');
    price = parseFloat(saleStr) || 0;
    compareAtPrice = parseFloat(regStr) || 0;
  } else {
    const regStr = $el.find('span.price .woocommerce-Price-amount bdi').text().replace(/[^0-9.]/g, '');
    price = parseFloat(regStr) || 0;
    compareAtPrice = price; // No sale
  }

  // Generate slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (name) {
    products.push({
      id: `hashmi-${i}`,
      name,
      slug,
      brand: "Hashmi Perfumes",
      price,
      compareAtPrice,
      imageUrl: imageUrl || "/placeholder.jpg",
      description: `Experience the elegant and refreshing scent of ${name}. Perfect for everyday wear, this deodorant offers long-lasting freshness and an unforgettable fragrance trail.`,
      fragranceFamily: "Fresh/Deodorant",
      topNotes: ["Fresh Notes"],
      middleNotes: ["Floral Notes"],
      baseNotes: ["Musk"],
      rating: 4.8,
      reviews: Math.floor(Math.random() * 100) + 10,
      sizes: ["200ml"],
      inStock: true
    });
  }
});

// Write to src/lib/products.ts
const outputPath = path.join(__dirname, '../src/lib/products.ts');

const tsContent = `export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  compareAtPrice: number;
  imageUrl: string;
  description: string;
  fragranceFamily: string;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  rating: number;
  reviews: number;
  sizes: string[];
  inStock: boolean;
  slug: string;
}

export const DUMMY_PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};
`;

fs.mkdirSync(path.join(__dirname, '../src/lib'), { recursive: true });
fs.writeFileSync(outputPath, tsContent);
console.log(`Successfully scraped ${products.length} products to src/lib/products.ts`);
