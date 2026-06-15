import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { DonutChart } from "../../components/charts/DonutChart";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { hrService } from "../../services/hr.service";
import type { AttendanceRecord, LeaveRequest } from "../../types";
import { attendanceRecords, colors, leaveRequests, spacing, typography } from "../../utils/constants";
import { MetricPill, ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

export const HRDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const attendanceQuery = useQuery({ queryKey: ["attendance"], queryFn: hrService.getAttendance });
  const leaveQuery = useQuery({ queryKey: ["leave_requests"], queryFn: hrService.getLeaveRequests });
  const attendance = (attendanceQuery.data as AttendanceRecord[]) || attendanceRecords;
  const leaves = (leaveQuery.data as LeaveRequest[]) || leaveRequests;

  const present = attendance.filter((record) => record.status === "present").length;
  const late = attendance.filter((record) => record.status === "late").length;

  return (
    <ScreenContainer title="HR & Workforce" subtitle="Attendance, leave, and shift coverage" navigationMode="drawer">
      <View style={styles.metrics}>
        <MetricPill label="Present" value={present.toString()} color={colors.inventory} />
        <MetricPill label="Absent" value="0" color={colors.maintenance} />
        <MetricPill label="Late" value={late.toString()} color={colors.amber400} />
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance by Department</Text>
        <DonutChart
          data={[
            { label: "Production", value: 58, color: colors.production },
            { label: "Quality", value: 18, color: colors.quality },
            { label: "Maintenance", value: 22, color: colors.maintenance },
            { label: "Finance", value: 8, color: colors.finance },
          ]}
        />
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Pending Leave Requests</Text>
          <Badge label={`${leaves.filter((leave) => leave.status === "pending").length} pending`} color={colors.amber400} />
        </View>
        {leaves.map((leave) => (
          <WorkCard key={leave.id} title={leave.employee.full_name} eyebrow={leave.type.toUpperCase()} status={leave.status} accentColor={leave.status === "pending" ? colors.amber400 : colors.inventory}>
            <Text style={styles.meta}>{leave.start_date} → {leave.end_date}</Text>
            <View style={styles.approvals}>
              <Button title="Approve" variant="secondary" style={styles.approvalButton} />
              <Button title="Reject" variant="ghost" style={styles.approvalButton} />
            </View>
          </WorkCard>
        ))}
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
