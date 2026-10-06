import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Line,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import type { LifeEntity } from '@/data/lifeos-store';

type Palette = {
  bg: string;
  panel: string;
  card: string;
  raised: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  onAccent: string;
  selected: string;
  success: string;
  warning: string;
  danger: string;
};

function useReduceMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

export function MotionReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduced = useReduceMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    progress.value = reduced ? 1 : withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [delay, progress, reduced]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export function LifeOrb({
  score,
  palette,
  size = 150,
  label = 'Life pulse',
}: {
  score: number;
  palette: Palette;
  size?: number;
  label?: string;
}) {
  const reduced = useReduceMotion();
  const rotate = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      rotate.value = 0;
      breathe.value = 0;
      return;
    }
    rotate.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1, false);
    breathe.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [breathe, reduced, rotate]);

  const orbital = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 360}deg` }, { scale: 0.96 + breathe.value * 0.04 }],
  }));
  const core = useAnimatedStyle(() => ({
    transform: [{ scale: 0.985 + breathe.value * 0.025 }],
  }));

  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 52;
  const dash = circumference * (clamped / 100);

  return (
    <View accessibilityLabel={`${label}, ${clamped} percent`} style={[v.orbWrap, { width: size, height: size }]}>
      <Animated.View style={[v.orbitLayer, orbital, { width: size, height: size, borderRadius: size / 2, borderColor: palette.line }]}>
        <View style={[v.satellite, { backgroundColor: palette.accent }]} />
        <View style={[v.satelliteAlt, { backgroundColor: palette.success }]} />
      </Animated.View>
      <Svg width={size} height={size} viewBox="0 0 140 140" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="orbStroke" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.accent} stopOpacity="1" />
            <Stop offset="1" stopColor={palette.success} stopOpacity="0.75" />
          </LinearGradient>
        </Defs>
        <Circle cx="70" cy="70" r="52" fill="none" stroke={palette.line} strokeWidth="7" opacity="0.72" />
        <Circle
          cx="70"
          cy="70"
          r="52"
          fill="none"
          stroke="url(#orbStroke)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 70 70)"
        />
      </Svg>
      <Animated.View style={[v.orbCore, core, { backgroundColor: palette.panel, borderColor: palette.line }]}>
        <Text style={[v.orbScore, { color: palette.text }]}>{clamped}</Text>
        <Text style={[v.orbLabel, { color: palette.muted }]}>PULSE</Text>
      </Animated.View>
    </View>
  );
}

function trendPoints(values: number[], width: number, height: number, maxValue?: number) {
  const max = Math.max(1, maxValue ?? Math.max(...values, 1));
  const ceiling = Math.max(1, max * 1.18);
  return values.map((value, index) => ({
    x: values.length === 1 ? width / 2 : index * (width / (values.length - 1)),
    y: height - 10 - (Math.max(0, value) / ceiling) * (height - 22),
  }));
}

function smoothPath(values: number[], width: number, height: number, maxValue?: number) {
  if (!values.length) return '';
  const points = trendPoints(values, width, height, maxValue);
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index];
    const next = points[index + 1];
    const dx = next.x - current.x;
    // Horizontal cubic controls keep the curve smooth without introducing
    // false peaks/valleys between sparse daily counts.
    const c1x = current.x + dx * 0.36;
    const c2x = next.x - dx * 0.36;
    path += ` C ${c1x.toFixed(2)} ${current.y.toFixed(2)} ${c2x.toFixed(2)} ${next.y.toFixed(2)} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }
  return path;
}

