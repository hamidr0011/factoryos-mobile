import type { Session } from "@supabase/supabase-js";

export type Role = "admin" | "manager" | "supervisor" | "operator" | "viewer";

export type ModuleId =
  | "production"
  | "inventory"
  | "quality"
  | "hr"
  | "maintenance"
  | "finance";

export type StatusTone = "running" | "idle" | "maintenance" | "breakdown" | "pending" | "in_progress" | "completed" | "critical" | "approved" | "rejected" | "paid" | "pass" | "fail" | "conditional" | "open";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  department: string;
  avatar_url?: string | null;
  employee_id: string;
  created_at?: string;
}

export interface AuthStateShape {
  session: Session | null;
  profile: Profile | null;
  userRole: Role;
}

export interface Machine {
  id: string;
  machine_code: string;
  name: string;
  type: string;
  status: "running" | "idle" | "maintenance" | "breakdown";
  efficiency_percent: number;
  location: string;
  last_maintenance: string;
  created_at?: string;
}

export interface ProductionOrder {
  id: string;
  order_number: string;
  product_name: string;
  quantity_planned: number;
  quantity_produced: number;
  status: "pending" | "in_progress" | "completed" | "on_hold" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  machine?: Machine;
  operator?: Profile;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: number;
  warehouse_location: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  type: "in" | "out" | "adjustment" | "transfer";
  quantity: number;
  reference: string;
  created_at: string;
}

export interface QualityCheck {
  id: string;
  order_id: string;
  order?: ProductionOrder;
  batch_number: string;
  total_inspected: number;
  passed: number;
  failed: number;
  defect_type: string[];
  status: "pass" | "fail" | "conditional";
  inspector?: Profile;
  notes?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee: Profile;
  date: string;
  check_in?: string;
  check_out?: string;
  status: "present" | "absent" | "late" | "half_day" | "leave";
}

export interface LeaveRequest {
  id: string;
  employee: Profile;
  type: "annual" | "sick" | "emergency" | "unpaid";
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

export interface MaintenanceTask {
  id: string;
  machine: Machine;
  type: "preventive" | "corrective" | "emergency" | "inspection";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "completed" | "cancelled";
  assigned_to?: Profile;
  scheduled_date: string;
  estimated_hours: number;
  actual_hours?: number;
  cost: number;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  department: string;
  status: "pending" | "approved" | "rejected" | "paid";
}

export interface Budget {
  id: string;
  department: string;
  period_start: string;
  period_end: string;
  allocated: number;
  spent: number;
}

export interface FactoryNotification {
  id: string;
  user_id: string;
  module: ModuleId | "system";
  title: string;
  body: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  icon: string;
  color: string;
  screen: string;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
  color?: string;
}
