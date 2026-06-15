import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "@react-navigation/native";
import { Play, Wrench } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { maintenanceService } from "../../services/maintenance.service";
import { useAppStore } from "../../store/appStore";
import type { MaintenanceTask } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { DetailRow, ScreenContainer } from "../shared/ScreenScaffold";
import { useState } from "react";

export const TaskDetailScreen = () => {
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const route = useRoute<any>();
  const task = route.params?.task as MaintenanceTask | undefined;
  const [complete, setComplete] = useState(false);
  const [actualHours, setActualHours] = useState(task?.estimated_hours ? task.estimated_hours.toString() : "");
  const [workNotes, setWorkNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const completeMutation = useMutation({
    mutationFn: () => {
      if (!task) throw new Error("No maintenance task selected.");
      return maintenanceService.completeTask({
        taskId: task.id,
        actualHours: Number(actualHours),
        notes: [workNotes.trim(), followUp.trim() ? `Follow-up: ${followUp.trim()}` : ""].filter(Boolean).join("\n"),
        partsUsed: [],
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["maintenance_tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["machines"] }),
      ]);
      setComplete(false);
      showToast("success", "Maintenance task completed.");
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not complete maintenance task.");
    },
  });

  const submitCompletion = () => {
    const parsed = Number(actualHours);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showToast("warning", "Enter actual hours greater than zero.");
      return;
    }
    completeMutation.mutate();
  };

  if (!task) {
    return (
      <ScreenContainer title="Task Detail" subtitle="Maintenance task">
        <EmptyState variant="maintenance" title="No task selected" subtitle="Open a task from the live maintenance queue." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title={task.title} subtitle={`${task.machine.name} · ${task.type}`}>
      <Card style={styles.section} accentColor={task.priority === "critical" ? colors.maintenance : colors.amber400}>
        <View style={styles.badges}>
          <StatusBadge status={task.priority} />
          <StatusBadge status={task.status} />
        </View>
        <Text style={styles.description}>{task.description}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Machine Info</Text>
        <DetailRow label="Code" value={task.machine.machine_code} />
        <DetailRow label="Status" value={task.machine.status} />
        <DetailRow label="Efficiency" value={`${task.machine.efficiency_percent}%`} />
        <DetailRow label="Last maintenance" value={formatDate(task.machine.last_maintenance, "dd MMM yyyy")} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Time & Cost</Text>
        <DetailRow label="Assigned" value={task.assigned_to?.full_name || "Unassigned"} />
        <DetailRow label="Scheduled" value={formatDate(task.scheduled_date, "dd MMM HH:mm")} />
        <DetailRow label="Estimated" value={`${task.estimated_hours} hours`} />
        <DetailRow label="Actual" value={`${task.actual_hours || 0} hours`} />
        <DetailRow label="Total cost" value={formatCurrency(task.cost)} />
      </Card>

      <View style={styles.actions}>
        <Button title="Start Timer" icon={<Play color={colors.steel950} size={18} />} />
        <Button title="Mark Complete" variant="secondary" icon={<Wrench color={colors.steel100} size={18} />} onPress={() => setComplete(true)} />
      </View>

      <BottomSheet visible={complete} onClose={() => setComplete(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Completion Form</Text>
          <Input label="Actual hours" keyboardType="numeric" value={actualHours} onChangeText={setActualHours} />
          <Input label="Work performed" placeholder="Describe repairs and verification" value={workNotes} onChangeText={setWorkNotes} />
          <Input label="Follow-up required" placeholder="Optional follow-up" value={followUp} onChangeText={setFollowUp} />
          <Button title="Complete Task" loading={completeMutation.isPending} onPress={submitCompletion} />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  badges: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  description: {
    color: colors.steel300,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 17,
  },
  actions: {
    gap: spacing.sm,
  },
  sheet: {
    gap: spacing.md,
  },
  sheetTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 22,
  },
});