export function Sparkline({
  values,
  palette,
  height = 84,
}: {
  values: number[];
  palette: Palette;
  height?: number;
}) {
  const width = 320;
  const safeValues = values.length ? values : [0, 0];
  const line = smoothPath(safeValues, width, height);
  const area = line ? `${line} L ${width} ${height - 6} L 0 ${height - 6} Z` : '';
  return (
    <View accessibilityLabel={`Activity trend: ${values.join(', ')}`} style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.accent} stopOpacity="0.28" />
            <Stop offset="1" stopColor={palette.accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#sparkFill)" />
        <Path d={line} fill="none" stroke={palette.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export function DistributionBars({
  data,
  palette,
  maxItems = 6,
}: {
  data: Array<{ label: string; value: number }>;
  palette: Palette;
  maxItems?: number;
}) {
  const shown = [...data].sort((a, b) => b.value - a.value).slice(0, maxItems);
  const max = Math.max(1, ...shown.map(item => item.value));
  return (
    <View style={v.barList}>
      {shown.map((item, index) => (
        <MotionReveal key={item.label} delay={index * 45}>
          <View style={v.barRow}>
            <View style={v.barLabelRow}>
              <Text numberOfLines={1} style={[v.barLabel, { color: palette.text }]}>{item.label}</Text>
              <Text style={[v.barValue, { color: palette.muted }]}>{item.value}</Text>
            </View>
            <View style={[v.barTrack, { backgroundColor: palette.raised }]}>
              <View style={[v.barFill, { width: `${Math.max(4, item.value / max * 100)}%`, backgroundColor: index === 0 ? palette.accent : palette.selected }]} />
            </View>
          </View>
        </MotionReveal>
      ))}
    </View>
  );
}

const graphPositions = [
  [70, 18],
  [116, 42],
  [116, 96],
  [70, 122],
  [24, 96],
  [24, 42],
] as const;

export function LifeGraph({
  groups,
  palette,
  size = 260,
}: {
  groups: Array<{ label: string; value: number }>;
  palette: Palette;
  size?: number;
}) {
  const reduced = useReduceMotion();
  const drift = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      drift.value = 0;
      return;
    }
    drift.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [drift, reduced]);

  const glow = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${drift.value * 6 - 3}deg` },
      { scale: 0.985 + drift.value * 0.025 },
    ],
  }));

  const shown = groups.slice(0, 6);
  const max = Math.max(1, ...shown.map(item => item.value));
  const center = { x: 70, y: 70 };

  return (
    <View style={[v.graphWrap, { width: size, height: size }]}>
      <Animated.View style={[v.graphHalo, glow, { width: size * 0.84, height: size * 0.84, borderRadius: size, borderColor: palette.line }]} />
      <Svg width={size} height={size} viewBox="0 0 140 140">
        <Defs>
          <LinearGradient id="graphEdge" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.accent} stopOpacity="0.58" />
            <Stop offset="1" stopColor={palette.success} stopOpacity="0.18" />
          </LinearGradient>
        </Defs>
        <G>
          {shown.map((item, index) => {
            const [x, y] = graphPositions[index];
            return <Line key={`edge-${item.label}`} x1={center.x} y1={center.y} x2={x} y2={y} stroke="url(#graphEdge)" strokeWidth="1.2" />;
          })}
          <Circle cx={center.x} cy={center.y} r="14" fill={palette.selected} stroke={palette.accent} strokeWidth="1.5" />
          <SvgText x={center.x} y={center.y + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill={palette.text}>MATRIX</SvgText>
          {shown.map((item, index) => {
            const [x, y] = graphPositions[index];
            const radius = 6 + item.value / max * 6;
            return (
              <G key={item.label}>
                <Circle cx={x} cy={y} r={radius + 3} fill={palette.accent} opacity="0.08" />
                <Circle cx={x} cy={y} r={radius} fill={palette.panel} stroke={palette.accent} strokeWidth="1.4" />
                <SvgText x={x} y={y + 2.5} textAnchor="middle" fontSize="6.5" fontWeight="700" fill={palette.text}>{item.value}</SvgText>
                <SvgText x={x} y={y + radius + 10} textAnchor="middle" fontSize="5.5" fill={palette.muted}>{item.label.slice(0, 10)}</SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

export function visualMetrics(items: LifeEntity[]) {
  const active = items.filter(item => !item.archivedAt);
  const tasks = active.filter(item => item.kind === 'task');
  const done = tasks.filter(item => item.metadata.completed === true).length;
  const taskScore = tasks.length ? Math.round(done / tasks.length * 100) : 50;

  const now = new Date();
  const daily = Array.from({ length: 7 }, (_, index) => {
    const target = new Date(now);
    target.setDate(now.getDate() - (6 - index));
    const key = [target.getFullYear(), String(target.getMonth() + 1).padStart(2, '0'), String(target.getDate()).padStart(2, '0')].join('-');
    return active.filter(item => item.createdAt.slice(0, 10) === key).length;
  });

  const groupsMap = active.reduce<Record<string, number>>((acc, item) => {
    const group = String(item.metadata.group ?? 'Other');
    acc[group] = (acc[group] ?? 0) + 1;
    return acc;
  }, {});

  const groups = Object.entries(groupsMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const recency = active.filter(item => {
    const age = Date.now() - Date.parse(item.updatedAt);
    return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const activityScore = Math.min(100, Math.round((recency / Math.max(1, active.length)) * 120));
  const coverageScore = Math.min(100, groups.length * 14);
  const pulse = Math.round(taskScore * 0.45 + activityScore * 0.35 + coverageScore * 0.2);

  return { pulse, daily, groups, done, taskCount: tasks.length, total: active.length };
}



export type TrendSeries = {
  label: string;
  color: string;
  values: number[];
};

function scaledPath(values: number[], width: number, height: number, maxValue: number) {
  return smoothPath(values, width, height, maxValue);
}

export function MultiTrendChart({
  series,
  palette,
  height = 176,
}: {
  series: TrendSeries[];
  palette: Palette;
  height?: number;
}) {
  const width = 420;
  const maxValue = Math.max(1, ...series.flatMap(item => item.values));
  const horizontal = [0.25, 0.5, 0.75];

  return (
    <View accessibilityLabel={`Trend chart with ${series.length} series`} style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {horizontal.map((ratio, index) => (
          <Line
            key={index}
            x1="0"
            y1={height * ratio}
            x2={width}
            y2={height * ratio}
            stroke={palette.line}
            strokeWidth="1"
            opacity="0.55"
          />
        ))}
        {series.map(item => (
          <Path
            key={item.label}
            d={scaledPath(item.values, width, height, maxValue)}
            fill="none"
            stroke={item.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
}

export function DonutDistribution({
  data,
  palette,
  size = 150,
  strokeWidth = 16,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  palette: Palette;
  size?: number;
  strokeWidth?: number;
}) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r={radius} fill="none" stroke={palette.raised} strokeWidth={strokeWidth} />
        {data.map(item => {
          const fraction = item.value / total;
          const dash = circumference * fraction;
          const node = (
            <Circle
              key={item.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, dash - 2)} ${circumference}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
          offset += dash;
          return node;
        })}
      </Svg>
      <View style={v.donutCenter}>
        <Text style={[v.donutValue, { color: palette.text }]}>{total}</Text>
        <Text style={[v.donutLabel, { color: palette.muted }]}>records</Text>
      </View>
    </View>
  );
}

export function MicroBars({
  values,
  color,
  trackColor,
  height = 30,
}: {
  values: number[];
  color: string;
  trackColor: string;
  height?: number;
}) {
  const max = Math.max(1, ...values);
  return (
    <View style={[v.microBars, { height }]}>
      {values.map((value, index) => (
        <View
          key={index}
          style={[
            v.microBar,
            {
              backgroundColor: value ? color : trackColor,
              height: Math.max(4, value / max * height),
              opacity: value ? 0.88 : 0.45,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function AmbientMatrixAnimation({
  palette,
  height = 112,
}: {
  palette: Palette;
  height?: number;
}) {
  const reduced = useReduceMotion();
  const phase = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      phase.value = 0;
      return;
    }
    phase.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [phase, reduced]);

  const a = useAnimatedStyle(() => ({
    transform: [
      { translateX: phase.value * 22 - 11 },
      { translateY: phase.value * -8 + 4 },
      { scale: 0.94 + phase.value * 0.12 },
    ],
    opacity: 0.55 + phase.value * 0.25,
  }));
  const b = useAnimatedStyle(() => ({
    transform: [
      { translateX: phase.value * -18 + 9 },
      { translateY: phase.value * 10 - 5 },
      { scale: 1.06 - phase.value * 0.08 },
    ],
    opacity: 0.4 + (1 - phase.value) * 0.28,
  }));
  const cStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${phase.value * 10 - 5}deg` }],
  }));

  return (
    <View style={[v.ambient, { height }]}>
      <Animated.View style={[v.ambientBlob, a, { width: 94, height: 94, borderRadius: 47, backgroundColor: palette.selected }]} />
      <Animated.View style={[v.ambientBlob, b, { width: 74, height: 74, borderRadius: 37, backgroundColor: palette.raised, right: 18, top: 18 }]} />
      <Animated.View style={[v.ambientRing, cStyle, { borderColor: palette.accent }]}>
        <View style={[v.ambientDot, { backgroundColor: palette.success }]} />
      </Animated.View>
    </View>
  );
}

