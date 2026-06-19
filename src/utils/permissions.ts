import type { ModuleId, Role } from "../types";

export type AppArea = ModuleId | "dashboard" | "notifications" | "settings";
export type AccessLevel = "read" | "write" | "approve" | "admin";

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

const allAreas: AppArea[] = ["dashboard", "production", "inventory", "quality", "hr", "maintenance", "finance", "notifications", "settings"];

export const roleAreaAccess: Record<Role, AppArea[]> = {
  admin: allAreas,
  manager: allAreas,
  supervisor: ["dashboard", "production", "inventory", "quality", "hr", "maintenance", "finance", "notifications", "settings"],
  operator: ["dashboard", "production", "inventory", "quality", "hr", "maintenance", "finance", "notifications"],
  viewer: ["dashboard", "production", "inventory", "quality", "maintenance", "finance", "notifications"],
};

export const roleWriteAccess: Record<Role, AppArea[]> = {
  admin: allAreas,
  manager: ["production", "inventory", "quality", "hr", "maintenance", "finance", "notifications"],
  supervisor: ["production", "inventory", "quality", "hr", "maintenance", "finance", "notifications"],
  operator: ["production", "inventory", "quality", "hr", "maintenance", "finance"],
  viewer: [],
};

export const roleApprovalAccess: Record<Role, AppArea[]> = {
  admin: allAreas,
  manager: ["hr", "finance", "production", "quality", "maintenance"],
  supervisor: ["hr", "finance", "quality", "maintenance"],
  operator: [],
  viewer: [],
};

export const roleAdminAccess: Record<Role, AppArea[]> = {
  admin: allAreas,
  manager: [],
  supervisor: [],
  operator: [],
  viewer: [],
};

export const roleMatrixRows = (Object.keys(roleAreaAccess) as Role[]).flatMap((role) =>
  allAreas.map((area) => ({
    role,
    area,
    canRead: roleAreaAccess[role].includes(area),
    canWrite: roleWriteAccess[role].includes(area),
    canApprove: roleApprovalAccess[role].includes(area),
    canAdmin: roleAdminAccess[role].includes(area),
  })),
);

export const canUseRole = (userRole: Role, allowedRoles: Role[]) => allowedRoles.includes(userRole);

export const canAccessArea = (userRole: Role, area: AppArea, level: AccessLevel = "read") => {
  if (level === "admin") return roleAdminAccess[userRole].includes(area);
  if (level === "approve") return roleApprovalAccess[userRole].includes(area) || roleAdminAccess[userRole].includes(area);
  if (level === "write") return roleWriteAccess[userRole].includes(area) || roleAdminAccess[userRole].includes(area);
  return roleAreaAccess[userRole].includes(area);
};

export const moduleDeniedMessage = (role: Role, area: AppArea, level: AccessLevel = "read") => {
  const action = level === "read" ? "open" : level === "write" ? "change" : level === "approve" ? "approve in" : "administer";
  return `${roleLabels[role]} accounts cannot ${action} ${area}. Ask an admin to update your role if this is part of your work.`;
};
