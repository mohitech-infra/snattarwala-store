-- Drop existing tables if needed (useful for resets, uncomment carefully)
-- drop table if exists order_items cascade;
-- drop table if exists orders cascade;
-- drop table if exists cart_items cascade;
-- drop table if exists wishlist_items cascade;
-- drop table if exists reviews cascade;
-- drop table if exists product_images cascade;
-- drop table if exists products cascade;
-- drop table if exists categories cascade;
-- drop table if exists brands cascade;
-- drop table if exists profiles cascade;
-- drop table if exists addresses cascade;
-- drop table if exists coupons cascade;
-- drop table if exists store_locations cascade;
-- drop table if exists newsletter_subscribers cascade;

-- Enable uuid-ossp extension for UUID generation
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends Supabase Auth users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  phone text,
  role text default 'customer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Addresses Table
create table addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  full_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  area text,
  city text default 'Mumbai',
  state text default 'Maharashtra',
  pincode text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Categories Table
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Brands Table
create table brands (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Products Table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  brand_id uuid references brands(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  description text not null,
  short_description text,
  price decimal(10,2) not null,
  compare_at_price decimal(10,2),
  sku text unique,
  stock_quantity integer default 0 not null,
  size text, -- e.g. 50ml, 100ml
  gender text, -- Men, Women, Unisex
  fragrance_type text, -- EDP, EDT, Parfum
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

-- 6. Product Images Table
create table product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  image_url text not null,
  alt_text text,
  display_order integer default 0,
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Reviews Table
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  title text,
  content text,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Cart Items Table (Persistent Cart)
create table cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade, -- Nullable for guest carts
  session_id text, -- For guest carts
  product_id uuid references products(id) on delete cascade not null,
  quantity integer default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id),
  unique(session_id, product_id)
);

-- 9. Wishlist Items Table
create table wishlist_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- 10. Coupons Table
create table coupons (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  discount_type text not null, -- 'percentage' or 'fixed'
  discount_value decimal(10,2) not null,
  min_order_amount decimal(10,2) default 0,
  max_discount_amount decimal(10,2),
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Orders Table
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete set null,
  order_number text unique not null,
  status text default 'pending' not null, -- pending, confirmed, processing, packed, shipped, out_for_delivery, delivered, cancelled
  subtotal decimal(10,2) not null,
  discount_amount decimal(10,2) default 0,
  shipping_amount decimal(10,2) default 0,
  tax_amount decimal(10,2) default 0,
  total_amount decimal(10,2) not null,
  coupon_code text,
  
  -- Snapshot of address at time of order
  shipping_name text not null,
  shipping_phone text not null,
  shipping_address_line1 text not null,
  shipping_address_line2 text,
  shipping_area text,
  shipping_city text not null,
  shipping_state text not null,
  shipping_pincode text not null,
  
  -- Payment Info
  payment_method text not null, -- razorpay, cod
  payment_status text default 'pending' not null, -- pending, paid, failed, refunded
  razorpay_order_id text,
  razorpay_payment_id text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Order Items Table
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_sku text,
  quantity integer not null,
  unit_price decimal(10,2) not null,
  total_price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. Store Locations Table
create table store_locations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text not null,
  phone text,
  opening_hours text,
  google_maps_embed_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. Newsletter Subscribers Table
create table newsletter_subscribers (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table addresses enable row level security;
alter table categories enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table reviews enable row level security;
alter table cart_items enable row level security;
alter table wishlist_items enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table store_locations enable row level security;
alter table newsletter_subscribers enable row level security;

-- Profiles: Users can view and edit their own profile
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
-- Admins can view and edit all
create policy "Admins can view all profiles" on profiles for select using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can update all profiles" on profiles for update using (auth.uid() in (select id from profiles where role = 'admin'));

-- Products, Categories, Brands, Images, Stores: Public can read active ones
create policy "Public can view active products" on products for select using (is_active = true);
create policy "Public can view categories" on categories for select using (true);
create policy "Public can view brands" on brands for select using (true);
create policy "Public can view product images" on product_images for select using (true);
create policy "Public can view store locations" on store_locations for select using (is_active = true);

-- Orders: Users can view their own orders
create policy "Users can view their own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can view their own order items" on order_items for select using (auth.uid() = (select user_id from orders where orders.id = order_items.order_id));
-- Order creation is typically handled via server-side API using service role to prevent tampering, 
-- but we can allow insert if needed. We'll use service role for orders to be safe.

-- Wishlist: Users can manage their own wishlist
create policy "Users can manage their wishlist" on wishlist_items for all using (auth.uid() = user_id);

-- Cart: Users can manage their own cart (guest cart relies on session_id, we might need a workaround for RLS with session_id, or use service_role for guest carts)
create policy "Users can manage their cart" on cart_items for all using (auth.uid() = user_id);
-- For guest carts, we'll likely use service role in Next.js API routes

-- Function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, role)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 'customer');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
