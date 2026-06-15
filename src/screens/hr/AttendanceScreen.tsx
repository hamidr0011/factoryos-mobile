import { Clock } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { hrService } from "../../services/hr.service";
import { useAppStore } from "../../store/appStore";
import type { AttendanceRecord } from "../../types";
import { attendanceRecords, colors, spacing, typography } from "../../utils/constants";
import { ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

const days = Array.from({ length: 30 }, (_, index) => index + 1);

export const AttendanceScreen = () => {
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const [selectedDay, setSelectedDay] = useState<number | null>(13);
  const { data = attendanceRecords } = useQuery({ queryKey: ["attendance"], queryFn: hrService.getAttendance });
  const records = data as AttendanceRecord[];
  const today = new Date().toISOString().slice(0, 10);
  const openShift = records.find((record) => record.date === today && record.check_in && !record.check_out);
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
    <ScreenContainer title="Attendance" subtitle="Month grid and daily roster">
      <Card style={styles.calendar}>
        <Text style={styles.month}>June 2026</Text>
        <View style={styles.grid}>
          {days.map((day) => {
            const status = day === 13 ? "present" : day % 8 === 0 ? "late" : day % 11 === 0 ? "absent" : "present";
            const color = status === "present" ? colors.inventory : status === "late" ? colors.amber400 : colors.maintenance;
            return (
              <Pressable key={day} style={[styles.day, selectedDay === day && styles.selectedDay]} onPress={() => setSelectedDay(day)}>
                <Text style={styles.dayText}>{day}</Text>
                <View style={[styles.dayDot, { backgroundColor: color }]} />
              </Pressable>
            );
          })}
        </View>
      </Card>

      {records.map((record) => (
        <WorkCard key={record.id} title={record.employee.full_name} eyebrow={record.employee.employee_id} status={record.status} accentColor={record.status === "late" ? colors.amber400 : colors.inventory}>
          <Text style={styles.meta}>Check in {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not clocked"}</Text>
        </WorkCard>
      ))}

      <Button title={openShift ? "Clock Out" : "Clock In"} icon={<Clock color={colors.steel950} size={18} />} loading={clockMutation.isPending} onPress={() => clockMutation.mutate()} />

      <BottomSheet visible={selectedDay !== null} onClose={() => setSelectedDay(null)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>June {selectedDay}</Text>
          {records.map((record) => (
            <View key={record.id} style={styles.sheetRow}>
              <Text style={styles.sheetName}>{record.employee.full_name}</Text>
              <StatusBadge status={record.status} />
            </View>
          ))}
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
    gap: spacing.xs,
  },
  day: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: "12.4%",
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
