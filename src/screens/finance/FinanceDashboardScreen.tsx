import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "../../components/charts/BarChart";
import { GaugeChart } from "../../components/charts/GaugeChart";
import { LineChart } from "../../components/charts/LineChart";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { financeService } from "../../services/finance.service";
import type { Budget, ChartPoint, Expense } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { formatCurrency } from "../../utils/formatters";
import { ChipRow, MetricPill, ProgressBar, ScreenContainer } from "../shared/ScreenScaffold";

export const FinanceDashboardScreen = () => {
  const [period, setPeriod] = useState("This Month");
  const expenseQuery = useQuery({ queryKey: ["expenses"], queryFn: financeService.getExpenses });
  const budgetQuery = useQuery({ queryKey: ["budgets"], queryFn: financeService.getBudgets });
  const expenseData = (expenseQuery.data as Expense[]) || [];
  const budgetData = (budgetQuery.data as Budget[]) || [];
  const total = expenseData.reduce((sum, expense) => sum + expense.amount, 0);
  const allocated = budgetData.reduce((sum, budget) => sum + budget.allocated, 0);
  const spent = budgetData.reduce((sum, budget) => sum + budget.spent, 0);
  const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
  const categoryData = Object.values(
    expenseData.reduce<Record<string, ChartPoint>>((acc, expense) => {
      const category = expense.category || "Uncategorized";
      acc[category] = acc[category] || { label: category.slice(0, 8), value: 0 };
      acc[category].value += Number(expense.amount || 0);
      return acc;
    }, {}),
  );
  const trendData = Object.values(
    expenseData.reduce<Record<string, ChartPoint>>((acc, expense) => {
      const key = expense.date || "No date";
      acc[key] = acc[key] || { label: key === "No date" ? key : new Date(key).toLocaleDateString([], { month: "short", day: "numeric" }), value: 0 };
      acc[key].value += Number(expense.amount || 0);
      return acc;
    }, {}),
  ).slice(-7);

  return (
    <ScreenContainer title="Finance" subtitle="Expenses, approvals, and budgets" navigationMode="drawer">
      <ChipRow items={["This Week", "This Month", "This Quarter"]} active={period} onChange={setPeriod} />
      <View style={styles.metrics}>
        <MetricPill label="Expenses" value={formatCurrency(total)} color={colors.finance} />
        <MetricPill label="Pending" value={expenseData.filter((expense) => expense.status === "pending").length.toString()} color={colors.amber400} />
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Utilization</Text>
        <View style={styles.gaugeRow}>
          <GaugeChart value={utilization} color={colors.finance} label="used" />
          <View style={styles.gaugeCopy}>
            <Text style={styles.big}>{formatCurrency(spent)}</Text>
            <Text style={styles.meta}>spent of {formatCurrency(allocated)} allocated</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Expenses by Category</Text>
        {categoryData.length ? <BarChart data={categoryData} color={colors.finance} /> : <EmptyState variant="finance" title="No expense categories" subtitle="Submitted expenses will build this chart." />}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Expense Trend</Text>
        {trendData.length ? <LineChart data={trendData} color={colors.amber400} /> : <EmptyState variant="finance" title="No expense trend" subtitle="Daily totals appear after expenses are recorded." />}
      </Card>

      {budgetData.length ? (
        budgetData.map((budget) => {
          const budgetPct = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;
          return (
            <Card key={budget.id} accentColor={budget.spent > budget.allocated ? colors.maintenance : colors.finance} style={styles.budget}>
              <View style={styles.budgetHead}>
                <Text style={styles.budgetTitle}>{budget.department}</Text>
                <Text style={styles.meta}>{Math.round(budgetPct)}%</Text>
              </View>
              <ProgressBar value={budgetPct} color={budget.spent > budget.allocated ? colors.maintenance : colors.finance} />
            </Card>
          );
        })
      ) : (
        <EmptyState variant="finance" title="No budgets configured" subtitle="Department budgets from Supabase will appear here." />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 17,
  },
  gaugeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  gaugeCopy: {
    flex: 1,
  },
  big: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 25,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
  budget: {
    gap: spacing.sm,
  },
  budgetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  budgetTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 15,
  },
});
