import { PropsWithChildren, ReactNode } from "react";
import type { Role } from "../../types";
import { usePermissions } from "../../hooks/usePermissions";

interface PermissionGateProps extends PropsWithChildren {
  roles: Role[];
  fallback?: ReactNode;
}

export const PermissionGate = ({ roles, fallback = null, children }: PermissionGateProps) => {
  const { can } = usePermissions();
  if (!can(roles)) return <>{fallback}</>;
  return <>{children}</>;
};
