import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react-native";
import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Card3D } from "../../components/3d/Card3D";
import { GlowBorder } from "../../components/3d/GlowBorder";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge, statusPalette } from "../../components/ui/StatusBadge";
import { Header } from "../../components/layout/Header";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { ModuleIconMark } from "../../components/visuals/ModuleArtwork";
import { useRealtime } from "../../hooks/useRealtime";
import { usePermissions } from "../../hooks/usePermissions";
import { financeService } from "../../services/finance.service";
import { hrService } from "../../services/hr.service";
import { inventoryService } from "../../services/inventory.service";
import { maintenanceService } from "../../services/maintenance.service";
import { notificationService } from "../../services/notification.service";
import { productionService } from "../../services/production.service";
import { qualityService } from "../../services/quality.service";
import { useAppStore } from "../../store/appStore";
import type { AttendanceRecord, Budget, FactoryNotification, InventoryItem, Machine, MaintenanceTask, ProductionOrder, QualityCheck } from "../../types";
import { colors, modules, spacing, typography } from "../../utils/constants";
import { moduleDeniedMessage } from "../../utils/permissions";
import { ProgressBar } from "../shared/ScreenScaffold";

const CountUpValue = ({ value }: { value: string }) => {
  const progress = useSharedValue(0);
  progress.value = withTiming(1, { duration: 800 });
  const style = useAnimatedStyle(() => ({ opacity: progress.value }));
  return <Animated.Text style={[styles.kpiValue, style]}>{value}</Animated.Text>;
};

