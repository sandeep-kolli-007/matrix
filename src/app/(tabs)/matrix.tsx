import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';

import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { BalanceBar } from '@/components/reference-visuals';
import { useRecords } from '@/components/use-records';
import { LifeEntity } from '@/data/lifeos-store';
import { isPreviewReviewMode } from '@/data/matrix-source';
import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

type Mode = 'Life' | 'Plans' | 'Growth' | 'Assets';

type Bubble = {
  label: string;
  value: number;
  color: string;
  ios: string;
  other: string;
  match: (item: LifeEntity) => boolean;
};

const definitions: Record<Mode, Bubble[]> = {
  Life: [
    { label: 'Health', value: 0, color: '#2FE394', ios: 'heart.fill', other: 'favorite', match: item => item.metadata.group === 'Health' },
    { label: 'Finance', value: 0, color: '#FFBD39', ios: 'banknote.fill', other: 'payments', match: item => item.metadata.group === 'Finance' },
    { label: 'Work', value: 0, color: '#3A91FF', ios: 'briefcase.fill', other: 'work', match: item => item.metadata.group === 'Productivity' },
    { label: 'Relationships', value: 0, color: '#FF5A8B', ios: 'person.2.fill', other: 'group', match: item => item.metadata.group === 'People' },
    { label: 'Learning', value: 0, color: '#9B68FF', ios: 'book.fill', other: 'menu_book', match: item => item.metadata.group === 'Learning' },
    { label: 'Lifestyle', value: 0, color: '#31C8DC', ios: 'leaf.fill', other: 'spa', match: item => ['Planning', 'Other'].includes(String(item.metadata.group)) },
  ],
  Plans: [
    { label: 'Tasks', value: 0, color: '#3A91FF', ios: 'checkmark.circle.fill', other: 'task_alt', match: item => item.kind === 'task' },
    { label: 'Events', value: 0, color: '#9B68FF', ios: 'calendar', other: 'event', match: item => ['event', 'meeting'].includes(item.kind) },
    { label: 'Trips', value: 0, color: '#31C8DC', ios: 'airplane', other: 'flight', match: item => ['trip', 'itinerary'].includes(item.kind) },
    { label: 'Reminders', value: 0, color: '#FFBD39', ios: 'bell.fill', other: 'notifications', match: item => item.kind === 'reminder' },
    { label: 'Routines', value: 0, color: '#2FE394', ios: 'repeat', other: 'repeat', match: item => ['routine', 'habit'].includes(item.kind) },
    { label: 'Reservations', value: 0, color: '#FF5A8B', ios: 'ticket.fill', other: 'confirmation_number', match: item => item.kind === 'reservation' },
  ],
  Growth: [
    { label: 'Goals', value: 0, color: '#9B68FF', ios: 'target', other: 'track_changes', match: item => item.kind === 'goal' },
    { label: 'Habits', value: 0, color: '#2FE394', ios: 'repeat.circle.fill', other: 'repeat', match: item => item.kind === 'habit' },
    { label: 'Skills', value: 0, color: '#31C8DC', ios: 'brain.head.profile', other: 'psychology', match: item => item.kind === 'skill' },
    { label: 'Courses', value: 0, color: '#3A91FF', ios: 'graduationcap.fill', other: 'school', match: item => ['course', 'lesson'].includes(item.kind) },
    { label: 'Practice', value: 0, color: '#FFBD39', ios: 'figure.mind.and.body', other: 'fitness_center', match: item => item.kind === 'practice' },
    { label: 'Milestones', value: 0, color: '#FF5A8B', ios: 'flag.fill', other: 'flag', match: item => item.kind === 'milestone' },
  ],
  Assets: [
    { label: 'Assets', value: 0, color: '#3A91FF', ios: 'shippingbox.fill', other: 'inventory_2', match: item => item.kind === 'asset' },
    { label: 'Property', value: 0, color: '#2FE394', ios: 'house.fill', other: 'home', match: item => item.kind === 'property' },
    { label: 'Vehicles', value: 0, color: '#31C8DC', ios: 'car.fill', other: 'directions_car', match: item => item.kind === 'vehicle' },
    { label: 'Accounts', value: 0, color: '#FFBD39', ios: 'building.columns.fill', other: 'account_balance', match: item => item.kind === 'account' },
    { label: 'Investments', value: 0, color: '#9B68FF', ios: 'chart.line.uptrend.xyaxis', other: 'monitoring', match: item => item.kind === 'investment' },
    { label: 'Insurance', value: 0, color: '#FF5A8B', ios: 'shield.fill', other: 'shield', match: item => item.kind === 'insurance' },
  ],
};

