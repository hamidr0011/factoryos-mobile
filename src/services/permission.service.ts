import type { Role } from "../types";
import type { AppArea } from "../utils/permissions";
import { apiRequest } from "./api";

export interface RoleAccessMatrixRow {
  role: Role;
  area: AppArea;
  canRead: boolean;
  canWrite: boolean;
  canApprove: boolean;
  canAdmin: boolean;
}

export interface RoleAccessResponse {
  role: Role;
  source: "database";
  matrix: RoleAccessMatrixRow[];
  currentRoleAccess: RoleAccessMatrixRow[];
}

export const permissionService = {
  getRoleAccess() {
    return apiRequest<RoleAccessResponse>("/api/role-access");
  },
};
