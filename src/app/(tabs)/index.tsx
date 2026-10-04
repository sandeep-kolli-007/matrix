import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect } from 'expo-router';

import { EntityIcon } from '@/components/entity-icon';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { MountainBackdrop, ProgressRing } from '@/components/reference-visuals';
import { formatLocalDate } from '@/data/entity-date';
import { homeSummary } from '@/data/home-summary';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { matrixGroupColor, matrixTheme } from '@/data/matrix-theme';
import { isPreviewReviewMode } from '@/data/matrix-source';
import { scheduledDate } from '@/data/planning';
import { useLifeOS } from '@/providers/lifeos-provider';

const quickTiles = [
  { label: 'Tasks', type: 'Task', ios: 'checkmark.square.fill', other: 'task_alt', group: 'Productivity' },
  { label: 'Calendar', type: 'Event', ios: 'calendar', other: 'calendar_today', group: 'Planning' },
  { label: 'Notes', type: 'Note', ios: 'note.text', other: 'description', group: 'Learning' },
  { label: 'Finance', type: 'Expense', ios: 'chart.line.uptrend.xyaxis', other: 'monitoring', group: 'Finance' },
  { label: 'Workout', type: 'Workout', ios: 'figure.strengthtraining.traditional', other: 'fitness_center', group: 'Health' },
  { label: 'Meals', type: 'Meal', ios: 'fork.knife', other: 'restaurant', group: 'Health' },
  { label: 'Habits', type: 'Habit', ios: 'repeat', other: 'repeat', group: 'Productivity' },
  { label: 'More', type: 'Note', ios: 'ellipsis', other: 'more_horiz', group: 'Other' },
] as const;