export function entityDashboard(items: LifeEntity[], days = 14) {
  const active = items.filter(item => !item.archivedAt);
  const now = new Date();
  const dateKeys = Array.from({ length: days }, (_, index) => {
    const target = new Date(now);
    target.setDate(now.getDate() - (days - 1 - index));
    return [
      target.getFullYear(),
      String(target.getMonth() + 1).padStart(2, '0'),
      String(target.getDate()).padStart(2, '0'),
    ].join('-');
  });

  const groupsMap = new Map<string, LifeEntity[]>();
  const typesMap = new Map<string, LifeEntity[]>();

  for (const item of active) {
    const group = String(item.metadata.group ?? 'Other');
    const type = String(item.metadata.entityType ?? item.kind);
    groupsMap.set(group, [...(groupsMap.get(group) ?? []), item]);
    typesMap.set(type, [...(typesMap.get(type) ?? []), item]);
  }

  const groupTrends = [...groupsMap.entries()]
    .map(([label, records]) => ({
      label,
      values: dateKeys.map(key => records.filter(item => item.createdAt.slice(0, 10) === key).length),
      total: records.length,
    }))
    .sort((a, b) => b.total - a.total);

  const entityTrends = [...typesMap.entries()]
    .map(([label, records]) => ({
      label,
      values: dateKeys.slice(-7).map(key => records.filter(item => item.createdAt.slice(0, 10) === key).length),
      total: records.length,
      updatedAt: records.reduce((latest, item) => latest > item.updatedAt ? latest : item.updatedAt, ''),
      group: String(records[0]?.metadata.group ?? 'Other'),
    }))
    .sort((a, b) => b.total - a.total || b.updatedAt.localeCompare(a.updatedAt));

  return { dateKeys, groupTrends, entityTrends };
}


