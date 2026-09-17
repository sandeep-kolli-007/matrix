import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function InsightsScreen() {
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = { bg: dark ? '#091710' : '#F4F8F5', card: dark ? '#172B21' : '#FFFFFF', text: dark ? '#F3F8F5' : '#172D20', muted: dark ? '#A2B7AB' : '#637D6D' };
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('Overview');
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listEntities()); setError(false); }
    catch { setItems([]); setError(true); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const tasks = items.filter((item) => item.kind === 'task');
  const done = tasks.filter((item) => item.metadata.completed === true).length;
  const privateCount = items.filter((item) => item.deviceOnly).length;
  const insights = items.filter((item) => item.kind === 'insight');
  const groups = Object.entries(items.reduce<Record<string, number>>((counts, item) => { const group = String(item.metadata.group ?? 'Other'); counts[group] = (counts[group] ?? 0) + 1; return counts; }, {})).sort((a, b) => b[1] - a[1]);
  return <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#36AD80" />}>
    <Text style={[s.title, { color: p.text }]}>Your life, in perspective</Text><Text style={[s.copy, { color: p.muted }]}>A reflection of the records you’ve chosen to keep.</Text>
    <View style={s.tabs}>{['Overview', 'Saved insights'].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === tab }} onPress={() => setTab(value)} style={[s.tab, { backgroundColor: tab === value ? '#157952' : p.card }]}><Text style={{ color: tab === value ? '#FFFFFF' : p.text, fontWeight: '600' }}>{value}</Text></Pressable>)}</View>
    {error ? <Pressable onPress={() => void load()} style={[s.card, { backgroundColor: p.card }]}><Text style={{ color: p.text }}>Could not load insights. Tap to retry.</Text></Pressable> : tab === 'Overview' ? <>
      <View style={s.hero}><Text style={s.heroLabel}>A LITTLE PROGRESS COUNTS</Text><Text style={s.heroValue}>{tasks.length ? `${done} of ${tasks.length}` : 'A fresh start'}</Text><Text style={s.heroCopy}>{tasks.length ? 'saved tasks completed' : 'Your progress will appear as you add and complete tasks.'}</Text><Pressable style={s.heroAction} onPress={() => router.push({ pathname: '/rooms', params: { room: 'work' } })}><Text style={{ color: '#DCFFE9', fontWeight: '700' }}>Open your tasks →</Text></Pressable></View>
      <View style={[s.card, { backgroundColor: p.card }]}><Text style={[s.heading, { color: p.text }]}>Where your records live</Text><Text style={[s.copy, { color: p.muted }]}>{items.length} saved records across {groups.length} areas. Counts describe your records, not how balanced your life is.</Text>{groups.map(([group, count]) => <View key={group} style={s.group}><View style={s.groupLabel}><Text style={{ color: p.text }}>{group}</Text><Text style={{ color: p.muted }}>{count}</Text></View><View style={s.track}><View style={[s.fill, { width: `${items.length ? count / items.length * 100 : 0}%` }]} /></View></View>)}</View>
      <View style={[s.card, { backgroundColor: p.card }]}><Text style={[s.heading, { color: p.text }]}>Your privacy choices</Text><Text style={[s.big, { color: '#2CAD7B' }]}>{privateCount}</Text><Text style={[s.copy, { color: p.muted }]}>records marked to stay on this device</Text><Pressable style={s.heroAction} onPress={() => router.push('/settings')}><Text style={{ color: '#2CAD7B', fontWeight: '700' }}>Review your settings →</Text></Pressable></View>
    </> : <>
      <Text style={[s.copy, { color: p.muted }]}>Stored insights from your selected data source. These are saved observations, not newly generated advice.</Text>
      {insights.map((item) => <Pressable accessibilityRole="button" key={item.id} style={[s.card, { backgroundColor: p.card }]} onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}><Text style={[s.eyebrow, { color: '#2CAD7B' }]}>{String(item.metadata.subtype ?? 'Observation').toUpperCase()}</Text><Text style={[s.heading, { color: p.text }]}>{item.title}</Text>{item.details && item.details !== item.title ? <Text style={[s.copy, { color: p.muted }]}>{item.details}</Text> : null}<Text style={[s.copy, { color: p.muted }]}>View saved details ›</Text></Pressable>)}
      {!insights.length ? <View style={[s.card, { backgroundColor: p.card }]}><Text style={[s.heading, { color: p.text }]}>No saved insights yet</Text><Text style={[s.copy, { color: p.muted }]}>Your overview is available now. Saved observations will appear here when your data source includes them.</Text></View> : null}
    </>}
  </ScrollView>;
}
const s = StyleSheet.create({ page: { padding: 22, paddingBottom: 60, gap: 16 }, title: { fontSize: 29, fontWeight: '800', letterSpacing: -0.8 }, copy: { fontSize: 14, lineHeight: 22 }, tabs: { flexDirection: 'row', gap: 10 }, tab: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 20 }, hero: { borderRadius: 25, padding: 24, backgroundColor: '#184D37', gap: 10 }, heroLabel: { color: '#A2DDBD', fontSize: 10, letterSpacing: 1.5, fontWeight: '800' }, heroValue: { color: '#FFFFFF', fontSize: 38, fontWeight: '800' }, heroCopy: { color: '#D4EBDD', fontSize: 15, lineHeight: 21 }, heroAction: { paddingVertical: 12 }, card: { borderRadius: 23, padding: 22, gap: 12 }, heading: { fontSize: 18, fontWeight: '700', lineHeight: 25 }, group: { gap: 9, marginTop: 8 }, groupLabel: { flexDirection: 'row', justifyContent: 'space-between' }, track: { height: 7, borderRadius: 4, backgroundColor: '#59736533', overflow: 'hidden' }, fill: { height: 7, backgroundColor: '#32B783', borderRadius: 4 }, big: { fontSize: 35, fontWeight: '800' }, eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3 } });
