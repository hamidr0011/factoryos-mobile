import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "../../components/charts/BarChart";
import { GaugeChart } from "../../components/charts/GaugeChart";
import { LineChart } from "../../components/charts/LineChart";
import { Card } from "../../components/ui/Card";
import { financeService } from "../../services/finance.service";
import type { Budget, Expense } from "../../types";
import { budgets, colors, expenses, spacing, typography } from "../../utils/constants";
import { formatCurrency } from "../../utils/formatters";
import { ChipRow, MetricPill, ProgressBar, ScreenContainer } from "../shared/ScreenScaffold";

export const FinanceDashboardScreen = () => {
  const [period, setPeriod] = useState("This Month");
  const expenseQuery = useQuery({ queryKey: ["expenses"], queryFn: financeService.getExpenses });
  const budgetQuery = useQuery({ queryKey: ["budgets"], queryFn: financeService.getBudgets });
  const expenseData = (expenseQuery.data as Expense[]) || expenses;
  const budgetData = (budgetQuery.data as Budget[]) || budgets;
  const total = expenseData.reduce((sum, expense) => sum + expense.amount, 0);
  const allocated = budgetData.reduce((sum, budget) => sum + budget.allocated, 0);
  const spent = budgetData.reduce((sum, budget) => sum + budget.spent, 0);

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
          <GaugeChart value={(spent / allocated) * 100} color={colors.finance} label="used" />
          <View style={styles.gaugeCopy}>
            <Text style={styles.big}>{formatCurrency(spent)}</Text>
            <Text style={styles.meta}>spent of {formatCurrency(allocated)} allocated</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Expenses by Category</Text>
        <BarChart
          data={[
            { label: "Maint", value: 182 },
            { label: "Raw", value: 940 },
            { label: "Util", value: 126 },
            { label: "HR", value: 64 },
          ]}
          color={colors.finance}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Expense Trend</Text>
        <LineChart
          data={[
            { label: "Mon", value: 140 },
            { label: "Tue", value: 220 },
            { label: "Wed", value: 160 },
            { label: "Thu", value: 310 },
            { label: "Fri", value: 184 },
          ]}
          color={colors.amber400}
        />
      </Card>

      {budgetData.map((budget) => (
        <Card key={budget.id} accentColor={budget.spent > budget.allocated ? colors.maintenance : colors.finance} style={styles.budget}>
          <View style={styles.budgetHead}>
            <Text style={styles.budgetTitle}>{budget.department}</Text>
            <Text style={styles.meta}>{Math.round((budget.spent / budget.allocated) * 100)}%</Text>
          </View>
          <ProgressBar value={(budget.spent / budget.allocated) * 100} color={budget.spent > budget.allocated ? colors.maintenance : colors.finance} />
        </Card>
      ))}
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
