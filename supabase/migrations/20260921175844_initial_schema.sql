-- =========================================================
-- 1. CATEGORIES
-- =========================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  created_at timestamptz not null default now(),

  constraint categories_name_unique
    unique (name)
);


-- =========================================================
-- 2. PRODUCTS
-- =========================================================

create table public.products (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,

  category_id uuid not null
    references public.categories(id)
    on delete restrict,

  price numeric(10, 2) not null,
  stock_quantity integer not null default 0,
  minimum_stock integer not null default 0,

  image_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_price_non_negative
    check (price >= 0),

  constraint products_stock_non_negative
    check (stock_quantity >= 0),

  constraint products_minimum_stock_non_negative
    check (minimum_stock >= 0)
);


-- =========================================================
-- 3. PRODUCTS INDEX
-- =========================================================

create index products_category_id_idx
on public.products(category_id);


-- =========================================================
-- 4. UPDATED_AT FUNCTION
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  return new;
end;
$$;


-- =========================================================
-- 5. UPDATED_AT TRIGGER
-- =========================================================

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();


-- =========================================================
-- 6. PROFILES
-- =========================================================

create table public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text not null,

  role text not null default 'employee',

  created_at timestamptz not null default now(),

  constraint profiles_role_check
    check (role in ('owner', 'employee'))
);


-- =========================================================
-- 7. SALES
-- =========================================================

create table public.sales (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete restrict,

  total_amount numeric(10, 2) not null,

  created_at timestamptz not null default now(),

  constraint sales_total_amount_non_negative
    check (total_amount >= 0)
);


-- =========================================================
-- 8. SALE ITEMS
-- =========================================================

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),

  sale_id uuid not null
    references public.sales(id)
    on delete cascade,

  product_id uuid not null
    references public.products(id)
    on delete restrict,

  quantity integer not null,

  unit_price numeric(10, 2) not null,

  constraint sale_items_quantity_positive
    check (quantity > 0),

  constraint sale_items_unit_price_non_negative
    check (unit_price >= 0)
);


-- =========================================================
-- 9. FOREIGN KEY INDEXES
-- =========================================================

create index sales_user_id_idx
on public.sales(user_id);

create index sale_items_sale_id_idx
on public.sale_items(sale_id);

create index sale_items_product_id_idx
on public.sale_items(product_id);


-- =========================================================
-- 10. ENABLE ROW LEVEL SECURITY
-- =========================================================

alter table public.categories
enable row level security;

alter table public.products
enable row level security;

alter table public.profiles
enable row level security;

alter table public.sales
enable row level security;

alter table public.sale_items
enable row level security;


-- =========================================================
-- 11. CATEGORIES POLICIES
-- =========================================================

create policy "Authenticated users can view categories"
on public.categories
for select
to authenticated
using (true);


-- =========================================================
-- 12. PRODUCTS POLICIES
-- =========================================================

-- Owner + Employee can view products

create policy "Authenticated users can view products"
on public.products
for select
to authenticated
using (true);


-- Only Owner can add products

create policy "Owners can add products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'owner'
  )
);


-- Only Owner can edit products

create policy "Owners can edit products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'owner'
  )
);


-- Only Owner can delete products

create policy "Owners can delete products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'owner'
  )
);


-- =========================================================
-- 13. SALES POLICIES
-- =========================================================

-- Owner + Employee can view sales

create policy "Authenticated users can view sales"
on public.sales
for select
to authenticated
using (true);


-- =========================================================
-- 14. PROFILE POLICIES
-- =========================================================

-- Users can view their own profile

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
);


-- =========================================================
-- 15. CREATE SALE RPC
-- =========================================================

