import { useNavigation } from "@react-navigation/native";
import { ReceiptText, WalletCards } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "../../components/charts/BarChart";
import { GaugeChart } from "../../components/charts/GaugeChart";
import { LineChart } from "../../components/charts/LineChart";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { financeService } from "../../services/finance.service";
import type { Budget, ChartPoint, Expense } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { formatCompactCurrency, formatCurrency } from "../../utils/formatters";
import { ChipRow, MetricPill, ProgressBar, ScreenContainer } from "../shared/ScreenScaffold";

export const FinanceDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [period, setPeriod] = useState("This Month");
  const expenseQuery = useQuery({ queryKey: ["expenses"], queryFn: financeService.getExpenses });
  const budgetQuery = useQuery({ queryKey: ["budgets"], queryFn: financeService.getBudgets });
  const expenseData = (expenseQuery.data as Expense[]) || [];
  const budgetData = (budgetQuery.data as Budget[]) || [];
  const periodStart = useMemo(() => {
    const date = new Date();
    if (period === "This Week") date.setDate(date.getDate() - 7);
    if (period === "This Month") date.setMonth(date.getMonth() - 1);
    if (period === "This Quarter") date.setMonth(date.getMonth() - 3);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [period]);
  const filteredExpenses = useMemo(
    () =>
      expenseData.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return Number.isFinite(expenseDate.getTime()) && expenseDate >= periodStart;
      }),
    [expenseData, periodStart],
  );
  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const allocated = budgetData.reduce((sum, budget) => sum + budget.allocated, 0);
  const spent = budgetData.reduce((sum, budget) => sum + budget.spent, 0);
  const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
  const categoryData = Object.values(
    filteredExpenses.reduce<Record<string, ChartPoint>>((acc, expense) => {
      const category = expense.category || "Uncategorized";
      acc[category] = acc[category] || { label: category.slice(0, 8), value: 0 };
      acc[category].value += Number(expense.amount || 0);
      return acc;
    }, {}),
  );
  const trendData = Object.values(
    filteredExpenses.reduce<Record<string, ChartPoint>>((acc, expense) => {
      const key = expense.date || "No date";
      acc[key] = acc[key] || { label: key === "No date" ? key : new Date(key).toLocaleDateString([], { month: "short", day: "numeric" }), value: 0 };
      acc[key].value += Number(expense.amount || 0);
      return acc;
    }, {}),
  ).slice(-7);

  return (
    <ScreenContainer title="Finance" navigationMode="drawer">
      <ChipRow items={["This Week", "This Month", "This Quarter"]} active={period} onChange={setPeriod} />
      <View style={styles.metrics}>
        <MetricPill label="Expenses" value={formatCompactCurrency(total)} color={colors.blue} />
        <MetricPill label="Pending" value={filteredExpenses.filter((expense) => expense.status === "pending").length.toString()} color={colors.orange} />
      </View>

      <View style={styles.quickGrid}>
        <Pressable style={styles.quickCard} onPress={() => navigation.navigate("ExpenseList")}>
          <View style={[styles.quickIcon, { backgroundColor: `${colors.blue}14` }]}>
            <ReceiptText color={colors.blue} size={21} />
          </View>
          <View style={styles.quickCopy}>
            <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.quickTitle}>Expenses</Text>
            <Text style={styles.quickMeta}>{filteredExpenses.length} in range</Text>
          </View>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => navigation.navigate("Budget")}>
          <View style={[styles.quickIcon, { backgroundColor: `${colors.finance}14` }]}>
            <WalletCards color={colors.finance} size={21} />
          </View>
          <View style={styles.quickCopy}>
            <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.quickTitle}>Budgets</Text>
            <Text style={styles.quickMeta}>{budgetData.length} active</Text>
          </View>
        </Pressable>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Utilization</Text>
        <View style={styles.gaugeRow}>
          <GaugeChart value={utilization} color={colors.blue} label="used" />
          <View style={styles.gaugeCopy}>
            <Text adjustsFontSizeToFit minimumFontScale={0.74} numberOfLines={1} style={styles.big}>{formatCompactCurrency(spent)}</Text>
            <Text numberOfLines={1} style={styles.meta}>{formatCurrency(allocated)} allocated</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Expenses by Category</Text>
        {categoryData.length ? <BarChart data={categoryData} color={colors.blue} /> : <EmptyState variant="finance" title="No categories" />}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Expense Trend</Text>
        {trendData.length ? <LineChart data={trendData} color={colors.blue} /> : <EmptyState variant="finance" title="No trend" />}
      </Card>

      {budgetData.length ? (
        budgetData.map((budget) => {
          const budgetPct = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;
          return (
            <Card key={budget.id} accentColor={budget.spent > budget.allocated ? colors.red : colors.blue} style={styles.budget}>
              <View style={styles.budgetHead}>
                <Text style={styles.budgetTitle}>{budget.department}</Text>
                <Text style={styles.meta}>{Math.round(budgetPct)}%</Text>
              </View>
              <ProgressBar value={budgetPct} color={budget.spent > budget.allocated ? colors.red : colors.blue} />
            </Card>
          );
        })
      ) : (
        <EmptyState variant="finance" title="No budgets configured" />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickCard: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 72,
    padding: spacing.sm,
  },
  quickIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  quickCopy: {
    flex: 1,
    minWidth: 0,
  },
  quickTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 14,
    lineHeight: 18,
  },
  quickMeta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 16,
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
    fontSize: 22,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 11,
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
    fontSize: 14,
  },
});
