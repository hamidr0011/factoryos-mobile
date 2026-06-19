import { useNavigation } from "@react-navigation/native";
import { LockKeyhole } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { usePermissions } from "../../hooks/usePermissions";
import { colors, spacing, typography } from "../../utils/constants";
import type { AccessLevel, AppArea } from "../../utils/permissions";
import { moduleDeniedMessage, roleLabels } from "../../utils/permissions";
import { ScreenContainer } from "../shared/ScreenScaffold";

export const AccessDeniedScreen = ({ area = "dashboard", level = "read" }: { area?: AppArea; level?: AccessLevel }) => {
  const navigation = useNavigation<any>();
  const { userRole } = usePermissions();
  const goDashboard = () => {
    if (navigation.getParent?.()?.getState?.()?.routeNames?.includes("MainTabs")) {
      navigation.getParent().navigate("MainTabs", { screen: "Dashboard" });
      return;
    }

    navigation.navigate("Dashboard");
  };

  return (
    <ScreenContainer title="Access Restricted" subtitle={`${roleLabels[userRole]} role`} navigationMode="drawer">
      <View style={styles.panel}>
        <View style={styles.icon}>
          <LockKeyhole color={colors.amber400} size={28} />
        </View>
        <Text style={styles.title}>This area is role protected</Text>
        <Text style={styles.copy}>{moduleDeniedMessage(userRole, area, level)}</Text>
        <Button title="Back to Dashboard" onPress={goDashboard} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  panel: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  icon: {
    alignItems: "center",
    backgroundColor: `${colors.amber400}18`,
    borderColor: `${colors.amber400}44`,
    borderRadius: 14,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 22,
    textAlign: "center",
  },
  copy: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
