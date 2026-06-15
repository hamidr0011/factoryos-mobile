import { useNavigation } from "@react-navigation/native";
import { AlertTriangle } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Card3D } from "../../components/3d/Card3D";
import { GlowBorder } from "../../components/3d/GlowBorder";
import { Card } from "../../components/ui/Card";
import { StatusBadge, statusPalette } from "../../components/ui/StatusBadge";
import { Header } from "../../components/layout/Header";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { ModuleIconMark } from "../../components/visuals/ModuleArtwork";
import { useRealtime } from "../../hooks/useRealtime";
import { useAppStore } from "../../store/appStore";
import { colors, kpiCards, machines, modules, spacing, typography } from "../../utils/constants";
import { ProgressBar } from "../shared/ScreenScaffold";

const CountUpValue = ({ value, label }: { value: string; label: number }) => {
  const progress = useSharedValue(0);
  progress.value = withTiming(1, { duration: 800 });
  const style = useAnimatedStyle(() => ({ opacity: progress.value }));
  return <Animated.Text style={[styles.kpiValue, style]}>{value}</Animated.Text>;
};

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const notifications = useAppStore((state) => state.notifications);
  const addNotification = useAppStore((state) => state.addNotification);
  const tabModules = new Set(["Production", "Inventory", "HR"]);

  const openModule = (screen: string) => {
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
                <CountUpValue value={card.value} label={card.numericValue} />
                <Text style={[styles.kpiDelta, { color: card.color }]}>{card.delta}</Text>
              </Card3D>
            </GlowBorder>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <SectionHeader title="Machine Status" meta="Live · realtime" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.machineRow}>
            {machines.map((machine) => {
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
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Modules" meta="2 × 3 command grid" />
          <View style={styles.moduleGrid}>
            {modules.map((module) => {
              return (
                <Pressable key={module.id} style={styles.modulePressable} onPress={() => openModule(module.screen)}>
                  <Animated.View entering={FadeIn.duration(260)} style={[styles.moduleCard, { borderLeftColor: module.color }]}>
                    <View style={styles.moduleTop}>
                      <View style={[styles.moduleIcon, { backgroundColor: `${module.color}16`, borderColor: `${module.color}40` }]}>
                        <ModuleIconMark id={module.id} color={module.color} size={38} />
                      </View>
                      <Text style={[styles.moduleStat, { color: module.color }]}>{module.stat}</Text>
                    </View>
                    <Text style={styles.moduleLabel}>{module.label}</Text>
                    <Text style={styles.moduleDelta}>{module.delta}</Text>
                    <View style={[styles.moduleRail, { backgroundColor: `${module.color}33` }]}>
                      <View style={[styles.moduleRailFill, { backgroundColor: module.color }]} />
                    </View>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Today's Alerts" meta="Critical first" />
          {alerts.map((alert) => (
            <Card key={alert.id} accentColor={alert.module === "maintenance" ? colors.maintenance : colors.amber400} style={styles.alertCard} onPress={() => navigation.getParent()?.navigate(alert.action_url || "Notifications")}>
              <AlertTriangle color={alert.module === "maintenance" ? colors.maintenance : colors.amber400} size={18} />
              <View style={styles.alertCopy}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text numberOfLines={2} style={styles.alertBody}>{alert.body}</Text>
              </View>
            </Card>
          ))}
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
    gap: spacing.md,
  },
  modulePressable: {
    width: "47%",
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