const positions = [
  { top: 18, left: '38%' },
  { top: 74, right: 16 },
  { top: 176, right: 24 },
  { top: 185, left: 16 },
  { top: 98, left: 9 },
  { bottom: 10, left: '39%' },
] as const;

export default function MatrixScreen() {
  const records = useRecords();
  const { appearance } = useLifeOS();
  const p = matrixTheme(isPreviewReviewMode ? 'dark' : appearance);
  const [mode, setMode] = useState<Mode>('Life');

  const bubbles = useMemo(() => {
    const base = definitions[mode];
    const counts = base.map(def => records.items.filter(def.match).length);
    const max = Math.max(1, ...counts);
    return base.map((def, index) => {
      const count = counts[index];
      const completionBoost = records.items.filter(item => def.match(item) && item.metadata.completed === true).length;
      const recency = records.items.filter(item => def.match(item) && Date.now() - Date.parse(item.updatedAt) < 7 * 86400000).length;
      const score = Math.min(96, Math.round(42 + (count / max) * 34 + Math.min(14, recency * 2) + Math.min(6, completionBoost)));
      return { ...def, value: score, count };
    });
  }, [mode, records.items]);

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.page}>
        <View style={s.header}>
          <View style={s.titleRow}>
            <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Matrix</Text>
            <SymbolView name={{ ios: 'info.circle', android: 'info', web: 'info' }} size={16} tintColor={p.accent} />
          </View>
          <Pressable onPress={() => router.push('/insights')} style={[s.iconButton, { backgroundColor: p.raised }]}>
            <SymbolView name={{ ios: 'square.and.arrow.up', android: 'ios_share', web: 'ios_share' }} size={17} tintColor={p.text} />
          </Pressable>
        </View>

        <View style={[s.segment, { backgroundColor: p.raised }]}>
          {(['Life', 'Plans', 'Growth', 'Assets'] as Mode[]).map(value => {
            const active = mode === value;
            return (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                style={[s.segmentItem, active && { backgroundColor: p.accent }]}
              >
                <Text style={[s.segmentText, { color: active ? p.onAccent : p.muted }]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[s.orbitCard, { backgroundColor: '#07101B', borderColor: p.line }]}>
          <View style={s.orbitHaloLarge} />
          <View style={s.orbitHaloSmall} />

          <View style={[s.centerBubble, { borderColor: '#448CFF' }]}>
            <View style={s.centerGlow} />
            <Text style={s.centerText}>You</Text>
          </View>

          {bubbles.map((bubble, index) => {
            const pos = positions[index];
            return (
              <Pressable
                key={bubble.label}
                onPress={() => router.push('/insights')}
                style={[
                  s.bubble,
                  pos,
                  {
                    borderColor: bubble.color,
                    shadowColor: bubble.color,
                    backgroundColor: '#0B1522',
                  },
                ]}
              >
                <SymbolView name={{ ios: bubble.ios as never, android: bubble.other as never, web: bubble.other as never }} size={19} tintColor={bubble.color} />
                <Text style={s.bubbleLabel}>{bubble.label}</Text>
                <Text style={[s.bubbleValue, { color: bubble.color }]}>{bubble.value}%</Text>
              </Pressable>
            );
          })}

          {Array.from({ length: 10 }, (_, index) => (
            <View
              key={index}
              style={[
                s.particle,
                {
                  backgroundColor: bubbles[index % bubbles.length]?.color ?? p.accent,
                  left: `${8 + ((index * 17) % 84)}%`,
                  top: `${12 + ((index * 23) % 76)}%`,
                },
              ]}
            />
          ))}
        </View>

        <View style={[s.balanceCard, { backgroundColor: p.card, borderColor: p.line }]}>
          <View style={s.balanceHeader}>
            <Text style={[s.balanceTitle, { color: p.text }]}>{mode} Balance</Text>
            <Pressable onPress={() => router.push('/insights')}>
              <Text style={[s.seeDetails, { color: p.accent }]}>See details</Text>
            </Pressable>
          </View>
          <View style={s.balanceList}>
            {bubbles.map(bubble => (
              <BalanceBar
                key={bubble.label}
                label={bubble.label}
                value={bubble.value}
                color={bubble.color}
                textColor={p.text}
                mutedColor={p.muted}
                icon={<SymbolView name={{ ios: bubble.ios as never, android: bubble.other as never, web: bubble.other as never }} size={14} tintColor={bubble.color} />}
              />
            ))}
          </View>
        </View>

        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: p.card }]}>
            <Text style={[s.summaryValue, { color: p.text }]}>{records.items.length}</Text>
            <Text style={[s.summaryLabel, { color: p.muted }]}>records mapped</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: p.card }]}>
            <Text style={[s.summaryValue, { color: p.text }]}>{bubbles.reduce((sum, item) => sum + item.count, 0)}</Text>
            <Text style={[s.summaryLabel, { color: p.muted }]}>{mode.toLowerCase()} records</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 14, paddingTop: 5, paddingBottom: 118, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '750' as '700', letterSpacing: -0.8 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', padding: 3, borderRadius: 13, marginTop: 9 },
  segmentItem: { flex: 1, minHeight: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 10.5, fontWeight: '600' },
  orbitCard: { height: 340, borderRadius: 26, borderWidth: 1, marginTop: 12, overflow: 'hidden', position: 'relative' },
  orbitHaloLarge: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: '#24518180', alignSelf: 'center', top: 38, left: '50%', marginLeft: -130 },
  orbitHaloSmall: { position: 'absolute', width: 176, height: 176, borderRadius: 88, borderWidth: 1, borderColor: '#4D58D060', alignSelf: 'center', top: 80, left: '50%', marginLeft: -88 },
  centerBubble: { position: 'absolute', width: 92, height: 92, borderRadius: 46, borderWidth: 2, left: '50%', top: '50%', marginLeft: -46, marginTop: -46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111A3A', shadowColor: '#477DFF', shadowOpacity: 0.8, shadowRadius: 20, elevation: 12 },
  centerGlow: { position: 'absolute', width: 68, height: 68, borderRadius: 34, backgroundColor: '#283685' },
  centerText: { color: '#FFFFFF', fontSize: 16, fontWeight: '750' as '700' },
  bubble: { position: 'absolute', width: 82, height: 82, borderRadius: 41, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.72, shadowRadius: 14, elevation: 8 },
  bubbleLabel: { color: '#F8FAFF', fontSize: 9.5, fontWeight: '650' as '600', marginTop: 3 },
  bubbleValue: { fontSize: 10.5, fontWeight: '700', marginTop: 1 },
  particle: { position: 'absolute', width: 4, height: 4, borderRadius: 2, opacity: 0.75 },
  balanceCard: { borderRadius: 20, borderWidth: 1, padding: 15, marginTop: 12 },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  balanceTitle: { fontSize: 14.5, fontWeight: '700' },
  seeDetails: { fontSize: 10.5, fontWeight: '600' },
  balanceList: { gap: 4 },
  summaryRow: { flexDirection: 'row', gap: 9, marginTop: 10 },
  summaryCard: { flex: 1, minHeight: 74, borderRadius: 17, padding: 13, justifyContent: 'center' },
  summaryValue: { fontSize: 21, fontWeight: '700', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 9.5, marginTop: 2 },
});
