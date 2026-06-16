import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DonutChart } from "../../components/charts/DonutChart";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { hrService } from "../../services/hr.service";
import { useAppStore } from "../../store/appStore";
import type { AttendanceRecord, ChartPoint, LeaveRequest } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { MetricPill, ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

export const HRDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);

  const attendanceQuery = useQuery({ queryKey: ["attendance"], queryFn: hrService.getAttendance });
  const leaveQuery = useQuery({ queryKey: ["leave_requests"], queryFn: hrService.getLeaveRequests });
  const attendance = (attendanceQuery.data as AttendanceRecord[]) || [];
  const leaves = (leaveQuery.data as LeaveRequest[]) || [];
  const pendingLeaves = leaves.filter((leave) => leave.status === "pending");

  const present = attendance.filter((record) => record.status === "present").length;
  const absent = attendance.filter((record) => record.status === "absent").length;
  const late = attendance.filter((record) => record.status === "late").length;
  const departmentData = Object.values(
    attendance.reduce<Record<string, ChartPoint>>((acc, record) => {
      const department = record.employee?.department || "Unassigned";
      acc[department] = acc[department] || { label: department, value: 0, color: colors.hr };
      acc[department].value += 1;
      return acc;
    }, {}),
  );

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) => hrService.reviewLeaveRequest(id, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leave_requests"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance"] }),
      ]);
      showToast("success", "Leave request reviewed.");
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not review leave request.");
    },
  });

  return (
    <ScreenContainer title="HR & Workforce" subtitle="Attendance, leave, and shift coverage" navigationMode="drawer">
      <View style={styles.metrics}>
        <MetricPill label="Present" value={present.toString()} color={colors.inventory} />
        <MetricPill label="Absent" value={absent.toString()} color={colors.maintenance} />
        <MetricPill label="Late" value={late.toString()} color={colors.amber400} />
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance by Department</Text>
        {departmentData.length ? <DonutChart data={departmentData} /> : <EmptyState variant="hr" title="No attendance records" subtitle="Clock-ins and roster records will build this chart." />}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Pending Leave Requests</Text>
          <Badge label={`${pendingLeaves.length} pending`} color={colors.amber400} />
        </View>
        {pendingLeaves.length ? (
          pendingLeaves.map((leave) => (
            <WorkCard key={leave.id} title={leave.employee?.full_name || "Unknown employee"} eyebrow={leave.type.toUpperCase()} status={leave.status} accentColor={colors.amber400}>
              <Text style={styles.meta}>{leave.start_date} → {leave.end_date}</Text>
              <Text style={styles.metaReason}>{leave.reason}</Text>
              <View style={styles.approvals}>
                <Button title="Approve" variant="secondary" style={styles.approvalButton} loading={reviewMutation.isPending} onPress={() => reviewMutation.mutate({ id: leave.id, status: "approved" })} />
                <Button title="Reject" variant="ghost" style={styles.approvalButton} loading={reviewMutation.isPending} onPress={() => reviewMutation.mutate({ id: leave.id, status: "rejected" })} />
              </View>
            </WorkCard>
          ))
        ) : (
          <EmptyState variant="hr" title="No pending leave" subtitle="Requests submitted by employees will appear here." />
        )}
      </Card>

      <View style={styles.quick}>
        <Button title="Attendance" variant="secondary" onPress={() => navigation.navigate("Attendance")} />
        <Button title="Leaves" variant="secondary" onPress={() => navigation.navigate("Leave")} />
        <Button title="Employees" variant="secondary" onPress={() => navigation.navigate("EmployeeList")} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 17,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
  metaReason: {
    color: colors.steel300,
    fontFamily: typography.body,
    fontSize: 13,
    marginVertical: spacing.xxs,
  },
  approvals: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  approvalButton: {
    flex: 1,
  },
  quick: {
    gap: spacing.sm,
  },
});
