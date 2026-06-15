import { StyleSheet, Text, View } from "react-native";
import { BarChart } from "../../components/charts/BarChart";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { colors, spacing, typography } from "../../utils/constants";
import { ScreenContainer } from "../shared/ScreenScaffold";

const defects = [
  { label: "Burr", value: 34, color: colors.production, severity: "minor" },
  { label: "Surface", value: 21, color: colors.amber400, severity: "major" },
  { label: "Dimension", value: 9, color: colors.maintenance, severity: "critical" },
  { label: "Coating", value: 7, color: colors.quality, severity: "major" },
];

export const DefectReportScreen = () => (
  <ScreenContainer title="Defect Report" subtitle="Pareto and severity breakdown">
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Defects by Frequency</Text>
      <BarChart data={defects} color={colors.quality} />
    </Card>
    {defects.map((defect) => (
      <Card key={defect.label} accentColor={defect.color} style={styles.defectCard}>
        <View>
          <Text style={styles.defectTitle}>{defect.label}</Text>
          <Text style={styles.defectMeta}>{defect.value} observations this period</Text>
        </View>
        <Badge label={defect.severity} color={defect.color} />
      </Card>
    ))}
  </ScreenContainer>
);

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
