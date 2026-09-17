import { useMemo, useState } from 'react';
import { EntityIcon } from '@/components/entity-icon';
import { SymbolView } from 'expo-symbols';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { FlatList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRecords } from '@/components/use-records';
import { entityCatalog, entityGroups } from '@/data/entity-catalog';

export default function Matrix() {
  const { items, loading, error, reload, p } = useRecords();
  const [type, setType] = useState<string | null>(null);
  const [group, setGroup] = useState('All');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('Categories');
  const kind = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
  const counts = useMemo(() => { const map = new Map<string, number>(); for (const item of items) map.set(item.kind, (map.get(item.kind) ?? 0) + 1); return map; }, [items]);
  const records = items.filter(item => (!type || item.kind === kind(type)) && (group === 'All' || item.metadata.group === group) && `${item.title} ${item.details ?? ''} ${item.kind}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const categories = entityCatalog.filter(item => (group === 'All' || item.group === group) && item.name.toLowerCase().includes(query.toLowerCase()));
  const showRecords = Boolean(type) || mode === 'All records' || mode === 'Recent';
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: p.bg }}><FlatList data={showRecords ? records.map(item => ({ id: item.id, title: item.title, sub: `${String(item.metadata.entityType ?? item.kind)} · ${new Date(item.updatedAt).toLocaleDateString()}`, record: true })) : categories.map(item => ({ id: item.name, title: item.name, sub: `${counts.get(kind(item.name)) ?? 0} records · ${item.group}`, record: false }))} keyExtractor={item => item.id} refreshing={loading} onRefresh={reload} contentContainerStyle={{ padding: 20, gap: 9, paddingBottom: 100 }}
    ListHeaderComponent={<View style={{ gap: 14, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{type ? <Pressable accessibilityRole="button" onPress={() => setType(null)} style={{ padding: 12 }}><Text style={{ color: p.accent }}>‹</Text></Pressable> : null}<Text style={{ color: p.text, fontSize: 30, fontWeight: '700', flex: 1 }}>{type ?? 'Matrix'}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={{ padding: 12 }}><Text style={{ color: p.accent }}>Settings</Text></Pressable></View>
      <Text style={{ color: p.muted }}>Your entire life, across every date · {items.length} records</Text>
      <TextInput accessibilityLabel="Search Matrix" placeholder="Search people, places, things…" placeholderTextColor={p.muted} value={query} onChangeText={setQuery} style={{ color: p.text, backgroundColor: p.panel, padding: 15, minHeight: 50, borderRadius: 12 }} />
      {!type ? <><View style={{ flexDirection: 'row', gap: 8 }}>{['Categories', 'All records', 'Recent'].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: mode === value }} onPress={() => setMode(value)} style={{ padding: 12, minHeight: 44, borderRadius: 12, backgroundColor: mode === value ? p.accent : p.panel }}><Text style={{ color: mode === value ? p.onAccent : p.text }}>{value}</Text></Pressable>)}</View><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['All', ...entityGroups].map(value => <Pressable key={value} accessibilityRole="button" onPress={() => setGroup(value)} style={{ padding: 12, minHeight: 44 }}><Text style={{ color: group === value ? p.accent : p.muted }}>{value}</Text></Pressable>)}</View></> : <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/entities', params: { type, request: String(Date.now()) } })} style={{ padding: 15, backgroundColor: p.panel, borderRadius: 12 }}><Text style={{ color: p.accent }}>＋ Add {type}</Text></Pressable>}
    </View>}
    ListEmptyComponent={<Text style={{ color: p.muted }}>{error ? 'Unable to load records. Pull down to retry.' : loading ? 'Loading…' : 'No matches. Add an item or change your search.'}</Text>}
    renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => { if (item.record) router.push({ pathname: '/entities', params: { id: item.id } }); else { setType(item.id); setQuery(''); } }} style={{ padding: 18, borderRadius: 12, backgroundColor: p.panel, borderWidth: 1, borderColor: p.line, flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: p.raised, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><EntityIcon type={item.record ? String(items.find(record => record.id === item.id)?.metadata.entityType ?? '') : item.title} color={p.accent} /></View><View style={{ flex: 1, gap: 6 }}><Text style={{ color: p.text, fontSize: 16 }}>{item.title}</Text><Text style={{ color: p.muted, fontSize: 12 }}>{item.sub}</Text></View><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={16} tintColor={p.muted} /></Pressable>} /></SafeAreaView>;
}
