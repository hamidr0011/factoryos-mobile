import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "../../components/charts/BarChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
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
    <ScreenContainer title="Budgets" navigationMode="back">
      {budgetData.length ? budgetData.map((budget) => {
        const pct = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;
        const danger = pct > 100;
        const remaining = budget.allocated - budget.spent;
        return (
          <Card key={budget.id} accentColor={danger ? colors.red : colors.blue} style={styles.budgetCard}>
            <View style={styles.budgetHead}>
              <View style={styles.budgetCopy}>
                <Text style={styles.title}>{budget.department}</Text>
                <Text numberOfLines={2} style={styles.meta}>
                  {formatCurrency(budget.spent)} spent · {danger ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} remaining`}
                </Text>
              </View>
              <DonutChart
                compact
                valueLabel={`${Math.round(pct)}%`}
                data={[
                  { label: "Spent", value: budget.spent, color: danger ? colors.red : colors.blue },
                  { label: "Remaining", value: Math.max(0, budget.allocated - budget.spent), color: colors.steel700 },
                ]}
              />
            </View>
            <ProgressBar value={pct} color={danger ? colors.red : colors.blue} />
          </Card>
        );
      }) : <EmptyState variant="finance" title="No budgets configured" />}
      {spendData.length ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Current Budget Spend</Text>
          <BarChart data={spendData} color={colors.blue} />
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
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  budgetCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 16,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 11,
    marginTop: 4,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 16,
  },
});
