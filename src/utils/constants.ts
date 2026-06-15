import type {
  AttendanceRecord,
  Budget,
  Expense,
  FactoryNotification,
  InventoryItem,
  InventoryTransaction,
  LeaveRequest,
  Machine,
  MaintenanceTask,
  ModuleDefinition,
  ProductionOrder,
  Profile,
  QualityCheck,
} from "../types";

export const colors = {
  steel950: "#F3F5F1",
  steel900: "#FFFFFF",
  steel800: "#E8EEE8",
  steel700: "#D3DDD4",
  steel500: "#727F77",
  steel300: "#4D5B52",
  steel100: "#16211A",
  amber400: "#4E6657",
  amber300: "#6F8475",
  production: "#536B78",
  inventory: "#627C63",
  quality: "#766D7A",
  hr: "#82725D",
  maintenance: "#A0615E",
  finance: "#587A7E",
  red: "#A0615E",
  emerald: "#627C63",
  cyan: "#587A7E",
  blue: "#536B78",
  violet: "#766D7A",
  orange: "#82725D",
};

export const typography = {
  display: "SpaceGrotesk_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  mono: "JetBrainsMono_400Regular",
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  cell: 4,
  card: 8,
  modal: 16,
  sheet: 24,
};

export const modules: ModuleDefinition[] = [
  { id: "production", label: "Production", icon: "factory", color: colors.production, screen: "Production", stat: "94.2%", delta: "+2.1% rate" },
  { id: "inventory", label: "Inventory", icon: "package", color: colors.inventory, screen: "Inventory", stat: "1,847", delta: "12 low stock" },
  { id: "quality", label: "Quality", icon: "shield-check", color: colors.quality, screen: "Quality", stat: "98.4%", delta: "pass yield" },
  { id: "hr", label: "HR & People", icon: "users", color: colors.hr, screen: "HR", stat: "143", delta: "present" },
  { id: "maintenance", label: "Maintenance", icon: "wrench", color: colors.maintenance, screen: "Maintenance", stat: "7", delta: "open tasks" },
  { id: "finance", label: "Finance", icon: "trending-up", color: colors.finance, screen: "Finance", stat: "72%", delta: "budget used" },
];

export const demoProfile: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Aisha Khan",
  role: "supervisor",
  department: "Factory Floor A",
  employee_id: "FOS-1024",
};

export const employees: Profile[] = [
  demoProfile,
  { id: "00000000-0000-4000-8000-000000000002", full_name: "Daniel Ortiz", role: "operator", department: "Production", employee_id: "FOS-1041" },
  { id: "00000000-0000-4000-8000-000000000003", full_name: "Mei Tan", role: "manager", department: "Quality", employee_id: "FOS-1011" },
  { id: "00000000-0000-4000-8000-000000000004", full_name: "Omar Farooq", role: "operator", department: "Maintenance", employee_id: "FOS-1107" },
  { id: "00000000-0000-4000-8000-000000000005", full_name: "Sofia Reyes", role: "admin", department: "Finance", employee_id: "FOS-1001" },
];

export const machines: Machine[] = [
  { id: "m1", machine_code: "CNC-01", name: "CNC Lathe 01", type: "CNC Lathe", status: "running", efficiency_percent: 96.4, location: "Line A", last_maintenance: "2026-06-05T09:20:00Z" },
  { id: "m2", machine_code: "ASM-04", name: "Assembly Cell 04", type: "Assembly", status: "running", efficiency_percent: 91.2, location: "Line B", last_maintenance: "2026-06-01T12:00:00Z" },
  { id: "m3", machine_code: "PRS-02", name: "Hydraulic Press 02", type: "Press", status: "maintenance", efficiency_percent: 63.8, location: "Line C", last_maintenance: "2026-06-13T06:30:00Z" },
  { id: "m4", machine_code: "PKG-07", name: "Packaging Robot 07", type: "Packaging", status: "idle", efficiency_percent: 77.5, location: "Pack Bay", last_maintenance: "2026-05-28T10:10:00Z" },
  { id: "m5", machine_code: "CUT-09", name: "Laser Cutter 09", type: "Laser", status: "breakdown", efficiency_percent: 28.6, location: "Line D", last_maintenance: "2026-06-11T14:40:00Z" },
];

