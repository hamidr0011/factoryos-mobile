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
  if (id === "production") return <Factory color={color} size={size} strokeWidth={1.8} />;
  if (id === "inventory") return <Package color={color} size={size} strokeWidth={1.8} />;
  if (id === "quality") return <ShieldCheck color={color} size={size} strokeWidth={1.8} />;
  if (id === "hr") return <Users color={color} size={size} strokeWidth={1.8} />;
  if (id === "maintenance") return <Wrench color={color} size={size} strokeWidth={1.8} />;
  if (id === "finance") return <Coins color={color} size={size} strokeWidth={1.8} />;
  return <Package color={color} size={size} strokeWidth={1.8} />;
};

export const ModuleIllustration = ({ id, color = colors.amber400, size = 64 }: ArtworkProps) => {
  const Icon = id === "production" ? Factory
    : id === "inventory" ? Package
    : id === "quality" ? ShieldCheck
    : id === "hr" ? Users
    : id === "maintenance" ? Wrench
    : id === "finance" ? Coins
    : Package;

  return (
    <View style={styles.illustrationWrapper}>
      <Icon color={color} size={size} strokeWidth={1.5} />
    </View>
  );
};

const styles = StyleSheet.create({
  illustrationWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.steel800, // One UI secondary gray-blue container background
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});
