import { useNavigation } from "@react-navigation/native";
import { CalendarDays, List, Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../components/ui/EmptyState";
import { maintenanceService } from "../../services/maintenance.service";
import type { MaintenanceTask } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";
import { ChipRow, ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

const filters = ["All", "Preventive", "Corrective", "Emergency", "Inspection"];
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

export const MaintenanceListScreen = () => {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState("All");
  const [calendar, setCalendar] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["maintenance_tasks"], queryFn: maintenanceService.getTasks, refetchInterval: 30_000 });

  const tasks = useMemo(
    () =>
      (data as MaintenanceTask[])
        .filter((task) => filter === "All" || task.type === filter.toLowerCase())
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
    [data, filter],
  );

  return (
    <ScreenContainer
      title="Maintenance"
      subtitle="Priority queue and equipment care"
      navigationMode="drawer"
      scroll={false}
      action={
        <View style={styles.actions}>
          <Pressable style={styles.iconButton} onPress={() => setCalendar((value) => !value)}>
            {calendar ? <List color={colors.steel100} size={20} /> : <CalendarDays color={colors.steel100} size={20} />}
          </Pressable>
          <Pressable style={styles.fabSmall} onPress={() => navigation.navigate("CreateTask")}>
            <Plus color={colors.steel950} size={22} />
          </Pressable>
        </View>
      }
    >
      <ChipRow items={filters} active={filter} onChange={setFilter} />
      {calendar ? (
        <View style={styles.calendar}>
          {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
            <View key={day} style={styles.day}>
              <Text style={styles.dayText}>{day}</Text>
              {tasks.some((task) => new Date(task.scheduled_date).getUTCDate() === day) ? <View style={styles.taskDot} /> : null}
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState variant="maintenance" title="All machines running" subtitle="Schedule preventive maintenance" cta="Create task" />}
          renderItem={({ item }) => (
            <WorkCard
              title={item.title}
              eyebrow={`${item.type.toUpperCase()} · ${item.machine.name}`}
              status={item.status}
              accentColor={item.priority === "critical" ? colors.maintenance : item.priority === "high" ? colors.amber400 : colors.production}
              onPress={() => navigation.navigate("TaskDetail", { task: item })}
            >
              <Text style={styles.meta}>Assigned: {item.assigned_to?.full_name || "Unassigned"}</Text>
              <Text style={styles.meta}>Scheduled: {formatDate(item.scheduled_date, "dd MMM HH:mm")} · Est {item.estimated_hours} hrs</Text>
            </WorkCard>
          )}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  fabSmall: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 180,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  day: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: "13%",
  },
  dayText: {
    color: colors.steel100,
    fontFamily: typography.mono,
    fontSize: 12,
  },
  taskDot: {
    backgroundColor: colors.maintenance,
    borderRadius: 4,
    height: 8,
    marginTop: 4,
    width: 8,
  },
});
