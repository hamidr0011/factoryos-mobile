import type { Role } from "../types";
import { useAuthStore } from "../store/authStore";
import type { AccessLevel, AppArea } from "../utils/permissions";
import { canAccessArea as checkAreaAccess, roleLabels } from "../utils/permissions";

export const usePermissions = () => {
  const userRole = useAuthStore((state) => state.userRole);
  const can = (roles: Role[]) => roles.includes(userRole);
  const canAccessArea = (area: AppArea, level: AccessLevel = "read") => checkAreaAccess(userRole, area, level);

  return {
    userRole,
    roleLabel: roleLabels[userRole],
    can,
    canAccessArea,
    canWriteArea: (area: AppArea) => canAccessArea(area, "write"),
    canApproveArea: (area: AppArea) => canAccessArea(area, "approve"),
    isManager: can(["admin", "manager", "supervisor"]),
    isAdmin: userRole === "admin",
  };
};
