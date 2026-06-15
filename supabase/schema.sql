create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text,
  role text check (role in ('admin','manager','supervisor','operator','viewer')),
  department text,
  avatar_url text,
  employee_id text unique,
  created_at timestamptz default now()
);

create table if not exists machines (
  id uuid primary key default gen_random_uuid(),
  machine_code text unique not null,
  name text not null,
  type text,
  status text check (status in ('running','idle','maintenance','breakdown')),
  efficiency_percent numeric(5,2),
  location text,
  last_maintenance timestamptz,
  created_at timestamptz default now()
);

create table if not exists production_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  product_name text not null,
  quantity_planned int not null,
  quantity_produced int default 0,
  status text check (status in ('pending','in_progress','completed','on_hold','cancelled')),
  priority text check (priority in ('low','medium','high','critical')),
  machine_id uuid references machines(id),
  operator_id uuid references profiles(id),
  start_date timestamptz,
  end_date timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  rating numeric(3,1),
  created_at timestamptz default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text,
  unit text,
  quantity_on_hand numeric(12,3) default 0,
  reorder_level numeric(12,3) default 0,
  unit_cost numeric(12,2),
  warehouse_location text,
  supplier_id uuid references suppliers(id),
  created_at timestamptz default now()
);

create table if not exists inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references inventory_items(id),
  type text check (type in ('in','out','adjustment','transfer')),
  quantity numeric(12,3) not null,
  reference text,
  performed_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists quality_checks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references production_orders(id),
  inspector_id uuid references profiles(id),
  batch_number text,
  total_inspected int,
  passed int,
  failed int,
  defect_type text[],
  status text check (status in ('pass','fail','conditional')),
  notes text,
  images text[],
  created_at timestamptz default now()
);

create table if not exists defect_types (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text,
  severity text check (severity in ('minor','major','critical')),
  description text
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  days_of_week int[]
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id),
  shift_id uuid references shifts(id),
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text check (status in ('present','absent','late','half_day','leave')),
  created_at timestamptz default now()
);

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id),
  type text check (type in ('annual','sick','emergency','unpaid')),
  start_date date,
  end_date date,
  reason text,
  status text check (status in ('pending','approved','rejected')),
  approved_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references machines(id),
  type text check (type in ('preventive','corrective','emergency','inspection')),
  title text not null,
  description text,
  priority text check (priority in ('low','medium','high','critical')),
  status text check (status in ('open','in_progress','completed','cancelled')),
  assigned_to uuid references profiles(id),
  scheduled_date timestamptz,
  completed_date timestamptz,
  estimated_hours numeric(6,2),
  actual_hours numeric(6,2),
  parts_used jsonb,
  cost numeric(12,2),
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  category text,
  description text,
  amount numeric(14,2),
  currency text default 'PKR',
  date date,
  department text,
  approved_by uuid references profiles(id),
  status text check (status in ('pending','approved','rejected','paid')),
  receipt_url text,
  created_at timestamptz default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  department text,
  period_start date,
  period_end date,
  allocated numeric(14,2),
  spent numeric(14,2) default 0,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  module text,
  title text,
  body text,
  is_read boolean default false,
  action_url text,
  created_at timestamptz default now()
);

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.current_profile_department()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select department from profiles where id = auth.uid()
$$;

alter table profiles enable row level security;
alter table machines enable row level security;
alter table production_orders enable row level security;
alter table suppliers enable row level security;
alter table inventory_items enable row level security;
alter table inventory_transactions enable row level security;
alter table quality_checks enable row level security;
alter table defect_types enable row level security;
alter table shifts enable row level security;
alter table attendance enable row level security;
alter table leave_requests enable row level security;
alter table maintenance_tasks enable row level security;
alter table expenses enable row level security;
alter table budgets enable row level security;
alter table notifications enable row level security;

create policy "profiles self admin manager department read"
on profiles for select
using (
  id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() = 'manager' and department = public.current_profile_department())
);

create policy "profiles admin write"
on profiles for all
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy "machines read by authenticated"
on machines for select
using (auth.role() = 'authenticated');

create policy "machines ops mutate"
on machines for all
using (public.current_profile_role() in ('admin','manager','supervisor'))
with check (public.current_profile_role() in ('admin','manager','supervisor'));

create policy "production assigned or elevated read"
on production_orders for select
using (
  public.current_profile_role() = 'admin'
  or operator_id = auth.uid()
  or public.current_profile_role() in ('manager','supervisor','viewer')
);

