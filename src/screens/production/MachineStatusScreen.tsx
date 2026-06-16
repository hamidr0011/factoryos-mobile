import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { GaugeChart } from "../../components/charts/GaugeChart";
import { Button } from "../../components/ui/Button";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Input } from "../../components/ui/Input";
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
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [status, setStatus] = useState<Machine["status"]>("running");
  const [efficiency, setEfficiency] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["machines"],
    queryFn: productionService.getMachines,
    refetchInterval: 20_000,
  });

  const telemetryMutation = useMutation({
    mutationFn: (input: { machineId: string; status: Machine["status"]; efficiencyPercent: number }) =>
      productionService.recordMachineTelemetry(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["machines"] });
      showToast("success", "Machine telemetry logged.");
      setSelectedMachine(null);
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
              <Button
                title="Log Sample"
                variant="secondary"
                onPress={() => {
                  setSelectedMachine(item);
                  setStatus(item.status);
                  setEfficiency(item.efficiency_percent.toString());
                }}
              />
            </WorkCard>
          );
        }}
      />

      <BottomSheet visible={selectedMachine !== null} onClose={() => setSelectedMachine(null)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Log Telemetry for {selectedMachine?.name}</Text>
          
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {(["running", "idle", "maintenance", "breakdown"] as const).map((s) => {
              const active = status === s;
              const colorPalette = statusPalette(s);
              return (
                <Pressable
                  key={s}
                  style={[styles.statusChip, active && { backgroundColor: `${colorPalette.color}1F`, borderColor: colorPalette.color }]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.statusChipText, active && { color: colorPalette.color }]}>{s}</Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Efficiency percentage (0-100)"
            keyboardType="numeric"
            value={efficiency}
            onChangeText={setEfficiency}
          />

          <Button
            title="Submit Telemetry"
            loading={telemetryMutation.isPending}
            onPress={() => {
              const eff = Number(efficiency);
              if (!selectedMachine) return;
              if (isNaN(eff) || eff < 0 || eff > 100) {
                showToast("warning", "Efficiency must be a number between 0 and 100.");
                return;
              }
              telemetryMutation.mutate({
                machineId: selectedMachine.id,
                status,
                efficiencyPercent: eff,
              });
            }}
          />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: 180,
  },
  gaugeWrap: {
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
  sheetContent: {
    gap: spacing.md,
  },
  sheetTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 20,
  },
  label: {
    color: colors.steel300,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  statusChip: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  statusChipText: {
    color: colors.steel500,
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    textTransform: "capitalize",
  },
});