export const productionOrders: ProductionOrder[] = [
  { id: "po1", order_number: "PO-260613-001", product_name: "Industrial Valve Housing", quantity_planned: 5000, quantity_produced: 4210, status: "in_progress", priority: "critical", machine: machines[0], operator: employees[1], start_date: "2026-06-13T07:00:00Z", end_date: "2026-06-14T18:00:00Z", notes: "High-priority export order.", created_at: "2026-06-13T06:45:00Z" },
  { id: "po2", order_number: "PO-260613-002", product_name: "Gearbox Carrier Plate", quantity_planned: 2200, quantity_produced: 2200, status: "completed", priority: "high", machine: machines[1], operator: employees[0], start_date: "2026-06-12T08:00:00Z", end_date: "2026-06-13T09:00:00Z", created_at: "2026-06-12T07:45:00Z" },
  { id: "po3", order_number: "PO-260613-003", product_name: "Sensor Bracket Assembly", quantity_planned: 1800, quantity_produced: 420, status: "on_hold", priority: "medium", machine: machines[2], operator: employees[3], start_date: "2026-06-13T10:30:00Z", end_date: "2026-06-14T12:00:00Z", notes: "Waiting for press calibration.", created_at: "2026-06-13T09:50:00Z" },
];

export const inventoryItems: InventoryItem[] = [
  { id: "i1", sku: "RM-STL-8MM", name: "8mm Cold Rolled Steel", category: "Raw Material", unit: "sheets", quantity_on_hand: 148.5, reorder_level: 80, unit_cost: 12600, warehouse_location: "W-A12" },
  { id: "i2", sku: "SP-BRG-6205", name: "Bearing 6205 ZZ", category: "Spare Parts", unit: "pcs", quantity_on_hand: 22, reorder_level: 40, unit_cost: 950, warehouse_location: "S-B04" },
  { id: "i3", sku: "PKG-CRT-M", name: "Medium Export Carton", category: "Packaging", unit: "pcs", quantity_on_hand: 0, reorder_level: 250, unit_cost: 82, warehouse_location: "P-C02" },
  { id: "i4", sku: "FG-VLV-18", name: "Valve Housing Finished", category: "Finished", unit: "pcs", quantity_on_hand: 841, reorder_level: 300, unit_cost: 4200, warehouse_location: "F-D18" },
];

export const inventoryTransactions: InventoryTransaction[] = [
  { id: "tx1", item_id: "i1", type: "out", quantity: 12, reference: "PO-260613-001", created_at: "2026-06-13T09:12:00Z" },
  { id: "tx2", item_id: "i2", type: "adjustment", quantity: -4, reference: "Cycle count", created_at: "2026-06-12T14:00:00Z" },
  { id: "tx3", item_id: "i4", type: "in", quantity: 220, reference: "PO-260613-002", created_at: "2026-06-13T10:05:00Z" },
];

export const qualityChecks: QualityCheck[] = [
  { id: "q1", order_id: "po1", batch_number: "B-4811", total_inspected: 300, passed: 291, failed: 9, defect_type: ["BURR", "SURFACE"], status: "conditional", inspector: employees[2], notes: "Minor burrs on second cavity.", created_at: "2026-06-13T10:15:00Z" },
  { id: "q2", order_id: "po2", batch_number: "B-4798", total_inspected: 240, passed: 240, failed: 0, defect_type: [], status: "pass", inspector: employees[2], created_at: "2026-06-13T08:20:00Z" },
];

export const attendanceRecords: AttendanceRecord[] = employees.map((employee, index) => ({
  id: `att-${employee.id}`,
  employee,
  date: "2026-06-13",
  check_in: index === 2 ? "2026-06-13T08:14:00Z" : "2026-06-13T07:55:00Z",
  check_out: undefined,
  status: index === 2 ? "late" : "present",
}));

