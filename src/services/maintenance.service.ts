import { apiRequest } from "./api";
import { stripSeedData } from "./seedDataGuard";

export const maintenanceService = {
  async getTasks() {
    return stripSeedData("maintenance", await apiRequest("/api/maintenance/tasks"));
  },

  async createTask(input: {
    machineId: string;
    type: "preventive" | "corrective" | "emergency" | "inspection";
    title: string;
    description?: string;
    priority: "low" | "medium" | "high" | "critical";
    assignedTo?: string;
    scheduledDate: string;
    estimatedHours: number;
    partsUsed?: unknown[];
  }) {
    return apiRequest("/api/maintenance/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async completeTask(input: { taskId: string; actualHours: number; notes?: string; partsUsed?: unknown[] }) {
    return apiRequest(`/api/maintenance/tasks/${input.taskId}/complete`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
