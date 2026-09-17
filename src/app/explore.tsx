import { matrixTheme } from '@/data/matrix-theme';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { relationshipIndex } from '@/data/entity-relations';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function ExploreScreen() {
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = matrixTheme(appearance);
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [query, setQuery] = useState('');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const token = ++request.current;
    setLoading(true);
    try {
      const result = await listEntities();
      if (token !== request.current) return;
      setItems(result.filter(item => !item.archivedAt)); setError(false);
    } catch { if (token === request.current) setError(true); }
    finally { if (token === request.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { request.current++; };
  }, [refresh]));
  const links = useMemo(() => relationshipIndex(items), [items]);
  const selected = items.find(item => item.id === focusId);
  const linkedIds = selected ? links.get(selected.id) : undefined;
  const rows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return items.filter(item => (!selected || linkedIds?.has(item.id))
      && (!linkedOnly || (links.get(item.id)?.size ?? 0) > 0)
      && (!needle || [item.title, item.kind, item.details ?? ''].some(value => value.toLocaleLowerCase().includes(needle))));
  }, [items, selected, linkedIds, linkedOnly, links, query]);
  const totalLinks = [...links.values()].reduce((sum, ids) => sum + ids.size, 0) / 2;
  const open = (item: LifeEntity) => router.navigate({ pathname: '/entities', params: { id: item.id } });
  return <View style={[s.page, { backgroundColor: p.bg }]}>
    <FlatList data={error ? [] : rows} keyExtractor={item => item.id} contentContainerStyle={s.content}
      refreshing={loading} onRefresh={() => void refresh()} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={s.header}>
        <Text style={[s.overline, { color: p.accent }]}>YOUR CONNECTED LIFE</Text>
        <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Explore relationships</Text>
        <Text style={[s.copy, { color: p.muted }]}>{items.length} records · {totalLinks} connections. Links are shown in both directions.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/entities')} style={[s.button, { borderColor: p.line }]}><Text style={{ color: p.accent }}>Browse all 72 types & add an item →</Text></Pressable>
        <TextInput accessibilityLabel="Search records and relationships" placeholder="Search title, type, or notes…" placeholderTextColor={p.muted}
          value={query} onChangeText={setQuery} style={[s.search, { color: p.text, backgroundColor: p.card, borderColor: p.line }]} />
        <View style={s.filters}>{[false, true].map(value => <Pressable key={String(value)} accessibilityRole="button" accessibilityState={{ selected: value === linkedOnly }}
          onPress={() => setLinkedOnly(value)} style={[s.button, { backgroundColor: value === linkedOnly ? p.accent : p.card, borderColor: p.line }]}>
          <Text style={{ color: value === linkedOnly ? (dark ? '#07110F' : '#fff') : p.text }}>{value ? 'Connected' : 'All records'}</Text>
        </Pressable>)}</View>
        {selected ? <View style={[s.focus, { backgroundColor: p.card, borderColor: p.accent }]}>
          <Text style={[s.overline, { color: p.muted }]}>EXPLORING FROM</Text>
          <Text style={[s.name, { color: p.text }]}>{selected.title}</Text>
          <Text style={[s.copy, { color: p.muted }]}>{linkedIds?.size ?? 0} related records{selected.deviceOnly ? ' · Device only' : ''}</Text>
          <View style={s.filters}>
            <Pressable accessibilityRole="button" onPress={() => open(selected)} style={s.button}><Text style={{ color: p.accent }}>View / edit details →</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setFocusId(null); setQuery(''); }} style={s.button}><Text style={{ color: p.text }}>Show all</Text></Pressable>
          </View>
        </View> : <Text style={[s.copy, { color: p.muted }]}>Choose “Explore links” on any record to follow its connections. Add relationships from a record’s edit screen.</Text>}
        <Text style={[s.copy, { color: p.muted }]}>{error ? 'Records unavailable' : rows.length + ' results'}</Text>
      </View>}
      ListEmptyComponent={loading ? <ActivityIndicator color={p.accent} /> : <View style={[s.focus, { backgroundColor: p.card, borderColor: p.line }]}>
        <Text style={[s.name, { color: p.text }]}>{error ? 'Could not load your records' : selected ? 'No matching connections' : 'No matching records'}</Text>
        <Text style={[s.copy, { color: p.muted }]}>{error ? 'Your saved data has not been changed.' : 'Try another search or add a record and link it to something in your life.'}</Text>
        {error ? <Pressable accessibilityRole="button" onPress={() => void refresh()} style={s.button}><Text style={{ color: p.accent }}>Retry</Text></Pressable> : null}
      </View>}
      renderItem={({ item }) => <View style={[s.row, { backgroundColor: p.card, borderColor: p.line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Open ' + item.title} onPress={() => open(item)} style={s.record}>
          <Text style={[s.name, { color: p.text }]}>{item.title}</Text>
          <Text style={[s.copy, { color: p.muted }]}>{String(item.metadata.entityType ?? item.kind)}{item.deviceOnly ? ' · Device only' : ''}{item.source ? ' · Read only' : ''}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={'Explore links for ' + item.title}
          onPress={() => { setFocusId(item.id); setQuery(''); setLinkedOnly(false); }} style={[s.linkButton, { borderColor: p.line }]}>
          <Text style={{ color: p.accent }}>Explore links · {links.get(item.id)?.size ?? 0} →</Text>
        </Pressable>
      </View>} />
  </View>;
}

const s = StyleSheet.create({
  page: { flex: 1 }, content: { padding: 22, paddingBottom: 60 }, header: { gap: 16, marginBottom: 18 },
  overline: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  copy: { fontSize: 14, lineHeight: 21 }, search: { minHeight: 50, padding: 14, borderRadius: 15, borderWidth: 1, fontSize: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, button: { minHeight: 44, padding: 12, borderRadius: 14, borderWidth: 0 },
  focus: { padding: 18, borderRadius: 20, borderWidth: 1, gap: 12 }, row: { marginBottom: 12, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  record: { padding: 18, gap: 6, minHeight: 70 }, name: { fontSize: 17, fontWeight: '700' },
  linkButton: { padding: 16, minHeight: 48, borderTopWidth: 1 },
});
