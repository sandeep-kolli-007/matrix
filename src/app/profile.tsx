import { matrixTheme } from '@/data/matrix-theme';
import { useCallback, useState } from 'react';
import { SectionList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function PeopleScreen() {
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = { ...matrixTheme(appearance), surface: matrixTheme(appearance).panel, border: matrixTheme(appearance).line };
  const [people, setPeople] = useState<LifeEntity[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const records = await listEntities();
      setPeople(records.filter((item) => ['person', 'family-member', 'group'].includes(item.kind)).sort((a, b) => a.title.localeCompare(b.title)));
      setError(false);
    } catch { setPeople([]); setError(true); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const visible = people.filter((item) => {
    const matches = `${item.title} ${item.metadata.relationship ?? ''} ${item.metadata.category ?? ''}`.toLowerCase().includes(query.trim().toLowerCase());
    const family = item.kind === 'family-member' || String(item.metadata.circle).toLowerCase() === 'family' || ['mother', 'father', 'parent', 'sibling', 'spouse', 'child'].includes(String(item.metadata.relationship).toLowerCase());
    return matches && (filter === 'All' || filter === 'Family' && family || filter === 'Groups' && item.kind === 'group' || filter === 'Organizations' && item.metadata.subtype === 'organization');
  });
  const grouped = new Map<string, LifeEntity[]>();
  for (const item of visible) {
    const title = String(item.metadata.circle || item.metadata.category || (item.kind === 'group' ? 'Groups' : 'Personal connections')).trim();
    const members = grouped.get(title);
    if (members) members.push(item); else grouped.set(title, [item]);
  }
  const sections = [...grouped].sort(([a], [b]) => a.localeCompare(b)).map(([title, data]) => ({ title, data }));
  return <SafeAreaView style={[s.safe, { backgroundColor: p.bg }]} edges={['top']}>
    <SectionList sections={sections} stickySectionHeadersEnabled={false} keyExtractor={(item) => item.id} refreshing={loading} onRefresh={() => void refresh()} keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}
      renderSectionHeader={({ section }) => <Text accessibilityRole="header" style={{ color: p.muted, fontSize: 10, letterSpacing: 1.2, marginTop: 20, marginBottom: 10 }}>{section.title.toUpperCase()}</Text>}
      ListHeaderComponent={<>
        <View style={s.header}><View><Text style={[s.title, { color: p.text }]}>Network Hub</Text><Text style={[s.subtitle, { color: p.muted }]}>The people who matter.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Add person" style={s.add} onPress={() => router.navigate({ pathname: '/entities', params: { type: 'Person', request: String(Date.now()) } })}><Text style={s.addText}>＋</Text></Pressable></View>
        <TextInput accessibilityLabel="Search people" value={query} onChangeText={setQuery} placeholder="Search people, groups, organizations…" placeholderTextColor={p.muted} style={[s.search, { backgroundColor: p.surface, color: p.text, borderColor: p.border }]} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{['All', 'Family', 'Groups', 'Organizations'].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === filter }} onPress={() => setFilter(value)} style={[s.filter, { backgroundColor: filter === value ? (dark ? '#303C20' : '#E4EDDA') : p.surface }]}><Text style={{ color: filter === value ? (dark ? '#A5D957' : '#537F1C') : p.muted, fontSize: 12, fontWeight: '600' }}>{value}</Text></Pressable>)}</ScrollView>
        <Text style={[s.count, { color: p.muted }]}>{visible.length} {visible.length === 1 ? 'connection' : 'connections'}</Text>
      </>}
      ListEmptyComponent={<View style={[s.empty, { backgroundColor: p.surface }]}><Text style={[s.emptyTitle, { color: p.text }]}>{error ? 'Could not load people' : query || filter !== 'All' ? 'No matches yet' : 'Start with someone who matters'}</Text><Text style={[s.subtitle, { color: p.muted }]}>{error ? 'Pull to refresh and try again.' : query || filter !== 'All' ? 'Try another search or filter.' : 'Add a person to keep their details and related moments together.'}</Text></View>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })} style={[s.person, { backgroundColor: p.surface, borderColor: p.border }]}>
        <View style={[s.avatar, { backgroundColor: item.kind === 'group' ? '#C3D4F6' : item.metadata.subtype === 'organization' ? '#BDDFD4' : '#E1BFA0' }]}><Text style={s.initials}>{item.kind === 'group' ? '♧' : item.title.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</Text></View>
        <View style={s.flex}><Text style={[s.name, { color: p.text }]}>{item.title}</Text><Text style={[s.subtitle, { color: p.muted }]}>{item.kind === 'group' ? `${item.metadata.member_count ?? '—'} members` : item.metadata.subtype === 'organization' ? 'Organization' : String(item.metadata.relationship ?? 'Personal connection')}</Text>{item.deviceOnly ? <Text style={[s.privacy, { color: p.muted }]}>Device only</Text> : null}</View><Text style={[s.arrow, { color: p.muted }]}>›</Text>
      </Pressable>} />
  </SafeAreaView>;
}
const s = StyleSheet.create({ safe: { flex: 1 }, page: { padding: 21, paddingBottom: 120 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { fontSize: 25, fontWeight: '500', letterSpacing: -0.7 }, subtitle: { fontSize: 13, lineHeight: 20, marginTop: 3 }, add: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#137954', alignItems: 'center', justifyContent: 'center' }, addText: { color: '#FFFFFF', fontSize: 27 }, search: { height: 50, borderRadius: 7, paddingHorizontal: 15, borderWidth: 1, marginTop: 22, fontSize: 13 }, filters: { gap: 8, paddingVertical: 17 }, filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 5 }, count: { fontSize: 12, marginBottom: 12 }, person: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, minHeight: 64, borderRadius: 2, borderWidth: 1, marginBottom: 10 }, avatar: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, initials: { color: '#284537', fontWeight: '800', fontSize: 15 }, flex: { flex: 1 }, name: { fontSize: 14, fontWeight: '500' }, privacy: { fontSize: 10, marginTop: 3 }, arrow: { fontSize: 25 }, empty: { padding: 23, borderRadius: 21, gap: 7 }, emptyTitle: { fontSize: 18, fontWeight: '700' } });