export function SpatialStage({
  children,
  intensity = 1,
}: {
  children: React.ReactNode;
  intensity?: number;
}) {
  const reduced = useReduceMotion();
  const tilt = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      tilt.value = 0;
      return;
    }
    tilt.value = withRepeat(withTiming(1, { duration: 6200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, tilt]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${(tilt.value - 0.5) * 2.2 * intensity}deg` },
      { rotateY: `${(0.5 - tilt.value) * 3.2 * intensity}deg` },
      { translateY: (tilt.value - 0.5) * -3 * intensity },
    ],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

const v = StyleSheet.create({
  orbWrap: { alignItems: 'center', justifyContent: 'center' },
  orbitLayer: { position: 'absolute', borderWidth: 1 },
  satellite: { width: 9, height: 9, borderRadius: 5, position: 'absolute', top: 8, left: '48%' },
  satelliteAlt: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 20, right: 13 },
  orbCore: { width: 78, height: 78, borderRadius: 39, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbScore: { fontSize: 27, fontWeight: '700', letterSpacing: -0.8 },
  orbLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.3, marginTop: 1 },
  barList: { gap: 14 },
  barRow: { gap: 7 },
  barLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  barLabel: { flex: 1, fontSize: 12.5, fontWeight: '500' },
  barValue: { fontSize: 11.5, fontVariant: ['tabular-nums'] },
  barTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4 },
  graphWrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  graphHalo: { position: 'absolute', borderWidth: 1 },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutValue: { fontSize: 24, fontWeight: '700', letterSpacing: -0.7 },
  donutLabel: { fontSize: 9.5, marginTop: 1 },
  microBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  microBar: { flex: 1, minWidth: 3, borderRadius: 3 },
  ambient: { position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  ambientBlob: { position: 'absolute', left: 22, top: 8 },
  ambientRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ambientDot: { width: 10, height: 10, borderRadius: 5, position: 'absolute', top: 2 },
});
