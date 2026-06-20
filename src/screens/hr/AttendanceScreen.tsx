import { Clock } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { hrService } from "../../services/hr.service";
import { useAppStore } from "../../store/appStore";
import type { AttendanceRecord } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

export const AttendanceScreen = () => {
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const currentMonth = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleDateString([], { month: "long", year: "numeric" });
  const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => index + 1);
  const toDateKey = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { data = [] } = useQuery({ queryKey: ["attendance"], queryFn: hrService.getAttendance });
  const records = data as AttendanceRecord[];
  const today = toDateKey(currentMonth.getDate());
  const openShift = records.find((record) => record.date === today && record.check_in && !record.check_out);
  const selectedRecords = selectedDay ? records.filter((record) => record.date === toDateKey(selectedDay)) : [];
  const clockMutation = useMutation({
    mutationFn: () => (openShift ? hrService.clockOut() : hrService.clockIn()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance"] });
      showToast("success", openShift ? "Clocked out." : "Clocked in.");
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not update attendance.");
    },
  });

  return (
    <ScreenContainer title="Attendance">
      <Card style={styles.calendar}>
        <Text style={styles.month}>{monthName}</Text>
        <View style={styles.grid}>
          {days.map((day) => {
            const dayRecords = records.filter((record) => record.date === toDateKey(day));
            const status = dayRecords.find((record) => record.status === "absent")?.status || dayRecords.find((record) => record.status === "late")?.status || dayRecords[0]?.status;
            const color = status === "present" ? colors.emerald : status === "late" ? colors.orange : status === "absent" ? colors.red : colors.steel700;
            return (
              <Pressable key={day} style={[styles.day, selectedDay === day && styles.selectedDay]} onPress={() => setSelectedDay(day)}>
                <Text style={styles.dayText}>{day}</Text>
                <View style={[styles.dayDot, { backgroundColor: color }]} />
              </Pressable>
            );
          })}
        </View>
      </Card>

      {records.length ? (
        records.map((record) => (
          <WorkCard key={record.id} title={record.employee?.full_name || "Unknown employee"} eyebrow={record.employee?.employee_id || "No employee ID"} status={record.status} accentColor={record.status === "late" ? colors.orange : record.status === "absent" ? colors.red : colors.emerald}>
            <Text numberOfLines={1} style={styles.meta}>Check in {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not clocked"}</Text>
          </WorkCard>
        ))
      ) : (
        <EmptyState variant="hr" title="No attendance yet" />
      )}

      <Button title={openShift ? "Clock Out" : "Clock In"} icon={<Clock color={colors.steel950} size={18} />} loading={clockMutation.isPending} onPress={() => clockMutation.mutate()} />

      <BottomSheet visible={selectedDay !== null} onClose={() => setSelectedDay(null)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{monthName} {selectedDay}</Text>
          {selectedRecords.length ? (
            selectedRecords.map((record) => (
              <View key={record.id} style={styles.sheetRow}>
                <Text style={styles.sheetName}>{record.employee?.full_name || "Unknown employee"}</Text>
                <StatusBadge status={record.status} />
              </View>
            ))
          ) : (
            <Text style={styles.meta}>No records</Text>
          )}
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  calendar: {
    gap: spacing.md,
  },
  month: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.xs,
  },
  day: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: "13%",
  },
  selectedDay: {
    borderColor: colors.amber400,
  },
  dayText: {
    color: colors.steel100,
    fontFamily: typography.mono,
    fontSize: 12,
  },
  dayDot: {
    borderRadius: 3,
    height: 6,
    marginTop: 3,
    width: 6,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
  sheet: {
    gap: spacing.md,
  },
  sheetTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 22,
  },
  sheetRow: {
    alignItems: "center",
    borderBottomColor: colors.steel700,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
  },
  sheetName: {
    color: colors.steel100,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
  },
});
