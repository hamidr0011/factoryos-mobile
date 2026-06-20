import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, PackagePlus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { hrService } from "../../services/hr.service";
import { productionService } from "../../services/production.service";
import { useAppStore } from "../../store/appStore";
import type { Machine, Profile, ProductionOrder } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { ChipRow, DetailRow, ScreenContainer } from "../shared/ScreenScaffold";

const priorityOptions = ["Low", "Medium", "High", "Critical"];
const unassigned = "Unassigned";

export const CreateProductionOrderScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const [orderNumber, setOrderNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [quantityPlanned, setQuantityPlanned] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [machineName, setMachineName] = useState(unassigned);
  const [operatorName, setOperatorName] = useState(unassigned);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: machineData = [] } = useQuery({ queryKey: ["machines"], queryFn: productionService.getMachines });
  const { data: employeeData = [] } = useQuery({ queryKey: ["employees"], queryFn: hrService.getEmployees });
  const machines = machineData as Machine[];
  const operators = useMemo(
    () => (employeeData as Profile[]).filter((employee) => ["operator", "supervisor", "manager"].includes(employee.role)),
    [employeeData],
  );
  const selectedMachine = machines.find((machine) => machine.name === machineName);
  const selectedOperator = operators.find((operator) => operator.full_name === operatorName);

  const createMutation = useMutation({
    mutationFn: () =>
      productionService.createOrder({
        orderNumber: orderNumber.trim() || undefined,
        productName: productName.trim(),
        quantityPlanned: Number(quantityPlanned),
        priority: priority.toLowerCase() as ProductionOrder["priority"],
        machineId: selectedMachine?.id || null,
        operatorId: selectedOperator?.id || null,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["production_orders"] });
      showToast("success", "Production order created.");
      navigation.goBack();
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not create production order.");
    },
  });

  const submit = () => {
    const planned = Number(quantityPlanned);
    if (!productName.trim() || !Number.isFinite(planned) || planned <= 0) {
      showToast("warning", "Enter product and planned quantity.");
      return;
    }

    createMutation.mutate();
  };

  return (
    <PermissionGate
      area="production"
      level="write"
      fallback={
        <ScreenContainer title="New Order" navigationMode="back">
          <EmptyState variant="production" title="Write access required" />
        </ScreenContainer>
      }
    >
      <ScreenContainer title="New Order" navigationMode="back">
        <Card style={styles.hero}>
          <View style={styles.heroIcon}>
            <PackagePlus color={colors.steel950} size={24} />
          </View>
          <Text style={styles.heroTitle}>Production Order</Text>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHead}>
            <ClipboardList color={colors.amber400} size={18} />
            <Text style={styles.sectionTitle}>Order Details</Text>
          </View>
          <Input label="Product" value={productName} onChangeText={setProductName} placeholder="Product name" />
          <Input label="Planned quantity" keyboardType="numeric" value={quantityPlanned} onChangeText={setQuantityPlanned} placeholder="0" />
          <Input label="Order number" value={orderNumber} onChangeText={setOrderNumber} placeholder="Auto" autoCapitalize="characters" />
          <Text style={styles.label}>Priority</Text>
          <ChipRow items={priorityOptions} active={priority} onChange={setPriority} />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Assignment</Text>
          <Text style={styles.label}>Machine</Text>
          <ChipRow items={[unassigned, ...machines.map((machine) => machine.name)]} active={machineName} onChange={setMachineName} />
          {selectedMachine ? (
            <>
              <DetailRow label="Machine code" value={selectedMachine.machine_code} />
              <DetailRow label="Status" value={selectedMachine.status} />
            </>
          ) : null}
          <Text style={styles.label}>Operator</Text>
          <ChipRow items={[unassigned, ...operators.map((operator) => operator.full_name)]} active={operatorName} onChange={setOperatorName} />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <Input label="Start" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD HH:MM" />
          <Input label="Target" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD HH:MM" />
          <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" />
        </Card>

        <Button title="Create Order" loading={createMutation.isPending} onPress={submit} />
      </ScreenContainer>
    </PermissionGate>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  heroTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 18,
  },
  section: {
    gap: spacing.md,
  },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
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
});
