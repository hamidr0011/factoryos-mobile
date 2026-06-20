import { Canvas, Path } from "@shopify/react-native-skia";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../utils/constants";
import { clamp } from "../../utils/formatters";

export const GaugeChart = ({ value, color = colors.amber400, label }: { value: number; color?: string; label?: string }) => {
  const normalized = clamp(value) / 100;
  if (Platform.OS === "web") {
    return (
      <View style={styles.webWrap}>
        <Text style={styles.value}>{Math.round(value)}%</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.webGaugeTrack}>
          <View style={[styles.webGaugeFill, { width: `${normalized * 100}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Canvas style={styles.canvas}>
        <Path path={describeArc(70, 70, 52, -220, 40)} color={colors.steel700} style="stroke" strokeWidth={12} strokeCap="round" />
        <Path path={describeArc(70, 70, 52, -220, -220 + normalized * 260)} color={color} style="stroke" strokeWidth={12} strokeCap="round" />
      </Canvas>
      <View style={styles.center}>
        <Text style={styles.value}>{Math.round(value)}%</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    height: 140,
    justifyContent: "center",
    width: 140,
  },
  canvas: {
    height: 140,
    width: 140,
  },
  webWrap: {
    alignItems: "center",
    height: 104,
    justifyContent: "center",
    width: 124,
  },
  center: {
    alignItems: "center",
    position: "absolute",
    top: 48,
  },
  webGaugeTrack: {
    backgroundColor: colors.steel700,
    borderRadius: 6,
    height: 12,
    marginTop: 8,
    overflow: "hidden",
    width: 112,
  },
  webGaugeFill: {
    height: "100%",
  },
  value: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 22,
  },
  label: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 10,
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