export const leaveRequests: LeaveRequest[] = [
  { id: "lr1", employee: employees[1], type: "annual", start_date: "2026-06-20", end_date: "2026-06-22", reason: "Family event", status: "pending" },
  { id: "lr2", employee: employees[3], type: "sick", start_date: "2026-06-12", end_date: "2026-06-12", reason: "Medical appointment", status: "approved" },
];

export const maintenanceTasks: MaintenanceTask[] = [
  { id: "mt1", machine: machines[4], type: "emergency", title: "Laser head fault recovery", description: "Beam alignment drift and thermal alarm during second shift.", priority: "critical", status: "open", assigned_to: employees[3], scheduled_date: "2026-06-13T12:30:00Z", estimated_hours: 4, cost: 68000 },
  { id: "mt2", machine: machines[2], type: "inspection", title: "Hydraulic pressure calibration", description: "Verify pressure variance after seal replacement.", priority: "high", status: "in_progress", assigned_to: employees[0], scheduled_date: "2026-06-13T08:00:00Z", estimated_hours: 2.5, actual_hours: 1.2, cost: 14500 },
  { id: "mt3", machine: machines[1], type: "preventive", title: "Servo belt replacement", description: "Scheduled PM cycle before high-volume run.", priority: "medium", status: "open", assigned_to: employees[3], scheduled_date: "2026-06-15T10:00:00Z", estimated_hours: 1.5, cost: 9200 },
];

export const expenses: Expense[] = [
  { id: "ex1", category: "Maintenance", description: "Laser head replacement kit", amount: 182000, currency: "PKR", date: "2026-06-13", department: "Maintenance", status: "pending" },
  { id: "ex2", category: "Raw Material", description: "Cold rolled steel sheets", amount: 940000, currency: "PKR", date: "2026-06-11", department: "Production", status: "approved" },
  { id: "ex3", category: "Utilities", description: "Compressor energy allocation", amount: 126500, currency: "PKR", date: "2026-06-10", department: "Factory Floor A", status: "paid" },
];

export const budgets: Budget[] = [
  { id: "b1", department: "Production", period_start: "2026-06-01", period_end: "2026-06-30", allocated: 3200000, spent: 2300000 },
  { id: "b2", department: "Maintenance", period_start: "2026-06-01", period_end: "2026-06-30", allocated: 900000, spent: 720000 },
  { id: "b3", department: "Quality", period_start: "2026-06-01", period_end: "2026-06-30", allocated: 520000, spent: 254000 },
  { id: "b4", department: "HR", period_start: "2026-06-01", period_end: "2026-06-30", allocated: 680000, spent: 341000 },
];

export const notifications: FactoryNotification[] = [
  { id: "n1", user_id: demoProfile.id, module: "maintenance", title: "Critical machine fault", body: "Laser Cutter 09 is down and blocking Line D.", is_read: false, action_url: "Maintenance", created_at: "2026-06-13T11:02:00Z" },
  { id: "n2", user_id: demoProfile.id, module: "inventory", title: "Packaging cartons depleted", body: "Medium export cartons are out of stock.", is_read: false, action_url: "Inventory", created_at: "2026-06-13T10:44:00Z" },
  { id: "n3", user_id: demoProfile.id, module: "quality", title: "Conditional batch release", body: "Batch B-4811 requires supervisor review.", is_read: true, action_url: "Quality", created_at: "2026-06-13T10:18:00Z" },
];

export const kpiCards = [
  { label: "Production Rate", value: "94.2%", numericValue: 94.2, delta: "+2.1%", color: colors.production },
  { label: "Inventory Items", value: "1,847", numericValue: 1847, delta: "12 low stock", color: colors.inventory },
  { label: "Active Machines", value: "23/26", numericValue: 23, delta: "3 in maintenance", color: colors.maintenance },
  { label: "Today's Output", value: "4,291", numericValue: 4291, delta: "units", color: colors.quality },
];
