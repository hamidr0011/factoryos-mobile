import { Bell, Database, Shield, UserPlus } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { permissionService } from "../../services/permission.service";
import { colors, spacing, typography } from "../../utils/constants";
import { roleLabels } from "../../utils/permissions";
import { ScreenContainer } from "../shared/ScreenScaffold";

const rows = [
  { title: "Realtime Channels", subtitle: "Machines, production, maintenance, notifications", icon: Database },
  { title: "Notification Haptics", subtitle: "Warning and success feedback enabled", icon: Bell },
  { title: "Role Permissions", subtitle: "Admin, manager, supervisor, operator, viewer", icon: Shield },
];

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { data } = useQuery({ queryKey: ["role_access"], queryFn: permissionService.getRoleAccess });
  const roles = Object.keys(roleLabels) as Array<keyof typeof roleLabels>;

  return (
    <ScreenContainer title="Settings" subtitle="App controls and operational preferences" navigationMode="drawer">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <Card key={row.title} style={styles.card}>
            <View style={styles.icon}>
              <Icon color={colors.amber400} size={21} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{row.title}</Text>
              <Text style={styles.subtitle}>{row.subtitle}</Text>
            </View>
          </Card>
        );
      })}

      <Card style={styles.matrixCard} accentColor={colors.hr}>
        <View style={styles.matrixHead}>
          <View style={styles.icon}>
            <UserPlus color={colors.hr} size={21} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>Account Provisioning</Text>
            <Text style={styles.subtitle}>Open HR Employees, then tap + to create a user and assign a role.</Text>
          </View>
        </View>
        <PermissionGate roles={["admin"]}>
          <Button
            title="Open Access Management"
            icon={<UserPlus color={colors.steel950} size={18} />}
            onPress={() => navigation.navigate("MainTabs", { screen: "HR", params: { screen: "EmployeeList" } })}
          />
        </PermissionGate>
        {roles.map((role) => {
          const matrixRows = (data?.matrix || []).filter((row) => row.role === role);
          const readable = matrixRows.filter((row) => row.canRead || row.canWrite || row.canApprove || row.canAdmin).length;
          const writable = matrixRows.filter((row) => row.canWrite || row.canAdmin).length;

          return (
            <View key={role} style={styles.roleRow}>
              <Text style={styles.roleName}>{roleLabels[role]}</Text>
              <Text style={styles.roleAccess}>
                {matrixRows.length ? `${readable}/${matrixRows.length} modules readable · ${writable}/${matrixRows.length} writable` : "No API role matrix rows returned."}
              </Text>
            </View>
          );
        })}
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  icon: {
    alignItems: "center",
    backgroundColor: `${colors.amber400}1F`,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: {
    flex: 1,
  },
  matrixCard: {
    gap: spacing.sm,
  },
  matrixHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 15,
  },
  subtitle: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 3,
  },
  roleRow: {
    borderTopColor: colors.steel700,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  roleName: {
    color: colors.hr,
    fontFamily: typography.display,
    fontSize: 13,
    textTransform: "capitalize",
  },
  roleAccess: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 17,
  },
});
