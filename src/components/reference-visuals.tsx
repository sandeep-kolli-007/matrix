import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export function MountainBackdrop({ height = 190 }: { height?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 26 }]}>
      <Svg width="100%" height={height} viewBox="0 0 420 190" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0D3462" />
            <Stop offset="0.5" stopColor="#123756" />
            <Stop offset="1" stopColor="#09111D" />
          </LinearGradient>
          <LinearGradient id="sunset" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#6E8FFF" stopOpacity="0" />
            <Stop offset="0.7" stopColor="#FF8A62" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#FFBD5E" stopOpacity="0.9" />
          </LinearGradient>
        </Defs>
        <Path d="M0 0H420V190H0Z" fill="url(#sky)" />
        <Circle cx="335" cy="54" r="34" fill="url(#sunset)" opacity="0.75" />
        <Path d="M0 154 L62 112 L105 136 L158 74 L211 129 L260 93 L305 132 L350 89 L420 140 L420 190 L0 190Z" fill="#102438" />
        <Path d="M78 134 L159 74 L211 129 L168 112 L146 130 L119 120 Z" fill="#2B5067" opacity="0.85" />
        <Path d="M305 132 L350 89 L420 140 L420 190 L338 162 Z" fill="#203E54" />
        <Path d="M0 168 C70 150, 115 176, 182 161 C252 145, 322 174, 420 151 L420 190 L0 190Z" fill="#07101A" opacity="0.9" />
      </Svg>
    </View>
  );
}

export function ProgressRing({
  value,
  color,
  label,
  icon,
  size = 66,
  textColor = '#F6F8FC',
  mutedColor = '#91A0B7',
}: {
  value: number;
  color: string;
  label: string;
  icon: React.ReactNode;
  size?: number;
  textColor?: string;
  mutedColor?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const r = 25;
  const c = 2 * Math.PI * r;
  const dash = c * (clamped / 100);
  return (
    <View style={{ alignItems: 'center', width: size + 14, minWidth: size }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} viewBox="0 0 60 60" style={StyleSheet.absoluteFill}>
          <Circle cx="30" cy="30" r={r} fill="none" stroke="#243146" strokeWidth="5" />
          <Circle
            cx="30" cy="30" r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform="rotate(-90 30 30)"
          />
        </Svg>
        {icon}
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ width: size + 14, textAlign: 'center', color: textColor, fontSize: 10.5, fontWeight: '650' as '600', marginTop: 6 }}>{label}</Text>
      <Text style={{ color: mutedColor, fontSize: 9.5, marginTop: 1 }}>{clamped}%</Text>
    </View>
  );
}

export function BalanceBar({
  label,
  value,
  color,
  icon,
  textColor = '#F6F8FC',
  mutedColor = '#91A0B7',
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  textColor?: string;
  mutedColor?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <View style={b.row}>
      <View style={b.labelWrap}>
        <View style={b.icon}>{icon}</View>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={[b.label, { color: textColor }]}>{label}</Text>
      </View>
      <View style={b.track}>
        <View style={[b.fill, { width: `${clamped}%`, backgroundColor: color }]} />
      </View>
      <Text style={[b.value, { color: mutedColor }]}>{clamped}%</Text>
    </View>
  );
}

const b = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 30 },
  labelWrap: { width: 112, flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 22, alignItems: 'center' },
  label: { flex: 1, fontSize: 11.5, fontWeight: '500' },
  track: { flex: 1, height: 7, borderRadius: 5, backgroundColor: '#223047', overflow: 'hidden' },
  fill: { height: 7, borderRadius: 5 },
  value: { width: 35, textAlign: 'right', fontSize: 10.5, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
