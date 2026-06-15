import { Platform, StyleSheet, Text, View } from "react-native";
import { CartesianChart, Line } from "victory-native";
import type { ChartPoint } from "../../types";
import { colors, typography } from "../../utils/constants";

type VictoryPoint = { label: string; value: number; [key: string]: string | number | undefined };

export const LineChart = ({ data, color = colors.amber400 }: { data: ChartPoint[]; color?: string }) => {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  if (Platform.OS === "web") {
    return (
      <View style={styles.webChart}>
        {data.map((point) => (
          <View key={point.label} style={styles.webColumn}>
            <View style={styles.webPointTrack}>
              <View style={[styles.webPoint, { height: `${Math.max(10, (point.value / maxValue) * 100)}%`, backgroundColor: color }]} />
            </View>
            <Text numberOfLines={1} style={styles.webLabel}>{point.label}</Text>
          </View>
        ))}
      </View>
    );
  }
  return <View style={styles.chart}>
    <CartesianChart<VictoryPoint, "label", "value">
      data={data.map((point) => ({ label: point.label, value: point.value }))}
      xKey="label"
      yKeys={["value"]}
      domainPadding={{ left: 16, right: 16, top: 18, bottom: 18 }}
    >
      {({ points }) => <Line points={points.value} color={color} strokeWidth={3} curveType="natural" />}
    </CartesianChart>
  </View>;
};

const styles = StyleSheet.create({
  chart: {
    height: 180,
    width: "100%",
  },
  webChart: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 8,
    height: 180,
    overflow: "hidden",
  },
  webColumn: {
    flex: 1,
    minWidth: 0,
  },
  webPointTrack: {
    flex: 1,
    justifyContent: "flex-end",
  },
  webPoint: {
    borderRadius: 4,
    opacity: 0.85,
    width: "100%",
  },
  webLabel: {
    color: colors.steel500,
    fontFamily: typography.mono,
    fontSize: 10,
    marginTop: 6,
    textAlign: "center",
  },
});
