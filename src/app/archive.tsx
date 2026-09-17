import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LifeEntity, listArchivedEntities, setEntityArchived } from '@/data/lifeos-store';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function ArchiveScreen() {
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = { bg: dark ? '#091710' : '#F4F8F5', card: dark ? '#172B21' : '#FFFFFF', text: dark ? '#F3F8F5' : '#172D20', muted: dark ? '#A2B7AB' : '#637D6D' };
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listArchivedEntities()); setError(false); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  async function restore(item: LifeEntity) {
    setBusy(item.id);
    try { await setEntityArchived(item.id, false); await load(); }
    catch { Alert.alert('Could not restore', 'Your archived item is preserved. Please try again.'); }
    finally { setBusy(null); }
  }
  return <FlatList style={{ backgroundColor: p.bg }} contentContainerStyle={{ padding: 22, gap: 12, paddingBottom: 60 }}
    data={error ? [] : items.filter((item) => `${item.title} ${item.kind}`.toLowerCase().includes(query.trim().toLowerCase()))} keyExtractor={(item) => item.id}
    refreshing={loading} onRefresh={() => void load()}
    ListHeaderComponent={<View style={{ gap: 14, marginBottom: 8 }}><Text style={{ fontSize: 29, fontWeight: '800', color: p.text }}>Room for what’s next</Text><Text style={{ color: p.muted, lineHeight: 22 }}>Archived local items stay on this device, outside your active dashboard. Restore them with their details, relationships and privacy choices intact.</Text><TextInput accessibilityLabel="Search archived items" value={query} onChangeText={setQuery} placeholder="Search your archive…" placeholderTextColor={p.muted} style={{ backgroundColor: p.card, color: p.text, borderRadius: 16, padding: 15, minHeight: 50 }} /></View>}
    ListEmptyComponent={<Text style={{ color: p.muted, paddingVertical: 24 }}>{error ? 'Archive could not load. Pull down to retry.' : loading ? 'Loading archive…' : query ? 'No archived items match your search.' : 'Nothing archived yet. Archive an item from its detail screen.'}</Text>}
    renderItem={({ item }) => <View style={{ padding: 20, borderRadius: 22, backgroundColor: p.card, gap: 10 }}><Text style={{ color: p.text, fontSize: 18, fontWeight: '700' }}>{item.title}</Text><Text style={{ color: p.muted }}>{item.kind} · {item.deviceOnly ? 'Device only' : 'Saved locally'}</Text>{item.details ? <Text numberOfLines={3} style={{ color: p.muted, lineHeight: 21 }}>{item.details}</Text> : null}<Pressable accessibilityRole="button" accessibilityLabel={`Restore ${item.title}`} disabled={busy !== null} onPress={() => void restore(item)} style={{ minHeight: 44, justifyContent: 'center', opacity: busy ? 0.5 : 1 }}><Text style={{ color: dark ? '#68D9AB' : '#157952', fontWeight: '700' }}>{busy === item.id ? 'Restoring…' : 'Restore item →'}</Text></Pressable></View>} />;
}
