-- ============================================================
-- ATTARWALA — Complete Supabase Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text,
  last_name     text,
  phone         text unique,
  email         text,
  city          text,
  state         text,
  address       text,
  pincode       text,
  total_orders  int default 0,
  total_spent   numeric(12,2) default 0,
  loyalty_tier  text default 'Standard' check (loyalty_tier in ('Standard','Silver','Gold','VIP')),
  is_whatsapp_opted_in boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Service role has full access to profiles" on public.profiles using (true) with check (true);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 2. PRODUCTS
-- ============================================================
create table if not exists public.products (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text unique not null,
  sku                 text unique,
  description         text,
  short_description   text,
  category            text not null,
  gender              text default 'Unisex',
  fragrance_family    text,
  price               numeric(10,2) not null,
  cost_price          numeric(10,2),
  sale_price          numeric(10,2),
  stock               int not null default 0,
  reserved_stock      int default 0,
  reorder_level       int default 10,
  sales_count         int default 0,
  revenue             numeric(12,2) default 0,
  rating              numeric(3,2) default 0,
  reviews_count       int default 0,
  image_url           text,
  images              jsonb default '[]',
  variants            jsonb default '[]',
  notes               jsonb default '{"top":[],"heart":[],"base":[]}',
  tags                text[] default '{}',
  is_featured         boolean default false,
  is_bestseller       boolean default false,
  is_new_arrival      boolean default false,
  is_active           boolean default true,
  status              text default 'Active' check (status in ('Active','Draft','Low Stock','Out of Stock')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_status_idx on public.products(status);

alter table public.products enable row level security;
create policy "Anyone can view active products" on public.products for select using (is_active = true);
create policy "Service role full access to products" on public.products using (true) with check (true);


-- ============================================================
-- 3. ORDERS
-- ============================================================
create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  order_number    text unique not null,
  user_id         uuid references auth.users(id) on delete set null,
  customer_name   text not null,
  customer_email  text,
  customer_phone  text,
  customer_city   text,
  customer_state  text,
  customer_address text,
  customer_pincode text,
  items           jsonb not null default '[]',
  subtotal        numeric(10,2) not null default 0,
  discount        numeric(10,2) default 0,
  shipping_charge numeric(10,2) default 0,
  total_amount    numeric(10,2) not null,
  coupon_code     text,
  status          text default 'Pending' check (status in (
    'Pending','Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Refunded'
  )),
  payment_method  text default 'Razorpay',
  payment_status  text default 'Paid' check (payment_status in ('Paid','Pending','Failed','Refunded')),
  razorpay_order_id   text,
  razorpay_payment_id text,
  tracking_number text,
  courier_partner text,
  notes           text,
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_order_number_idx on public.orders(order_number);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

alter table public.orders enable row level security;
create policy "Users can view their own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Service role full access to orders" on public.orders using (true) with check (true);

-- Auto generate order number (ATW1001, ATW1002...)
create or replace function public.generate_order_number()
returns trigger language plpgsql as $$
declare
  counter int;
begin
  select count(*) + 1001 into counter from public.orders;
  new.order_number := 'ATW' || lpad(counter::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists set_order_number on public.orders;
create trigger set_order_number
  before insert on public.orders
  for each row
  when (new.order_number is null or new.order_number = '')
  execute function public.generate_order_number();


-- ============================================================
-- 4. REVIEWS
-- ============================================================
create table if not exists public.reviews (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid references public.products(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  order_id      uuid references public.orders(id) on delete set null,
  author_name   text not null,
  author_email  text,
  rating        int not null check (rating between 1 and 5),
  title         text,
  body          text not null,
  is_verified   boolean default false,
  is_approved   boolean default false,
  is_featured   boolean default false,
  helpful_count int default 0,
  images        text[] default '{}',
  created_at    timestamptz default now()
);

create index if not exists reviews_product_id_idx on public.reviews(product_id);
create index if not exists reviews_approved_idx on public.reviews(is_approved);

alter table public.reviews enable row level security;
create policy "Anyone can view approved reviews" on public.reviews for select using (is_approved = true);
create policy "Authenticated users can insert reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Service role full access to reviews" on public.reviews using (true) with check (true);


-- ============================================================
-- 5. COUPONS
-- ============================================================
create table if not exists public.coupons (
  id                  uuid primary key default uuid_generate_v4(),
  code                text unique not null,
  description         text,
  discount_type       text not null check (discount_type in ('percentage','fixed')),
  discount_value      numeric(10,2) not null,
  min_order_value     numeric(10,2) default 0,
  max_discount_amount numeric(10,2),
  usage_limit         int,
  usage_count         int default 0,
  per_user_limit      int default 1,
  is_active           boolean default true,
  valid_from          timestamptz default now(),
  valid_until         timestamptz,
  applicable_categories text[] default '{}',
  created_at          timestamptz default now()
);

alter table public.coupons enable row level security;
create policy "Anyone can view active coupons" on public.coupons for select using (is_active = true);
create policy "Service role full access to coupons" on public.coupons using (true) with check (true);

insert into public.coupons (code, description, discount_type, discount_value, min_order_value, usage_limit, valid_until)
values
  ('WELCOME10',  'Welcome discount for new customers',     'percentage', 10, 0,    null, now() + interval '1 year'),
  ('COMEBACK10', 'Abandoned cart recovery discount',       'percentage', 10, 0,    null, now() + interval '1 year'),
  ('EID2026',    'Eid Al Adha celebration discount',       'percentage', 15, 500,  null, '2026-09-15'),
  ('DIWALI20',   'Diwali 2026 VIP early access',           'percentage', 20, 1000, null, '2026-11-01'),
  ('FLAT200',    'Flat ₹200 off on orders above ₹1,500',   'fixed',      200, 1500, null, now() + interval '6 months'),
  ('MUMBAI25',   'Mumbai Flash Sale — 25% off storewide',  'percentage', 25, 0,   500,  now() + interval '7 days')
on conflict (code) do nothing;


-- ============================================================
-- 6. WISHLISTS
-- ============================================================
create table if not exists public.wishlists (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  product_id    uuid references public.products(id) on delete cascade,
  product_name  text not null,
  product_slug  text,
  price         numeric(10,2),
  image_url     text,
  category      text,
  created_at    timestamptz default now(),
  unique(user_id, product_id)
);

create index if not exists wishlists_user_id_idx on public.wishlists(user_id);

alter table public.wishlists enable row level security;
create policy "Users can manage their own wishlist" on public.wishlists
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Service role full access to wishlists" on public.wishlists using (true) with check (true);


-- ============================================================
-- 7. ABANDONED CARTS
-- ============================================================
create table if not exists public.abandoned_carts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete set null,
  customer_name   text,
  phone           text,
  email           text,
  items           jsonb not null default '[]',
  cart_value      numeric(10,2) not null default 0,
  recovery_status text default 'Not Contacted' check (recovery_status in (
    'Not Contacted','WhatsApp Sent','Email Sent','Recovered','Dismissed'
  )),
  priority        text default 'MEDIUM' check (priority in ('HIGH','MEDIUM','LOW')),
  recovered_at    timestamptz,
  recovered_order_id uuid references public.orders(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists abandoned_carts_status_idx on public.abandoned_carts(recovery_status);
create index if not exists abandoned_carts_created_at_idx on public.abandoned_carts(created_at desc);

alter table public.abandoned_carts enable row level security;
create policy "Service role full access to abandoned_carts" on public.abandoned_carts using (true) with check (true);


-- ============================================================
-- 8. RETURNS
-- ============================================================
create table if not exists public.returns (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete set null,
  order_id        uuid references public.orders(id) on delete set null,
  order_number    text not null,
  customer_name   text,
  phone           text,
  email           text,
  product_name    text not null,
  quantity        int default 1,
  price           numeric(10,2),
  reason          text not null,
  reason_code     text check (reason_code in (
    'damaged','wrong_item','not_as_described','changed_mind','quality_issue'
  )),
  image_url       text,
  status          text default 'Pending Review' check (status in (
    'Pending Review','Approved','Rejected','Refunded','Replacement Sent'
  )),
  admin_notes     text,
  refund_amount   numeric(10,2),
  refunded_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists returns_user_id_idx on public.returns(user_id);
create index if not exists returns_status_idx on public.returns(status);

alter table public.returns enable row level security;
create policy "Users can view their own returns" on public.returns for select using (auth.uid() = user_id);
create policy "Users can insert returns" on public.returns for insert with check (auth.uid() = user_id);
create policy "Service role full access to returns" on public.returns using (true) with check (true);


-- ============================================================
-- 9. SUPPORT TICKETS
-- ============================================================
create table if not exists public.support_tickets (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete set null,
  ticket_number   text unique,
  subject         text not null,
  category        text not null,
  order_number    text,
  message         text not null,
  messages        jsonb default '[]',
  status          text default 'Open' check (status in (
    'Open','In Progress','Waiting on Customer','Resolved','Closed'
  )),
  priority        text default 'Medium' check (priority in ('High','Medium','Low')),
  customer_name   text,
  phone           text,
  email           text,
  last_message    text,
  assigned_to     text,
  resolved_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists support_tickets_user_id_idx on public.support_tickets(user_id);
create index if not exists support_tickets_status_idx on public.support_tickets(status);

alter table public.support_tickets enable row level security;
create policy "Users can view their own tickets" on public.support_tickets for select using (auth.uid() = user_id);
create policy "Users can insert tickets" on public.support_tickets for insert with check (auth.uid() = user_id);
create policy "Service role full access to support_tickets" on public.support_tickets using (true) with check (true);


-- ============================================================
-- 10. CAMPAIGNS
-- ============================================================
create table if not exists public.campaigns (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  type        text default 'WhatsApp Blast' check (type in ('WhatsApp Blast','Email','SMS','Discount')),
  segment     text not null,
  status      text default 'Draft' check (status in ('Active','Scheduled','Completed','Draft','Paused')),
  coupon_code text,
  message     text,
  reach       int default 0,
  opens       int default 0,
  conversions int default 0,
  revenue     numeric(12,2) default 0,
  start_date  date,
  end_date    date,
  sent_at     timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.campaigns enable row level security;
create policy "Service role full access to campaigns" on public.campaigns using (true) with check (true);


-- ============================================================
-- 11. MEDIA FILES
-- ============================================================
create table if not exists public.media_files (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  url         text not null,
  bucket_path text,
  size_bytes  int,
  mime_type   text,
  width       int,
  height      int,
  type        text default 'misc' check (type in ('product','banner','misc')),
  used_in     text,
  product_id  uuid references public.products(id) on delete set null,
  created_at  timestamptz default now()
);

alter table public.media_files enable row level security;
create policy "Service role full access to media_files" on public.media_files using (true) with check (true);


-- ============================================================
-- 12. AUDIT LOGS
-- ============================================================
create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  action      text not null,
  entity      text not null,
  entity_id   text,
  admin       text,
  admin_role  text default 'Admin',
  details     text,
  ip_address  text,
  severity    text default 'info' check (severity in ('info','success','warning','critical')),
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;
create policy "Service role full access to audit_logs" on public.audit_logs using (true) with check (true);


-- ============================================================
-- 13. STAFF MEMBERS
-- ============================================================
create table if not exists public.staff_members (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  email       text unique not null,
  phone       text,
  role        text not null check (role in (
    'Super Admin','Admin','Store Manager','Support Agent','Inventory Manager'
  )),
  permissions text[] default '{}',
  status      text default 'Active' check (status in ('Active','Inactive','Suspended')),
  last_login  timestamptz,
  joined_date date default current_date,
  created_at  timestamptz default now()
);

alter table public.staff_members enable row level security;
create policy "Service role full access to staff_members" on public.staff_members using (true) with check (true);


-- ============================================================
-- 14. SHIPPING ZONES
-- ============================================================
create table if not exists public.shipping_zones (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  cities      text[] not null default '{}',
  pincodes    text[] default '{}',
  partner     text,
  rate        numeric(8,2) default 0,
  free_above  numeric(10,2) default 999,
  eta         text,
  status      text default 'Active' check (status in ('Active','Paused')),
  created_at  timestamptz default now()
);

alter table public.shipping_zones enable row level security;
create policy "Anyone can view active shipping zones" on public.shipping_zones for select using (status = 'Active');
create policy "Service role full access to shipping_zones" on public.shipping_zones using (true) with check (true);

insert into public.shipping_zones (name, cities, partner, rate, free_above, eta)
values
  ('Mumbai Metro',     '{"Mumbai","Thane","Navi Mumbai"}',                          'Ekart Same-Day',   0,   0,    'Same Day'),
  ('Maharashtra',      '{"Pune","Nashik","Nagpur","Aurangabad","Solapur"}',          'Delhivery',        79,  999,  '1-2 Days'),
  ('Metro Cities',     '{"Delhi","Bangalore","Hyderabad","Chennai","Kolkata"}',      'BlueDart Express',  99, 999,  '2-3 Days'),
  ('Pan India Tier 2', '{"Jaipur","Lucknow","Indore","Surat","Vadodara","Patna"}',   'Delhivery',        99,  999,  '3-4 Days'),
  ('Tier 3 & Rural',   '{"All other pincodes"}',                                    'India Post',       129, 1499, '5-7 Days')
on conflict do nothing;


-- ============================================================
-- 15. INVENTORY ALERTS
-- ============================================================
create table if not exists public.inventory_alerts (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid references public.products(id) on delete cascade,
  type          text check (type in ('low_stock','out_of_stock','reorder')),
  threshold     int,
  current_stock int,
  is_resolved   boolean default false,
  created_at    timestamptz default now()
);

alter table public.inventory_alerts enable row level security;
create policy "Service role full access to inventory_alerts" on public.inventory_alerts using (true) with check (true);

-- Trigger: auto-alert when stock falls below reorder level
create or replace function public.check_inventory_alert()
returns trigger language plpgsql as $$
begin
  if new.stock = 0 then
    insert into public.inventory_alerts (product_id, type, threshold, current_stock)
    values (new.id, 'out_of_stock', 0, 0);
  elsif new.stock <= new.reorder_level then
    insert into public.inventory_alerts (product_id, type, threshold, current_stock)
    values (new.id, 'low_stock', new.reorder_level, new.stock);
  end if;
  return new;
end;
$$;

drop trigger if exists inventory_alert_trigger on public.products;
create trigger inventory_alert_trigger
  after update of stock on public.products
  for each row
  when (new.stock <> old.stock)
  execute function public.check_inventory_alert();


-- ============================================================
-- 16. CONTENT BLOCKS (Homepage CMS)
-- ============================================================
create table if not exists public.content_blocks (
  id          uuid primary key default uuid_generate_v4(),
  type        text not null check (type in ('hero_banner','announcement_bar','promotional_strip','section_heading')),
  title       text not null,
  body        text not null,
  cta         text,
  cta_link    text,
  is_active   boolean default true,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.content_blocks enable row level security;
create policy "Anyone can view active content blocks" on public.content_blocks for select using (is_active = true);
create policy "Service role full access to content_blocks" on public.content_blocks using (true) with check (true);

insert into public.content_blocks (type, title, body, cta, cta_link, is_active, sort_order)
values
  ('announcement_bar', 'Free Shipping Banner',     '🌟 Free shipping on orders above ₹999 | Use WELCOME10 for 10% off!', null, null, true, 1),
  ('hero_banner',      'Homepage Hero',            'Royal Fragrances of Arabia', 'Shop Now', '/shop', true, 2),
  ('section_heading',  'Featured Products Heading','Our Bestselling Fragrances', null, null, true, 3)
on conflict do nothing;


-- ============================================================
-- Shared auto-updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','products','orders','returns',
    'support_tickets','campaigns','abandoned_carts','content_blocks'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end;
$$;


-- ============================================================
-- Convenience views
-- ============================================================
create or replace view public.daily_revenue as
select
  date_trunc('day', created_at)::date as date,
  count(*) as orders,
  sum(total_amount) as revenue
from public.orders
where created_at >= now() - interval '30 days'
  and status not in ('Cancelled','Refunded')
group by 1 order by 1;

create or replace view public.top_products as
select id, name, category, price, stock, sales_count, revenue, rating, reviews_count
from public.products
where is_active = true
order by sales_count desc
limit 20;


-- ============================================================
-- DONE ✅  16 tables, RLS policies, indexes, triggers, seeds
-- ============================================================
