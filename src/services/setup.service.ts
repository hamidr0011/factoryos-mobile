import type { Profile } from "../types";
import { publicApiRequest } from "./api";

interface SetupStatus {
  needsSuperAdmin: boolean;
  adminCount: number;
}

interface CreateSuperAdminInput {
  email: string;
  password: string;
  fullName: string;
  department: string;
  employeeId: string;
}

interface CreateSuperAdminResult {
  user: {
    id: string;
    email?: string;
  };
  profile: Profile;
  setupComplete: boolean;
}

export const setupService = {
  getStatus() {
    return publicApiRequest<SetupStatus>("/api/setup/status");
  },

  createSuperAdmin(input: CreateSuperAdminInput) {
    return publicApiRequest<CreateSuperAdminResult>("/api/setup/super-admin", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
