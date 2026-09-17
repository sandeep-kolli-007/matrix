import { matrixTheme } from '@/data/matrix-theme';
import { useCallback, useMemo, useRef, useState } from 'react';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { EntityIcon } from '@/components/entity-icon';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect } from 'expo-router';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { formatLocalDate } from '@/data/entity-date';
import { homeSummary } from '@/data/home-summary';
import { scheduledDate } from '@/data/planning';
import { useLifeOS } from '@/providers/lifeos-provider';

type Filter = 'All' | 'Urgent' | 'Today';
const quick = [
  { title: 'Mood', type: 'Mood Log', ios: 'face.smiling', other: 'sentiment_satisfied', color: '#EDB52D', bg: '#2B230B' },
  { title: 'Workout', type: 'Workout', ios: 'figure.strengthtraining.traditional', other: 'fitness_center', color: '#20B8A8', bg: '#102E28' },
  { title: 'Meal', type: 'Meal', ios: 'fork.knife', other: 'restaurant', color: '#5B98EF', bg: '#152237' },
  { title: 'Task', type: 'Task', ios: 'checkmark.square', other: 'task_alt', color: '#FB576D', bg: '#34151D' },
] as const;

export default function HomeScreen() {
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = matrixTheme(appearance);
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');
  const [day, setDay] = useState(() => formatLocalDate(new Date()));
  const token = useRef(0);
  const load = useCallback(async () => {
    const current = ++token.current;
    setLoading(true); setDay(formatLocalDate(new Date()));
    try {
      const records = await listEntities();
      if (current === token.current) { setItems(records); setFailed(false); }
    } catch { if (current === token.current) setFailed(true); }
    finally { if (current === token.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); return () => { token.current++; }; }, [load]));
  const summary = useMemo(() => homeSummary(items, day), [items, day]);
  const rows = useMemo(() => {
    const candidates = filter === 'Today' ? summary.today : filter === 'Urgent' ? summary.active.filter(item => summary.urgentIds.has(item.id)) : summary.active;
    return [...candidates].sort((a, b) => Number(summary.urgentIds.has(b.id)) - Number(summary.urgentIds.has(a.id))
      || (scheduledDate(a) ?? '9999').localeCompare(scheduledDate(b) ?? '9999')
      || b.updatedAt.localeCompare(a.updatedAt));
  }, [summary, filter]);
  const now = new Date();
  const create = (type: string) => router.navigate({ pathname: '/entities', params: { type, request: String(Date.now()) } });
  return <SafeAreaView style={[s.safe, { backgroundColor: p.bg }]} edges={['top']}>
    <FlatList data={failed ? [] : rows} keyExtractor={item => item.id} contentContainerStyle={s.page}
      refreshing={loading} onRefresh={() => void load()} showsVerticalScrollIndicator={false}
      ListHeaderComponent={<View>
        <View style={s.header}>
          <View style={s.flex}><Text accessibilityRole="header" style={[s.greeting, { color: p.text }]}>Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, Sandeep</Text><Text style={[s.date, { color: p.muted }]}>{now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} · MATRIX</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open plans" onPress={() => router.push('/plans')} style={s.headerButton}><SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} size={21} tintColor={p.muted} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={s.headerButton}><SymbolView name={{ ios: 'gearshape', android: 'settings', web: 'settings' }} size={22} tintColor={p.muted} /></Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={'Task progress, ' + (summary.progress ?? 0) + ' percent. Open work room.'} onPress={() => router.push({ pathname: '/rooms', params: { room: 'work' } })} style={[s.score, { backgroundColor: p.panel, borderColor: p.line }]}>
          <View style={[s.ring, { borderColor: p.accent }]}><Text style={[s.scoreValue, { color: p.text }]}>{loading && !items.length ? '…' : summary.progress === null ? '—' : summary.progress}</Text></View>
          <View style={s.flex}><Text style={[s.overline, { color: p.muted }]}>TASK PROGRESS</Text><Text style={[s.meta, { color: p.muted }]}>{summary.tasks.length ? summary.completed + ' of ' + summary.tasks.length + ' complete' : 'Begin with one small task'}</Text></View>
          <SymbolView name={{ ios: 'chart.line.uptrend.xyaxis', android: 'show_chart', web: 'show_chart' }} size={30} tintColor={p.accent} />
        </Pressable>
        <View style={s.stats}>{[
          { label: 'TODAY', count: summary.today.length, color: '#F1B900', action: () => setFilter('Today') },
          { label: 'OVERDUE', count: summary.overdue.length, color: '#FF5458', action: () => setFilter('Urgent') },
          { label: 'ACTIVE', count: summary.active.length, color: '#428BF3', action: () => setFilter('All') },
        ].map(stat => <Pressable key={stat.label} accessibilityRole="button" onPress={stat.action} style={[s.stat, { backgroundColor: p.panel, borderColor: p.line }]}>
          <View style={s.statTop}><View style={[s.dot, { backgroundColor: stat.color }]} /><Text style={[s.statNumber, { color: p.text }]}>{loading && !items.length ? '—' : stat.count}</Text></View><Text style={[s.statLabel, { color: p.muted }]}>{stat.label}</Text>
        </Pressable>)}</View>
        <Text style={[s.sectionLabel, { color: p.muted }]}>QUICK LOG</Text>
        <View style={s.quick}>{quick.map(action => <Pressable key={action.title} accessibilityRole="button" accessibilityLabel={'Log ' + action.title} onPress={() => create(action.type)} style={[s.quickButton, { borderColor: p.line, backgroundColor: p.panel }]}>
          <View style={[s.quickIcon, { backgroundColor: dark ? action.bg : '#EDF1E8' }]}><SymbolView name={{ ios: action.ios, android: action.other, web: action.other }} size={19} tintColor={action.color} /></View>
          <Text style={[s.quickLabel, { color: p.muted }]}>{action.title}</Text>
        </Pressable>)}</View>
        <View style={s.filters}>{(['All', 'Urgent', 'Today'] as const).map(value => <Pressable accessibilityRole="button" accessibilityState={{ selected: value === filter }} key={value} onPress={() => setFilter(value)} style={[s.filter, { backgroundColor: value === filter ? p.selected : p.bg, borderColor: p.line }]}>
          {value !== 'All' ? <View style={[s.dot, { backgroundColor: value === 'Urgent' ? '#FF5458' : '#428BF3' }]} /> : null}<Text style={[s.filterText, { color: p.text }]}>{value.toUpperCase()}</Text>
        </Pressable>)}</View>
        {failed ? <Pressable accessibilityRole="button" onPress={() => void load()} style={[s.empty, { borderColor: p.line }]}><Text style={{ color: p.text }}>Could not load your dashboard. Tap to retry.</Text></Pressable> : null}
      </View>}
      renderItem={({ item }) => {
        const due = scheduledDate(item);
        const overdue = summary.overdue.some(record => record.id === item.id);
        const color = summary.urgentIds.has(item.id) ? '#FF5458' : due === day ? p.accent : '#428BF3';
        return <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })} style={[s.feedCard, { borderColor: p.line, backgroundColor: p.panel }]}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: p.raised, alignItems: 'center', justifyContent: 'center' }}><EntityIcon type={String(item.metadata.entityType ?? '')} color={color} size={22} /></View><View style={s.flex}><Text numberOfLines={2} style={[s.feedTitle, { color: p.text }]}>{item.title}</Text><Text numberOfLines={2} style={[s.meta, { color: p.muted }]}>{String(item.metadata.entityType ?? item.kind)}{overdue ? ' · Overdue' : due === day ? ' · Today' : due ? ' · ' + due : ''}{item.deviceOnly ? ' · Device only' : ''}</Text></View>
        </Pressable>;
      }}
      ListEmptyComponent={!failed && !loading ? <View style={[s.empty, { borderColor: p.line }]}><Text style={[s.feedTitle, { color: p.text }]}>{filter === 'Urgent' ? 'Nothing urgent. A little breathing room.' : filter === 'Today' ? 'No plans dated today.' : 'Your life starts with one small thing.'}</Text><Pressable accessibilityRole="button" onPress={() => router.navigate('/add')} style={s.emptyAction}><Text style={{ color: p.accent }}>Add something →</Text></Pressable></View> : null}
      ListFooterComponent={<View style={s.footer}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/insights')} style={[s.insight, { backgroundColor: dark ? '#111B13' : '#EBF2E8', borderColor: dark ? '#243B27' : '#CCDFCA' }]}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={20} tintColor="#20B8A8" /><Text style={[s.insightText, { color: p.text }]}>{summary.tasks.length ? summary.completed + ' tasks complete — explore your saved progress.' : 'Build a picture of your life, one entry at a time.'}</Text></Pressable>
        <View style={s.destinations}>{[{ title: 'Rooms', path: '/rooms' }, { title: 'People', path: '/profile' }, { title: 'Messages', path: '/messages' }, { title: 'Data source', path: '/data-connection' }].map(link => <Pressable key={link.title} accessibilityRole="button" onPress={() => router.navigate(link.path as '/rooms')} style={s.destination}><Text style={{ color: p.muted, fontSize: 12 }}>{link.title} →</Text></Pressable>)}</View>
      </View>} />
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1 }, page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, maxWidth: 680, width: '100%', alignSelf: 'center' }, flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 26, minHeight: 48 }, greeting: { fontSize: 20, fontWeight: '600' }, date: { fontSize: 13, marginTop: 5 },
  headerButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  score: { padding: 18, borderWidth: 1, borderRadius: 9, minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: 18 },
  ring: { width: 68, height: 68, borderRadius: 34, borderWidth: 4, justifyContent: 'center', alignItems: 'center' }, scoreValue: { fontSize: 25, fontWeight: '500' },
  overline: { fontSize: 11, letterSpacing: 1.4 }, meta: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16 }, stat: { flex: 1, borderRadius: 9, borderWidth: 1, padding: 12, minHeight: 62 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 8 }, statNumber: { fontSize: 24, fontWeight: '600' }, statLabel: { fontSize: 11, marginTop: 7 },
  dot: { width: 6, height: 6, borderRadius: 3 }, sectionLabel: { fontSize: 11, letterSpacing: 1.5, marginTop: 26, marginBottom: 12 },
  quick: { flexDirection: 'row', gap: 12 }, quickButton: { flex: 1, minHeight: 88, borderWidth: 1, borderRadius: 10, padding: 11, alignItems: 'center', gap: 7 }, quickIcon: { width: 34, height: 34, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }, quickLabel: { fontSize: 12 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 24, marginBottom: 24 }, filter: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, borderWidth: 1, borderRadius: 5, paddingHorizontal: 13 }, filterText: { fontSize: 12, letterSpacing: 0.6 },
  feedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, paddingVertical: 13, minHeight: 60, borderRadius: 9, borderWidth: 1, marginBottom: 8 },
  feedTitle: { fontSize: 15, lineHeight: 22, letterSpacing: 0.2 }, empty: { padding: 18, borderRadius: 9, borderWidth: 1 }, emptyAction: { paddingVertical: 14 },
  footer: { marginTop: 28 }, insight: { borderWidth: 1, borderRadius: 9, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }, insightText: { flex: 1, fontSize: 12, lineHeight: 18 },
  destinations: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 }, destination: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 },
});
