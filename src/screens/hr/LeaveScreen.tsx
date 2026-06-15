import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { hrService } from "../../services/hr.service";
import type { LeaveRequest } from "../../types";
import { colors, leaveRequests, spacing, typography } from "../../utils/constants";
import { ChipRow, MetricPill, ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

export const LeaveScreen = () => {
  const [tab, setTab] = useState("My Leaves");
  const { data = leaveRequests } = useQuery({ queryKey: ["leave_requests"], queryFn: hrService.getLeaveRequests });
  const leaves = data as LeaveRequest[];

  return (
    <ScreenContainer title="Leave" subtitle="Balances, applications, approvals">
      <ChipRow items={["My Leaves", "Manage Leaves", "Apply"]} active={tab} onChange={setTab} />
      {tab === "My Leaves" ? (
        <>
          <View style={styles.metrics}>
            <MetricPill label="Annual" value="14" color={colors.inventory} />
            <MetricPill label="Sick" value="6" color={colors.production} />
            <MetricPill label="Pending" value={leaves.filter((leave) => leave.status === "pending").length.toString()} color={colors.amber400} />
          </View>
          {leaves.map((leave) => (
            <WorkCard key={leave.id} title={leave.type} eyebrow={`${leave.start_date} → ${leave.end_date}`} status={leave.status} accentColor={leave.status === "pending" ? colors.amber400 : colors.inventory}>
              <Text style={styles.meta}>{leave.reason}</Text>
            </WorkCard>
          ))}
        </>
      ) : null}

      {tab === "Manage Leaves" ? (
        <PermissionGate roles={["admin", "manager", "supervisor"]} fallback={<Text style={styles.meta}>Manager access required.</Text>}>
          {leaves.filter((leave) => leave.status === "pending").map((leave) => (
            <WorkCard key={leave.id} title={leave.employee.full_name} eyebrow={leave.type.toUpperCase()} status={leave.status} accentColor={colors.amber400}>
              <Text style={styles.meta}>{leave.reason}</Text>
              <View style={styles.approvals}>
                <Button title="Approve" variant="secondary" style={styles.buttonFlex} />
                <Button title="Reject" variant="ghost" style={styles.buttonFlex} />
              </View>
            </WorkCard>
          ))}
        </PermissionGate>
      ) : null}

      {tab === "Apply" ? (
        <Card style={styles.form}>
          <Input label="Type" defaultValue="annual" />
          <Input label="Start date" defaultValue="2026-06-20" />
          <Input label="End date" defaultValue="2026-06-22" />
          <Input label="Reason" placeholder="Reason for leave" />
          <Button title="Submit Leave Request" />
        </Card>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 13,
  },
  approvals: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  buttonFlex: {
    flex: 1,
  },
  form: {
    gap: spacing.md,
  },
});
