import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../utils/constants";

export const SectionHeader = ({ title, meta }: { title: string; meta?: string }) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {meta ? <Text style={styles.meta}>{meta}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 17,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
});
