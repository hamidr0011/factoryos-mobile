import { useNavigation } from "@react-navigation/native";
import { Plus } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../components/ui/EmptyState";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { qualityService } from "../../services/quality.service";
import type { QualityCheck } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { MetricPill, ProgressBar, ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

export const QualityCheckListScreen = () => {
  const navigation = useNavigation<any>();
  const { data = [] } = useQuery({ queryKey: ["quality_checks"], queryFn: qualityService.getChecks });
  const checks = data as QualityCheck[];

  return (
    <ScreenContainer
      title="Quality Control"
      subtitle="Inspections, defects, and batch release"
      navigationMode="drawer"
      scroll={false}
      action={
        <PermissionGate area="quality" level="write">
          <Pressable style={styles.fabSmall} onPress={() => navigation.navigate("InspectionForm")}>
            <Plus color={colors.steel950} size={22} />
          </Pressable>
        </PermissionGate>
      }
    >
      <View style={styles.metrics}>
        <MetricPill label="Passed" value={checks.filter((check) => check.status === "pass").length.toString()} color={colors.inventory} />
        <MetricPill label="Failed" value={checks.filter((check) => check.status === "fail").length.toString()} color={colors.maintenance} />
        <MetricPill label="Pending" value={checks.filter((check) => check.status === "conditional").length.toString()} color={colors.amber400} />
      </View>
      <FlatList
        data={checks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <PermissionGate
            area="quality"
            level="write"
            fallback={<EmptyState variant="quality" title="No inspections today" subtitle="Inspections will appear here when submitted by the floor team." />}
          >
            <EmptyState variant="quality" title="No inspections today" subtitle="Start an inspection" cta="New inspection" onPress={() => navigation.navigate("InspectionForm")} />
          </PermissionGate>
        }
        renderItem={({ item }) => {
          const passRate = item.total_inspected ? (item.passed / item.total_inspected) * 100 : 0;
          return (
            <WorkCard
              title={`Batch ${item.batch_number}`}
              eyebrow={item.order?.order_number ? `Order ${item.order.order_number}` : `Order ${(item.order_id || "").slice(0, 8)}...`}
              status={item.status}
              accentColor={item.status === "fail" ? colors.maintenance : item.status === "conditional" ? colors.amber400 : colors.inventory}
            >
              <View style={styles.row}>
                <Text style={styles.ratio}>{item.passed}/{item.total_inspected} pass</Text>
                <Text style={styles.ratio}>{item.failed} failed</Text>
              </View>
              <ProgressBar value={passRate} color={passRate > 95 ? colors.inventory : passRate > 85 ? colors.amber400 : colors.maintenance} />
              <Text style={styles.meta}>{item.inspector?.full_name || "Inspector"} · {item.defect_type.join(", ") || "No defects"}</Text>
            </WorkCard>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  fabSmall: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 180,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ratio: {
    color: colors.steel300,
    fontFamily: typography.mono,
    fontSize: 12,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
});
