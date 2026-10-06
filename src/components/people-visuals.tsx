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
import Svg, { Circle, Line } from 'react-native-svg';
import { SymbolView } from 'expo-symbols';

import type { LifeEntity } from '@/data/lifeos-store';

type Palette = {
  bg: string;
  panel: string;
  card: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  selected: string;
  success: string;
  warning: string;
  violet: string;
  cyan: string;
  rose: string;
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

const positions = [
  { x: 72, y: 52 },
  { x: 226, y: 50 },
  { x: 284, y: 146 },
  { x: 227, y: 246 },
  { x: 72, y: 245 },
  { x: 18, y: 146 },
  { x: 150, y: 18 },
  { x: 150, y: 278 },
] as const;

export function PeopleOrbit({
  people,
  palette,
  onPress,
}: {
  people: LifeEntity[];
  palette: Palette;
  onPress: (item: LifeEntity) => void;
}) {
  const shown = people.slice(0, 8);
  const reduced = useReduceMotion();
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = reduced ? 0 : withRepeat(withTiming(1, { duration: 22000, easing: Easing.linear }), -1, false);
  }, [reduced, rotate]);

  const halo = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 360}deg` }],
  }));

  return (
    <View style={[p.orbitStage, { backgroundColor: palette.panel }]}>
      <Animated.View style={[p.orbitHalo, halo, { borderColor: palette.line }]}>
        <View style={[p.orbitSpark, { backgroundColor: palette.accent }]} />
      </Animated.View>

      <View style={[p.you, { backgroundColor: palette.selected, borderColor: palette.accent }]}>
        <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} size={22} tintColor={palette.accent} />
        <Text style={[p.youText, { color: palette.text }]}>You</Text>
      </View>

      <Svg width="100%" height="100%" viewBox="0 0 320 320" style={StyleSheet.absoluteFill}>
        {shown.map((_, index) => {
          const point = positions[index];
          return (
            <Line
              key={index}
              x1="160"
              y1="160"
              x2={point.x + 18}
              y2={point.y + 18}
              stroke={index % 3 === 0 ? palette.rose : index % 3 === 1 ? palette.violet : palette.cyan}
              strokeWidth="1"
              opacity="0.22"
            />
          );
        })}
      </Svg>

      {shown.map((item, index) => (
        <FloatingPerson
          key={item.id}
          item={item}
          index={index}
          x={positions[index].x}
          y={positions[index].y}
          palette={palette}
          reduced={reduced}
          onPress={() => onPress(item)}
        />
      ))}
    </View>
  );
}

function FloatingPerson({
  item,
  index,
  x,
  y,
  palette,
  reduced,
  onPress,
}: {
  item: LifeEntity;
  index: number;
  x: number;
  y: number;
  palette: Palette;
  reduced: boolean;
  onPress: () => void;
}) {
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = reduced
      ? 0
      : withDelay(index * 100, withRepeat(withTiming(1, { duration: 2500 + (index % 4) * 300, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [float, index, reduced]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: (float.value - 0.5) * 8 },
      { scale: 0.985 + float.value * 0.03 },
    ],
  }));

  const initials = item.title.split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase();
  const color = index % 3 === 0 ? palette.rose : index % 3 === 1 ? palette.violet : palette.cyan;

  return (
    <Animated.View style={[p.personWrap, { left: x, top: y }, style]}>
      <Pressable onPress={onPress} style={p.personPress}>
        <View style={[p.personAvatar, { borderColor: color, backgroundColor: palette.card }]}>
          <Text style={[p.initials, { color }]}>{initials || '?'}</Text>
          <View style={[p.online, { backgroundColor: index % 3 === 1 ? palette.muted : palette.success, borderColor: palette.panel }]} />
        </View>
        <Text numberOfLines={1} style={[p.personName, { color: palette.text }]}>{item.title.split(' ')[0]}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ConnectionField({
  people,
  palette,
  onPress,
}: {
  people: LifeEntity[];
  palette: Palette;
  onPress: (item: LifeEntity) => void;
}) {
  const visible = people.slice(0, 18);
  return (
    <View style={p.field}>
      {visible.map((item, index) => {
        const streak = [12, 5, 21, 8, 17, 4][index % 6];
        const color = index % 4 === 0 ? palette.rose : index % 4 === 1 ? palette.violet : index % 4 === 2 ? palette.cyan : palette.accent;
        const size = 74 + (streak / 21) * 28;
        const initials = item.title.split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase();

        return (
          <Pressable key={item.id} onPress={() => onPress(item)} style={p.fieldCell}>
            <View style={[p.connectionBubble, { width: size, height: size, borderRadius: size / 2, borderColor: color, backgroundColor: palette.card }]}>
              <Text style={[p.fieldInitials, { color }]}>{initials}</Text>
              <Text style={[p.fieldName, { color: palette.text }]} numberOfLines={1}>{item.title.split(' ')[0]}</Text>
              <Text style={[p.fieldStreak, { color: palette.warning }]}>🔥 {streak}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SocialPulse({
  people,
  groups,
  palette,
}: {
  people: LifeEntity[];
  groups: LifeEntity[];
  palette: Palette;
}) {
  const online = Math.max(1, Math.round(people.length * 0.58));
  const close = Math.max(1, Math.round(people.length * 0.35));

  const metrics = [
    { label: 'people', value: people.length, color: palette.accent },
    { label: 'active now', value: online, color: palette.success },
    { label: 'close circle', value: close, color: palette.rose },
    { label: 'groups', value: groups.length, color: palette.violet },
  ];

  return (
    <View style={p.pulseRow}>
      {metrics.map(metric => (
        <View key={metric.label} style={p.pulseMetric}>
          <View style={[p.pulseDot, { backgroundColor: metric.color }]} />
          <Text style={[p.pulseValue, { color: palette.text }]}>{metric.value}</Text>
          <Text style={[p.pulseLabel, { color: palette.muted }]}>{metric.label}</Text>
        </View>
      ))}
    </View>
  );
}

const p = StyleSheet.create({
  orbitStage: { height: 320, borderRadius: 32, position: 'relative', overflow: 'hidden' },
  orbitHalo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, left: 50, top: 50 },
  orbitSpark: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: -4, left: '50%' },
  you: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, left: 115, top: 115, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  youText: { fontSize: 10.5, fontWeight: '700', marginTop: 4 },
  personWrap: { position: 'absolute', width: 72, zIndex: 4 },
  personPress: { alignItems: 'center' },
  personAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.4, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 12, fontWeight: '700' },
  online: { position: 'absolute', width: 9, height: 9, borderRadius: 5, borderWidth: 2, right: -1, bottom: 1 },
  personName: { fontSize: 8.5, fontWeight: '600', marginTop: 4, maxWidth: 70 },

  field: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingVertical: 4 },
  fieldCell: { alignItems: 'center', justifyContent: 'center' },
  connectionBubble: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  fieldInitials: { fontSize: 13, fontWeight: '700' },
  fieldName: { fontSize: 8.5, fontWeight: '600', marginTop: 3, maxWidth: 66 },
  fieldStreak: { fontSize: 7.5, fontWeight: '700', marginTop: 2 },

  pulseRow: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 72, alignItems: 'center' },
  pulseMetric: { flex: 1, alignItems: 'center' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 5 },
  pulseValue: { fontSize: 17, fontWeight: '700' },
  pulseLabel: { fontSize: 8.5, marginTop: 1, textAlign: 'center' },
});
