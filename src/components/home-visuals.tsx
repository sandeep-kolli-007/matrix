import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { SymbolView } from 'expo-symbols';

import { EntityIcon } from '@/components/entity-icon';
import { MatrixLottie } from '@/components/matrix-lottie';
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
  selected: string;
  success: string;
  warning: string;
  danger: string;
  violet: string;
  cyan: string;
  rose: string;
};

export type VisualArea = {
  label: string;
  total: number;
  color: string;
  soft: string;
  values: number[];
};

function useReduceMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

export function LifeConstellation({
  areas,
  palette,
  total,
  onPressArea,
}: {
  areas: VisualArea[];
  palette: Palette;
  total: number;
  onPressArea?: (label: string) => void;
}) {
  const reduced = useReduceMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = reduced
      ? 0
      : withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse, reduced]);

  const positions = [
    { left: '5%', top: 24 },
    { right: '5%', top: 42 },
    { left: '9%', bottom: 18 },
    { right: '8%', bottom: 14 },
    { left: '37%', top: 4 },
    { left: '40%', bottom: 2 },
  ] as const;

  return (
    <View style={[c.constellation, { backgroundColor: palette.panel }]}>
      <View style={[c.constellationGlow, { backgroundColor: palette.selected }]} />
      <View style={c.center}>
        <MatrixLottie size={132} />
        <View style={c.centerCopy}>
          <Text style={[c.centerValue, { color: palette.text }]}>{total}</Text>
          <Text style={[c.centerLabel, { color: palette.muted }]}>records</Text>
        </View>
      </View>

      {areas.slice(0, 6).map((area, index) => (
        <FloatingNode
          key={area.label}
          area={area}
          position={positions[index]}
          delay={index * 180}
          reduced={reduced}
          palette={palette}
          onPress={() => onPressArea?.(area.label)}
        />
      ))}

      {Array.from({ length: 12 }, (_, index) => (
        <View
          key={index}
          style={[
            c.star,
            {
              backgroundColor: areas[index % Math.max(1, areas.length)]?.color ?? palette.accent,
              left: `${8 + ((index * 19) % 84)}%`,
              top: `${12 + ((index * 27) % 74)}%`,
              opacity: 0.16 + (index % 4) * 0.09,
            },
          ]}
        />
      ))}
    </View>
  );
}

