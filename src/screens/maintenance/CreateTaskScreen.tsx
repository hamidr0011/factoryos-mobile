import { StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { colors, employees, inventoryItems, machines, spacing, typography } from "../../utils/constants";
import { ChipRow, DetailRow, ScreenContainer } from "../shared/ScreenScaffold";
import { useState } from "react";

export const CreateTaskScreen = () => {
  const [type, setType] = useState("Preventive");
  const [priority, setPriority] = useState("High");
  const machine = machines[0];
  const technician = employees.find((employee) => employee.role === "operator") || employees[0];

  return (
    <ScreenContainer title="Create Task" subtitle="Schedule maintenance work">
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Machine</Text>
        <DetailRow label="Selected" value={machine.name} />
        <DetailRow label="Current status" value={machine.status} />
        <DetailRow label="Location" value={machine.location} />
      </Card>
      <Card style={styles.form}>
        <Text style={styles.label}>Task type</Text>
        <ChipRow items={["Preventive", "Corrective", "Emergency", "Inspection"]} active={type} onChange={setType} />
        <Text style={styles.label}>Priority</Text>
        <ChipRow items={["Low", "Medium", "High", "Critical"]} active={priority} onChange={setPriority} />
        <Input label="Title" defaultValue="Servo belt replacement" />
        <Input label="Description" placeholder="Task details" />
        <Input label="Schedule" defaultValue="2026-06-15 10:00" />
        <Input label="Estimated hours" keyboardType="numeric" defaultValue="1.5" />
      </Card>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Assignment</Text>
        <DetailRow label="Technician" value={technician.full_name} />
        <View style={styles.parts}>
          {inventoryItems.slice(0, 2).map((item) => (
            <Badge key={item.id} label={item.sku} color={colors.inventory} />
          ))}
        </View>
      </Card>
      <Button title="Create Maintenance Task" />
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
});
