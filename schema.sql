-- ==============================================================================
-- KOPI KOFFEE - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Real-time Cloud Kitchen Display System & Customer Ordering
-- ==============================================================================

-- 1. Create the 'orders' table
create table if not exists public.orders (
    id text primary key,
    table_number text not null default '1',
    status text not null default 'pending' check (status in ('pending', 'preparing', 'completed')),
    items jsonb not null default '[]'::jsonb,
    total numeric(10, 2) not null default 0.00,
    notes text default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    archived_at timestamptz default null
);

-- 2. Performance Indexes
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_archived on public.orders(archived_at);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- 3. Enable Row Level Security (RLS)
alter table public.orders enable row level security;

-- 4. Permissive Policies for anonymous/public customers and kitchen staff
drop policy if exists "Allow public select on orders" on public.orders;
create policy "Allow public select on orders"
    on public.orders
    for select
    using (true);

drop policy if exists "Allow public insert on orders" on public.orders;
create policy "Allow public insert on orders"
    on public.orders
    for insert
    with check (true);

drop policy if exists "Allow public update on orders" on public.orders;
create policy "Allow public update on orders"
    on public.orders
    for update
    using (true)
    with check (true);

drop policy if exists "Allow public delete on orders" on public.orders;
create policy "Allow public delete on orders"
    on public.orders
    for delete
    using (true);

-- 5. Enable Supabase Realtime for instant live push to kitchen & customer phones
do $$
begin
    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
    ) then
        alter publication supabase_realtime add table public.orders;
    end if;
end $$;

-- 6. Trigger to automatically refresh 'updated_at' on updates
create or replace function public.update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
    before update on public.orders
    for each row
    execute function public.update_modified_column();
