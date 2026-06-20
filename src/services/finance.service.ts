import { apiRequest } from "./api";
import { stripSeedData } from "./seedDataGuard";

export const financeService = {
  async getExpenses() {
    return stripSeedData("finance", await apiRequest("/api/finance/expenses"));
  },

  async getBudgets() {
    return stripSeedData("finance", await apiRequest("/api/finance/budgets"));
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
    return apiRequest("/api/finance/expenses", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async reviewExpense(expenseId: string, status: "approved" | "rejected" | "paid") {
    return apiRequest(`/api/finance/expenses/${expenseId}/review`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },
};
