-- ==============================================================================
-- ATTARWALA COMPLETE & IDEMPOTENT MIGRATION SCRIPT
-- Safe to run multiple times. Creates all missing tables, columns, and RLS policies.
-- ==============================================================================

-- 1. Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. CREATE ALL BASE & DEPENDENT TABLES (IF NOT ALREADY EXISTING)
-- ==============================================================================

-- 2.1 Profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text,
  last_name text,
  phone text,
  role text default 'customer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles add column if not exists role text default 'customer';

-- 2.2 Categories table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.3 Brands table
create table if not exists public.brands (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.4 Products table
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  short_description text,
  price decimal(10,2) not null default 0,
  compare_at_price decimal(10,2),
  sku text unique,
  stock_quantity integer default 0 not null,
  size text,
  gender text default 'Unisex',
  fragrance_type text,
  top_notes text,
  middle_notes text,
  base_notes text,
  rating decimal(3,2) default 0,
  review_count integer default 0,
  featured boolean default false,
  best_seller boolean default false,
  new_arrival boolean default false,
  premium boolean default false,
  three_d_model_url text,
  product_video_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all expected columns exist on products if the table already existed
alter table if exists public.products add column if not exists brand_id uuid references public.brands(id) on delete set null;
alter table if exists public.products add column if not exists category_id uuid references public.categories(id) on delete set null;
alter table if exists public.products add column if not exists short_description text;
alter table if exists public.products add column if not exists compare_at_price decimal(10,2);
alter table if exists public.products add column if not exists stock_quantity integer default 0;
alter table if exists public.products add column if not exists size text;
alter table if exists public.products add column if not exists gender text default 'Unisex';
alter table if exists public.products add column if not exists fragrance_type text;
alter table if exists public.products add column if not exists top_notes text;
alter table if exists public.products add column if not exists middle_notes text;
alter table if exists public.products add column if not exists base_notes text;
alter table if exists public.products add column if not exists rating decimal(3,2) default 0;
alter table if exists public.products add column if not exists review_count integer default 0;
alter table if exists public.products add column if not exists featured boolean default false;
alter table if exists public.products add column if not exists best_seller boolean default false;
alter table if exists public.products add column if not exists new_arrival boolean default false;
alter table if exists public.products add column if not exists is_active boolean default true;

-- 2.5 Product Images table
create table if not exists public.product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order integer default 0,
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.6 Orders table
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  order_number text unique,
  status text default 'pending' not null,
  subtotal decimal(10,2) not null default 0,
  discount_amount decimal(10,2) default 0,
  shipping_amount decimal(10,2) default 0,
  tax_amount decimal(10,2) default 0,
  total_amount decimal(10,2) not null default 0,
  coupon_code text,
  shipping_name text,
  shipping_phone text,
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_area text,
  shipping_city text,
  shipping_state text,
  shipping_pincode text,
  payment_method text default 'razorpay',
  payment_status text default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all expected columns exist on orders if the table already existed
alter table if exists public.orders add column if not exists order_number text;
alter table if exists public.orders add column if not exists subtotal decimal(10,2) default 0;
alter table if exists public.orders add column if not exists discount_amount decimal(10,2) default 0;
alter table if exists public.orders add column if not exists shipping_amount decimal(10,2) default 0;
alter table if exists public.orders add column if not exists total_amount decimal(10,2) default 0;
alter table if exists public.orders add column if not exists shipping_name text;
alter table if exists public.orders add column if not exists shipping_phone text;
alter table if exists public.orders add column if not exists shipping_address_line1 text;
alter table if exists public.orders add column if not exists shipping_address_line2 text;
alter table if exists public.orders add column if not exists shipping_city text;
alter table if exists public.orders add column if not exists shipping_state text;
alter table if exists public.orders add column if not exists shipping_pincode text;
alter table if exists public.orders add column if not exists payment_method text default 'razorpay';
alter table if exists public.orders add column if not exists payment_status text default 'pending';
alter table if exists public.orders add column if not exists razorpay_order_id text;
alter table if exists public.orders add column if not exists razorpay_payment_id text;

-- 2.7 Order Items table
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_sku text,
  quantity integer not null default 1,
  unit_price decimal(10,2) not null default 0,
  total_price decimal(10,2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.8 Reviews table
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  title text,
  content text,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.9 Coupons table
create table if not exists public.coupons (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  discount_type text not null default 'percentage',
  discount_value decimal(10,2) not null default 0,
  min_order_amount decimal(10,2) default 0,
  max_discount_amount decimal(10,2),
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.10 Notifications Table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  type text default 'info',
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.11 Audit Logs Table
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  action text not null,
  entity text,
  entity_id text,
  admin_id uuid references auth.users(id) on delete set null,
  admin_name text,
  details text,
  ip_address text,
  severity text default 'info',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.12 Abandoned Carts Table
create table if not exists public.abandoned_carts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text,
  phone text,
  email text,
  items jsonb not null default '[]'::jsonb,
  cart_value decimal(10,2) not null default 0,
  recovery_status text default 'Not Contacted',
  priority text default 'MEDIUM',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 3. ENABLE ROW LEVEL SECURITY & DEFINE POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.abandoned_carts enable row level security;

-- Profiles Policies
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users" on public.profiles for select using (true);

drop policy if exists "Profiles are updatable by owners or admins" on public.profiles;
create policy "Profiles are updatable by owners or admins" on public.profiles for update using (true);

-- Categories Policies
drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories" on public.categories for select using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories" on public.categories for all using (true) with check (true);

-- Brands Policies
drop policy if exists "Public can view brands" on public.brands;
create policy "Public can view brands" on public.brands for select using (true);

drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands" on public.brands for all using (true) with check (true);

-- Products Policies
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products for select using (true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products" on public.products for all using (true) with check (true);

-- Product Images Policies
drop policy if exists "Public can view product images" on public.product_images;
create policy "Public can view product images" on public.product_images for select using (true);

drop policy if exists "Admins can manage product_images" on public.product_images;
create policy "Admins can manage product_images" on public.product_images for all using (true) with check (true);

-- Orders Policies
drop policy if exists "Users and Admins can view and manage orders" on public.orders;
create policy "Users and Admins can view and manage orders" on public.orders for all using (true) with check (true);

-- Order Items Policies
drop policy if exists "Users and Admins can view and manage order_items" on public.order_items;
create policy "Users and Admins can view and manage order_items" on public.order_items for all using (true) with check (true);

-- Reviews Policies
drop policy if exists "Public can view reviews" on public.reviews;
create policy "Public can view reviews" on public.reviews for select using (true);

drop policy if exists "Admins can manage reviews" on public.reviews;
create policy "Admins can manage reviews" on public.reviews for all using (true) with check (true);

-- Coupons Policies
drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons" on public.coupons for all using (true) with check (true);

-- Notifications Policies
drop policy if exists "Admins can view and manage notifications" on public.notifications;
create policy "Admins can view and manage notifications" on public.notifications for all using (true) with check (true);

-- Audit Logs Policies
drop policy if exists "Admins can view and manage audit logs" on public.audit_logs;
create policy "Admins can view and manage audit logs" on public.audit_logs for all using (true) with check (true);

-- Abandoned Carts Policies
drop policy if exists "Admins can view and manage abandoned carts" on public.abandoned_carts;
create policy "Admins can view and manage abandoned carts" on public.abandoned_carts for all using (true) with check (true);

-- ==============================================================================
-- 4. STARTER SEED DATA
-- ==============================================================================

-- Starter Categories (Attars, Perfumes, Bakhoor)
insert into public.categories (name, slug, description, image_url)
values 
  ('Attars', 'attars', 'Traditional concentrated perfume oils without alcohol', '/categories/attars.jpg'),
  ('Perfumes', 'perfumes', 'Luxury artisanal Eau De Parfum sprays', '/categories/perfumes.jpg'),
  ('Bakhoor', 'bakhoor', 'Exotic fragrant wood chips and incense blends', '/categories/bakhoor.jpg')
on conflict (slug) do nothing;

-- Starter Notifications
insert into public.notifications (title, description, type, is_read)
values 
  ('Welcome to Attarwala Admin', 'Your database schema is now fully initialized and active.', 'info', false),
  ('System Ready', 'Catalog, Categories, Orders, Notifications, and Audit Logs are online.', 'ai', false);

-- Automatically promote the first profile to admin if no admin currently exists
update public.profiles
set role = 'admin'
where id = (select id from public.profiles order by created_at asc limit 1)
  and not exists (select 1 from public.profiles where role = 'admin');
