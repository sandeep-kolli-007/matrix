import { matrixTheme } from '@/data/matrix-theme';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LifeEntity, listEntities, saveEntity } from '@/data/lifeos-store';
import { messageThreads } from '@/data/message-threads';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function MessagesScreen({ groupsOnly = false, embedded = false }: { groupsOnly?: boolean; embedded?: boolean }) {
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = matrixTheme(appearance);
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const sendLock = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const request = ++generation.current; setLoading(true);
    try { const data = await listEntities(); if (request === generation.current) { setItems(data); setFailed(false); } }
    catch { if (request === generation.current) { setItems([]); setFailed(true); } }
    finally { if (request === generation.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));
  const threads = useMemo(() => messageThreads(items).filter(thread => !groupsOnly || thread.group), [items, groupsOnly]);
  const selected = threads.find((thread) => thread.id === selectedId);
  const draft = selected ? drafts[selected.id] ?? '' : '';
  const visible = threads.filter((thread) => `${thread.title} ${thread.preview}`.toLowerCase().includes(query.trim().toLowerCase()) && (filter === 'All' || (filter === 'Groups' ? thread.group : filter === 'Unread' ? thread.unread : !thread.source)));
  async function saveDraft() {
    if (!selected || selected.source || !draft.trim() || sendLock.current) return;
    sendLock.current = true; setSending(true);
    const body = draft.trim(); const id = selected.id;
    try {
      const saved = await saveEntity({ kind: 'message', title: `Draft to ${selected.title}`, details: body, deviceOnly: true, metadata: { entityType: 'Message', group: 'People', threadId: id, recipient: selected.title, delivery: 'local' } });
      setItems((current) => [...current, saved]);
      setDrafts((current) => current[id]?.trim() === body ? { ...current, [id]: '' } : current);
    } catch { Alert.alert('Draft not saved', 'Your text is still here. Please try again.'); }
    finally { sendLock.current = false; setSending(false); }
  }
  const button = { minHeight: 44, padding: 12, justifyContent: 'center' as const };
  if (selected) return <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={embedded ? [] : ['top']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}><Pressable accessibilityRole="button" accessibilityLabel="Back to conversations" onPress={() => setSelectedId(null)} style={button}><Text style={{ color: p.text, fontSize: 24 }}>‹</Text></Pressable><View style={{ flex: 1 }}><Text style={{ color: p.text, fontSize: 19, fontWeight: '700' }}>{selected.title}</Text><Text style={{ color: p.muted }}>{selected.source ? 'Stored conversation' : 'Local drafts · not delivered'}</Text></View></View>
      <FlatList data={selected.messages} keyExtractor={(item) => item.id} contentContainerStyle={{ padding: 20, gap: 14 }}
        ListHeaderComponent={<View style={{ gap: 12, marginBottom: 18 }}><Text style={{ color: p.muted, lineHeight: 21 }}>{selected.source ? 'This source contains a saved conversation summary, not a complete live chat history. Delivery, calls and read receipts are not connected.' : 'Messages here stay on this device. Saving a draft does not send it to anyone.'}</Text>{selected.recordId ? <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { id: selected.recordId } })} style={{ padding: 20, borderRadius: 20, backgroundColor: p.panel }}><Text style={{ color: p.text, lineHeight: 22 }}>{items.find((item) => item.id === selected.recordId)?.details || 'No summary stored.'}</Text><Text style={{ color: p.accent, marginTop: 14 }}>Open conversation record →</Text></Pressable> : null}</View>}
        renderItem={({ item }) => <View style={{ backgroundColor: item.source ? p.panel : '#146B4E', borderRadius: 20, padding: 16, alignSelf: item.source ? 'flex-start' : 'flex-end', maxWidth: '92%', gap: 8 }}><Text style={{ color: item.source ? p.text : '#FFFFFF', lineHeight: 22 }}>{item.details || item.title}</Text><Text style={{ color: item.source ? p.muted : '#D1E9DD', fontSize: 11 }}>{item.source ? 'Stored message' : 'Saved locally · not delivered'}</Text></View>} />
      {!selected.source ? <View style={{ flexDirection: 'row', padding: 12, gap: 8, alignItems: 'center' }}><TextInput accessibilityLabel="Local message draft" multiline value={draft} onChangeText={(value) => setDrafts((current) => ({ ...current, [selected.id]: value }))} placeholder="Write a local draft…" placeholderTextColor={p.muted} style={{ flex: 1, minHeight: 48, maxHeight: 140, padding: 14, borderRadius: 20, backgroundColor: p.panel, color: p.text }} /><Pressable accessibilityRole="button" disabled={sending || !draft.trim()} onPress={() => void saveDraft()} style={{ ...button, opacity: sending || !draft.trim() ? 0.4 : 1 }}><Text style={{ color: p.accent, fontWeight: '700' }}>Save</Text></Pressable></View> : null}
    </KeyboardAvoidingView>
  </SafeAreaView>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={embedded ? [] : ['top']}><FlatList data={visible} keyExtractor={(thread) => thread.id} refreshing={loading} onRefresh={() => void load()} contentContainerStyle={{ padding: 22, gap: 10, paddingBottom: 100 }}
    ListHeaderComponent={<View style={{ gap: 16, marginBottom: 10 }}>{!embedded ? <Text style={{ color: p.text, fontSize: 32, fontWeight: '800' }}>Messages</Text> : null}<Text style={{ color: p.muted }}>Your conversations, with context.</Text><Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { type: 'Conversation', request: String(Date.now()) } })} style={button}><Text style={{ color: p.accent, fontWeight: '700' }}>＋ New local conversation</Text></Pressable><TextInput accessibilityLabel="Search conversations" value={query} onChangeText={setQuery} placeholder="Search conversations…" placeholderTextColor={p.muted} style={{ minHeight: 50, padding: 15, borderRadius: 18, color: p.text, backgroundColor: p.panel }} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['All', 'Local', 'Groups', 'Unread'].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={{ ...button, borderRadius: 18, backgroundColor: filter === value ? '#146B4E' : p.panel }}><Text style={{ color: filter === value ? '#FFFFFF' : p.text }}>{value}</Text></Pressable>)}</View></View>}
    ListEmptyComponent={<Text style={{ color: p.muted, padding: 20, lineHeight: 22 }}>{failed ? 'Could not load conversations. Pull down to retry.' : loading ? 'Loading…' : 'No conversations match this view. Create a local conversation or choose a different data source.'}</Text>}
    renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => setSelectedId(item.id)} style={{ flexDirection: 'row', backgroundColor: p.panel, borderRadius: 20, padding: 18, gap: 14, alignItems: 'center' }}><View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#B5DBCA', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#163727', fontWeight: '800' }}>{item.group ? '♧' : item.title.slice(0, 2).toUpperCase()}</Text></View><View style={{ flex: 1, gap: 6 }}><Text style={{ color: p.text, fontSize: 16, fontWeight: '700' }}>{item.title}</Text><Text numberOfLines={2} style={{ color: p.muted, lineHeight: 20 }}>{item.preview || 'No messages yet'}</Text></View>{item.unread ? <Text accessibilityLabel="Marked unread in source" style={{ color: p.accent }}>●</Text> : null}</Pressable>} /></SafeAreaView>;
}
