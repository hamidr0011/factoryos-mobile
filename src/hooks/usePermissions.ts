import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Role } from "../types";
import { permissionService } from "../services/permission.service";
import { useAuthStore } from "../store/authStore";
import type { AccessLevel, AppArea } from "../utils/permissions";
import { roleLabels } from "../utils/permissions";

export const usePermissions = () => {
  const userRole = useAuthStore((state) => state.userRole);
  const session = useAuthStore((state) => state.session);
  const accessQuery = useQuery({
    queryKey: ["role_access"],
    queryFn: permissionService.getRoleAccess,
    enabled: Boolean(session),
    staleTime: 1000 * 60,
  });
  const currentRoleAccess = useMemo(() => accessQuery.data?.currentRoleAccess || [], [accessQuery.data]);
  const can = (roles: Role[]) => roles.includes(userRole);
  const canAccessArea = (area: AppArea, level: AccessLevel = "read") => {
    const row = currentRoleAccess.find((entry) => entry.area === area);
    if (!row) return false;
    if (level === "admin") return row.canAdmin;
    if (level === "approve") return row.canApprove || row.canAdmin;
    if (level === "write") return row.canWrite || row.canAdmin;
    return row.canRead || row.canWrite || row.canApprove || row.canAdmin;
  };

  return {
    userRole,
    roleLabel: roleLabels[userRole],
    accessLoading: accessQuery.isLoading,
    accessRows: currentRoleAccess,
    can,
    canAccessArea,
    canWriteArea: (area: AppArea) => canAccessArea(area, "write"),
    canApproveArea: (area: AppArea) => canAccessArea(area, "approve"),
    isManager: can(["admin", "manager", "supervisor"]),
    isAdmin: userRole === "admin",
  };
};
