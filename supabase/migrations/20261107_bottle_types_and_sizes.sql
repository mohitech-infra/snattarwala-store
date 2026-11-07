-- ==============================================================================
-- MIGRATION: BOTTLE SIZES & BOTTLE TYPES VARIANT SYSTEM
-- Description: Adds and standardizes bottle size and bottle type selectors
--              (Spray, Roll-On, Glass Dipstick, Crystal Decanter, Pocket Atomizer)
-- ==============================================================================

-- 1. Ensure 'variants' jsonb column exists on public.products
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- 2. Add an optional default bottle_type column on products
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS bottle_type TEXT DEFAULT 'Roll-On';

-- 3. Update existing products to have bottleType populated in their variants
UPDATE public.products
SET variants = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', COALESCE(elem->>'id', gen_random_uuid()::text),
      'size', COALESCE(elem->>'size', 'Standard'),
      'bottleType', COALESCE(
        elem->>'bottleType', 
        elem->>'bottle_type',
        CASE 
          WHEN (SELECT name FROM public.categories WHERE id = products.category_id) ILIKE '%perfume%' THEN 'Fine Mist Spray'
          WHEN (SELECT name FROM public.categories WHERE id = products.category_id) ILIKE '%bakhoor%' THEN 'Airtight Glass Jar'
          WHEN (elem->>'size') ILIKE '%25ml%' OR (elem->>'size') ILIKE '%50ml%' THEN 'Crystal Decanter'
          ELSE 'Roll-On'
        END
      ),
      'price', COALESCE((elem->>'price')::numeric, products.price),
      'compareAtPrice', CASE WHEN elem->>'compareAtPrice' IS NOT NULL THEN (elem->>'compareAtPrice')::numeric ELSE products.compare_at_price END,
      'stock', COALESCE((elem->>'stock')::int, products.stock_quantity, 20),
      'sku', COALESCE(elem->>'sku', products.sku || '-' || COALESCE(elem->>'size', 'STD')),
      'isDefault', COALESCE((elem->>'isDefault')::boolean, (elem_idx = 1))
    )
  )
  FROM jsonb_array_elements(products.variants) WITH ORDINALITY AS arr(elem, elem_idx)
)
WHERE products.variants IS NOT NULL AND jsonb_array_length(products.variants) > 0;

COMMENT ON COLUMN public.products.variants IS 'Array of size and bottle type variants: [{"size":"12ml","bottleType":"Roll-On","price":1400,"compareAtPrice":1800,"stock":25,"sku":"SNA-12ML-ROL","isDefault":true}]';
