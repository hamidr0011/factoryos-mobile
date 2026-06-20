import { Factory, Package, ShieldCheck, Users, Wrench, Coins } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import type { ModuleId } from "../../types";
import { colors } from "../../utils/constants";

type ArtworkProps = {
  id: ModuleId;
  color?: string;
  size?: number;
};

export const ModuleIconMark = ({ id, color = colors.amber400, size = 24 }: ArtworkProps) => {
  if (id === "production") return <Factory color={color} size={size} strokeWidth={1.7} />;
  if (id === "inventory") return <Package color={color} size={size} strokeWidth={1.7} />;
  if (id === "quality") return <ShieldCheck color={color} size={size} strokeWidth={1.7} />;
  if (id === "hr") return <Users color={color} size={size} strokeWidth={1.7} />;
  if (id === "maintenance") return <Wrench color={color} size={size} strokeWidth={1.7} />;
  if (id === "finance") return <Coins color={color} size={size} strokeWidth={1.7} />;
  return <Package color={color} size={size} strokeWidth={1.7} />;
};

export const ModuleIllustration = ({ id, color = colors.amber400, size = 52 }: ArtworkProps) => {
  const Icon = id === "production" ? Factory
    : id === "inventory" ? Package
    : id === "quality" ? ShieldCheck
    : id === "hr" ? Users
    : id === "maintenance" ? Wrench
    : id === "finance" ? Coins
    : Package;

  return (
    <View style={[styles.illustrationWrapper, { backgroundColor: `${color}14`, borderColor: `${color}24` }]}>
      <Icon color={color} size={size} strokeWidth={1.65} />
    </View>
  );
};

const styles = StyleSheet.create({
  illustrationWrapper: {
    alignItems: "center",
    borderRadius: 30,
    borderWidth: 1,
    height: 96,
    justifyContent: "center",
    marginBottom: 8,
    width: 96,
  },
});
