import { budgets, expenses } from "../utils/constants";
import { isSupabaseConfigured, supabase } from "./supabase";

export const financeService = {
  async getExpenses() {
    if (!isSupabaseConfigured) return expenses;
    const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getBudgets() {
    if (!isSupabaseConfigured) return budgets;
    const { data, error } = await supabase.from("budgets").select("*").order("department");
    if (error) throw error;
    return data;
  },
};
