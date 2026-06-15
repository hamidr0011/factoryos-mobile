import type { ModuleDefinition } from "../types";

export const colors = {
  steel950: "#F3F5F1",
  steel900: "#FFFFFF",
  steel800: "#E8EEE8",
  steel700: "#D3DDD4",
  steel500: "#727F77",
  steel300: "#4D5B52",
  steel100: "#16211A",
  amber400: "#4E6657",
  amber300: "#6F8475",
  production: "#536B78",
  inventory: "#627C63",
  quality: "#766D7A",
  hr: "#82725D",
  maintenance: "#A0615E",
  finance: "#587A7E",
  red: "#A0615E",
  emerald: "#627C63",
  cyan: "#587A7E",
  blue: "#536B78",
  violet: "#766D7A",
  orange: "#82725D",
};

export const typography = {
  display: "SpaceGrotesk_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  mono: "JetBrainsMono_400Regular",
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  cell: 4,
  card: 8,
  modal: 16,
  sheet: 24,
};

export const modules: ModuleDefinition[] = [
  { id: "production", label: "Production", icon: "factory", color: colors.production, screen: "Production" },
  { id: "inventory", label: "Inventory", icon: "package", color: colors.inventory, screen: "Inventory" },
  { id: "quality", label: "Quality", icon: "shield-check", color: colors.quality, screen: "Quality" },
  { id: "hr", label: "HR & People", icon: "users", color: colors.hr, screen: "HR" },
  { id: "maintenance", label: "Maintenance", icon: "wrench", color: colors.maintenance, screen: "Maintenance" },
  { id: "finance", label: "Finance", icon: "trending-up", color: colors.finance, screen: "Finance" },
];
