-- ==============================================================================
-- CLEAN SLATE SCRIPT: RESET STORE TO ZERO (0 Products, 0 Orders, 0 Inventory)
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project.
-- 3. Click on "SQL Editor" in the left sidebar.
-- 4. Click "New Query", paste this entire script, and click "Run".
-- ==============================================================================

DO $$
BEGIN
  -- 1. Clear shopping carts & wishlists (only if the tables exist)
  IF to_regclass('public.cart_items') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.cart_items';
  END IF;

  IF to_regclass('public.wishlists') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.wishlists';
  END IF;

  IF to_regclass('public.wishlist_items') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.wishlist_items';
  END IF;

  IF to_regclass('public.reviews') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.reviews';
  END IF;

  -- 2. Clear test orders & order items
  IF to_regclass('public.order_items') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.order_items';
  END IF;

  IF to_regclass('public.orders') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.orders';
  END IF;

  -- 3. Clear product variants and product images
  IF to_regclass('public.product_variants') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.product_variants';
  END IF;

  IF to_regclass('public.product_images') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.product_images';
  END IF;

  -- 4. Delete all products
  IF to_regclass('public.products') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.products';
  END IF;

  -- 5. Clear test abandoned carts
  IF to_regclass('public.abandoned_carts') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.abandoned_carts';
  END IF;
END $$;

-- 6. Verification: Confirms all core tables are at 0
SELECT 'products' AS entity, count(*) AS count FROM public.products
UNION ALL
SELECT 'product_variants', count(*) FROM public.product_variants
UNION ALL
SELECT 'product_images', count(*) FROM public.product_images
UNION ALL
SELECT 'orders', count(*) FROM public.orders
UNION ALL
SELECT 'order_items', count(*) FROM public.order_items;