export default function HomeScreen() {
  const { appearance } = useLifeOS();
  const reviewAppearance = isPreviewReviewMode ? 'dark' : appearance;
  const p = matrixTheme(reviewAppearance);
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [day, setDay] = useState(() => formatLocalDate(new Date()));
  const token = useRef(0);

  const load = useCallback(async () => {
    const current = ++token.current;
    setLoading(true);
    setDay(formatLocalDate(new Date()));
    try {
      const records = await listEntities();
      if (current === token.current) {
        setItems(records);
        setFailed(false);
      }
    } catch {
      if (current === token.current) setFailed(true);
    } finally {
      if (current === token.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { token.current++; };
  }, [load]));

  const summary = useMemo(() => homeSummary(items, day), [items, day]);
  const byType = useMemo(() => {
    const map = new Map<string, LifeEntity[]>();
    for (const item of items) {
      const type = String(item.metadata.entityType ?? item.kind);
      map.set(type, [...(map.get(type) ?? []), item]);
    }
    return map;
  }, [items]);

  const healthCount = items.filter(item => item.metadata.group === 'Health').length;
  const recentHealth = items.filter(item => item.metadata.group === 'Health' && Date.now() - Date.parse(item.updatedAt) < 7 * 86400000).length;
  const goalProgress = items
    .filter(item => ['Goal', 'Project', 'Milestone'].includes(String(item.metadata.entityType)))
    .map(item => Number(item.metadata.progress ?? 0))
    .filter(Number.isFinite);
  const moodCount = byType.get('Mood Log')?.length ?? 0;

  const ringStats = [
    {
      label: 'Health',
      value: Math.min(96, 58 + Math.min(32, recentHealth * 3)),
      color: '#35E09B',
      icon: <SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} size={19} tintColor="#35E09B" />,
    },
    {
      label: 'Productivity',
      value: summary.progress ?? Math.min(92, 55 + summary.active.length * 3),
      color: '#2D9CFF',
      icon: <SymbolView name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }} size={19} tintColor="#2D9CFF" />,
    },
    {
      label: 'Focus',
      value: goalProgress.length ? Math.round(goalProgress.reduce((a, b) => a + b, 0) / goalProgress.length) : 68,
      color: '#9B6CFF',
      icon: <SymbolView name={{ ios: 'scope', android: 'track_changes', web: 'track_changes' }} size={19} tintColor="#9B6CFF" />,
    },
    {
      label: 'Mood',
      value: Math.min(94, 66 + moodCount * 4),
      color: '#FFB43C',
      icon: <SymbolView name={{ ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' }} size={19} tintColor="#FFB43C" />,
    },
  ];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const todayItems = summary.today.slice(0, 4);

  function tileMeta(type: string, label: string) {
    const records = byType.get(type) ?? [];
    if (type === 'Task') return `${summary.today.filter(item => item.kind === 'task').length} due`;
    if (type === 'Event') return `${summary.today.filter(item => ['event', 'meeting'].includes(item.kind)).length} today`;
    if (type === 'Habit') {
      const done = records.filter(item => item.metadata.completed === true).length;
      return `${done}/${records.length || 0} done`;
    }
    if (type === 'Expense') {
      const total = records.reduce((sum, item) => sum + (Number(item.metadata.amount) || 0), 0);
      return total ? `₹${Math.round(total).toLocaleString('en-IN')}` : 'Track spend';
    }
    if (type === 'Workout') return records.length ? `${records.length} logs` : 'Log activity';
    if (type === 'Meal') return records.length ? `${records.length} logged` : 'Track food';
    if (type === 'Note') return records.length ? `${records.length} saved` : 'Capture ideas';
    return label === 'More' ? `${items.length} records` : `${records.length} saved`;
  }

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.page}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={p.accent} />}
      >
        <View style={s.brandRow}>
          <Text style={[s.brand, { color: p.text }]}>LifeOS</Text>
          <Pressable onPress={() => router.push('/settings')} accessibilityLabel="Open settings" style={[s.avatarButton, { backgroundColor: p.raised }]}>
            <SymbolView name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} size={28} tintColor={p.text} />
          </Pressable>
        </View>

        <View style={[s.hero, { backgroundColor: '#0B1C2C' }]}>
          <MountainBackdrop height={206} />
          <View style={s.heroShade} />
          <View style={s.heroContent}>
            <Text style={s.greeting}>{greeting}</Text>
            <Text style={s.heroName}>Your day 👋</Text>
            <Text style={s.heroSub}>Everything that matters, in one place.</Text>
            <View style={s.quoteCard}>
              <SymbolView name={{ ios: 'quote.opening', android: 'format_quote', web: 'format_quote' }} size={14} tintColor="#A8B9CE" />
              <Text style={s.quoteText}>Small actions, consistently tracked, become momentum.</Text>
            </View>
          </View>
        </View>

        <View style={s.rings}>
          {ringStats.map(item => (
            <ProgressRing
              key={item.label}
              value={item.value}
              color={item.color}
              label={item.label}
              icon={item.icon}
              size={62}
            />
          ))}
        </View>

        <View style={s.quickGrid}>
          {quickTiles.map(tile => {
            const domain = matrixGroupColor(tile.group, reviewAppearance);
            return (
              <Pressable
                key={tile.label}
                onPress={() => tile.label === 'More'
                  ? router.navigate('/(tabs)/matrix')
                  : router.navigate({ pathname: '/entities', params: { type: tile.type, request: String(Date.now()) } })}
                style={[s.quickTile, { backgroundColor: p.card, borderColor: p.line }]}
              >
                <View style={[s.quickTileIcon, { backgroundColor: domain.soft }]}>
                  <SymbolView name={{ ios: tile.ios, android: tile.other, web: tile.other }} size={18} tintColor={domain.accent} />
                </View>
                <Text style={[s.quickTileTitle, { color: p.text }]}>{tile.label}</Text>
                <Text numberOfLines={1} style={[s.quickTileMeta, { color: p.muted }]}>{tileMeta(tile.type, tile.label)}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.sectionHead}>
          <Text style={[s.sectionTitle, { color: p.text }]}>Today</Text>
          <Pressable onPress={() => router.navigate('/(tabs)/timeline')}><Text style={[s.seeAll, { color: p.accent }]}>See all</Text></Pressable>
        </View>

        <View style={s.todayList}>
          {todayItems.length ? todayItems.map((item, index) => {
            const type = String(item.metadata.entityType ?? item.kind);
            const group = String(item.metadata.group ?? 'Other');
            const domain = matrixGroupColor(group, reviewAppearance);
            const due = scheduledDate(item);
            return (
              <Pressable
                key={item.id}
                onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}
                style={[s.todayCard, { backgroundColor: p.card, borderColor: p.line }]}
              >
                <View style={[s.todayAccent, { backgroundColor: domain.accent }]} />
                <View style={[s.todayIcon, { backgroundColor: domain.soft }]}>
                  <EntityIcon type={type} color={domain.accent} size={20} />
                </View>
                <View style={s.flex}>
                  <Text numberOfLines={1} style={[s.todayTitle, { color: p.text }]}>{item.title}</Text>
                  <Text numberOfLines={1} style={[s.todayMeta, { color: p.muted }]}>
                    {type}{item.details ? ` · ${item.details}` : ''}
                  </Text>
                </View>
                <Text style={[s.todayTime, { color: p.muted }]}>
                  {String(item.metadata.time || (due === day ? 'Today' : due || ''))}
                </Text>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={13} tintColor={p.muted} />
              </Pressable>
            );
          }) : (
            <View style={[s.empty, { backgroundColor: p.card, borderColor: p.line }]}>
              <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'task_alt', web: 'task_alt' }} size={27} tintColor={p.success} />
              <View style={s.flex}>
                <Text style={[s.emptyTitle, { color: p.text }]}>Your day is clear</Text>
                <Text style={[s.emptyText, { color: p.muted }]}>Add a task, event, meal or workout when you need it.</Text>
              </View>
            </View>
          )}
        </View>

        {failed ? (
          <Pressable onPress={() => void load()} style={[s.error, { borderColor: p.danger }]}>
            <Text style={[s.emptyTitle, { color: p.text }]}>Couldn’t refresh MATRIX</Text>
            <Text style={[s.emptyText, { color: p.muted }]}>Tap to try again.</Text>
          </Pressable>
        ) : null}

        {isPreviewReviewMode ? (
          <Text style={[s.previewNote, { color: p.muted }]}>Preview build · synthetic records are enabled for UI review.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 118, maxWidth: 640, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  brandRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  avatarButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 198, borderRadius: 26, overflow: 'hidden', marginTop: 6 },
  heroShade: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#06111DA8' },
  heroContent: { flex: 1, justifyContent: 'flex-end', padding: 18 },
  greeting: { color: '#EAF1FA', fontSize: 16, fontWeight: '500' },
  heroName: { color: '#FFFFFF', fontSize: 27, lineHeight: 31, fontWeight: '750' as '700', letterSpacing: -0.7, marginTop: 1 },
  heroSub: { color: '#B4C3D4', fontSize: 11.5, marginTop: 4 },
  quoteCard: { minHeight: 42, borderRadius: 14, backgroundColor: '#0D1B29C9', borderWidth: 1, borderColor: '#38516B', marginTop: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  quoteText: { color: '#DCE7F3', flex: 1, fontSize: 10.5, lineHeight: 15 },
  rings: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 17 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: 18 },
  quickTile: { width: '23.5%', minHeight: 88, borderRadius: 16, borderWidth: 1, padding: 9, justifyContent: 'space-between' },
  quickTileIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickTileTitle: { fontSize: 11.5, fontWeight: '650' as '600', marginTop: 8 },
  quickTileMeta: { fontSize: 8.8, marginTop: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 9 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  seeAll: { fontSize: 11.5, fontWeight: '600' },
  todayList: { gap: 8 },
  todayCard: { minHeight: 64, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 10, overflow: 'hidden' },
  todayAccent: { width: 3, alignSelf: 'stretch' },
  todayIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  todayTitle: { fontSize: 12.5, fontWeight: '650' as '600' },
  todayMeta: { fontSize: 9.5, marginTop: 3 },
  todayTime: { fontSize: 9.5, fontVariant: ['tabular-nums'] },
  empty: { minHeight: 78, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', gap: 11, alignItems: 'center' },
  emptyTitle: { fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  error: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 12 },
  previewNote: { fontSize: 9.5, textAlign: 'center', marginTop: 18 },
});