create policy "production assigned or elevated mutate"
on production_orders for all
using (public.current_profile_role() in ('admin','manager','supervisor') or operator_id = auth.uid())
with check (public.current_profile_role() in ('admin','manager','supervisor') or operator_id = auth.uid());

create policy "inventory read by authenticated"
on inventory_items for select
using (auth.role() = 'authenticated');

create policy "inventory mutate by elevated"
on inventory_items for all
using (public.current_profile_role() in ('admin','manager','supervisor'))
with check (public.current_profile_role() in ('admin','manager','supervisor'));

create policy "inventory transactions read by authenticated"
on inventory_transactions for select
using (auth.role() = 'authenticated');

create policy "inventory transactions mutate by staff"
on inventory_transactions for all
using (public.current_profile_role() in ('admin','manager','supervisor','operator'))
with check (public.current_profile_role() in ('admin','manager','supervisor','operator'));

create policy "suppliers read by authenticated"
on suppliers for select
using (auth.role() = 'authenticated');

create policy "suppliers mutate by managers"
on suppliers for all
using (public.current_profile_role() in ('admin','manager'))
with check (public.current_profile_role() in ('admin','manager'));

create policy "quality read by authenticated"
on quality_checks for select
using (auth.role() = 'authenticated');

create policy "quality mutate by inspector or elevated"
on quality_checks for all
using (public.current_profile_role() in ('admin','manager','supervisor','operator') or inspector_id = auth.uid())
with check (public.current_profile_role() in ('admin','manager','supervisor','operator') or inspector_id = auth.uid());

create policy "defects read by authenticated"
on defect_types for select
using (auth.role() = 'authenticated');

create policy "defects mutate by elevated"
on defect_types for all
using (public.current_profile_role() in ('admin','manager','supervisor'))
with check (public.current_profile_role() in ('admin','manager','supervisor'));

create policy "shifts read by authenticated"
on shifts for select
using (auth.role() = 'authenticated');

create policy "shifts mutate by managers"
on shifts for all
using (public.current_profile_role() in ('admin','manager'))
with check (public.current_profile_role() in ('admin','manager'));

create policy "attendance scoped read"
on attendance for select
using (employee_id = auth.uid() or public.current_profile_role() in ('admin','manager','supervisor'));

create policy "attendance scoped mutate"
on attendance for all
using (employee_id = auth.uid() or public.current_profile_role() in ('admin','manager','supervisor'))
with check (employee_id = auth.uid() or public.current_profile_role() in ('admin','manager','supervisor'));

create policy "leave scoped read"
on leave_requests for select
using (employee_id = auth.uid() or public.current_profile_role() in ('admin','manager','supervisor'));

create policy "leave scoped mutate"
on leave_requests for all
using (employee_id = auth.uid() or public.current_profile_role() in ('admin','manager','supervisor'))
with check (employee_id = auth.uid() or public.current_profile_role() in ('admin','manager','supervisor'));

create policy "maintenance scoped read"
on maintenance_tasks for select
using (assigned_to = auth.uid() or public.current_profile_role() in ('admin','manager','supervisor','viewer'));

create policy "maintenance scoped mutate"
on maintenance_tasks for all
using (assigned_to = auth.uid() or public.current_profile_role() in ('admin','manager','supervisor'))
with check (assigned_to = auth.uid() or public.current_profile_role() in ('admin','manager','supervisor'));

create policy "expenses scoped read"
on expenses for select
using (public.current_profile_role() in ('admin','manager','supervisor') or approved_by = auth.uid());

create policy "expenses mutate by staff"
on expenses for all
using (public.current_profile_role() in ('admin','manager','supervisor','operator'))
with check (public.current_profile_role() in ('admin','manager','supervisor','operator'));

create policy "budgets read by authenticated"
on budgets for select
using (auth.role() = 'authenticated');

create policy "budgets admin write"
on budgets for all
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy "notifications own read"
on notifications for select
using (user_id = auth.uid() or public.current_profile_role() = 'admin');

create policy "notifications own mutate"
on notifications for all
using (user_id = auth.uid() or public.current_profile_role() = 'admin')
with check (user_id = auth.uid() or public.current_profile_role() = 'admin');

alter publication supabase_realtime add table machines;
alter publication supabase_realtime add table production_orders;
alter publication supabase_realtime add table maintenance_tasks;
alter publication supabase_realtime add table notifications;