function FloatingNode({
  area,
  position,
  delay,
  reduced,
  palette,
  onPress,
}: {
  area: VisualArea;
  position: object;
  delay: number;
  reduced: boolean;
  palette: Palette;
  onPress?: () => void;
}) {
  const motion = useSharedValue(0);
  useEffect(() => {
    motion.value = reduced
      ? 0
      : withDelay(delay, withRepeat(withTiming(1, { duration: 2800 + delay, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [delay, motion, reduced]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: (motion.value - 0.5) * 8 },
      { scale: 0.985 + motion.value * 0.025 },
    ],
  }));

  return (
    <Animated.View style={[c.floatingNode, position, style]}>
      <Pressable onPress={onPress} style={[c.nodeButton, { borderColor: area.color, backgroundColor: palette.card }]}>
        <View style={[c.nodeIcon, { backgroundColor: area.soft }]}>
          <View style={[c.nodeDot, { backgroundColor: area.color }]} />
        </View>
        <Text numberOfLines={1} style={[c.nodeLabel, { color: palette.text }]}>{area.label}</Text>
        <Text style={[c.nodeCount, { color: area.color }]}>{area.total}</Text>
      </Pressable>
    </Animated.View>
  );
}

function streamPath(values: number[], lower: number[], width: number, height: number, maxStack: number) {
  if (!values.length) return '';
  const top = values.map((value, index) => {
    const x = index * (width / Math.max(1, values.length - 1));
    const y = height - ((lower[index] + value) / Math.max(1, maxStack)) * height;
    return { x, y };
  });
  const bottom = lower.map((value, index) => {
    const x = index * (width / Math.max(1, lower.length - 1));
    const y = height - (value / Math.max(1, maxStack)) * height;
    return { x, y };
  });

  let d = `M ${top[0].x.toFixed(1)} ${top[0].y.toFixed(1)}`;
  for (let i = 1; i < top.length; i++) {
    const prev = top[i - 1];
    const next = top[i];
    const mid = (prev.x + next.x) / 2;
    d += ` C ${mid.toFixed(1)} ${prev.y.toFixed(1)} ${mid.toFixed(1)} ${next.y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  for (let i = bottom.length - 1; i >= 0; i--) {
    const point = bottom[i];
    if (i === bottom.length - 1) {
      d += ` L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    } else {
      const prev = bottom[i + 1];
      const mid = (prev.x + point.x) / 2;
      d += ` C ${mid.toFixed(1)} ${prev.y.toFixed(1)} ${mid.toFixed(1)} ${point.y.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    }
  }
  return d + ' Z';
}

export function LifeStream({
  areas,
  palette,
  height = 188,
}: {
  areas: VisualArea[];
  palette: Palette;
  height?: number;
}) {
  const width = 420;
  const shown = areas.slice(0, 6);
  const length = Math.max(1, ...shown.map(area => area.values.length));
  const normalized = shown.map(area => ({
    ...area,
    values: Array.from({ length }, (_, i) => area.values[i] ?? 0),
  }));

  const stacks = Array.from({ length }, (_, index) =>
    normalized.reduce((sum, area) => sum + (area.values[index] ?? 0), 0)
  );
  const maxStack = Math.max(1, ...stacks);
  const lower = Array.from({ length }, () => 0);

  return (
    <View style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Defs>
          {normalized.map((area, index) => (
            <LinearGradient key={area.label} id={`stream-${index}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={area.color} stopOpacity="0.22" />
              <Stop offset="0.5" stopColor={area.color} stopOpacity="0.78" />
              <Stop offset="1" stopColor={area.color} stopOpacity="0.34" />
            </LinearGradient>
          ))}
        </Defs>
        {normalized.map((area, index) => {
          const path = streamPath(area.values, [...lower], width, height - 6, maxStack);
          area.values.forEach((value, i) => { lower[i] += value; });
          return <Path key={area.label} d={path} fill={`url(#stream-${index})`} />;
        })}
      </Svg>
      <View style={c.streamLegend}>
        {normalized.map(area => (
          <View key={area.label} style={c.legendItem}>
            <View style={[c.legendDot, { backgroundColor: area.color }]} />
            <Text style={[c.legendText, { color: palette.muted }]}>{area.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function TodayOrbit({
  items,
  palette,
  onPressItem,
}: {
  items: LifeEntity[];
  palette: Palette;
  onPressItem: (item: LifeEntity) => void;
}) {
  const shown = items.slice(0, 6);
  const reduced = useReduceMotion();
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = reduced ? 0 : withRepeat(withTiming(1, { duration: 18000, easing: Easing.linear }), -1, false);
  }, [reduced, spin]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const spots = [
    { top: 6, left: '40%' },
    { top: 42, right: 6 },
    { bottom: 34, right: 18 },
    { bottom: 4, left: '41%' },
    { bottom: 34, left: 16 },
    { top: 42, left: 6 },
  ] as const;

  return (
    <View style={[c.todayOrbit, { backgroundColor: palette.panel }]}>
      <Animated.View style={[c.orbitRing, { borderColor: palette.line }, ringStyle]}>
        <View style={[c.orbitSatellite, { backgroundColor: palette.accent }]} />
      </Animated.View>

      <View style={[c.orbitCenter, { backgroundColor: palette.selected }]}>
        <Text style={[c.orbitCenterValue, { color: palette.text }]}>{shown.length}</Text>
        <Text style={[c.orbitCenterLabel, { color: palette.muted }]}>today</Text>
      </View>

      {shown.map((item, index) => {
        const type = String(item.metadata.entityType ?? item.kind);
        return (
          <Pressable key={item.id} onPress={() => onPressItem(item)} style={[c.orbitItem, spots[index]]}>
            <View style={[c.orbitItemIcon, { backgroundColor: palette.card, borderColor: palette.line }]}>
              <EntityIcon type={type} color={palette.accent} size={18} />
            </View>
            <Text numberOfLines={1} style={[c.orbitItemText, { color: palette.text }]}>{item.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EntityGalaxy({
  entities,
  palette,
  onPressEntity,
}: {
  entities: Array<{ name: string; group: string; count: number; color: string; soft: string }>;
  palette: Palette;
  onPressEntity: (name: string) => void;
}) {
  const visible = entities.filter(entity => entity.count > 0).slice(0, 18);
  const max = Math.max(1, ...visible.map(entity => entity.count));

  return (
    <View style={c.galaxy}>
      {visible.map((entity, index) => {
        const size = 62 + (entity.count / max) * 30;
        return (
          <AnimatedGalaxyNode
            key={entity.name}
            entity={entity}
            index={index}
            size={size}
            palette={palette}
            onPress={() => onPressEntity(entity.name)}
          />
        );
      })}
    </View>
  );
}

function AnimatedGalaxyNode({
  entity,
  index,
  size,
  palette,
  onPress,
}: {
  entity: { name: string; group: string; count: number; color: string; soft: string };
  index: number;
  size: number;
  palette: Palette;
  onPress: () => void;
}) {
  const reduced = useReduceMotion();
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = reduced
      ? 0
      : withDelay(index * 90, withRepeat(withTiming(1, { duration: 2400 + (index % 5) * 320, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [float, index, reduced]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: (float.value - 0.5) * 8 },
      { scale: 0.985 + float.value * 0.025 },
    ],
  }));

  return (
    <Animated.View style={[c.galaxyCell, style]}>
      <Pressable
        onPress={onPress}
        style={[
          c.galaxyNode,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: entity.color,
            backgroundColor: entity.soft,
          },
        ]}
      >
        <EntityIcon type={entity.name} color={entity.color} size={20} />
        <Text numberOfLines={1} style={[c.galaxyCount, { color: palette.text }]}>{entity.count}</Text>
        <Text numberOfLines={1} style={[c.galaxyName, { color: palette.text }]}>{entity.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ActivityRiver({
  items,
  palette,
  onPressItem,
}: {
  items: LifeEntity[];
  palette: Palette;
  onPressItem: (item: LifeEntity) => void;
}) {
  return (
    <View style={c.river}>
      <View style={[c.riverLine, { backgroundColor: palette.line }]} />
      {items.slice(0, 8).map((item, index) => {
        const type = String(item.metadata.entityType ?? item.kind);
        return (
          <Pressable key={item.id} onPress={() => onPressItem(item)} style={c.riverRow}>
            <View style={[c.riverDot, { backgroundColor: index % 2 ? palette.violet : palette.accent, borderColor: palette.bg }]} />
            <View style={c.riverCopy}>
              <Text numberOfLines={1} style={[c.riverTitle, { color: palette.text }]}>{item.title}</Text>
              <Text numberOfLines={1} style={[c.riverMeta, { color: palette.muted }]}>
                {type} · {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            <SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} size={13} tintColor={palette.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const c = StyleSheet.create({
  constellation: { minHeight: 330, borderRadius: 32, overflow: 'hidden', position: 'relative' },
  constellationGlow: { position: 'absolute', width: 230, height: 230, borderRadius: 115, left: '50%', top: '50%', marginLeft: -115, marginTop: -115, opacity: 0.26 },
  center: { position: 'absolute', left: '50%', top: '50%', width: 150, height: 150, marginLeft: -75, marginTop: -75, alignItems: 'center', justifyContent: 'center' },
  centerCopy: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerValue: { fontSize: 27, fontWeight: '700', letterSpacing: -0.8 },
  centerLabel: { fontSize: 9.5, marginTop: 1 },
  floatingNode: { position: 'absolute' },
  nodeButton: { minWidth: 88, minHeight: 66, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  nodeIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nodeDot: { width: 8, height: 8, borderRadius: 4 },
  nodeLabel: { fontSize: 9.5, fontWeight: '600', marginTop: 5, maxWidth: 76 },
  nodeCount: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  star: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },

  streamLegend: { position: 'absolute', left: 0, right: 0, bottom: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 5, height: 5, borderRadius: 3 },
  legendText: { fontSize: 8.5 },

  todayOrbit: { height: 300, borderRadius: 30, position: 'relative', overflow: 'hidden' },
  orbitRing: { position: 'absolute', width: 194, height: 194, borderRadius: 97, borderWidth: 1, left: '50%', top: '50%', marginLeft: -97, marginTop: -97 },
  orbitSatellite: { width: 8, height: 8, borderRadius: 4, position: 'absolute', left: '50%', top: -4 },
  orbitCenter: { position: 'absolute', width: 86, height: 86, borderRadius: 43, left: '50%', top: '50%', marginLeft: -43, marginTop: -43, alignItems: 'center', justifyContent: 'center' },
  orbitCenterValue: { fontSize: 25, fontWeight: '700' },
  orbitCenterLabel: { fontSize: 9.5 },
  orbitItem: { position: 'absolute', width: 96, alignItems: 'center' },
  orbitItemIcon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbitItemText: { fontSize: 9.5, fontWeight: '600', marginTop: 5, maxWidth: 90, textAlign: 'center' },

  galaxy: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 4 },
  galaxyCell: { alignItems: 'center', justifyContent: 'center' },
  galaxyNode: { borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  galaxyCount: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  galaxyName: { fontSize: 8.5, fontWeight: '600', marginTop: 1, maxWidth: 70, textAlign: 'center' },

  river: { position: 'relative', paddingLeft: 18 },
  riverLine: { position: 'absolute', left: 22, top: 12, bottom: 12, width: 1 },
  riverRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11 },
  riverDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, marginLeft: -1, zIndex: 2 },
  riverCopy: { flex: 1 },
  riverTitle: { fontSize: 12, fontWeight: '600' },
  riverMeta: { fontSize: 9.5, marginTop: 3 },
});