create or replace function public.create_sale(
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_user_id uuid;
  v_total_amount numeric(10, 2) := 0;

  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;

  v_product_price numeric(10, 2);
  v_stock_quantity integer;

  v_item_count integer;
begin

  -- =======================================================
  -- 1. Authentication
  -- =======================================================

  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;


  -- =======================================================
  -- 2. Verify user profile
  -- =======================================================

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
  ) then
    raise exception 'User profile not found';
  end if;


  -- =======================================================
  -- 3. Validate items input
  -- =======================================================

  if p_items is null then
    raise exception 'Sale items are required';
  end if;


  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Sale items must be a JSON array';
  end if;


  v_item_count := jsonb_array_length(p_items);


  if v_item_count = 0 then
    raise exception 'Sale must contain at least one item';
  end if;


  -- =======================================================
  -- 4. Validate each item
  -- =======================================================

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop

    -- -------------------------------------------------------
    -- Validate product_id
    -- -------------------------------------------------------

    if not (v_item ? 'product_id') then
      raise exception 'Each sale item must contain product_id';
    end if;


    begin
      v_product_id := (v_item ->> 'product_id')::uuid;
    exception
      when invalid_text_representation then
        raise exception 'Invalid product_id';
    end;


    if v_product_id is null then
      raise exception 'product_id cannot be null';
    end if;


    -- -------------------------------------------------------
    -- Validate quantity
    -- -------------------------------------------------------

    if not (v_item ? 'quantity') then
      raise exception 'Each sale item must contain quantity';
    end if;


    begin
      v_quantity := (v_item ->> 'quantity')::integer;
    exception
      when invalid_text_representation then
        raise exception 'Invalid quantity';
    end;


    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero';
    end if;


    -- -------------------------------------------------------
    -- Check duplicate products
    -- -------------------------------------------------------

    if (
      select count(*)
      from jsonb_array_elements(p_items) item
      where item ->> 'product_id' = v_product_id::text
    ) > 1 then

      raise exception
        'A product cannot appear more than once in the same sale: %',
        v_product_id;

    end if;


    -- -------------------------------------------------------
    -- Lock product row
    -- -------------------------------------------------------

    select
      price,
      stock_quantity
    into
      v_product_price,
      v_stock_quantity
    from public.products
    where id = v_product_id
    for update;


    -- -------------------------------------------------------
    -- Product must exist
    -- -------------------------------------------------------

    if not found then
      raise exception
        'Product % does not exist',
        v_product_id;
    end if;


    -- -------------------------------------------------------
    -- Check stock
    -- -------------------------------------------------------

    if v_stock_quantity < v_quantity then
      raise exception
        'Insufficient stock for product %. Available: %, requested: %',
        v_product_id,
        v_stock_quantity,
        v_quantity;
    end if;


    -- -------------------------------------------------------
    -- Calculate total
    -- -------------------------------------------------------

    v_total_amount :=
      v_total_amount +
      (v_product_price * v_quantity);

  end loop;


  -- =======================================================
  -- 5. Create sale
  -- =======================================================

  insert into public.sales (
    user_id,
    total_amount
  )
  values (
    v_user_id,
    v_total_amount
  )
  returning id
  into v_sale_id;


  -- =======================================================
  -- 6. Create sale items
  -- =======================================================

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop

    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;


    -- Get the authoritative current product price

    select price
    into v_product_price
    from public.products
    where id = v_product_id;


    insert into public.sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price
    )
    values (
      v_sale_id,
      v_product_id,
      v_quantity,
      v_product_price
    );


    -- =====================================================
    -- 7. Decrease inventory
    -- =====================================================

    update public.products
    set stock_quantity = stock_quantity - v_quantity
    where id = v_product_id;

  end loop;


  -- =======================================================
  -- 8. Return sale ID
  -- =======================================================

  return v_sale_id;

end;
$$;


-- =========================================================
-- 16. CREATE SALE RPC PERMISSIONS
-- =========================================================

revoke execute
on function public.create_sale(jsonb)
from public;

revoke execute
on function public.create_sale(jsonb)
from anon;

grant execute
on function public.create_sale(jsonb)
to authenticated;