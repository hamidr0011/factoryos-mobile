import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Activity, Package, Wrench, CheckCircle2, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
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
import { colors, modules, radii, spacing, typography } from "../../utils/constants";
import { ProgressBar } from "../shared/ScreenScaffold";

const percent = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

const findDrawerNavigation = (navigation: any) => {
  let current = navigation;

  while (current) {
    if (typeof current.openDrawer === "function") return current;
    current = current.getParent?.();
  }

  return undefined;
};

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const drawerNavigation = findDrawerNavigation(navigation);
  const { canAccessArea, userRole } = usePermissions();
  const notifications = useAppStore((state) => state.notifications);
  const setNotifications = useAppStore((state) => state.setNotifications);
  const addNotification = useAppStore((state) => state.addNotification);
  const tabModules = new Set(["Production", "Inventory", "HR"]);
  const openMachineStatus = useCallback(() => navigation.navigate("Production", { screen: "MachineStatus" }), [navigation]);
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

    drawerNavigation?.navigate(screen);
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

  const averageEfficiency = useMemo(() => {
    return machineData.length
      ? machineData.reduce((sum, machine) => sum + Number(machine.efficiency_percent || 0), 0) / machineData.length
      : 0;
  }, [machineData]);

  const runningMachines = useMemo(() => {
    return machineData.filter((machine) => machine.status === "running").length;
  }, [machineData]);

  const lowStock = useMemo(() => {
    return inventoryData.filter((item) => Number(item.reorder_level) > 0 && Number(item.quantity_on_hand) <= Number(item.reorder_level)).length;
  }, [inventoryData]);

  const totalOutput = useMemo(() => {
    return orderData.reduce((sum, order) => sum + Number(order.quantity_produced || 0), 0);
  }, [orderData]);

  const healthScore = useMemo(() => {
    if (!machineData.length) return null;
    let base = Math.round(averageEfficiency);
    const stopped = machineData.length - runningMachines;
    base -= stopped * 4;
    base -= lowStock * 2;
    return Math.min(100, Math.max(0, base));
  }, [averageEfficiency, lowStock, machineData.length, runningMachines]);

  const healthColor = healthScore === null ? colors.steel700 : healthScore >= 90 ? colors.emerald : healthScore >= 70 ? colors.orange : colors.red;

  const kpiItems = useMemo(() => {
    return [
      {
        label: "Production Rate",
        value: `${averageEfficiency.toFixed(1)}%`,
        icon: <Activity size={18} color={colors.amber400} />,
        bgColor: colors.steel800,
        onPress: () => navigation.navigate("Production"),
      },
      {
        label: "Inventory Items",
        value: inventoryData.length.toLocaleString(),
        icon: <Package size={18} color={colors.amber400} />,
        bgColor: colors.steel800,
        onPress: () => navigation.navigate("Inventory"),
      },
      {
        label: "Active Machines",
        value: `${runningMachines}/${machineData.length}`,
        icon: <Wrench size={18} color={colors.amber400} />,
        bgColor: colors.steel800,
        onPress: openMachineStatus,
      },
      {
        label: "Total Output",
        value: totalOutput.toLocaleString(),
        icon: <CheckCircle2 size={18} color={colors.amber400} />,
        bgColor: colors.steel800,
        onPress: () => navigation.navigate("Production"),
      },
    ];
  }, [averageEfficiency, inventoryData.length, machineData.length, openMachineStatus, runningMachines, totalOutput, navigation]);

  const moduleStats = useMemo(() => {
    const activeOrders = orderData.filter((order) => ["pending", "in_progress", "on_hold"].includes(order.status)).length;
    const completedOrders = orderData.filter((order) => order.status === "completed").length;
    const passedChecks = qualityData.reduce((sum, check) => sum + Number(check.passed || 0), 0);
    const inspected = qualityData.reduce((sum, check) => sum + Number(check.total_inspected || 0), 0);
    const present = attendanceData.filter((record) => record.status === "present").length;
    const openTasks = maintenanceData.filter((task) => ["open", "in_progress"].includes(task.status)).length;
    const allocated = budgetData.reduce((sum, budget) => sum + Number(budget.allocated || 0), 0);
    const spent = budgetData.reduce((sum, budget) => sum + Number(budget.spent || 0), 0);

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
        <View style={styles.careSection}>
          <Card style={styles.careCard}>
            <View style={styles.careHeader}>
              <View style={styles.gaugeContainer}>
                <View style={[
                  styles.gaugeCircle,
                  { borderColor: healthColor }
                ]}>
                  <Text style={styles.gaugeScore}>{healthScore ?? "--"}</Text>
                  <Text style={styles.gaugeMax}>/100</Text>
                </View>
              </View>
              <View style={styles.careSummary}>
                <Text style={styles.careStatusText}>
                  Factory Health
                </Text>
                <Text numberOfLines={2} style={styles.careSubstatusText}>
                  {machineData.length
                    ? `${runningMachines} of ${machineData.length} machines running · ${lowStock} low stock`
                    : "No telemetry"}
                </Text>
              </View>
            </View>

            <View style={styles.careDivider} />

            <View style={styles.careList}>
              {kpiItems.map((item, index) => (
                <View key={item.label}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.careRow,
                      pressed && styles.careRowPressed,
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={[styles.careIconWrapper, { backgroundColor: item.bgColor }]}>
                      {item.icon}
                    </View>
	                    <View style={styles.careInfo}>
	                      <Text style={styles.careLabel}>{item.label}</Text>
	                    </View>
                    <View style={styles.careValueWrapper}>
                      <Text style={styles.careValue}>{item.value}</Text>
                      <ChevronRight size={14} color={colors.steel500} style={{ marginLeft: 4 }} />
                    </View>
                  </Pressable>
                  {index < kpiItems.length - 1 && <View style={styles.careRowDivider} />}
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Machine Status" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.machineRow}>
            {machineData.length ? machineData.map((machine) => {
              const palette = statusPalette(machine.status);
              return (
                <Card key={machine.id} style={styles.machineCard} onPress={openMachineStatus}>
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
                <EmptyState variant="maintenance" title="No machine telemetry" />
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Modules" />
          <View style={styles.moduleGrid}>
            {modules.map((module) => {
              const stats = moduleStats[module.id];
              const locked = !canAccessArea(module.id);
              return (
                <Pressable key={module.id} style={styles.modulePressable} onPress={() => openModule(module.screen)} disabled={locked}>
                  <Animated.View entering={FadeIn.duration(260)} style={[styles.moduleCard, locked && styles.moduleCardLocked]}>
                    <View style={styles.moduleTop}>
                      <View style={styles.moduleIcon}>
                        <ModuleIconMark id={module.id} color={locked ? colors.steel500 : colors.amber400} size={24} />
                      </View>
                      <Text style={[styles.moduleStat, { color: locked ? colors.steel500 : colors.amber400 }]}>{locked ? "Locked" : stats.stat}</Text>
                    </View>
                    <Text style={styles.moduleLabel}>{module.label}</Text>
                    <Text numberOfLines={1} style={styles.moduleDelta}>{locked ? "Locked" : stats.delta}</Text>
                    <View style={styles.moduleRail}>
                      <View style={[styles.moduleRailFill, { backgroundColor: locked ? colors.steel500 : colors.amber400, width: locked ? "0%" : `${Math.min(Math.max(stats.fill, 0), 100)}%` }]} />
                    </View>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Today's Alerts" />
          {alerts.length ? (
            alerts.map((alert) => (
              <Card key={alert.id} accentColor={alert.module === "maintenance" ? colors.red : colors.orange} style={styles.alertCard} onPress={() => drawerNavigation?.navigate(alert.action_url || "Notifications")}>
                <AlertTriangle color={alert.module === "maintenance" ? colors.red : colors.orange} size={18} />
                <View style={styles.alertCopy}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text numberOfLines={2} style={styles.alertBody}>{alert.body}</Text>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState variant="quality" title="No unread alerts" />
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
  careSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  careCard: {
    padding: spacing.md,
  },
  careHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  gaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeScore: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 20,
    fontWeight: "700",
  },
  gaugeMax: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 9,
    marginTop: -2,
  },
  careSummary: {
    flex: 1,
  },
  careStatusText: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 15,
    fontWeight: "600",
  },
  careSubstatusText: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  careDivider: {
    height: 1,
    backgroundColor: colors.steel700,
    marginVertical: spacing.md,
  },
  careList: {
    gap: spacing.sm,
  },
  careRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  careRowPressed: {
    backgroundColor: `${colors.steel800}50`,
  },
  careIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  careInfo: {
    flex: 1,
  },
  careLabel: {
    color: colors.steel100,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    fontWeight: "600",
  },
  careValueWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  careValue: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 14,
    fontWeight: "600",
  },
  careRowDivider: {
    height: 1,
    backgroundColor: colors.steel700,
    opacity: 0.5,
    marginLeft: 50,
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
    fontSize: 14,
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
    borderRadius: radii.card,
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
    backgroundColor: colors.steel950,
    borderColor: colors.steel700,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  moduleStat: {
    fontFamily: typography.mono,
    fontSize: 11,
  },
  moduleLabel: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 14,
  },
  moduleDelta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 11,
    marginTop: 4,
  },
  moduleRail: {
    backgroundColor: colors.steel800,
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
