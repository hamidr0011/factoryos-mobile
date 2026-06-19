import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "../../components/charts/BarChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { Button } from "../../components/ui/Button";
import { financeService } from "../../services/finance.service";
import type { Budget } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { formatCurrency } from "../../utils/formatters";
import { ProgressBar, ScreenContainer } from "../shared/ScreenScaffold";

export const BudgetScreen = () => {
  const { data = [] } = useQuery({ queryKey: ["budgets"], queryFn: financeService.getBudgets });
  const budgetData = data as Budget[];
  const spendData = budgetData.map((budget) => ({ label: (budget.department || "").slice(0, 8), value: Number(budget.spent || 0) }));

  return (
    <ScreenContainer title="Budgets" subtitle="Department utilization and comparison">
      {budgetData.length ? budgetData.map((budget) => {
        const pct = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;
        const danger = pct > 100;
        return (
          <Card key={budget.id} accentColor={danger ? colors.maintenance : colors.finance} style={styles.budgetCard}>
            <View style={styles.budgetHead}>
              <View>
                <Text style={styles.title}>{budget.department}</Text>
                <Text style={styles.meta}>{formatCurrency(budget.spent)} spent · {formatCurrency(budget.allocated - budget.spent)} remaining</Text>
              </View>
              <DonutChart
                data={[
                  { label: "Spent", value: budget.spent, color: danger ? colors.maintenance : colors.finance },
                  { label: "Remaining", value: Math.max(0, budget.allocated - budget.spent), color: colors.steel700 },
                ]}
              />
            </View>
            <ProgressBar value={pct} color={danger ? colors.maintenance : colors.finance} />
          </Card>
        );
      }) : <EmptyState variant="finance" title="No budgets configured" subtitle="Admin-created department budgets will appear here." />}
      {spendData.length ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Current Budget Spend</Text>
          <BarChart data={spendData} color={colors.finance} />
        </Card>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  budgetCard: {
    gap: spacing.md,
  },
  budgetHead: {
    gap: spacing.md,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 18,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 17,
  },
});
