import { Bell, Database, Shield } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/ui/Card";
import { colors, spacing, typography } from "../../utils/constants";
import { ScreenContainer } from "../shared/ScreenScaffold";

const rows = [
  { title: "Realtime Channels", subtitle: "Machines, production, maintenance, notifications", icon: Database },
  { title: "Notification Haptics", subtitle: "Warning and success feedback enabled", icon: Bell },
  { title: "Role Permissions", subtitle: "Admin, manager, supervisor, operator, viewer", icon: Shield },
];

export const SettingsScreen = () => (
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
  </ScreenContainer>
);

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
