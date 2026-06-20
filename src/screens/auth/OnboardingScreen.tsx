import { StackScreenProps } from "@react-navigation/stack";
import { ShieldCheck, Signal, Workflow } from "lucide-react-native";
import { useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Button } from "../../components/ui/Button";
import { colors, spacing, typography } from "../../utils/constants";

type Props = StackScreenProps<any, "Onboarding">;

const slides = [
  {
    title: "6 Modules, One Command Center",
    body: "Production, inventory, quality, workforce, maintenance, and finance in one operational surface.",
    icon: Workflow,
    color: colors.blue,
    insights: [
      ["Modules", "06"],
      ["Queues", "24"],
      ["Lines", "A-D"],
    ],
  },
  {
    title: "Real-Time Everything",
    body: "Live machine state, production movement, approvals, alerts, and notifications without manual refresh.",
    icon: Signal,
    color: colors.amber400,
    insights: [
      ["Sync", "Live"],
      ["Alerts", "02"],
      ["Latency", "<1s"],
    ],
  },
  {
    title: "Role-Based Access",
    body: "Admin, manager, supervisor, operator, and viewer experiences stay precise and permission-aware.",
    icon: ShieldCheck,
    color: colors.blue,
    insights: [
      ["Roles", "05"],
      ["RLS", "On"],
      ["Audit", "Full"],
    ],
  },
];

export const OnboardingScreen = ({ navigation }: Props) => {
  const [page, setPage] = useState(0);
  const flip = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const slideWidth = Platform.OS === "web" ? 430 : width;

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(event.nativeEvent.contentOffset.x / slideWidth));
  };

  const roleCardStyle = useAnimatedStyle(() => {
    if (Platform.OS === "web") {
      return {
        transform: [{ perspective: 800 }, { rotateY: `${flip.value}deg` }],
      };
    }
    const scale = flip.value === 0 ? 1 : 0.95;
    const rotate = flip.value === 0 ? "0deg" : "4deg";
    return {
      transform: [
        { scale: withSpring(scale, { damping: 18, mass: 0.8 }) },
        { rotate: withSpring(rotate, { damping: 18, mass: 0.8 }) },
      ],
    };
  });

  const advance = () => {
    if (page === 2) {
      navigation.replace("Login");
      return;
    }
    const next = page + 1;
    setPage(next);
    scrollRef.current?.scrollTo({ x: next * slideWidth, animated: true });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.grid} />
      <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} style={styles.carousel}>
        {slides.map((slide, index) => {
          const Icon = slide.icon;
          return (
            <View key={slide.title} style={[styles.slide, { width: slideWidth }]}>
              <View style={[styles.illustration, { borderColor: `${slide.color}55` }]}>
                {index === 2 ? (
                  <Animated.View style={[styles.roleStack, roleCardStyle]}>
                    {["ADMIN", "MANAGER", "SUPERVISOR", "OPERATOR"].map((role, roleIndex) => (
                      <View key={role} style={[styles.roleCard, { top: roleIndex * 22, left: roleIndex * 10, borderColor: `${slide.color}66` }]}>
                        <Text style={styles.roleText}>{role}</Text>
                      </View>
                    ))}
                  </Animated.View>
                ) : (
                  <>
                    <Icon color={slide.color} size={86} strokeWidth={1.6} />
                    <View style={styles.signalLine} />
                    <View style={[styles.blip, { backgroundColor: slide.color }]} />
                  </>
                )}
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.body}>{slide.body}</Text>
              <View style={styles.insightRail}>
                {slide.insights.map(([label, value]) => (
                  <View key={label} style={[styles.insightCell, { borderColor: `${slide.color}3D` }]}>
                    <Text style={[styles.insightValue, { color: slide.color }]}>{value}</Text>
                    <Text style={styles.insightLabel}>{label}</Text>
                  </View>
                ))}
              </View>
              {index === 2 ? (
                <Button
                  title="Flip Access Stack"
                  variant="secondary"
                  onPress={() => {
                    flip.value = withSpring(flip.value ? 0 : 180, { damping: 18, mass: 0.8 });
                  }}
                />
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View key={slide.title} style={[styles.dot, page === index && styles.dotActive]} />
          ))}
        </View>
        <Button title={page === 2 ? "Get Started" : "Next"} onPress={advance} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.steel950,
    flex: 1,
    overflow: "hidden",
  },
  grid: {
    borderColor: colors.steel800,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    opacity: 0.14,
    position: "absolute",
    right: 0,
    top: 0,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "flex-start",
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  illustration: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderRadius: 16,
    borderWidth: 1,
    height: 230,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  signalLine: {
    backgroundColor: colors.steel700,
    height: 2,
    marginTop: spacing.xl,
    width: 180,
  },
  blip: {
    borderRadius: 6,
    height: 12,
    marginTop: -7,
    width: 12,
  },
  roleStack: {
    height: 190,
    width: 220,
  },
  roleCard: {
    backgroundColor: colors.steel800,
    borderRadius: 8,
    borderWidth: 1,
    height: 72,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    position: "absolute",
    width: 180,
  },
  roleText: {
    color: colors.steel100,
    fontFamily: typography.mono,
    fontSize: 13,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 21,
    textAlign: "center",
  },
  body: {
    color: colors.steel300,
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  insightRail: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
    width: "100%",
  },
  insightCell: {
    backgroundColor: colors.steel900,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 60,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  insightValue: {
    fontFamily: typography.display,
    fontSize: 15,
  },
  insightLabel: {
    color: colors.steel500,
    fontFamily: typography.mono,
    fontSize: 10,
    marginTop: 3,
    textTransform: "uppercase",
  },
  footer: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  dots: {
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  dot: {
    backgroundColor: colors.steel700,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: colors.amber400,
    width: 28,
  },
});
