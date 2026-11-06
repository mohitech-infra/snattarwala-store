-- ==============================================================================
-- CLEAN SLATE SCRIPT: RESET STORE TO ZERO (0 Products, 0 Orders, 0 Inventory)
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project.
-- 3. Click on "SQL Editor" in the left sidebar.
-- 4. Click "New Query", paste this entire script, and click "Run".
-- ==============================================================================

BEGIN;

-- 1. Clear shopping carts, wishlists, and reviews (references products)
DELETE FROM public.cart_items;
DELETE FROM public.wishlists;
DELETE FROM public.reviews;

-- 2. Clear test orders & order items (references products)
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- 3. Clear product variants and product images (references products with FK)
DELETE FROM public.product_images;
DELETE FROM public.product_variants;

-- 4. Delete all products
DELETE FROM public.products;

-- 5. Clear test abandoned carts
DELETE FROM public.abandoned_carts;

COMMIT;

-- 6. Verification Query: Confirms every table is at 0
SELECT 'products' AS entity, count(*) AS count FROM public.products
UNION ALL
SELECT 'product_variants', count(*) FROM public.product_variants
UNION ALL
SELECT 'product_images', count(*) FROM public.product_images
UNION ALL
SELECT 'orders', count(*) FROM public.orders
UNION ALL
SELECT 'order_items', count(*) FROM public.order_items;
