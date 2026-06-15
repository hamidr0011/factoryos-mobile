import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "../../components/charts/BarChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { Card } from "../../components/ui/Card";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { Button } from "../../components/ui/Button";
import { financeService } from "../../services/finance.service";
import type { Budget } from "../../types";
import { budgets, colors, spacing, typography } from "../../utils/constants";
import { formatCurrency } from "../../utils/formatters";
import { ProgressBar, ScreenContainer } from "../shared/ScreenScaffold";

export const BudgetScreen = () => {
  const { data = budgets } = useQuery({ queryKey: ["budgets"], queryFn: financeService.getBudgets });
  const budgetData = data as Budget[];

  return (
    <ScreenContainer title="Budgets" subtitle="Department utilization and comparison">
      {budgetData.map((budget) => {
        const pct = (budget.spent / budget.allocated) * 100;
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
            <PermissionGate roles={["admin"]}>
              <Button title="Edit Budget" variant="secondary" />
            </PermissionGate>
          </Card>
        );
      })}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Current vs Last Period</Text>
        <BarChart
          data={[
            { label: "Prod", value: 72 },
            { label: "Maint", value: 80 },
            { label: "Quality", value: 49 },
            { label: "HR", value: 50 },
          ]}
          color={colors.finance}
        />
      </Card>
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
