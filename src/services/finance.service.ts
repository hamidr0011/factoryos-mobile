import { budgets, expenses } from "../utils/constants";
import { shouldUseSupabase, supabase } from "./supabase";

export const financeService = {
  async getExpenses() {
    if (!(await shouldUseSupabase())) return expenses;
    const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getBudgets() {
    if (!(await shouldUseSupabase())) return budgets;
    const { data, error } = await supabase.from("budgets").select("*").order("department");
    if (error) throw error;
    return data;
  },

  async createExpense(input: {
    category: string;
    description: string;
    amount: number;
    currency?: string;
    date: string;
    department: string;
    receiptUrl?: string;
  }) {
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        category: input.category,
        description: input.description,
        amount: input.amount,
        currency: input.currency || "PKR",
        date: input.date,
        department: input.department,
        status: "pending",
        receipt_url: input.receiptUrl || null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async reviewExpense(expenseId: string, status: "approved" | "rejected" | "paid") {
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("review_expense", {
      p_expense_id: expenseId,
      p_status: status,
    });
    if (error) throw error;
    return data;
  },
};
