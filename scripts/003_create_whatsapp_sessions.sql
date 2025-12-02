-- Create whatsapp_sessions table
create table if not exists public.whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  session_name text not null,
  phone_number text,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'qr_pending', 'connecting')),
  qr_code text,
  last_seen timestamp with time zone,
  session_data jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(tenant_id, session_name)
);

-- Enable RLS
alter table public.whatsapp_sessions enable row level security;

-- WhatsApp sessions policies
create policy "Users can view sessions in their tenant"
  on public.whatsapp_sessions for select
  using (tenant_id in (select tenant_id from public.users where id = auth.uid()));

create policy "Admins can manage sessions in their tenant"
  on public.whatsapp_sessions for all
  using (tenant_id in (
    select tenant_id from public.users 
    where id = auth.uid() and role in ('admin', 'super_admin')
  ));

-- Indexes
create index if not exists idx_whatsapp_sessions_tenant_id on public.whatsapp_sessions(tenant_id);
create index if not exists idx_whatsapp_sessions_status on public.whatsapp_sessions(status);
