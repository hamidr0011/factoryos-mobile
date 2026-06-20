import { Bell, Database, UserPlus } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { colors, spacing, typography } from "../../utils/constants";
import { ScreenContainer } from "../shared/ScreenScaffold";

const rows = [
  { title: "Realtime Channels", subtitle: "Machines, production, maintenance, notifications", icon: Database },
  { title: "Notification Haptics", subtitle: "Warning and success feedback enabled", icon: Bell },
];

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();

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
});
