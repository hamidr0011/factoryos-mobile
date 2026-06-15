import type { Role } from "../types";
import { useAuthStore } from "../store/authStore";

export const usePermissions = () => {
  const userRole = useAuthStore((state) => state.userRole);
  const can = (roles: Role[]) => roles.includes(userRole);

  return {
    userRole,
    can,
    isManager: can(["admin", "manager", "supervisor"]),
    isAdmin: userRole === "admin",
  };
};
