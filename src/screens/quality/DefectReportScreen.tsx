import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { BarChart } from "../../components/charts/BarChart";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { qualityService } from "../../services/quality.service";
import type { QualityCheck } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { ScreenContainer } from "../shared/ScreenScaffold";

const palette = [colors.production, colors.amber400, colors.maintenance, colors.quality, colors.inventory];

export const DefectReportScreen = () => {
  const { data = [] } = useQuery({ queryKey: ["quality_checks"], queryFn: qualityService.getChecks });
  const defects = Object.values(
    (data as QualityCheck[]).reduce<Record<string, { label: string; value: number; color: string }>>((acc, check) => {
      (check.defect_type || []).forEach((label) => {
        acc[label] = acc[label] || { label, value: 0, color: palette[Object.keys(acc).length % palette.length] };
        acc[label].value += 1;
      });
      return acc;
    }, {}),
  ).sort((a, b) => b.value - a.value);

  return (
    <ScreenContainer title="Defect Report" subtitle="Pareto and severity breakdown">
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Defects by Frequency</Text>
        {defects.length ? <BarChart data={defects} color={colors.quality} /> : <EmptyState variant="quality" title="No defects recorded" subtitle="Submitted quality checks will build this report." />}
      </Card>
      {defects.map((defect) => (
        <Card key={defect.label} accentColor={defect.color} style={styles.defectCard}>
          <View>
            <Text style={styles.defectTitle}>{defect.label}</Text>
            <Text style={styles.defectMeta}>{defect.value} observations this period</Text>
          </View>
          <Badge label="recorded" color={defect.color} />
        </Card>
      ))}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 17,
  },
  defectCard: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  defectTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 16,
  },
  defectMeta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 3,
  },
});
