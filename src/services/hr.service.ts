import { attendanceRecords, employees, leaveRequests } from "../utils/constants";
import { isSupabaseConfigured, supabase } from "./supabase";

export const hrService = {
  async getEmployees() {
    if (!isSupabaseConfigured) return employees;
    const { data, error } = await supabase.from("profiles").select("*").order("full_name");
    if (error) throw error;
    return data;
  },

  async getAttendance() {
    if (!isSupabaseConfigured) return attendanceRecords;
    const { data, error } = await supabase.from("attendance").select("*, employee:profiles(*)").order("date", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getLeaveRequests() {
    if (!isSupabaseConfigured) return leaveRequests;
    const { data, error } = await supabase.from("leave_requests").select("*, employee:profiles(*)").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
};
