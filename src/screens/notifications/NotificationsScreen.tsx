import * as Haptics from "expo-haptics";
import { Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAppStore } from "../../store/appStore";
import { colors, modules, spacing, typography } from "../../utils/constants";
import { formatTimeAgo } from "../../utils/formatters";
import { ChipRow, ScreenContainer } from "../shared/ScreenScaffold";

const tabs = ["All", "Unread", "Production", "Maintenance", "Quality"];

const NotificationCard = ({ item }: { item: ReturnType<typeof useAppStore.getState>["notifications"][number] }) => {
  const markRead = useAppStore((state) => state.markRead);
  const remove = useAppStore((state) => state.removeNotification);
  const translateX = useSharedValue(0);
  const module = modules.find((entry) => entry.id === item.module);
  const color = module?.color || colors.amber400;

  const gesture = Gesture.Pan()
    .onChange((event) => {
      translateX.value = Math.min(0, Math.max(-92, event.translationX));
    })
    .onEnd(() => {
      if (translateX.value < -62) {
        runOnJS(remove)(item.id);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    <View style={styles.swipeShell}>
      <View style={styles.deleteBg}>
        <Trash2 color={colors.steel100} size={20} />
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={style}>
          <Card
            accentColor={color}
            style={[styles.card, !item.is_read && styles.unreadCard]}
            onPress={async () => {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              markRead(item.id);
            }}
          >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <View style={styles.copy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text numberOfLines={2} style={styles.body}>{item.body}</Text>
              <View style={styles.meta}>
                <Badge label={item.module} color={color} />
                <Text style={styles.time}>{formatTimeAgo(item.created_at)}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export const NotificationsScreen = () => {
  const [active, setActive] = useState("All");
  const notifications = useAppStore((state) => state.notifications);
  const markAllRead = useAppStore((state) => state.markAllRead);

  const filtered = useMemo(() => {
    if (active === "Unread") return notifications.filter((item) => !item.is_read);
    if (active === "All") return notifications;
    return notifications.filter((item) => item.module === active.toLowerCase());
  }, [active, notifications]);

  return (
    <ScreenContainer
      title="Notifications"
      subtitle="Realtime cross-module alerts"
      navigationMode="drawer"
      action={
        <Pressable style={styles.markAll} onPress={markAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </Pressable>
      }
    >
      <ChipRow items={tabs} active={active} onChange={setActive} />
      {filtered.map((item) => (
        <NotificationCard key={item.id} item={item} />
      ))}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  markAll: {
    justifyContent: "center",
    minHeight: 44,
  },
  markAllText: {
    color: colors.amber400,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  swipeShell: {
    overflow: "hidden",
  },
  deleteBg: {
    alignItems: "center",
    backgroundColor: colors.maintenance,
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    top: 0,
    width: 92,
  },
  card: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  unreadCard: {
    backgroundColor: colors.steel800,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    marginTop: 5,
    width: 10,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 15,
  },
  body: {
    color: colors.steel300,
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  time: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 11,
  },
});
