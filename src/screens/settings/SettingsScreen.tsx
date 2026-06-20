import { Bell, Database, Moon, UserPlus } from "lucide-react-native";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { useAppStore } from "../../store/appStore";
import { colors, spacing, typography } from "../../utils/constants";
import { ScreenContainer } from "../shared/ScreenScaffold";

const rows = [
  { title: "Realtime Channels", icon: Database },
  { title: "Notification Haptics", icon: Bell },
];

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const setDarkMode = useAppStore((state) => state.setDarkMode);
  const showToast = useAppStore((state) => state.showToast);

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    showToast("success", `${enabled ? "Dark" : "Light"} mode enabled.`);

    if (Platform.OS === "web") {
      setTimeout(() => globalThis.location?.reload(), 150);
    }
  };

  return (
    <ScreenContainer title="Settings" navigationMode="drawer">
      <Card style={styles.card}>
        <View style={styles.icon}>
          <Moon color={colors.amber400} size={21} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Dark Mode</Text>
        </View>
        <Switch
          value={isDarkMode}
          onValueChange={toggleDarkMode}
          trackColor={{ false: colors.steel700, true: `${colors.amber400}66` }}
          thumbColor={isDarkMode ? colors.amber400 : colors.steel500}
        />
      </Card>

      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <Card key={row.title} style={styles.card}>
            <View style={styles.icon}>
              <Icon color={colors.amber400} size={21} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{row.title}</Text>
            </View>
          </Card>
        );
      })}

      <Card style={styles.matrixCard} accentColor={colors.blue}>
        <View style={styles.matrixHead}>
          <View style={styles.icon}>
            <UserPlus color={colors.blue} size={21} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>Account Provisioning</Text>
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
});
