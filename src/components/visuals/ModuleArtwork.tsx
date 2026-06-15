import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from "react-native-svg";
import type { ModuleId } from "../../types";
import { colors } from "../../utils/constants";

type ArtworkProps = {
  id: ModuleId;
  color?: string;
  size?: number;
  muted?: string;
};

const fallbackMuted = colors.steel500;

export const ModuleIconMark = ({ id, color = colors.amber400, muted = fallbackMuted, size = 36 }: ArtworkProps) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id={`mark-${id}`} x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor={color} stopOpacity="0.95" />
        <Stop offset="1" stopColor={color} stopOpacity="0.48" />
      </LinearGradient>
    </Defs>
    <Rect x="7" y="7" width="50" height="50" rx="12" stroke={muted} strokeOpacity="0.28" strokeWidth="1.4" />
    {id === "production" ? <ProductionMark color={color} muted={muted} /> : null}
    {id === "inventory" ? <InventoryMark color={color} muted={muted} /> : null}
    {id === "quality" ? <QualityMark color={color} muted={muted} /> : null}
    {id === "hr" ? <HrMark color={color} muted={muted} /> : null}
    {id === "maintenance" ? <MaintenanceMark color={color} muted={muted} /> : null}
    {id === "finance" ? <FinanceMark color={color} muted={muted} /> : null}
  </Svg>
);

export const ModuleIllustration = ({ id, color = colors.amber400, muted = fallbackMuted, size = 172 }: ArtworkProps) => (
  <Svg width={size} height={size * 0.72} viewBox="0 0 220 158" fill="none">
    <Defs>
      <LinearGradient id={`panel-${id}`} x1="24" y1="18" x2="194" y2="138" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor={color} stopOpacity="0.2" />
        <Stop offset="1" stopColor={color} stopOpacity="0.03" />
      </LinearGradient>
    </Defs>
    <Rect x="15" y="13" width="190" height="128" rx="18" fill={`url(#panel-${id})`} stroke={colors.steel700} strokeWidth="1.4" />
    <Line x1="34" y1="122" x2="184" y2="122" stroke={muted} strokeOpacity="0.28" strokeWidth="2" />
    <G transform="translate(34 26) scale(2.35)">
      {id === "production" ? <ProductionMark color={color} muted={muted} /> : null}
      {id === "inventory" ? <InventoryMark color={color} muted={muted} /> : null}
      {id === "quality" ? <QualityMark color={color} muted={muted} /> : null}
      {id === "hr" ? <HrMark color={color} muted={muted} /> : null}
      {id === "maintenance" ? <MaintenanceMark color={color} muted={muted} /> : null}
      {id === "finance" ? <FinanceMark color={color} muted={muted} /> : null}
    </G>
  </Svg>
);

const ProductionMark = ({ color, muted }: { color: string; muted: string }) => (
  <G strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 42H50" stroke={muted} strokeOpacity="0.42" strokeWidth="2" />
    <Path d="M17 42V28L25 21V29L34 21V29L43 22V42" stroke={color} strokeWidth="2.4" />
    <Rect x="19" y="33" width="6" height="5" rx="1" stroke={muted} strokeWidth="1.6" />
    <Rect x="30" y="33" width="6" height="5" rx="1" stroke={muted} strokeWidth="1.6" />
    <Rect x="41" y="33" width="5" height="5" rx="1" stroke={muted} strokeWidth="1.6" />
    <Path d="M48 42V18H54V42" stroke={color} strokeWidth="2.4" />
    <Circle cx="22" cy="48" r="2.2" stroke={muted} strokeWidth="1.6" />
    <Circle cx="32" cy="48" r="2.2" stroke={muted} strokeWidth="1.6" />
    <Circle cx="42" cy="48" r="2.2" stroke={muted} strokeWidth="1.6" />
  </G>
);

const InventoryMark = ({ color, muted }: { color: string; muted: string }) => (
  <G strokeLinecap="round" strokeLinejoin="round">
    <Rect x="15" y="18" width="34" height="30" rx="3" stroke={color} strokeWidth="2.4" />
    <Path d="M15 29H49M15 39H49M26 18V48M38 18V48" stroke={muted} strokeOpacity="0.48" strokeWidth="1.7" />
    <Rect x="20" y="32" width="8" height="7" rx="1.4" stroke={color} strokeWidth="1.8" />
    <Rect x="37" y="22" width="7" height="7" rx="1.2" stroke={color} strokeWidth="1.8" />
    <Path d="M19 53H46" stroke={muted} strokeOpacity="0.45" strokeWidth="2" />
  </G>
);

const QualityMark = ({ color, muted }: { color: string; muted: string }) => (
  <G strokeLinecap="round" strokeLinejoin="round">
    <Path d="M32 13L48 20V31C48 42 41 50 32 54C23 50 16 42 16 31V20L32 13Z" stroke={color} strokeWidth="2.4" />
    <Path d="M24 33L30 39L42 26" stroke={color} strokeWidth="3" />
    <Path d="M24 22H40M22 46H42" stroke={muted} strokeOpacity="0.45" strokeWidth="1.7" />
    <Circle cx="44" cy="42" r="4" stroke={muted} strokeWidth="1.6" />
  </G>
);

const HrMark = ({ color, muted }: { color: string; muted: string }) => (
  <G strokeLinecap="round" strokeLinejoin="round">
    <Rect x="13" y="17" width="38" height="32" rx="5" stroke={color} strokeWidth="2.4" />
    <Path d="M22 17V12M42 17V12M13 27H51" stroke={muted} strokeOpacity="0.46" strokeWidth="1.8" />
    <Circle cx="24" cy="37" r="4" stroke={color} strokeWidth="2" />
    <Path d="M17 47C18.4 41.5 29.6 41.5 31 47" stroke={color} strokeWidth="2" />
    <Path d="M36 34H46M36 40H44M36 46H47" stroke={muted} strokeOpacity="0.55" strokeWidth="1.8" />
  </G>
);

const MaintenanceMark = ({ color, muted }: { color: string; muted: string }) => (
  <G strokeLinecap="round" strokeLinejoin="round">
    <Path d="M42 16C38.4 14.8 34.2 15.6 31.3 18.6C28.2 21.7 27.6 26.2 29.4 29.9L16.4 42.9C14.8 44.5 14.8 47.1 16.4 48.7C18 50.3 20.6 50.3 22.2 48.7L35.2 35.7C38.9 37.5 43.4 36.9 46.5 33.8C49.5 30.8 50.3 26.7 49.1 23.1L42.4 29.8L36.1 23.5L42 16Z" stroke={color} strokeWidth="2.4" />
    <Circle cx="20" cy="45" r="2.4" stroke={muted} strokeWidth="1.7" />
    <Path d="M42 44L49 51M49 44L42 51" stroke={muted} strokeOpacity="0.55" strokeWidth="1.8" />
  </G>
);

const FinanceMark = ({ color, muted }: { color: string; muted: string }) => (
  <G strokeLinecap="round" strokeLinejoin="round">
    <Rect x="16" y="14" width="32" height="40" rx="4" stroke={color} strokeWidth="2.4" />
    <Path d="M24 25H40M24 32H36" stroke={muted} strokeOpacity="0.52" strokeWidth="1.8" />
    <Path d="M24 46V39M32 46V35M40 46V29" stroke={color} strokeWidth="2.4" />
    <Path d="M22 46H43" stroke={muted} strokeOpacity="0.46" strokeWidth="1.8" />
    <Polygon points="48,18 53,23 48,28" stroke={muted} strokeOpacity="0.5" strokeWidth="1.5" />
  </G>
);
