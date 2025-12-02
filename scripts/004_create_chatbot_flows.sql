-- Create chatbot_flows table
create table if not exists public.chatbot_flows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null check (trigger_type in ('keyword', 'always', 'schedule', 'pipeline_stage')),
  trigger_value text,
  is_active boolean default true,
  flow_data jsonb not null default '[]'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create chatbot_logs table
create table if not exists public.chatbot_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  flow_id uuid not null references public.chatbot_flows(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  node_id text not null,
  executed_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.chatbot_flows enable row level security;
alter table public.chatbot_logs enable row level security;

-- Chatbot flows policies
create policy "Users can view flows in their tenant"
  on public.chatbot_flows for select
  using (tenant_id in (select tenant_id from public.users where id = auth.uid()));

create policy "Users can create flows in their tenant"
  on public.chatbot_flows for insert
  with check (tenant_id in (select tenant_id from public.users where id = auth.uid()));

create policy "Users can update flows in their tenant"
  on public.chatbot_flows for update
  using (tenant_id in (select tenant_id from public.users where id = auth.uid()));

create policy "Users can delete flows in their tenant"
  on public.chatbot_flows for delete
  using (tenant_id in (select tenant_id from public.users where id = auth.uid()));

-- Chatbot logs policies
create policy "Users can view logs in their tenant"
  on public.chatbot_logs for select
  using (tenant_id in (select tenant_id from public.users where id = auth.uid()));

-- Indexes
create index if not exists idx_chatbot_flows_tenant_id on public.chatbot_flows(tenant_id);
create index if not exists idx_chatbot_flows_is_active on public.chatbot_flows(is_active);
create index if not exists idx_chatbot_logs_flow_id on public.chatbot_logs(flow_id);
create index if not exists idx_chatbot_logs_contact_id on public.chatbot_logs(contact_id);
