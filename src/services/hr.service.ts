import { attendanceRecords, employees, leaveRequests } from "../utils/constants";
import { shouldUseSupabase, supabase } from "./supabase";

export const hrService = {
  async getEmployees() {
    if (!(await shouldUseSupabase())) return employees;
    const { data, error } = await supabase.from("profiles").select("*").order("full_name");
    if (error) throw error;
    return data;
  },

  async getAttendance() {
    if (!(await shouldUseSupabase())) return attendanceRecords;
    const { data, error } = await supabase.from("attendance").select("*, employee:profiles(*)").order("date", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getLeaveRequests() {
    if (!(await shouldUseSupabase())) return leaveRequests;
    const { data, error } = await supabase.from("leave_requests").select("*, employee:profiles(*)").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async clockIn(shiftId?: string) {
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("clock_in", { p_shift_id: shiftId || null });
    if (error) throw error;
    return data;
  },

  async clockOut() {
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("clock_out");
    if (error) throw error;
    return data;
  },

  async requestLeave(input: { type: "annual" | "sick" | "emergency" | "unpaid"; startDate: string; endDate: string; reason: string }) {
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("request_leave", {
      p_type: input.type,
      p_start_date: input.startDate,
      p_end_date: input.endDate,
      p_reason: input.reason,
    });
    if (error) throw error;
    return data;
  },

  async reviewLeaveRequest(requestId: string, status: "approved" | "rejected") {
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("review_leave_request", {
      p_request_id: requestId,
      p_status: status,
    });
    if (error) throw error;
    return data;
  },

  async assignShift(input: { shiftId: string; employeeId: string; machineId?: string; productionOrderId?: string; startsAt: string; endsAt: string; role?: string }) {
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("assign_shift", {
      p_shift_id: input.shiftId,
      p_employee_id: input.employeeId,
      p_machine_id: input.machineId || null,
      p_production_order_id: input.productionOrderId || null,
      p_starts_at: input.startsAt,
      p_ends_at: input.endsAt,
      p_assignment_role: input.role || "operator",
    });
    if (error) throw error;
    return data;
  },
};
