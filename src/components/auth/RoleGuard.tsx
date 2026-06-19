import { PropsWithChildren, ReactNode } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { AccessDeniedScreen } from "../../screens/settings/AccessDeniedScreen";
import type { Role } from "../../types";
import type { AccessLevel, AppArea } from "../../utils/permissions";

interface RoleGuardProps extends PropsWithChildren {
  roles?: Role[];
  area?: AppArea;
  level?: AccessLevel;
  fallback?: ReactNode;
}

export const RoleGuard = ({ roles, area, level = "read", fallback, children }: RoleGuardProps) => {
  const { can, canAccessArea } = usePermissions();
  const allowed = roles ? can(roles) : area ? canAccessArea(area, level) : true;

  if (!allowed) {
    return <>{fallback || <AccessDeniedScreen area={area} level={level} />}</>;
  }

  return <>{children}</>;
};
