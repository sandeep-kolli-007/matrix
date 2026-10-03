import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect } from 'expo-router';

import { EntityIcon } from '@/components/entity-icon';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { LifeOrb, MotionReveal, Sparkline, visualMetrics } from '@/components/matrix-visuals';
import { PremiumSurface } from '@/components/premium-surface';
import { formatLocalDate } from '@/data/entity-date';
import { homeSummary } from '@/data/home-summary';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { matrixTheme } from '@/data/matrix-theme';
import { scheduledDate } from '@/data/planning';
import { useLifeOS } from '@/providers/lifeos-provider';

type Filter = 'All' | 'Urgent' | 'Today';

const quick = [
  { title: 'Mood', type: 'Mood Log', ios: 'face.smiling', other: 'sentiment_satisfied' },
  { title: 'Workout', type: 'Workout', ios: 'figure.strengthtraining.traditional', other: 'fitness_center' },
  { title: 'Meal', type: 'Meal', ios: 'fork.knife', other: 'restaurant' },
  { title: 'Task', type: 'Task', ios: 'checkmark.circle', other: 'task_alt' },
] as const;

export default function HomeScreen() {
  const { appearance } = useLifeOS();
  const p = matrixTheme(appearance);
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');
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
  const visuals = useMemo(() => visualMetrics(items), [items]);
  const rows = useMemo(() => {
    const candidates = filter === 'Today'
      ? summary.today
      : filter === 'Urgent'
        ? summary.active.filter(item => summary.urgentIds.has(item.id))
        : summary.active;
    return [...candidates].sort((a, b) =>
      Number(summary.urgentIds.has(b.id)) - Number(summary.urgentIds.has(a.id))
      || (scheduledDate(a) ?? '9999').localeCompare(scheduledDate(b) ?? '9999')
      || b.updatedAt.localeCompare(a.updatedAt));
  }, [summary, filter]);

  const now = new Date();
  const create = (type: string) => router.navigate({ pathname: '/entities', params: { type, request: String(Date.now()) } });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <FlatList
        data={failed ? [] : rows}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={() => void load()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.page}
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <View style={s.flex}>
                <Text style={[s.date, { color: p.muted }]}>
                  {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Today</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={[s.iconButton, { backgroundColor: p.panel, borderColor: p.line }]}>
                <SymbolView name={{ ios: 'gearshape', android: 'settings', web: 'settings' }} size={20} tintColor={p.text} />
              </Pressable>
            </View>

            <MotionReveal>
              <Pressable accessibilityRole="button" accessibilityLabel="Open insights" onPress={() => router.push('/insights')}>
                <PremiumSurface style={[s.pulseCard, { backgroundColor: p.panel, borderColor: p.line }]}>
                  <View style={s.pulseCopy}>
                    <View style={s.pulseHeadingRow}>
                      <View style={s.flex}>
                        <Text style={[s.kicker, { color: p.accent }]}>LIFE PULSE</Text>
                        <Text style={[s.pulseTitle, { color: p.text }]}>Your week at a glance</Text>
                      </View>
                      <View style={[s.liveBadge, { backgroundColor: p.selected }]}>
                        <View style={[s.liveDot, { backgroundColor: p.success }]} />
                        <Text style={[s.liveText, { color: p.accent }]}>LIVE</Text>
                      </View>
                    </View>
                    <Text style={[s.pulseBody, { color: p.muted }]}>
                      A private activity signal from your saved records, task progress, and recent capture.
                    </Text>
                    <View style={s.sparkWrap}>
                      <Sparkline values={visuals.daily} palette={p} height={68} />
                    </View>
                    <View style={s.pulseStats}>
                      <View>
                        <Text style={[s.pulseStatValue, { color: p.text }]}>{visuals.total}</Text>
                        <Text style={[s.pulseStatLabel, { color: p.muted }]}>records</Text>
                      </View>
                      <View>
                        <Text style={[s.pulseStatValue, { color: p.text }]}>{visuals.groups.length}</Text>
                        <Text style={[s.pulseStatLabel, { color: p.muted }]}>areas</Text>
                      </View>
                      <View>
                        <Text style={[s.pulseStatValue, { color: p.text }]}>{visuals.taskCount ? `${visuals.done}/${visuals.taskCount}` : '—'}</Text>
                        <Text style={[s.pulseStatLabel, { color: p.muted }]}>tasks</Text>
                      </View>
                    </View>
                  </View>
                  <View style={s.orbColumn}>
                    <LifeOrb score={visuals.pulse} palette={p} size={136} />
                  </View>
                </PremiumSurface>
              </Pressable>
            </MotionReveal>

            <MotionReveal delay={80}>
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/rooms', params: { room: 'work' } })} style={[s.taskCard, { backgroundColor: p.panel, borderColor: p.line }]}>
                <View style={s.taskCardTop}>
                  <View>
                    <Text style={[s.kicker, { color: p.muted }]}>TASKS</Text>
                    <Text style={[s.taskTitle, { color: p.text }]}>
                      {summary.tasks.length ? `${summary.completed} of ${summary.tasks.length} done` : 'No tasks yet'}
                    </Text>
                  </View>
                  <Text style={[s.taskPercent, { color: p.text }]}>{summary.progress === null ? '—' : `${summary.progress}%`}</Text>
                </View>
                <View style={[s.track, { backgroundColor: p.raised }]}>
                  <View style={[s.fill, { width: `${summary.progress ?? 0}%`, backgroundColor: p.accent }]} />
                </View>
                <View style={s.metrics}>
                  {[
                    { label: 'Today', value: summary.today.length, action: () => setFilter('Today') },
                    { label: 'Overdue', value: summary.overdue.length, action: () => setFilter('Urgent') },
                    { label: 'Active', value: summary.active.length, action: () => setFilter('All') },
                  ].map((metric, index) => (
                    <Pressable key={metric.label} onPress={metric.action} style={[s.metric, index > 0 && { borderLeftColor: p.line, borderLeftWidth: StyleSheet.hairlineWidth }]}>
                      <Text style={[s.metricValue, { color: p.text }]}>{loading && !items.length ? '—' : metric.value}</Text>
                      <Text style={[s.metricLabel, { color: p.muted }]}>{metric.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </Pressable>
            </MotionReveal>

            <View style={s.sectionHead}>
              <Text style={[s.sectionTitle, { color: p.text }]}>Quick add</Text>
              <Pressable onPress={() => router.navigate('/add')}><Text style={[s.link, { color: p.accent }]}>See all</Text></Pressable>
            </View>

            <MotionReveal delay={140}>
              <View style={s.quickRow}>
                {quick.map(action => (
                  <Pressable key={action.title} accessibilityRole="button" accessibilityLabel={`Add ${action.title}`} onPress={() => create(action.type)} style={[s.quickButton, { backgroundColor: p.panel, borderColor: p.line }]}>
                    <View style={[s.quickIcon, { backgroundColor: p.selected }]}>
                      <SymbolView name={{ ios: action.ios, android: action.other, web: action.other }} size={20} tintColor={p.accent} />
                    </View>
                    <Text style={[s.quickText, { color: p.text }]}>{action.title}</Text>
                  </Pressable>
                ))}
              </View>
            </MotionReveal>

            <View style={[s.sectionHead, { marginTop: 30 }]}>
              <Text style={[s.sectionTitle, { color: p.text }]}>Up next</Text>
              <Pressable onPress={() => router.push('/plans')}><Text style={[s.link, { color: p.accent }]}>Plans</Text></Pressable>
            </View>

            <View style={s.filters}>
              {(['All', 'Today', 'Urgent'] as const).map(value => (
                <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === filter }} onPress={() => setFilter(value)} style={[s.filter, { backgroundColor: value === filter ? p.selected : 'transparent', borderColor: value === filter ? p.accent : p.line }]}>
                  <Text style={[s.filterText, { color: value === filter ? p.accent : p.muted }]}>{value}</Text>
                </Pressable>
              ))}
            </View>

            {failed ? (
              <Pressable onPress={() => void load()} style={[s.stateCard, { backgroundColor: p.panel, borderColor: p.line }]}>
                <Text style={[s.stateTitle, { color: p.text }]}>Couldn’t load your dashboard</Text>
                <Text style={[s.stateText, { color: p.muted }]}>Tap to try again.</Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => {
          const due = scheduledDate(item);
          const overdue = summary.overdue.some(record => record.id === item.id);
          const type = String(item.metadata.entityType ?? item.kind);
          return (
            <MotionReveal delay={Math.min(index, 6) * 35}>
              <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })} style={[s.row, { backgroundColor: p.panel, borderColor: p.line }]}>
                <View style={[s.rowIcon, { backgroundColor: p.raised }]}>
                  <EntityIcon type={type} color={summary.urgentIds.has(item.id) ? p.danger : p.accent} size={21} />
                </View>
                <View style={s.flex}>
                  <Text numberOfLines={1} style={[s.rowTitle, { color: p.text }]}>{item.title}</Text>
                  <Text numberOfLines={1} style={[s.rowMeta, { color: p.muted }]}>
                    {type}{overdue ? ' · Overdue' : due === day ? ' · Today' : due ? ` · ${due}` : ''}{item.deviceOnly ? ' · On device' : ''}
                  </Text>
                </View>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={15} tintColor={p.muted} />
              </Pressable>
            </MotionReveal>
          );
        }}
        ListEmptyComponent={!failed && !loading ? (
          <View style={[s.stateCard, { backgroundColor: p.panel, borderColor: p.line }]}>
            <Text style={[s.stateTitle, { color: p.text }]}>
              {filter === 'Urgent' ? 'Nothing urgent' : filter === 'Today' ? 'Nothing scheduled for today' : 'Your day is clear'}
            </Text>
            <Text style={[s.stateText, { color: p.muted }]}>Add a task, event, or note when you’re ready.</Text>
            <Pressable onPress={() => router.navigate('/add')} style={[s.emptyAction, { backgroundColor: p.accent }]}>
              <Text style={{ color: p.onAccent, fontWeight: '600' }}>Add something</Text>
            </Pressable>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, maxWidth: 760, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  date: { fontSize: 13, lineHeight: 18, marginBottom: 3 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1.1 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pulseCard: { minHeight: 236, borderRadius: 26, borderWidth: 1, padding: 20, flexDirection: 'row', overflow: 'hidden' },
  pulseCopy: { flex: 1, minWidth: 0 },
  pulseHeadingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  pulseTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.35, marginTop: 6 },
  pulseBody: { fontSize: 12.5, lineHeight: 18, marginTop: 7, maxWidth: 390 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  sparkWrap: { marginTop: 10, maxWidth: 360 },
  pulseStats: { flexDirection: 'row', gap: 24, marginTop: 4 },
  pulseStatValue: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  pulseStatLabel: { fontSize: 10.5, marginTop: 2 },
  orbColumn: { width: 150, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  taskCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginTop: 12 },
  taskCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  taskTitle: { fontSize: 17, fontWeight: '600', marginTop: 5 },
  taskPercent: { fontSize: 20, fontWeight: '600' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 17 },
  fill: { height: '100%', borderRadius: 3 },
  metrics: { flexDirection: 'row', marginTop: 18 },
  metric: { flex: 1, paddingHorizontal: 14 },
  metricValue: { fontSize: 18, fontWeight: '600' },
  metricLabel: { fontSize: 12, marginTop: 3 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  link: { fontSize: 13, fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickButton: { flex: 1, minHeight: 82, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  quickIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontSize: 12, fontWeight: '500' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filter: { minHeight: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 13, fontWeight: '600' },
  row: { minHeight: 68, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, marginTop: 4 },
  stateCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'flex-start' },
  stateTitle: { fontSize: 16, fontWeight: '600' },
  stateText: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  emptyAction: { minHeight: 42, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
