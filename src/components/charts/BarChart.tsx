import { Platform, StyleSheet, Text, View } from "react-native";
import { Bar, CartesianChart } from "victory-native";
import type { ChartPoint } from "../../types";
import { colors, typography } from "../../utils/constants";

type VictoryPoint = { label: string; value: number; [key: string]: string | number | undefined };

export const BarChart = ({ data, color = colors.amber400 }: { data: ChartPoint[]; color?: string }) => {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  if (Platform.OS === "web") {
    return (
      <View style={styles.webChart}>
        {data.map((point) => (
          <View key={point.label} style={styles.webColumn}>
            <View style={styles.webBarTrack}>
              <View style={[styles.webBar, { height: `${Math.max(12, (point.value / maxValue) * 100)}%`, backgroundColor: color }]} />
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
      domainPadding={{ left: 18, right: 18, top: 24 }}
    >
      {({ points, chartBounds }) => <Bar points={points.value} chartBounds={chartBounds} color={color} roundedCorners={{ topLeft: 4, topRight: 4 }} />}
    </CartesianChart>
  </View>;
};

const styles = StyleSheet.create({
  chart: {
    height: 190,
    width: "100%",
  },
  webChart: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 8,
    height: 190,
    overflow: "hidden",
  },
  webColumn: {
    flex: 1,
    minWidth: 0,
  },
  webBarTrack: {
    flex: 1,
    justifyContent: "flex-end",
  },
  webBar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
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
