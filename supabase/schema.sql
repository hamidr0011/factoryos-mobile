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

-- FACTORYOS OPERATIONAL LOGIC

alter table inventory_transactions add column if not exists notes text;
alter table inventory_transactions add column if not exists from_location text;
alter table inventory_transactions add column if not exists to_location text;

alter table quality_checks add column if not exists pass_rate numeric(5,2);
alter table attendance add constraint attendance_employee_date_unique unique (employee_id, date);

create table if not exists production_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references production_orders(id) on delete cascade,
  quantity_delta int not null,
  quantity_after int not null,
  notes text,
  entered_by uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists machine_telemetry (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references machines(id) on delete cascade,
  runtime_status text check (runtime_status in ('running','idle','maintenance','breakdown')),
  efficiency_percent numeric(5,2),
  output_rate numeric(12,2),
  temperature_c numeric(8,2),
  vibration_mm_s numeric(8,3),
  recorded_at timestamptz default now()
);

create table if not exists shift_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references shifts(id) on delete cascade,
  employee_id uuid references profiles(id) on delete cascade,
  machine_id uuid references machines(id),
  production_order_id uuid references production_orders(id),
  assignment_role text default 'operator',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text check (status in ('scheduled','active','completed','cancelled')) default 'scheduled',
  created_by uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) default auth.uid(),
  module text not null,
  action text not null,
  entity_table text,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists production_logs_order_created_idx on production_logs(order_id, created_at desc);
create index if not exists machine_telemetry_machine_recorded_idx on machine_telemetry(machine_id, recorded_at desc);
create index if not exists shift_assignments_employee_time_idx on shift_assignments(employee_id, starts_at, ends_at);
create index if not exists attendance_date_idx on attendance(date desc);
create index if not exists notifications_user_read_idx on notifications(user_id, is_read, created_at desc);
create index if not exists attendance_shift_id_idx on attendance(shift_id);
create index if not exists audit_events_actor_id_idx on audit_events(actor_id);
create index if not exists expenses_approved_by_idx on expenses(approved_by);
create index if not exists inventory_items_supplier_id_idx on inventory_items(supplier_id);
create index if not exists inventory_transactions_item_id_idx on inventory_transactions(item_id);
create index if not exists inventory_transactions_performed_by_idx on inventory_transactions(performed_by);
create index if not exists leave_requests_approved_by_idx on leave_requests(approved_by);
create index if not exists leave_requests_employee_id_idx on leave_requests(employee_id);
create index if not exists maintenance_tasks_assigned_to_idx on maintenance_tasks(assigned_to);
create index if not exists maintenance_tasks_machine_id_idx on maintenance_tasks(machine_id);
create index if not exists production_logs_entered_by_idx on production_logs(entered_by);
create index if not exists production_orders_machine_id_idx on production_orders(machine_id);
create index if not exists production_orders_operator_id_idx on production_orders(operator_id);
create index if not exists quality_checks_inspector_id_idx on quality_checks(inspector_id);
create index if not exists quality_checks_order_id_idx on quality_checks(order_id);
create index if not exists shift_assignments_created_by_idx on shift_assignments(created_by);
create index if not exists shift_assignments_machine_id_idx on shift_assignments(machine_id);
create index if not exists shift_assignments_production_order_id_idx on shift_assignments(production_order_id);
create index if not exists shift_assignments_shift_id_idx on shift_assignments(shift_id);

alter table production_logs enable row level security;
alter table machine_telemetry enable row level security;
alter table shift_assignments enable row level security;
alter table audit_events enable row level security;

create policy "production logs scoped read"
on production_logs for select
using (
  public.current_profile_role() in ('admin','manager','supervisor','viewer')
  or entered_by = auth.uid()
  or exists (
    select 1 from production_orders po
    where po.id = production_logs.order_id and po.operator_id = auth.uid()
  )
);

create policy "production logs staff insert"
on production_logs for insert
with check (public.current_profile_role() in ('admin','manager','supervisor','operator'));

create policy "machine telemetry authenticated read"
on machine_telemetry for select
using (auth.role() = 'authenticated');

