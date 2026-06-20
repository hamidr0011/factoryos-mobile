import type { ModuleId, Role } from "../types";

export type AppArea = ModuleId | "dashboard" | "notifications" | "settings";
export type AccessLevel = "read" | "write" | "approve" | "admin";

export const appAreas: AppArea[] = ["dashboard", "production", "inventory", "quality", "hr", "maintenance", "finance", "notifications", "settings"];

export const roleLabels: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  supervisor: "Supervisor",
  operator: "Operator",
  viewer: "Viewer",
};

export const roleDescriptions: Record<Role, string> = {
  admin: "Full system control, account creation, role assignment, budgets, and all operational modules.",
  manager: "Department oversight, approvals, reporting, production control, finance visibility, and staff operations.",
  supervisor: "Floor execution, inspections, maintenance scheduling, attendance review, and operator coordination.",
  operator: "Daily execution: assigned orders, stock movements, quality checks, clock-in/out, leave, and task completion.",
  viewer: "Read-only dashboards and operational visibility without create, update, approval, or delete actions.",
};

export const canUseRole = (userRole: Role, allowedRoles: Role[]) => allowedRoles.includes(userRole);

export const moduleDeniedMessage = (role: Role, area: AppArea, level: AccessLevel = "read") => {
  const action = level === "read" ? "open" : level === "write" ? "change" : level === "approve" ? "approve in" : "administer";
  return `${roleLabels[role]} accounts cannot ${action} ${area}. Ask an admin to update your role if this is part of your work.`;
};
