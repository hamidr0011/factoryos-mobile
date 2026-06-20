import { StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import { colors, spacing, typography } from "../../utils/constants";
import { DetailRow, ScreenContainer } from "../shared/ScreenScaffold";

export const ProfileScreen = () => {
  const { profile } = useAuth();
  return (
    <ScreenContainer title="Profile" navigationMode="drawer">
      <Card style={styles.card} accentColor={colors.amber400}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.full_name?.slice(0, 1) || "F"}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || "FactoryOS User"}</Text>
        <Badge label={profile?.role || "viewer"} color={colors.amber400} />
        <DetailRow label="Employee ID" value={profile?.employee_id || "N/A"} />
        <DetailRow label="Department" value={profile?.department || "Operations"} />
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 24,
    height: 86,
    justifyContent: "center",
    width: 86,
  },
  avatarText: {
    color: colors.steel950,
    fontFamily: typography.display,
    fontSize: 38,
  },
  name: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 24,
  },
});
