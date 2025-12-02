-- Create tenants table (clientes do SaaS)
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  plan text not null default 'free' check (plan in ('free', 'starter', 'professional', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  whatsapp_sessions_limit integer not null default 1,
  users_limit integer not null default 5,
  contacts_limit integer not null default 1000,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create users table (agentes do sistema)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'agent' check (role in ('super_admin', 'admin', 'agent')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.tenants enable row level security;
alter table public.users enable row level security;

-- Tenants policies
create policy "Users can view their own tenant"
  on public.tenants for select
  using (id in (select tenant_id from public.users where id = auth.uid()));

create policy "Admins can update their tenant"
  on public.tenants for update
  using (id in (
    select tenant_id from public.users 
    where id = auth.uid() and role in ('admin', 'super_admin')
  ));

-- Users policies
create policy "Users can view users in their tenant"
  on public.users for select
  using (tenant_id in (select tenant_id from public.users where id = auth.uid()));

create policy "Users can view their own profile"
  on public.users for select
  using (id = auth.uid());

create policy "Users can update their own profile"
  on public.users for update
  using (id = auth.uid());

create policy "Admins can manage users in their tenant"
  on public.users for all
  using (tenant_id in (
    select tenant_id from public.users 
    where id = auth.uid() and role in ('admin', 'super_admin')
  ));

-- Function to create tenant and user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
begin
  -- Create tenant
  insert into public.tenants (name, email, plan)
  values (
    coalesce(new.raw_user_meta_data ->> 'company_name', 'My Company'),
    new.email,
    'free'
  )
  returning id into new_tenant_id;

  -- Create user profile
  insert into public.users (id, tenant_id, full_name, email, role)
  values (
    new.id,
    new_tenant_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'User'),
    new.email,
    'admin'
  );

  return new;
end;
$$;

-- Trigger to auto-create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Indexes for performance
create index if not exists idx_users_tenant_id on public.users(tenant_id);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_tenants_email on public.tenants(email);
