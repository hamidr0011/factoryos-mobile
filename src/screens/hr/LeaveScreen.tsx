import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { hrService } from "../../services/hr.service";
import { useAppStore } from "../../store/appStore";
import type { LeaveRequest } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { ChipRow, MetricPill, ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

export const LeaveScreen = () => {
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const [tab, setTab] = useState("My Leaves");
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const { data = [] } = useQuery({ queryKey: ["leave_requests"], queryFn: hrService.getLeaveRequests });
  const leaves = data as LeaveRequest[];
  const pendingLeaves = leaves.filter((leave) => leave.status === "pending");
  const refreshLeaves = async () => {
    await queryClient.invalidateQueries({ queryKey: ["leave_requests"] });
  };

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) => hrService.reviewLeaveRequest(id, status),
    onSuccess: async () => {
      await refreshLeaves();
      showToast("success", "Leave request reviewed.");
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not review leave request.");
    },
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      hrService.requestLeave({
        type: leaveType as "annual" | "sick" | "emergency" | "unpaid",
        startDate,
        endDate,
        reason,
      }),
    onSuccess: async () => {
      await refreshLeaves();
      setReason("");
      setTab("My Leaves");
      showToast("success", "Leave request submitted.");
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not submit leave request.");
    },
  });

  const submitLeaveRequest = () => {
    if (!["annual", "sick", "emergency", "unpaid"].includes(leaveType) || !startDate || !endDate || !reason.trim()) {
      showToast("warning", "Enter leave type, dates, and reason.");
      return;
    }
    requestMutation.mutate();
  };

  return (
    <ScreenContainer title="Leave" subtitle="Balances, applications, approvals">
      <ChipRow items={["My Leaves", "Manage Leaves", "Apply"]} active={tab} onChange={setTab} />
      {tab === "My Leaves" ? (
        <>
          <View style={styles.metrics}>
            <MetricPill label="Approved" value={leaves.filter((leave) => leave.status === "approved").length.toString()} color={colors.inventory} />
            <MetricPill label="Sick" value={leaves.filter((leave) => leave.type === "sick").length.toString()} color={colors.production} />
            <MetricPill label="Pending" value={pendingLeaves.length.toString()} color={colors.amber400} />
          </View>
          {leaves.length ? (
            leaves.map((leave) => (
              <WorkCard key={leave.id} title={leave.type} eyebrow={`${leave.start_date} → ${leave.end_date}`} status={leave.status} accentColor={leave.status === "pending" ? colors.amber400 : colors.inventory}>
                <Text style={styles.meta}>{leave.reason}</Text>
              </WorkCard>
            ))
          ) : (
            <EmptyState variant="hr" title="No leave requests" subtitle="Submitted leave applications will appear here." />
          )}
        </>
      ) : null}

      {tab === "Manage Leaves" ? (
        <PermissionGate roles={["admin", "manager", "supervisor"]} fallback={<Text style={styles.meta}>Manager access required.</Text>}>
          {pendingLeaves.length ? (
            pendingLeaves.map((leave) => (
              <WorkCard key={leave.id} title={leave.employee?.full_name || "Unknown employee"} eyebrow={leave.type.toUpperCase()} status={leave.status} accentColor={colors.amber400}>
                <Text style={styles.meta}>{leave.reason}</Text>
                <View style={styles.approvals}>
                  <Button title="Approve" variant="secondary" style={styles.buttonFlex} loading={reviewMutation.isPending} onPress={() => reviewMutation.mutate({ id: leave.id, status: "approved" })} />
                  <Button title="Reject" variant="ghost" style={styles.buttonFlex} loading={reviewMutation.isPending} onPress={() => reviewMutation.mutate({ id: leave.id, status: "rejected" })} />
                </View>
              </WorkCard>
            ))
          ) : (
            <EmptyState variant="hr" title="No approvals pending" subtitle="Leave requests waiting for review will appear here." />
          )}
        </PermissionGate>
      ) : null}

      {tab === "Apply" ? (
        <Card style={styles.form}>
          <Input label="Type" value={leaveType} onChangeText={(value) => setLeaveType(value.toLowerCase())} />
          <Input label="Start date" value={startDate} onChangeText={setStartDate} />
          <Input label="End date" value={endDate} onChangeText={setEndDate} />
          <Input label="Reason" placeholder="Reason for leave" value={reason} onChangeText={setReason} />
          <Button title="Submit Leave Request" loading={requestMutation.isPending} onPress={submitLeaveRequest} />
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
