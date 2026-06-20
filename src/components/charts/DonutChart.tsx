import { Canvas, Circle, Group, Path } from "@shopify/react-native-skia";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { ChartPoint } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";

export const DonutChart = ({ data, compact = false, valueLabel }: { data: ChartPoint[]; compact?: boolean; valueLabel?: string }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const percent = Math.round(((data[0]?.value || 0) / total) * 100);
  const displayValue = valueLabel || `${percent}%`;
  const chartSize = compact ? 96 : 140;
  const center = chartSize / 2;
  const radius = compact ? 34 : 52;
  const strokeWidth = compact ? 12 : 18;
  let cursor = -90;
  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap}>
        <View style={[styles.webDonut, compact && styles.webDonutCompact, { borderColor: data[0]?.color || colors.amber400 }]}>
          <Text style={styles.webDonutText}>{displayValue}</Text>
        </View>
        {compact ? null : <Legend data={data} />}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={{ height: chartSize, width: chartSize }}>
        <Canvas style={{ height: chartSize, width: chartSize }}>
          <Group>
            <Circle cx={center} cy={center} r={radius} color={colors.steel700} style="stroke" strokeWidth={strokeWidth} />
            {data.map((item) => {
              const sweep = (item.value / total) * 360;
              const path = describeArc(center, center, radius, cursor, cursor + sweep);
              cursor += sweep;
              return <Path key={item.label} path={path} color={item.color || colors.amber400} style="stroke" strokeWidth={strokeWidth} />;
            })}
          </Group>
        </Canvas>
        <View style={styles.centerLabel}>
          <Text style={styles.webDonutText}>{displayValue}</Text>
        </View>
      </View>
      {compact ? null : <Legend data={data} />}
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
  centerLabel: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  legend: {
    flex: 1,
    gap: spacing.xs,
  },
  webDonut: {
    alignItems: "center",
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
  webDonutCompact: {
    borderRadius: 42,
    borderWidth: 9,
    height: 84,
    width: 84,
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
