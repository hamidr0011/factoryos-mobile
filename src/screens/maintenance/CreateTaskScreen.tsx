import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
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
  
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);

  const { data: machineData = [] } = useQuery({ queryKey: ["machines"], queryFn: productionService.getMachines });
  const { data: employeeData = [] } = useQuery({ queryKey: ["employees"], queryFn: hrService.getEmployees });
  const { data: inventoryData = [] } = useQuery({ queryKey: ["inventory_items"], queryFn: inventoryService.getItems });

  const machines = (machineData || []) as Machine[];
  const technicians = useMemo(
    () => ((employeeData || []) as Profile[]).filter((e) => e.role === "operator" || e.role === "supervisor" || e.role === "manager"),
    [employeeData],
  );
  const spareParts = (inventoryData || []) as InventoryItem[];

  useEffect(() => {
    if (machines.length && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  useEffect(() => {
    if (technicians.length && !selectedTechnicianId) {
      setSelectedTechnicianId(technicians[0].id);
    }
  }, [technicians, selectedTechnicianId]);

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];
  const selectedTechnician = technicians.find((t) => t.id === selectedTechnicianId) || technicians[0];
  const selectedParts = spareParts.filter((p) => selectedPartIds.includes(p.id));

  const taskMutation = useMutation({
    mutationFn: () =>
      maintenanceService.createTask({
        machineId: selectedMachine!.id,
        type: type.toLowerCase() as "preventive" | "corrective" | "emergency" | "inspection",
        priority: priority.toLowerCase() as "low" | "medium" | "high" | "critical",
        title,
        description,
        assignedTo: selectedTechnician!.id,
        scheduledDate,
        estimatedHours: Number(estimatedHours),
        partsUsed: selectedParts.map((item) => ({ sku: item.sku, quantity: 1, unit_cost: item.unit_cost })),
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
    if (!selectedMachine) {
      showToast("warning", "Select a machine before creating maintenance tasks.");
      return;
    }
    if (!selectedTechnician) {
      showToast("warning", "Assign a technician before creating tasks.");
      return;
    }
    if (!title.trim() || !Number.isFinite(hours) || hours <= 0) {
      showToast("warning", "Enter a title and valid estimated hours.");
      return;
    }
    taskMutation.mutate();
  };

  return (
    <ScreenContainer title="Create Task">
      {machines.length ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Select Machine</Text>
          <ChipRow
            items={machines.map((m) => m.name)}
            active={selectedMachine?.name || ""}
            onChange={(name) => {
              const found = machines.find((m) => m.name === name);
              if (found) setSelectedMachineId(found.id);
            }}
          />
          <DetailRow label="Selected Machine Code" value={selectedMachine?.machine_code || "N/A"} />
          <DetailRow label="Current Status" value={selectedMachine?.status || "Unavailable"} />
          <DetailRow label="Location" value={selectedMachine?.location || "Unavailable"} />
        </Card>
      ) : null}

      <Card style={styles.form}>
        <Text style={styles.label}>Task type</Text>
        <ChipRow items={["Preventive", "Corrective", "Emergency", "Inspection"]} active={type} onChange={setType} />
        <Text style={styles.label}>Priority</Text>
        <ChipRow items={["Low", "Medium", "High", "Critical"]} active={priority} onChange={setPriority} />
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Description" placeholder="Task details" value={description} onChangeText={setDescription} />
        <Input label="Schedule" placeholder="YYYY-MM-DD HH:MM" value={scheduledDate} onChangeText={setScheduledDate} />
        <Input label="Estimated hours" keyboardType="numeric" value={estimatedHours} onChangeText={setEstimatedHours} />
      </Card>

      {technicians.length ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Technician Assignment</Text>
          <ChipRow
            items={technicians.map((t) => t.full_name)}
            active={selectedTechnician?.full_name || ""}
            onChange={(name) => {
              const found = technicians.find((t) => t.full_name === name);
              if (found) setSelectedTechnicianId(found.id);
            }}
          />
          <DetailRow label="Technician Role" value={selectedTechnician?.role || "N/A"} />
        </Card>
      ) : null}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Spare Parts Linked</Text>
        <View style={styles.partsGrid}>
          {spareParts.length ? (
            spareParts.map((item) => {
              const isSelected = selectedPartIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  style={[styles.partChip, isSelected && styles.partChipActive]}
                  onPress={() => {
                    setSelectedPartIds((prev) =>
                      isSelected ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                    );
                  }}
                >
                  <Text style={[styles.partText, isSelected && styles.partTextActive]}>
                    {item.sku} ({item.name})
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.meta}>No linked parts</Text>
          )}
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
  partsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  partChip: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  partChipActive: {
    backgroundColor: `${colors.inventory}22`,
    borderColor: colors.inventory,
  },
  partText: {
    color: colors.steel500,
    fontFamily: typography.bodyMedium,
    fontSize: 11,
  },
  partTextActive: {
    color: colors.inventory,
  },
});
