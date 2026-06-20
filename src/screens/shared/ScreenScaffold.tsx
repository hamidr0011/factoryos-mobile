import { ChevronLeft, Menu, Search } from "lucide-react-native";
import { PropsWithChildren, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { colors, radii, spacing, typography } from "../../utils/constants";

interface ScreenContainerProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  navigationMode?: "auto" | "back" | "drawer" | "none";
  scroll?: boolean;
  style?: ViewStyle;
}

const findDrawerNavigation = (navigation: any) => {
  let current = navigation;

  while (current) {
    if (typeof current.openDrawer === "function") {
      return current;
    }

    current = current.getParent?.();
  }

  return undefined;
};

export const ScreenContainer = ({ title, subtitle, action, children, navigationMode = "auto", scroll = true, style }: ScreenContainerProps) => {
  const navigation = useNavigation<any>();
  const drawerNavigation = findDrawerNavigation(navigation);
  const canGoBack = navigation.canGoBack?.() ?? false;
  const showNavButton = navigationMode !== "none" && (canGoBack || drawerNavigation);
  const useBackButton = navigationMode === "back" || (navigationMode === "auto" && canGoBack);

  const handleNavigation = () => {
    if (useBackButton && canGoBack) {
      navigation.goBack();
      return;
    }

    drawerNavigation?.openDrawer();
  };

  const content = (
    <View style={[styles.content, style]}>
      {title ? (
        <View style={styles.titleRow}>
          {showNavButton ? (
            <Pressable style={styles.navButton} onPress={handleNavigation}>
              {useBackButton ? <ChevronLeft color={colors.steel100} size={24} /> : <Menu color={colors.steel100} size={23} />}
            </Pressable>
          ) : null}
          <View style={styles.titleCopy}>
            <Text numberOfLines={1} style={styles.title}>{title}</Text>
            {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};

export const ProgressBar = ({ value, color = colors.amber400 }: { value: number; color?: string }) => (
  <View style={styles.progressTrack}>
    <View style={[styles.progressFill, { width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: color }]} />
  </View>
);

export const MetricPill = ({ label, value, color = colors.amber400 }: { label: string; value: string; color?: string }) => (
  <View style={[styles.metric, { borderColor: `${color}44` }]}>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

export const SearchField = ({ value, onChangeText, placeholder = "Search" }: { value: string; onChangeText: (value: string) => void; placeholder?: string }) => (
  <View style={styles.search}>
    <Search color={colors.amber400} size={18} />
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.steel500} style={styles.searchInput} />
  </View>
);

export const ChipRow = ({ items, active, onChange }: { items: string[]; active: string; onChange: (item: string) => void }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
    {items.map((item) => {
      const selected = active === item;
      return (
        <Pressable key={item} style={[styles.chip, selected && styles.chipActive]} onPress={() => onChange(item)}>
          <Text style={[styles.chipText, selected && styles.chipTextActive]}>{item}</Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

export const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export const WorkCard = ({
  title,
  eyebrow,
  status,
  badge,
  accentColor = colors.amber400,
  children,
  onPress,
}: PropsWithChildren<{ title: string; eyebrow?: string; status?: string; badge?: string; accentColor?: string; onPress?: () => void }>) => (
  <Card accentColor={accentColor} onPress={onPress} style={styles.workCard}>
    <View style={styles.cardHead}>
      <View style={styles.cardCopy}>
        {eyebrow ? <Text numberOfLines={1} style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text numberOfLines={2} style={styles.cardTitle}>{title}</Text>
      </View>
      {status ? <StatusBadge status={status} /> : badge ? <Badge label={badge} color={accentColor} /> : null}
    </View>
    {children}
  </Card>
);

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.steel950,
    flex: 1,
  },
  scroll: {
    paddingBottom: 112,
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 56,
    paddingBottom: spacing.xs,
  },
  navButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  titleCopy: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 26,
    lineHeight: 31,
  },
  subtitle: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  progressTrack: {
    backgroundColor: colors.steel800,
    borderRadius: 8,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: 8,
    height: "100%",
  },
  metric: {
    backgroundColor: colors.steel900,
    borderRadius: radii.card,
    borderWidth: 1,
    flex: 1,
    minHeight: 68,
    padding: spacing.sm,
  },
  metricValue: {
    fontFamily: typography.display,
    fontSize: 22,
  },
  metricLabel: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 11,
    marginTop: 4,
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.steel100,
    flex: 1,
    fontFamily: typography.body,
    fontSize: 15,
  },
  chips: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    borderColor: colors.steel700,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: `${colors.amber400}12`,
    borderColor: colors.amber400,
  },
  chipText: {
    color: colors.steel300,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.amber400,
  },
  detailRow: {
    borderBottomColor: colors.steel700,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 42,
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 13,
  },
  detailValue: {
    color: colors.steel100,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    maxWidth: "58%",
    textAlign: "right",
  },
  workCard: {
    gap: spacing.sm,
  },
  cardHead: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  cardCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.steel500,
    fontFamily: typography.mono,
    fontSize: 11,
    marginBottom: 4,
  },
  cardTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 16,
    lineHeight: 20,
  },
});
