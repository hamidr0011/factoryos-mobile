import { maintenanceTasks } from "../utils/constants";
import { shouldUseSupabase, supabase } from "./supabase";

export const maintenanceService = {
  async getTasks() {
    if (!(await shouldUseSupabase())) return maintenanceTasks;
    const { data, error } = await supabase
      .from("maintenance_tasks")
      .select("*, machine:machines(*), assigned_to:profiles(*)")
      .order("scheduled_date", { ascending: true });
    if (error) throw error;
    return data;
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
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase
      .from("maintenance_tasks")
      .insert({
        machine_id: input.machineId,
        type: input.type,
        title: input.title,
        description: input.description || null,
        priority: input.priority,
        status: "open",
        assigned_to: input.assignedTo || null,
        scheduled_date: input.scheduledDate,
        estimated_hours: input.estimatedHours,
        parts_used: input.partsUsed || [],
      })
      .select("*, machine:machines(*), assigned_to:profiles(*)")
      .single();
    if (error) throw error;
    return data;
  },

  async completeTask(input: { taskId: string; actualHours: number; notes?: string; partsUsed?: unknown[] }) {
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("complete_maintenance_task", {
      p_task_id: input.taskId,
      p_actual_hours: input.actualHours,
      p_notes: input.notes || null,
      p_parts_used: input.partsUsed || [],
    });
    if (error) throw error;
    return data;
  },
};
