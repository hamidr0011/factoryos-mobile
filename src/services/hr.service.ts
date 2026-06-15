import type { Role } from "../types";
import { apiRequest, isApiConfigured } from "./api";

export const hrService = {
  async getEmployees() {
    return apiRequest("/api/hr/employees");
  },

  async getAttendance() {
    return apiRequest("/api/hr/attendance");
  },

  async getLeaveRequests() {
    return apiRequest("/api/hr/leave-requests");
  },

  async createAccount(input: { email: string; password: string; fullName: string; role: Role; department: string; employeeId: string }) {
    if (!isApiConfigured) {
      throw new Error("Render API is required to create accounts securely.");
    }

    return apiRequest("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async clockIn(shiftId?: string) {
    return apiRequest("/api/hr/clock-in", {
      method: "POST",
      body: JSON.stringify({ shiftId: shiftId || null }),
    });
  },

  async clockOut() {
    return apiRequest("/api/hr/clock-out", { method: "POST" });
  },

  async requestLeave(input: { type: "annual" | "sick" | "emergency" | "unpaid"; startDate: string; endDate: string; reason: string }) {
    return apiRequest("/api/hr/leave-requests", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async reviewLeaveRequest(requestId: string, status: "approved" | "rejected") {
    return apiRequest(`/api/hr/leave-requests/${requestId}/review`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },

  async assignShift(input: { shiftId: string; employeeId: string; machineId?: string; productionOrderId?: string; startsAt: string; endsAt: string; role?: string }) {
    return apiRequest("/api/hr/shift-assignments", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
