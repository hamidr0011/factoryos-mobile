import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { hrService } from "../../services/hr.service";
import { inventoryService } from "../../services/inventory.service";
import { maintenanceService } from "../../services/maintenance.service";
import { productionService } from "../../services/production.service";
import { useAppStore } from "../../store/appStore";
import type { InventoryItem, Machine, Profile } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { ChipRow, DetailRow, ScreenContainer } from "../shared/ScreenScaffold";

export const CreateTaskScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const [type, setType] = useState("Preventive");
  const [priority, setPriority] = useState("High");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const { data: machineData = [] } = useQuery({ queryKey: ["machines"], queryFn: productionService.getMachines });
  const { data: employeeData = [] } = useQuery({ queryKey: ["employees"], queryFn: hrService.getEmployees });
  const { data: inventoryData = [] } = useQuery({ queryKey: ["inventory_items"], queryFn: inventoryService.getItems });
  const machine = (machineData as Machine[])[0];
  const technician = (employeeData as Profile[]).find((employee) => employee.role === "operator" || employee.role === "supervisor");
  const parts = (inventoryData as InventoryItem[]).slice(0, 2);
  const taskMutation = useMutation({
    mutationFn: () =>
      maintenanceService.createTask({
        machineId: machine!.id,
        type: type.toLowerCase() as "preventive" | "corrective" | "emergency" | "inspection",
        priority: priority.toLowerCase() as "low" | "medium" | "high" | "critical",
        title,
        description,
        assignedTo: technician!.id,
        scheduledDate,
        estimatedHours: Number(estimatedHours),
        partsUsed: parts.map((item) => ({ sku: item.sku, quantity: 1, unit_cost: item.unit_cost })),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["maintenance_tasks"] });
      showToast("success", "Maintenance task created.");
      navigation.goBack();
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not create maintenance task.");
    },
  });

  const submitTask = () => {
    const hours = Number(estimatedHours);
    if (!machine) {
      showToast("warning", "Add a machine before creating maintenance tasks.");
      return;
    }
    if (!technician) {
      showToast("warning", "Create an operator or supervisor account before assigning tasks.");
      return;
    }
    if (!title.trim() || !Number.isFinite(hours) || hours <= 0) {
      showToast("warning", "Enter a title and valid estimated hours.");
      return;
    }
    taskMutation.mutate();
  };

  return (
    <ScreenContainer title="Create Task" subtitle="Schedule maintenance work">
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Machine</Text>
        <DetailRow label="Selected" value={machine?.name || "No machine available"} />
        <DetailRow label="Current status" value={machine?.status || "Unavailable"} />
        <DetailRow label="Location" value={machine?.location || "Unavailable"} />
      </Card>
      <Card style={styles.form}>
        <Text style={styles.label}>Task type</Text>
        <ChipRow items={["Preventive", "Corrective", "Emergency", "Inspection"]} active={type} onChange={setType} />
        <Text style={styles.label}>Priority</Text>
        <ChipRow items={["Low", "Medium", "High", "Critical"]} active={priority} onChange={setPriority} />
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Description" placeholder="Task details" value={description} onChangeText={setDescription} />
        <Input label="Schedule" value={scheduledDate} onChangeText={setScheduledDate} />
        <Input label="Estimated hours" keyboardType="numeric" value={estimatedHours} onChangeText={setEstimatedHours} />
      </Card>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Assignment</Text>
        <DetailRow label="Technician" value={technician?.full_name || "No operator or supervisor available"} />
        <View style={styles.parts}>
          {parts.length ? parts.map((item) => (
            <Badge key={item.id} label={item.sku} color={colors.inventory} />
          )) : <Text style={styles.meta}>No linked inventory parts available.</Text>}
        </View>
      </Card>
      <Button title="Create Maintenance Task" loading={taskMutation.isPending} onPress={submitTask} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 17,
  },
  label: {
    color: colors.steel300,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  parts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 13,
  },
});
