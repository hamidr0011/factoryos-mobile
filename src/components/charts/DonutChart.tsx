import { Canvas, Circle, Group, Path } from "@shopify/react-native-skia";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { ChartPoint } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";

export const DonutChart = ({ data }: { data: ChartPoint[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = -90;
  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap}>
        <View style={styles.webDonut}>
          <Text style={styles.webDonutText}>{Math.round((data[0]?.value || 0) / total * 100)}%</Text>
        </View>
        <Legend data={data} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Canvas style={styles.canvas}>
        <Group>
          <Circle cx={70} cy={70} r={52} color={colors.steel700} style="stroke" strokeWidth={18} />
          {data.map((item) => {
            const sweep = (item.value / total) * 360;
            const path = describeArc(70, 70, 52, cursor, cursor + sweep);
            cursor += sweep;
            return <Path key={item.label} path={path} color={item.color || colors.amber400} style="stroke" strokeWidth={18} />;
          })}
        </Group>
      </Canvas>
      <Legend data={data} />
    </View>
  );
};

const Legend = ({ data }: { data: ChartPoint[] }) => (
  <View style={styles.legend}>
    {data.map((item) => (
      <View key={item.label} style={styles.legendItem}>
        <View style={[styles.dot, { backgroundColor: item.color || colors.amber400 }]} />
        <Text style={styles.legendText}>{item.label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  canvas: {
    height: 140,
    width: 140,
  },
  legend: {
    flex: 1,
    gap: spacing.xs,
  },
  webDonut: {
    alignItems: "center",
    borderColor: colors.amber400,
    borderRadius: 52,
    borderWidth: 10,
    height: 104,
    justifyContent: "center",
    width: 104,
  },
  webDonutText: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 18,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legendText: {
    color: colors.steel300,
    fontFamily: typography.body,
    fontSize: 12,
  },
});

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(radians), y: cy + r * Math.sin(radians) };
};

const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};
