import { apiRequest } from "./api";
import { stripSeedData } from "./seedDataGuard";

export const productionService = {
  async getOrders(status?: string) {
    const params = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    return stripSeedData("orders", await apiRequest(`/api/production/orders${params}`));
  },

  async getOrderLogs(orderId: string) {
    return apiRequest(`/api/production/orders/${orderId}/logs`);
  },

  async getMachines() {
    return stripSeedData("machines", await apiRequest("/api/production/machines"));
  },

  async updateProgress(orderId: string, quantityDelta: number, notes?: string) {
    return apiRequest(`/api/production/orders/${orderId}/progress`, {
      method: "POST",
      body: JSON.stringify({ quantityDelta, notes }),
    });
  },

  async updateStatus(orderId: string, status: "pending" | "in_progress" | "completed" | "on_hold" | "cancelled", notes?: string) {
    return apiRequest(`/api/production/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
  },

  async recordMachineTelemetry(input: { machineId: string; status: string; efficiencyPercent: number; outputRate?: number; temperatureC?: number; vibrationMmS?: number }) {
    return apiRequest(`/api/production/machines/${input.machineId}/telemetry`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