const percent = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { canAccessArea, userRole } = usePermissions();
  const notifications = useAppStore((state) => state.notifications);
  const setNotifications = useAppStore((state) => state.setNotifications);
  const addNotification = useAppStore((state) => state.addNotification);
  const tabModules = new Set(["Production", "Inventory", "HR"]);
  const machinesQuery = useQuery({ queryKey: ["machines"], queryFn: productionService.getMachines, refetchInterval: 20_000 });
  const ordersQuery = useQuery({ queryKey: ["production_orders", "all"], queryFn: () => productionService.getOrders("all"), refetchInterval: 30_000 });
  const inventoryQuery = useQuery({ queryKey: ["inventory_items"], queryFn: inventoryService.getItems, refetchInterval: 30_000 });
  const qualityQuery = useQuery({ queryKey: ["quality_checks"], queryFn: qualityService.getChecks, refetchInterval: 30_000 });
  const attendanceQuery = useQuery({ queryKey: ["attendance"], queryFn: hrService.getAttendance, refetchInterval: 30_000 });
  const maintenanceQuery = useQuery({ queryKey: ["maintenance_tasks"], queryFn: maintenanceService.getTasks, refetchInterval: 30_000 });
  const budgetQuery = useQuery({ queryKey: ["budgets"], queryFn: financeService.getBudgets, refetchInterval: 60_000 });
  const notificationQuery = useQuery({ queryKey: ["notifications"], queryFn: notificationService.getNotifications, refetchInterval: 30_000 });
  const machineData = (machinesQuery.data || []) as Machine[];
  const orderData = (ordersQuery.data || []) as ProductionOrder[];
  const inventoryData = (inventoryQuery.data || []) as InventoryItem[];
  const qualityData = (qualityQuery.data || []) as QualityCheck[];
  const attendanceData = (attendanceQuery.data || []) as AttendanceRecord[];
  const maintenanceData = (maintenanceQuery.data || []) as MaintenanceTask[];
  const budgetData = (budgetQuery.data || []) as Budget[];

  const openModule = (screen: string) => {
    const target = modules.find((module) => module.screen === screen);
    if (target && !canAccessArea(target.id)) return;

    if (tabModules.has(screen)) {
      navigation.navigate(screen);
      return;
    }

    navigation.getParent()?.navigate(screen);
  };

  useRealtime("machines");
  useRealtime("notifications", (payload) => {
    if (payload.eventType === "INSERT") {
      addNotification(payload.new as any);
    }
  });

  useEffect(() => {
    if (notificationQuery.data) {
      setNotifications(notificationQuery.data as FactoryNotification[]);
    }
  }, [notificationQuery.data, setNotifications]);

  const kpiCards = useMemo(() => {
    const averageEfficiency = machineData.length
      ? machineData.reduce((sum, machine) => sum + Number(machine.efficiency_percent || 0), 0) / machineData.length
      : 0;
    const lowStock = inventoryData.filter((item) => Number(item.reorder_level) > 0 && Number(item.quantity_on_hand) <= Number(item.reorder_level)).length;
    const runningMachines = machineData.filter((machine) => machine.status === "running").length;
    const totalOutput = orderData.reduce((sum, order) => sum + Number(order.quantity_produced || 0), 0);

    return [
      { label: "Production Rate", value: `${averageEfficiency.toFixed(1)}%`, delta: machineData.length ? "average machine efficiency" : "no machine telemetry", color: colors.production },
      { label: "Inventory Items", value: inventoryData.length.toLocaleString(), delta: lowStock ? `${lowStock} low stock` : "no low stock flags", color: colors.inventory },
      { label: "Active Machines", value: `${runningMachines}/${machineData.length}`, delta: machineData.length ? `${machineData.length - runningMachines} not running` : "no machines connected", color: colors.maintenance },
      { label: "Total Output", value: totalOutput.toLocaleString(), delta: "units reported by orders", color: colors.quality },
    ];
  }, [inventoryData, machineData, orderData]);

  const moduleStats = useMemo(() => {
    const activeOrders = orderData.filter((order) => ["pending", "in_progress", "on_hold"].includes(order.status)).length;
    const completedOrders = orderData.filter((order) => order.status === "completed").length;
    const passedChecks = qualityData.reduce((sum, check) => sum + Number(check.passed || 0), 0);
    const inspected = qualityData.reduce((sum, check) => sum + Number(check.total_inspected || 0), 0);
    const present = attendanceData.filter((record) => record.status === "present").length;
    const openTasks = maintenanceData.filter((task) => ["open", "in_progress"].includes(task.status)).length;
    const allocated = budgetData.reduce((sum, budget) => sum + Number(budget.allocated || 0), 0);
    const spent = budgetData.reduce((sum, budget) => sum + Number(budget.spent || 0), 0);
    const lowStock = inventoryData.filter((item) => Number(item.reorder_level) > 0 && Number(item.quantity_on_hand) <= Number(item.reorder_level)).length;

    return {
      production: { stat: `${activeOrders} active`, delta: `${completedOrders} completed`, fill: percent(completedOrders, orderData.length) },
      inventory: {
        stat: `${inventoryData.length} SKU`,
        delta: `${lowStock} low stock`,
        fill: percent(inventoryData.length - lowStock, inventoryData.length),
      },
      quality: { stat: `${percent(passedChecks, inspected)}% pass`, delta: `${qualityData.length} inspections`, fill: percent(passedChecks, inspected) },
      hr: { stat: `${present} present`, delta: `${attendanceData.length} records`, fill: percent(present, attendanceData.length) },
      maintenance: { stat: `${openTasks} open`, delta: `${maintenanceData.length} tasks`, fill: percent(maintenanceData.length - openTasks, maintenanceData.length) },
      finance: { stat: `${percent(spent, allocated)}% used`, delta: `${budgetData.length} budgets`, fill: percent(spent, allocated) },
    };
  }, [attendanceData, budgetData, inventoryData, maintenanceData, orderData, qualityData]);

  const alerts = useMemo(
    () =>
      notifications
        .filter((item) => !item.is_read)
        .sort((a, b) => (a.module === "maintenance" ? -1 : b.module === "maintenance" ? 1 : 0))
        .slice(0, 3),
    [notifications],
  );

  return (
    <View style={styles.screen}>
      <Header onMenu={() => navigation.getParent()?.openDrawer()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpis}>
          {kpiCards.map((card) => (
            <GlowBorder key={card.label} color={card.color} style={styles.kpiGlow}>
              <Card3D accentColor={card.color} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{card.label}</Text>
                <CountUpValue value={card.value} />
                <Text style={[styles.kpiDelta, { color: card.color }]}>{card.delta}</Text>
              </Card3D>
            </GlowBorder>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <SectionHeader title="Machine Status" meta="Live · realtime" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.machineRow}>
            {machineData.length ? machineData.map((machine) => {
              const palette = statusPalette(machine.status);
              return (
                <Card key={machine.id} style={styles.machineCard} onPress={() => navigation.navigate("MachineStatus")}>
                  <View style={styles.machineHeader}>
                    <Text style={styles.machineName}>{machine.name}</Text>
                    <StatusBadge status={machine.status} />
                  </View>
                  <Text style={styles.machineMeta}>{machine.location} · {machine.machine_code}</Text>
                  <ProgressBar value={machine.efficiency_percent} color={palette.color} />
                  <Text style={styles.machineEfficiency}>{machine.efficiency_percent}% efficiency</Text>
                </Card>
              );
            }) : (
              <View style={styles.emptySlot}>
                <EmptyState variant="maintenance" title="No machine telemetry" subtitle="Machines will appear here after records are added to Supabase." />
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Modules" meta="2 × 3 command grid" />
          <View style={styles.moduleGrid}>
            {modules.map((module) => {
              const stats = moduleStats[module.id];
              const locked = !canAccessArea(module.id);
              return (
                <Pressable key={module.id} style={styles.modulePressable} onPress={() => openModule(module.screen)} disabled={locked}>
                  <Animated.View entering={FadeIn.duration(260)} style={[styles.moduleCard, locked && styles.moduleCardLocked, { borderLeftColor: locked ? colors.steel700 : module.color }]}>
                    <View style={styles.moduleTop}>
                      <View style={[styles.moduleIcon, { backgroundColor: `${module.color}16`, borderColor: `${module.color}40` }]}>
                        <ModuleIconMark id={module.id} color={locked ? colors.steel500 : module.color} size={38} />
                      </View>
                      <Text style={[styles.moduleStat, { color: locked ? colors.steel500 : module.color }]}>{locked ? "Locked" : stats.stat}</Text>
                    </View>
                    <Text style={styles.moduleLabel}>{module.label}</Text>
                    <Text style={styles.moduleDelta}>{locked ? moduleDeniedMessage(userRole, module.id) : stats.delta}</Text>
                    <View style={[styles.moduleRail, { backgroundColor: `${module.color}33` }]}>
                      <View style={[styles.moduleRailFill, { backgroundColor: locked ? colors.steel500 : module.color, width: locked ? "0%" : `${Math.min(Math.max(stats.fill, 0), 100)}%` }]} />
                    </View>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Today's Alerts" meta="Critical first" />
          {alerts.length ? (
            alerts.map((alert) => (
              <Card key={alert.id} accentColor={alert.module === "maintenance" ? colors.maintenance : colors.amber400} style={styles.alertCard} onPress={() => navigation.getParent()?.navigate(alert.action_url || "Notifications")}>
                <AlertTriangle color={alert.module === "maintenance" ? colors.maintenance : colors.amber400} size={18} />
                <View style={styles.alertCopy}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text numberOfLines={2} style={styles.alertBody}>{alert.body}</Text>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState variant="quality" title="No unread alerts" subtitle="Realtime alerts from Supabase will appear here." />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.steel950,
    flex: 1,
  },
  scroll: {
    paddingBottom: 110,
  },
  kpis: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  kpiGlow: {
    width: 210,
  },
  kpiCard: {
    height: 138,
    justifyContent: "space-between",
  },
  kpiLabel: {
    color: colors.steel500,
    fontFamily: typography.bodyMedium,
    fontSize: 12,
  },
  kpiValue: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 34,
  },
  kpiDelta: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  machineRow: {
    gap: spacing.md,
  },
  emptySlot: {
    width: 300,
  },
  machineCard: {
    gap: spacing.sm,
    width: 230,
  },
  machineHeader: {
    gap: spacing.xs,
  },
  machineName: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 15,
  },
  machineMeta: {
    color: colors.steel500,
    fontFamily: typography.mono,
    fontSize: 11,
  },
  machineEfficiency: {
    color: colors.steel300,
    fontFamily: typography.body,
    fontSize: 12,
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  modulePressable: {
    width: "48%",
  },
  moduleCard: {
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 154,
    padding: spacing.md,
    width: "100%",
  },
  moduleCardLocked: {
    opacity: 0.62,
  },
  moduleTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  moduleIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  moduleStat: {
    fontFamily: typography.mono,
    fontSize: 12,
  },
  moduleLabel: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 15,
  },
  moduleDelta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 4,
  },
  moduleRail: {
    borderRadius: 2,
    height: 3,
    marginTop: "auto",
    overflow: "hidden",
    width: "100%",
  },
  moduleRailFill: {
    borderRadius: 2,
    height: "100%",
    width: "58%",
  },
  alertCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  alertCopy: {
    flex: 1,
  },
  alertTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 14,
  },
  alertBody: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 2,
  },
});
