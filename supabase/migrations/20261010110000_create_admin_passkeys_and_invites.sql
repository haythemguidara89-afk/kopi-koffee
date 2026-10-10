-- ==============================================================================
-- KOPI KOFFEE - PASSKEY & ONE-TIME INVITE TOKENS MIGRATION
-- ==============================================================================

-- 1. One-Time Passkey Setup Tokens Table
create table if not exists public.admin_invite_tokens (
    token text primary key,
    admin_name text not null,
    created_by text not null default 'Owner',
    expires_at timestamptz not null default (now() + interval '48 hours'),
    used boolean not null default false,
    used_at timestamptz default null,
    created_at timestamptz not null default now()
);

create index if not exists idx_invite_tokens_used on public.admin_invite_tokens(used);
create index if not exists idx_invite_tokens_expires on public.admin_invite_tokens(expires_at);

alter table public.admin_invite_tokens enable row level security;

drop policy if exists "Allow public select on admin_invite_tokens" on public.admin_invite_tokens;
create policy "Allow public select on admin_invite_tokens"
    on public.admin_invite_tokens
    for select
    using (true);

drop policy if exists "Allow public insert on admin_invite_tokens" on public.admin_invite_tokens;
create policy "Allow public insert on admin_invite_tokens"
    on public.admin_invite_tokens
    for insert
    with check (true);

drop policy if exists "Allow public update on admin_invite_tokens" on public.admin_invite_tokens;
create policy "Allow public update on admin_invite_tokens"
    on public.admin_invite_tokens
    for update
    using (true)
    with check (true);

drop policy if exists "Allow public delete on admin_invite_tokens" on public.admin_invite_tokens;
create policy "Allow public delete on admin_invite_tokens"
    on public.admin_invite_tokens
    for delete
    using (true);

-- 2. Registered Admin Passkeys & Credentials Table
create table if not exists public.admin_passkeys (
    credential_id text primary key,
    admin_name text not null,
    public_key text not null default '',
    raw_id text not null default '',
    recovery_code text default null,
    transports jsonb not null default '["internal"]'::jsonb,
    created_at timestamptz not null default now(),
    last_used_at timestamptz default null
);

create index if not exists idx_admin_passkeys_created on public.admin_passkeys(created_at desc);
create index if not exists idx_admin_passkeys_recovery on public.admin_passkeys(recovery_code);

alter table public.admin_passkeys enable row level security;

drop policy if exists "Allow public select on admin_passkeys" on public.admin_passkeys;
create policy "Allow public select on admin_passkeys"
    on public.admin_passkeys
    for select
    using (true);

drop policy if exists "Allow public insert on admin_passkeys" on public.admin_passkeys;
create policy "Allow public insert on admin_passkeys"
    on public.admin_passkeys
    for insert
    with check (true);

drop policy if exists "Allow public update on admin_passkeys" on public.admin_passkeys;
create policy "Allow public update on admin_passkeys"
    on public.admin_passkeys
    for update
    using (true)
    with check (true);

drop policy if exists "Allow public delete on admin_passkeys" on public.admin_passkeys;
create policy "Allow public delete on admin_passkeys"
    on public.admin_passkeys
    for delete
    using (true);
