import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { GaugeChart } from "../../components/charts/GaugeChart";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge, statusPalette } from "../../components/ui/StatusBadge";
import { productionService } from "../../services/production.service";
import { useAppStore } from "../../store/appStore";
import type { Machine } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";
import { ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

export const MachineStatusScreen = () => {
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const { data = [] } = useQuery({
    queryKey: ["machines"],
    queryFn: productionService.getMachines,
    refetchInterval: 20_000,
  });
  const telemetryMutation = useMutation({
    mutationFn: (machine: Machine) =>
      productionService.recordMachineTelemetry({
        machineId: machine.id,
        status: machine.status,
        efficiencyPercent: machine.efficiency_percent,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["machines"] });
      showToast("success", "Machine telemetry logged.");
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not log telemetry.");
    },
  });

  return (
    <ScreenContainer title="Machine Status" subtitle="Realtime equipment health" scroll={false}>
      <FlatList
        data={data as Machine[]}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState variant="maintenance" title="No machines connected" subtitle="Machine records from Supabase will appear here." />}
        renderItem={({ item }) => {
          const palette = statusPalette(item.status);
          return (
            <WorkCard title={item.name} eyebrow={item.machine_code} status={item.status} accentColor={palette.color}>
              <View style={styles.gaugeWrap}>
                <GaugeChart value={item.efficiency_percent} color={palette.color} label="efficiency" />
              </View>
              <Text style={styles.meta}>{item.location}</Text>
              <Text style={styles.meta}>Last PM {formatDate(item.last_maintenance, "dd MMM")}</Text>
              <StatusBadge status={item.status} />
              <Button title="Log Sample" variant="secondary" loading={telemetryMutation.isPending} onPress={() => telemetryMutation.mutate(item)} />
            </WorkCard>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: 180,
  },
  columns: {
    gap: spacing.md,
  },
  gaugeWrap: {
    alignItems: "center",
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
});