create policy "machine telemetry elevated insert"
on machine_telemetry for insert
with check (public.current_profile_role() in ('admin','manager','supervisor','operator'));

create policy "shift assignments scoped read"
on shift_assignments for select
using (
  employee_id = auth.uid()
  or public.current_profile_role() in ('admin','manager','supervisor','viewer')
);

create policy "shift assignments managers mutate"
on shift_assignments for all
using (public.current_profile_role() in ('admin','manager','supervisor'))
with check (public.current_profile_role() in ('admin','manager','supervisor'));

create policy "audit read elevated"
on audit_events for select
using (public.current_profile_role() in ('admin','manager','supervisor'));

create policy "audit insert authenticated"
on audit_events for insert
with check (auth.role() = 'authenticated');

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists production_orders_touch_updated_at on production_orders;
create trigger production_orders_touch_updated_at
before update on production_orders
for each row execute function public.touch_updated_at();

create or replace function public.create_audit_event(
  p_module text,
  p_action text,
  p_entity_table text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into audit_events(module, action, entity_table, entity_id, metadata)
  values (p_module, p_action, p_entity_table, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.create_notification(
  p_user_id uuid,
  p_module text,
  p_title text,
  p_body text,
  p_action_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into notifications(user_id, module, title, body, action_url)
  values (p_user_id, p_module, p_title, p_body, p_action_url)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.notify_roles(
  p_roles text[],
  p_module text,
  p_title text,
  p_body text,
  p_action_url text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into notifications(user_id, module, title, body, action_url)
  select id, p_module, p_title, p_body, p_action_url
  from profiles
  where role = any(p_roles);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.apply_inventory_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item inventory_items%rowtype;
  v_delta numeric(12,3);
begin
  if new.type = 'in' then
    if new.quantity <= 0 then
      raise exception 'Stock-in quantity must be greater than zero';
    end if;
    v_delta := new.quantity;
  elsif new.type in ('out', 'transfer') then
    if new.quantity <= 0 then
      raise exception 'Stock-out and transfer quantities must be greater than zero';
    end if;
    v_delta := -new.quantity;
  elsif new.type = 'adjustment' then
    if new.quantity = 0 then
      raise exception 'Adjustment quantity cannot be zero';
    end if;
    v_delta := new.quantity;
  else
    raise exception 'Unsupported inventory transaction type: %', new.type;
  end if;

  update inventory_items
  set quantity_on_hand = quantity_on_hand + v_delta
  where id = new.item_id
  returning * into v_item;

  if not found then
    raise exception 'Inventory item not found: %', new.item_id;
  end if;

  if v_item.quantity_on_hand < 0 then
    raise exception 'Insufficient stock for SKU %', v_item.sku;
  end if;

  perform public.create_audit_event(
    'inventory',
    'transaction_created',
    'inventory_transactions',
    new.id,
    jsonb_build_object('item_id', new.item_id, 'sku', v_item.sku, 'type', new.type, 'quantity', new.quantity)
  );

  if v_item.quantity_on_hand <= v_item.reorder_level then
    perform public.notify_roles(
      array['admin','manager','supervisor'],
      'inventory',
      'Low stock: ' || v_item.sku,
      v_item.name || ' is at ' || v_item.quantity_on_hand || ' ' || coalesce(v_item.unit, ''),
      'Inventory'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists inventory_transactions_apply on inventory_transactions;
create trigger inventory_transactions_apply
after insert on inventory_transactions
for each row execute function public.apply_inventory_transaction();

create or replace function public.record_inventory_transaction(
  p_item_id uuid,
  p_type text,
  p_quantity numeric,
  p_reference text default null,
  p_notes text default null,
  p_to_location text default null
)
returns inventory_transactions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row inventory_transactions;
  v_item inventory_items%rowtype;
begin
  select * into v_item from inventory_items where id = p_item_id;
  if not found then
    raise exception 'Inventory item not found';
  end if;

  insert into inventory_transactions(item_id, type, quantity, reference, performed_by, notes, from_location, to_location)
  values (p_item_id, p_type, p_quantity, p_reference, auth.uid(), p_notes, v_item.warehouse_location, p_to_location)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.update_production_progress(
  p_order_id uuid,
  p_quantity_delta int,
  p_notes text default null
)
returns production_orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order production_orders%rowtype;
  v_after int;
begin
  if p_quantity_delta <= 0 then
    raise exception 'Produced quantity must be greater than zero';
  end if;

  select * into v_order from production_orders where id = p_order_id for update;
  if not found then
    raise exception 'Production order not found';
  end if;

  v_after := least(v_order.quantity_planned, v_order.quantity_produced + p_quantity_delta);

  update production_orders
  set quantity_produced = v_after,
      status = case when v_after >= quantity_planned then 'completed' else 'in_progress' end
  where id = p_order_id
  returning * into v_order;

  insert into production_logs(order_id, quantity_delta, quantity_after, notes, entered_by)
  values (p_order_id, p_quantity_delta, v_after, p_notes, auth.uid());

  perform public.create_audit_event(
    'production',
    'progress_updated',
    'production_orders',
    p_order_id,
    jsonb_build_object('quantity_delta', p_quantity_delta, 'quantity_after', v_after)
  );

  return v_order;
end;
$$;

create or replace function public.record_machine_telemetry(
  p_machine_id uuid,
  p_status text,
  p_efficiency_percent numeric,
  p_output_rate numeric default null,
  p_temperature_c numeric default null,
  p_vibration_mm_s numeric default null
)
returns machine_telemetry
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row machine_telemetry;
begin
  insert into machine_telemetry(machine_id, runtime_status, efficiency_percent, output_rate, temperature_c, vibration_mm_s)
  values (p_machine_id, p_status, p_efficiency_percent, p_output_rate, p_temperature_c, p_vibration_mm_s)
  returning * into v_row;

  update machines
  set status = p_status,
      efficiency_percent = p_efficiency_percent
  where id = p_machine_id;

  if p_status = 'breakdown' then
    perform public.notify_roles(
      array['admin','manager','supervisor'],
      'maintenance',
      'Machine breakdown',
      'Machine requires immediate attention.',
      'Maintenance'
    );
  end if;

  return v_row;
end;
$$;

create or replace function public.clock_in(p_shift_id uuid default null)
returns attendance
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row attendance;
  v_today date := current_date;
begin
  insert into attendance(employee_id, shift_id, date, check_in, status)
  values (auth.uid(), p_shift_id, v_today, now(), 'present')
  on conflict (employee_id, date)
  do update set check_in = coalesce(attendance.check_in, excluded.check_in),
                shift_id = coalesce(attendance.shift_id, excluded.shift_id),
                status = case when attendance.status = 'absent' then 'present' else attendance.status end
  returning * into v_row;

  perform public.create_audit_event('hr', 'clock_in', 'attendance', v_row.id, jsonb_build_object('date', v_today));
  return v_row;
end;
$$;

create or replace function public.clock_out()
returns attendance
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row attendance;
begin
  update attendance
  set check_out = now()
  where employee_id = auth.uid()
    and date = current_date
  returning * into v_row;

  if not found then
    raise exception 'No clock-in record found for today';
  end if;

  perform public.create_audit_event('hr', 'clock_out', 'attendance', v_row.id, jsonb_build_object('date', current_date));
  return v_row;
end;
$$;

create or replace function public.assign_shift(
  p_shift_id uuid,
  p_employee_id uuid,
  p_machine_id uuid,
  p_production_order_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_assignment_role text default 'operator'
)
returns shift_assignments
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row shift_assignments;
begin
  if public.current_profile_role() not in ('admin','manager','supervisor') then
    raise exception 'Insufficient permission to assign shifts';
  end if;

  insert into shift_assignments(shift_id, employee_id, machine_id, production_order_id, starts_at, ends_at, assignment_role, created_by)
  values (p_shift_id, p_employee_id, p_machine_id, p_production_order_id, p_starts_at, p_ends_at, p_assignment_role, auth.uid())
  returning * into v_row;

  perform public.create_notification(
    p_employee_id,
    'hr',
    'New shift assignment',
    'You have been assigned to a shift block.',
    'HR'
  );

  return v_row;
end;
$$;

create or replace function public.request_leave(
  p_type text,
  p_start_date date,
  p_end_date date,
  p_reason text
)
returns leave_requests
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row leave_requests;
begin
  insert into leave_requests(employee_id, type, start_date, end_date, reason, status)
  values (auth.uid(), p_type, p_start_date, p_end_date, p_reason, 'pending')
  returning * into v_row;

  perform public.notify_roles(
    array['admin','manager','supervisor'],
    'hr',
    'Leave request pending',
    'A leave request needs review.',
    'HR'
  );

  return v_row;
end;
$$;

create or replace function public.review_leave_request(
  p_request_id uuid,
  p_status text
)
returns leave_requests
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row leave_requests;
begin
  if public.current_profile_role() not in ('admin','manager','supervisor') then
    raise exception 'Insufficient permission to review leave';
  end if;

  if p_status not in ('approved','rejected') then
    raise exception 'Leave review status must be approved or rejected';
  end if;

  update leave_requests
  set status = p_status,
      approved_by = auth.uid()
  where id = p_request_id
  returning * into v_row;

  if not found then
    raise exception 'Leave request not found';
  end if;

  perform public.create_notification(v_row.employee_id, 'hr', 'Leave request ' || p_status, 'Your leave request has been ' || p_status || '.', 'HR');
  return v_row;
end;
$$;

create or replace function public.complete_maintenance_task(
  p_task_id uuid,
  p_actual_hours numeric,
  p_notes text default null,
  p_parts_used jsonb default '[]'::jsonb
)
returns maintenance_tasks
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_task maintenance_tasks%rowtype;
begin
  update maintenance_tasks
  set status = 'completed',
      completed_date = now(),
      actual_hours = p_actual_hours,
      parts_used = p_parts_used,
      description = trim(coalesce(description, '') || E'\n\nCompletion notes: ' || coalesce(p_notes, ''))
  where id = p_task_id
  returning * into v_task;

  if not found then
    raise exception 'Maintenance task not found';
  end if;

  update machines
  set status = 'idle',
      last_maintenance = now()
  where id = v_task.machine_id;

  perform public.create_audit_event('maintenance', 'task_completed', 'maintenance_tasks', p_task_id, jsonb_build_object('actual_hours', p_actual_hours));
  return v_task;
end;
$$;

create or replace function public.calculate_quality_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(new.total_inspected, 0) > 0 then
    new.pass_rate = round((coalesce(new.passed, 0)::numeric / new.total_inspected::numeric) * 100, 2);
  else
    new.pass_rate = 0;
  end if;

  if coalesce(new.failed, 0) = 0 then
    new.status = 'pass';
  elsif coalesce(new.failed, 0) > 0 and new.pass_rate >= 95 then
    new.status = 'conditional';
  else
    new.status = 'fail';
  end if;

  return new;
end;
$$;

drop trigger if exists quality_checks_calculate_status on quality_checks;
create trigger quality_checks_calculate_status
before insert or update of total_inspected, passed, failed
on quality_checks
for each row execute function public.calculate_quality_status();

create or replace function public.submit_quality_check(
  p_order_id uuid,
  p_batch_number text,
  p_total_inspected int,
  p_passed int,
  p_failed int,
  p_defect_type text[] default '{}',
  p_notes text default null,
  p_images text[] default '{}'
)
returns quality_checks
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row quality_checks;
begin
  insert into quality_checks(order_id, inspector_id, batch_number, total_inspected, passed, failed, defect_type, notes, images)
  values (p_order_id, auth.uid(), p_batch_number, p_total_inspected, p_passed, p_failed, p_defect_type, p_notes, p_images)
  returning * into v_row;

  if v_row.status in ('fail','conditional') then
    perform public.notify_roles(
      array['admin','manager','supervisor'],
      'quality',
      'Quality check ' || v_row.status,
      'Batch ' || coalesce(p_batch_number, 'unknown') || ' requires review.',
      'Quality'
    );
  end if;

  return v_row;
end;
$$;

create or replace function public.apply_expense_budget()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_active boolean := tg_op = 'UPDATE' and old.status in ('approved','paid');
  v_new_active boolean := new.status in ('approved','paid');
begin
  if tg_op = 'UPDATE' and v_old_active then
    update budgets
    set spent = greatest(0, spent - old.amount)
    where department = old.department
      and old.date between period_start and period_end;
  end if;

  if v_new_active then
    update budgets
    set spent = spent + new.amount
    where department = new.department
      and new.date between period_start and period_end;
  end if;

  return new;
end;
$$;

drop trigger if exists expenses_apply_budget on expenses;
create trigger expenses_apply_budget
after insert or update of status, amount, department, date
on expenses
for each row execute function public.apply_expense_budget();

create or replace function public.review_expense(
  p_expense_id uuid,
  p_status text
)
returns expenses
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row expenses;
begin
  if public.current_profile_role() not in ('admin','manager','supervisor') then
    raise exception 'Insufficient permission to review expenses';
  end if;

  if p_status not in ('approved','rejected','paid') then
    raise exception 'Expense status must be approved, rejected, or paid';
  end if;

  update expenses
  set status = p_status,
      approved_by = auth.uid()
  where id = p_expense_id
  returning * into v_row;

  if not found then
    raise exception 'Expense not found';
  end if;

  return v_row;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles(id, full_name, role, department, employee_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'viewer'),
    coalesce(new.raw_user_meta_data->>'department', 'Operations'),
    coalesce(new.raw_user_meta_data->>'employee_id', 'FOS-' || substr(new.id::text, 1, 8))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into storage.buckets(id, name, public)
values ('quality-evidence', 'quality-evidence', false)
on conflict (id) do nothing;

insert into storage.buckets(id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "quality evidence authenticated read"
on storage.objects for select
using (bucket_id = 'quality-evidence' and auth.role() = 'authenticated');

create policy "quality evidence staff upload"
on storage.objects for insert
with check (bucket_id = 'quality-evidence' and public.current_profile_role() in ('admin','manager','supervisor','operator'));

create policy "receipts scoped read"
on storage.objects for select
using (bucket_id = 'receipts' and auth.role() = 'authenticated');

create policy "receipts staff upload"
on storage.objects for insert
with check (bucket_id = 'receipts' and public.current_profile_role() in ('admin','manager','supervisor','operator'));

alter publication supabase_realtime add table production_logs;
alter publication supabase_realtime add table machine_telemetry;
alter publication supabase_realtime add table inventory_items;
alter publication supabase_realtime add table inventory_transactions;
alter publication supabase_realtime add table attendance;
alter publication supabase_realtime add table shift_assignments;

revoke execute on function public.apply_expense_budget() from public;
revoke execute on function public.apply_inventory_transaction() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.current_profile_role() from public;
revoke execute on function public.current_profile_department() from public;
revoke execute on function public.create_audit_event(text, text, text, uuid, jsonb) from public;
revoke execute on function public.create_notification(uuid, text, text, text, text) from public;
revoke execute on function public.notify_roles(text[], text, text, text, text) from public;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_department() to authenticated;

create or replace function public.can_access_area(p_area text, p_level text default 'read')
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.role_access_matrix ram
    where ram.role = public.current_profile_role()
      and ram.area = p_area
      and case p_level
        when 'admin' then ram.can_admin
        when 'approve' then ram.can_approve or ram.can_admin
        when 'write' then ram.can_write or ram.can_admin
        else ram.can_read
      end
  );
$$;

grant execute on function public.can_access_area(text, text) to authenticated;
grant execute on function public.create_audit_event(text, text, text, uuid, jsonb) to authenticated;
grant execute on function public.create_notification(uuid, text, text, text, text) to authenticated;
grant execute on function public.notify_roles(text[], text, text, text, text) to authenticated;

revoke execute on function public.apply_expense_budget() from anon;
revoke execute on function public.apply_inventory_transaction() from anon;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.current_profile_role() from anon;
revoke execute on function public.current_profile_department() from anon;
revoke execute on function public.create_audit_event(text, text, text, uuid, jsonb) from anon;
revoke execute on function public.create_notification(uuid, text, text, text, text) from anon;
revoke execute on function public.notify_roles(text[], text, text, text, text) from anon;
revoke execute on function public.apply_expense_budget() from authenticated;
revoke execute on function public.apply_inventory_transaction() from authenticated;
revoke execute on function public.handle_new_user() from authenticated;

-- ROLE-BASED ACCESS MVP
alter table profiles add column if not exists updated_at timestamptz default now();

create table if not exists role_access_matrix (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('admin','manager','supervisor','operator','viewer')),
  area text not null check (area in ('dashboard','production','inventory','quality','hr','maintenance','finance','notifications','settings')),
  can_read boolean not null default false,
  can_write boolean not null default false,
  can_approve boolean not null default false,
  can_admin boolean not null default false,
  created_at timestamptz not null default now(),
  unique(role, area)
);

alter table role_access_matrix enable row level security;

grant select on role_access_matrix to authenticated;
grant all on role_access_matrix to service_role;

drop policy if exists "role matrix own role read" on role_access_matrix;
create policy "role matrix own role read"
on role_access_matrix for select
using (role = public.current_profile_role() or public.current_profile_role() = 'admin');

drop policy if exists "role matrix admin manage" on role_access_matrix;
create policy "role matrix admin manage"
on role_access_matrix for all
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

insert into role_access_matrix(role, area, can_read, can_write, can_approve, can_admin)
values
  ('admin','dashboard',true,true,true,true),
  ('admin','production',true,true,true,true),
  ('admin','inventory',true,true,true,true),
  ('admin','quality',true,true,true,true),
  ('admin','hr',true,true,true,true),
  ('admin','maintenance',true,true,true,true),
  ('admin','finance',true,true,true,true),
  ('admin','notifications',true,true,true,true),
  ('admin','settings',true,true,true,true),
  ('manager','dashboard',true,false,false,false),
  ('manager','production',true,true,true,false),
  ('manager','inventory',true,true,false,false),
  ('manager','quality',true,true,true,false),
  ('manager','hr',true,true,true,false),
  ('manager','maintenance',true,true,true,false),
  ('manager','finance',true,true,true,false),
  ('manager','notifications',true,true,false,false),
  ('manager','settings',true,false,false,false),
  ('supervisor','dashboard',true,false,false,false),
  ('supervisor','production',true,true,false,false),
  ('supervisor','inventory',true,true,false,false),
  ('supervisor','quality',true,true,true,false),
  ('supervisor','hr',true,true,true,false),
  ('supervisor','maintenance',true,true,true,false),
  ('supervisor','finance',true,true,true,false),
  ('supervisor','notifications',true,true,false,false),
  ('supervisor','settings',true,false,false,false),
  ('operator','dashboard',true,false,false,false),
  ('operator','production',true,true,false,false),
  ('operator','inventory',true,true,false,false),
  ('operator','quality',true,true,false,false),
  ('operator','hr',true,true,false,false),
  ('operator','maintenance',true,true,false,false),
  ('operator','finance',true,true,false,false),
  ('operator','notifications',true,false,false,false),
  ('operator','settings',false,false,false,false),
  ('viewer','dashboard',true,false,false,false),
  ('viewer','production',true,false,false,false),
  ('viewer','inventory',true,false,false,false),
  ('viewer','quality',true,false,false,false),
  ('viewer','hr',false,false,false,false),
  ('viewer','maintenance',true,false,false,false),
  ('viewer','finance',true,false,false,false),
  ('viewer','notifications',true,false,false,false),
  ('viewer','settings',false,false,false,false)
on conflict (role, area) do update
set can_read = excluded.can_read,
    can_write = excluded.can_write,
    can_approve = excluded.can_approve,
    can_admin = excluded.can_admin;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_department() to authenticated;
