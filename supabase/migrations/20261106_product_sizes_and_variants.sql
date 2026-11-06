-- ==============================================================================
-- S.N. ATTARWALA: PRODUCT SIZES & MULTI-VARIANT PRICING MIGRATION
-- Migration Date: November 6, 2026
-- Description: Adds multi-size variant support, size-specific pricing,
--              compare-at pricing, and inventory management per size.
-- ==============================================================================

-- 1. Ensure required extensions exist
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. ADD VARIANT COLUMNS TO PRODUCTS TABLE (IF NOT ALREADY PRESENT)
-- ==============================================================================

-- 2.1 Add 'variants' JSONB column to store size array directly on the product record
alter table public.products
  add column if not exists variants jsonb default '[]'::jsonb;

-- 2.2 Add 'size' text column for quick display summary (e.g. "3ml, 6ml, 12ml")
alter table public.products
  add column if not exists size text;

-- 2.3 Create a GIN index on products(variants) for rapid JSON querying
create index if not exists idx_products_variants_gin
  on public.products using gin (variants);

-- ==============================================================================
-- 3. CREATE DEDICATED RELATIONAL TABLE: product_variants
-- ==============================================================================

create table if not exists public.product_variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  sku text,
  price decimal(10,2) not null default 0,
  compare_at_price decimal(10,2),
  stock_quantity integer not null default 0,
  is_default boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_product_size unique (product_id, size)
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================

create index if not exists idx_product_variants_product_id
  on public.product_variants(product_id);

create index if not exists idx_product_variants_sku
  on public.product_variants(sku);

create index if not exists idx_product_variants_is_default
  on public.product_variants(is_default);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on product_variants
alter table public.product_variants enable row level security;

-- Drop previous policies if they exist to ensure clean idempotent run
drop policy if exists "Public can view product variants" on public.product_variants;
drop policy if exists "Authenticated users can manage product variants" on public.product_variants;
drop policy if exists "Service role has full access to product variants" on public.product_variants;

-- 5.1 Public / Storefront read access
create policy "Public can view product variants"
  on public.product_variants
  for select
  using (true);

-- 5.2 Authenticated / Admin full access
create policy "Authenticated users can manage product variants"
  on public.product_variants
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 5.3 Service role full access
create policy "Service role has full access to product variants"
  on public.product_variants
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

-- ==============================================================================
-- 6. AUTOMATIC TIMESTAMP TRIGGER
-- ==============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_product_variants_updated_at on public.product_variants;

create trigger set_product_variants_updated_at
  before update on public.product_variants
  for each row
  execute function public.handle_updated_at();

-- ==============================================================================
-- 7. OPTIONAL BACKFILL / MIGRATION OF EXISTING PRODUCTS
-- Populates default variants for any existing products without variants
-- ==============================================================================

do $$
declare
  prod record;
  v_default_size text;
  v_compare_price numeric;
begin
  for prod in select id, name, sku, price, compare_at_price, stock_quantity, variants, size from public.products loop
    if prod.variants is null or jsonb_array_length(prod.variants) = 0 then
      v_default_size := coalesce(prod.size, '12ml');
      v_compare_price := coalesce(prod.compare_at_price, round(prod.price * 1.25));

      -- Update products.variants JSONB
      update public.products
      set
        variants = jsonb_build_array(
          jsonb_build_object(
            'size', v_default_size,
            'sku', coalesce(prod.sku, 'SNA-' || substr(prod.id::text, 1, 6)),
            'price', prod.price,
            'compareAtPrice', v_compare_price,
            'stock', prod.stock_quantity,
            'isDefault', true
          )
        ),
        size = v_default_size
      where id = prod.id;

      -- Insert into relational product_variants table
      insert into public.product_variants (product_id, size, sku, price, compare_at_price, stock_quantity, is_default)
      values (
        prod.id,
        v_default_size,
        coalesce(prod.sku, 'SNA-' || substr(prod.id::text, 1, 6)),
        prod.price,
        v_compare_price,
        prod.stock_quantity,
        true
      )
      on conflict (product_id, size) do nothing;
    end if;
  end loop;
end $$;
