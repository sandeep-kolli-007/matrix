import { useCallback, useState } from 'react';
import { SectionList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function PeopleScreen() {
  const { appearance } = useLifeOS();
  const p = matrixTheme(appearance);
  const [people, setPeople] = useState<LifeEntity[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const records = await listEntities();
      setPeople(records.filter(item => ['person', 'family-member', 'group'].includes(item.kind)).sort((a, b) => a.title.localeCompare(b.title)));
      setError(false);
    } catch {
      setPeople([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const visible = people.filter(item => {
    const matches = `${item.title} ${item.metadata.relationship ?? ''} ${item.metadata.category ?? ''}`.toLowerCase().includes(query.trim().toLowerCase());
    const family = item.kind === 'family-member'
      || String(item.metadata.circle).toLowerCase() === 'family'
      || ['mother', 'father', 'parent', 'sibling', 'spouse', 'child'].includes(String(item.metadata.relationship).toLowerCase());
    return matches && (
      filter === 'All'
      || filter === 'Family' && family
      || filter === 'Groups' && item.kind === 'group'
      || filter === 'Organizations' && item.metadata.subtype === 'organization'
    );
  });

  const grouped = new Map<string, LifeEntity[]>();
  for (const item of visible) {
    const title = String(item.metadata.circle || item.metadata.category || (item.kind === 'group' ? 'Groups' : 'Connections')).trim();
    const members = grouped.get(title);
    if (members) members.push(item);
    else grouped.set(title, [item]);
  }

  const sections = [...grouped]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }));

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <SectionList
        sections={sections}
        stickySectionHeadersEnabled={false}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={() => void refresh()}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.page}
        renderSectionHeader={({ section }) => <Text style={[s.section, { color: p.muted }]}>{section.title}</Text>}
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <View style={s.flex}>
                <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Contacts</Text>
                <Text style={[s.subtitle, { color: p.muted }]}>{visible.length} {visible.length === 1 ? 'connection' : 'connections'}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Add person" style={[s.add, { backgroundColor: p.accent }]} onPress={() => router.navigate({ pathname: '/entities', params: { type: 'Person', request: String(Date.now()) } })}>
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={20} tintColor={p.onAccent} />
              </Pressable>
            </View>

            <View style={[s.searchWrap, { backgroundColor: p.raised, borderColor: query ? p.rose : p.line }]}>
              <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={18} tintColor={p.muted} />
              <TextInput accessibilityLabel="Search people" value={query} onChangeText={setQuery} placeholder="Search contacts" placeholderTextColor={p.muted} style={[s.search, { color: p.text }]} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
              {['All', 'Family', 'Groups', 'Organizations'].map(value => (
                <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === filter }} onPress={() => setFilter(value)} style={[s.filter, { backgroundColor: filter === value ? p.selected : 'transparent', borderColor: filter === value ? p.accent : p.line }]}>
                  <Text style={[s.filterText, { color: filter === value ? p.accent : p.muted }]}>{value}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={[s.empty, { backgroundColor: p.panel, borderColor: p.line }]}>
            <Text style={[s.emptyTitle, { color: p.text }]}>{error ? 'Couldn’t load contacts' : query || filter !== 'All' ? 'No matches' : 'No contacts yet'}</Text>
            <Text style={[s.subtitle, { color: p.muted }]}>{error ? 'Pull to refresh and try again.' : 'Add a person to keep their details and related items together.'}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const initials = item.kind === 'group' ? 'G' : item.title.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
          return (
            <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })} style={[s.person, { backgroundColor: p.panel, borderColor: p.line }]}>
              <View style={[s.avatar, { backgroundColor: p.selected }]}>
                <Text style={[s.initials, { color: p.rose }]}>{initials}</Text>
              </View>
              <View style={s.flex}>
                <Text style={[s.name, { color: p.text }]}>{item.title}</Text>
                <Text style={[s.subtitle, { color: p.muted }]}>
                  {item.kind === 'group'
                    ? `${item.metadata.member_count ?? '—'} members`
                    : item.metadata.subtype === 'organization'
                      ? 'Organization'
                      : String(item.metadata.relationship ?? 'Connection')}
                  {item.deviceOnly ? ' · On device' : ''}
                </Text>
              </View>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={15} tintColor={p.muted} />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120, maxWidth: 720, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8 },
  subtitle: { fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  add: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  search: { flex: 1, paddingHorizontal: 10, paddingVertical: 11, fontSize: 14 },
  filters: { gap: 8, paddingVertical: 14 },
  filter: { height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  filterText: { fontSize: 12.5, fontWeight: '600' },
  section: { fontSize: 12, fontWeight: '600', marginTop: 18, marginBottom: 8 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 66, borderRadius: 15, borderWidth: 1, marginBottom: 8 },
  avatar: { height: 40, width: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '700', fontSize: 14 },
  name: { fontSize: 15, fontWeight: '600' },
  empty: { padding: 20, borderRadius: 16, borderWidth: 1, gap: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
});
