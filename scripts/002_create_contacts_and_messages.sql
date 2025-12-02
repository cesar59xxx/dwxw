-- Create contacts table (CRM)
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  whatsapp_id text not null,
  name text not null,
  phone text not null,
  email text,
  avatar_url text,
  tags text[] default array[]::text[],
  pipeline_stage text default 'new' check (pipeline_stage in ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  notes text,
  last_message_at timestamp with time zone,
  assigned_to uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(tenant_id, whatsapp_id)
);

-- Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  whatsapp_session_id uuid not null,
  message_id text not null,
  from_me boolean not null default false,
  type text not null check (type in ('text', 'image', 'audio', 'video', 'document')),
  content text,
  media_url text,
  timestamp timestamp with time zone not null,
  status text default 'sent' check (status in ('pending', 'sent', 'delivered', 'read', 'failed')),
  created_at timestamp with time zone default now(),
  unique(tenant_id, message_id)
);

-- Enable RLS
alter table public.contacts enable row level security;
alter table public.messages enable row level security;

-- Contacts policies
create policy "Users can view contacts in their tenant"
  on public.contacts for select
  using (tenant_id in (select tenant_id from public.users where id = auth.uid()));

create policy "Users can create contacts in their tenant"
  on public.contacts for insert
  with check (tenant_id in (select tenant_id from public.users where id = auth.uid()));

create policy "Users can update contacts in their tenant"
  on public.contacts for update
  using (tenant_id in (select tenant_id from public.users where id = auth.uid()));

create policy "Users can delete contacts in their tenant"
  on public.contacts for delete
  using (tenant_id in (select tenant_id from public.users where id = auth.uid()));

-- Messages policies
create policy "Users can view messages in their tenant"
  on public.messages for select
  using (tenant_id in (select tenant_id from public.users where id = auth.uid()));

create policy "Users can create messages in their tenant"
  on public.messages for insert
  with check (tenant_id in (select tenant_id from public.users where id = auth.uid()));

-- Indexes
create index if not exists idx_contacts_tenant_id on public.contacts(tenant_id);
create index if not exists idx_contacts_whatsapp_id on public.contacts(whatsapp_id);
create index if not exists idx_contacts_pipeline_stage on public.contacts(pipeline_stage);
create index if not exists idx_contacts_assigned_to on public.contacts(assigned_to);
create index if not exists idx_messages_tenant_id on public.messages(tenant_id);
create index if not exists idx_messages_contact_id on public.messages(contact_id);
create index if not exists idx_messages_timestamp on public.messages(timestamp desc);
