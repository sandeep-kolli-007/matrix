import { useEffect, useState } from 'react';
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

import { EntityIcon } from '@/components/entity-icon';
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
  violet: string;
  cyan: string;
  rose: string;
  warning: string;
};

export type TimelineMoment = {
  item: LifeEntity;
  color: string;
  soft: string;
  time: string;
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

export function DayFlow({
  moments,
  palette,
  onPress,
}: {
  moments: TimelineMoment[];
  palette: Palette;
  onPress: (item: LifeEntity) => void;
}) {
  const shown = moments.slice(0, 10);
  const height = Math.max(380, shown.length * 96);
  const width = 360;

  return (
    <View style={[t.flowStage, { minHeight: height }]}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="timeline-flow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.accent} stopOpacity="0.14" />
            <Stop offset="0.45" stopColor={palette.violet} stopOpacity="0.52" />
            <Stop offset="1" stopColor={palette.cyan} stopOpacity="0.18" />
          </LinearGradient>
        </Defs>
        <Path
          d={flowPath(width, height)}
          fill="none"
          stroke="url(#timeline-flow)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>

      {shown.map((moment, index) => (
        <MomentNode
          key={moment.item.id}
          moment={moment}
          index={index}
          total={shown.length}
          height={height}
          palette={palette}
          onPress={() => onPress(moment.item)}
        />
      ))}

      {!shown.length ? (
        <View style={t.emptyFlow}>
          <Text style={[t.emptyTitle, { color: palette.text }]}>No moments on this day</Text>
          <Text style={[t.emptyText, { color: palette.muted }]}>Move through dates to watch your life flow change.</Text>
        </View>
      ) : null}
    </View>
  );
}

function flowPath(width: number, height: number) {
  const x = width / 2;
  return [
    `M ${x} 24`,
    `C ${x - 76} ${height * 0.16}, ${x + 82} ${height * 0.25}, ${x} ${height * 0.34}`,
    `C ${x - 86} ${height * 0.45}, ${x + 74} ${height * 0.54}, ${x} ${height * 0.64}`,
    `C ${x - 70} ${height * 0.75}, ${x + 80} ${height * 0.84}, ${x} ${height - 24}`,
  ].join(' ');
}

function MomentNode({
  moment,
  index,
  total,
  height,
  palette,
  onPress,
}: {
  moment: TimelineMoment;
  index: number;
  total: number;
  height: number;
  palette: Palette;
  onPress: () => void;
}) {
  const reduced = useReduceMotion();
  const reveal = useSharedValue(reduced ? 1 : 0);
  const float = useSharedValue(0);

  useEffect(() => {
    reveal.value = reduced ? 1 : withDelay(index * 70, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }));
    float.value = reduced
      ? 0
      : withDelay(index * 130, withRepeat(withTiming(1, { duration: 2600 + (index % 4) * 280, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [float, index, reduced, reveal]);

  const style = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [
      { translateY: (1 - reveal.value) * 14 + (float.value - 0.5) * 5 },
      { scale: 0.97 + reveal.value * 0.03 },
    ],
  }));

  const progress = total <= 1 ? 0.5 : index / (total - 1);
  const top = 26 + progress * (height - 92);
  const leftSide = index % 2 === 0;
  const type = String(moment.item.metadata.entityType ?? moment.item.kind);

  return (
    <Animated.View
      style={[
        t.momentWrap,
        { top, left: leftSide ? 2 : undefined, right: leftSide ? undefined : 2 },
        style,
      ]}
    >
      <Pressable onPress={onPress} style={t.momentPress}>
        <View style={[t.timeBubble, { borderColor: moment.color, backgroundColor: palette.bg }]}>
          <Text style={[t.timeText, { color: moment.color }]}>{moment.time}</Text>
        </View>

        <View style={[t.iconOrb, { backgroundColor: moment.soft, borderColor: moment.color }]}>
          <EntityIcon type={type} color={moment.color} size={18} />
        </View>

        <View style={[t.momentCopy, { alignItems: leftSide ? 'flex-start' : 'flex-end' }]}>
          <Text numberOfLines={1} style={[t.momentTitle, { color: palette.text, textAlign: leftSide ? 'left' : 'right' }]}>
            {moment.item.title}
          </Text>
          <Text numberOfLines={2} style={[t.momentMeta, { color: palette.muted, textAlign: leftSide ? 'left' : 'right' }]}>
            {type}{moment.item.details ? ` · ${moment.item.details}` : ''}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function DayPulse({
  count,
  categories,
  palette,
}: {
  count: number;
  categories: number;
  palette: Palette;
}) {
  const reduced = useReduceMotion();
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = reduced ? 0 : withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [phase, reduced]);

  const outer = useAnimatedStyle(() => ({
    transform: [{ scale: 0.96 + phase.value * 0.05 }],
    opacity: 0.58 + phase.value * 0.2,
  }));

  return (
    <View style={t.pulseStage}>
      <Animated.View style={[t.pulseOuter, outer, { borderColor: palette.accent }]} />
      <View style={[t.pulseInner, { backgroundColor: palette.selected }]}>
        <Text style={[t.pulseValue, { color: palette.text }]}>{count}</Text>
        <Text style={[t.pulseLabel, { color: palette.muted }]}>moments</Text>
      </View>
      <View style={[t.pulseChip, { backgroundColor: palette.panel }]}>
        <Text style={[t.pulseChipValue, { color: palette.violet }]}>{categories}</Text>
        <Text style={[t.pulseChipLabel, { color: palette.muted }]}>areas</Text>
      </View>
    </View>
  );
}

const t = StyleSheet.create({
  flowStage: { position: 'relative', width: '100%', overflow: 'hidden' },
  momentWrap: { position: 'absolute', width: '47%', minHeight: 78 },
  momentPress: { flex: 1, position: 'relative', justifyContent: 'center' },
  timeBubble: { alignSelf: 'flex-start', minHeight: 24, borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  timeText: { fontSize: 8.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  iconOrb: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  momentCopy: { marginTop: 6 },
  momentTitle: { fontSize: 11.5, fontWeight: '700' },
  momentMeta: { fontSize: 8.8, lineHeight: 13, marginTop: 3 },
  emptyFlow: { minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  emptyTitle: { fontSize: 14, fontWeight: '700' },
  emptyText: { fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 4 },

  pulseStage: { height: 154, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  pulseOuter: { position: 'absolute', width: 116, height: 116, borderRadius: 58, borderWidth: 1.4 },
  pulseInner: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  pulseValue: { fontSize: 26, fontWeight: '700', letterSpacing: -0.7 },
  pulseLabel: { fontSize: 8.5 },
  pulseChip: { position: 'absolute', right: 42, top: 20, minWidth: 58, minHeight: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pulseChipValue: { fontSize: 14, fontWeight: '700' },
  pulseChipLabel: { fontSize: 7.5 },
});
