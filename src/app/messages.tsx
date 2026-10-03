import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { LifeEntity, listEntities, saveEntity } from '@/data/lifeos-store';
import { matrixTheme } from '@/data/matrix-theme';
import { messageThreads } from '@/data/message-threads';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function MessagesScreen({ groupsOnly = false, embedded = false }: { groupsOnly?: boolean; embedded?: boolean }) {
  const { appearance } = useLifeOS();
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
    const request = ++generation.current;
    setLoading(true);
    try {
      const data = await listEntities();
      if (request === generation.current) {
        setItems(data);
        setFailed(false);
      }
    } catch {
      if (request === generation.current) {
        setItems([]);
        setFailed(true);
      }
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { generation.current++; };
  }, [load]));

  const threads = useMemo(() => messageThreads(items).filter(thread => !groupsOnly || thread.group), [items, groupsOnly]);
  const selected = threads.find(thread => thread.id === selectedId);
  const draft = selected ? drafts[selected.id] ?? '' : '';
  const visible = threads.filter(thread =>
    `${thread.title} ${thread.preview}`.toLowerCase().includes(query.trim().toLowerCase())
    && (filter === 'All' || (filter === 'Groups' ? thread.group : filter === 'Unread' ? thread.unread : !thread.source)));

  async function saveDraft() {
    if (!selected || selected.source || !draft.trim() || sendLock.current) return;
    sendLock.current = true;
    setSending(true);
    const body = draft.trim();
    const id = selected.id;
    try {
      const saved = await saveEntity({
        kind: 'message',
        title: `Draft to ${selected.title}`,
        details: body,
        deviceOnly: true,
        metadata: { entityType: 'Message', group: 'People', threadId: id, recipient: selected.title, delivery: 'local' },
      });
      setItems(current => [...current, saved]);
      setDrafts(current => current[id]?.trim() === body ? { ...current, [id]: '' } : current);
    } catch {
      Alert.alert('Draft not saved', 'Your text is still here. Please try again.');
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  }

  if (selected) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: p.bg }]} edges={embedded ? [] : ['top']}>
        <KeyboardAvoidingView style={s.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[s.chatHeader, { borderBottomColor: p.line }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to conversations" onPress={() => setSelectedId(null)} style={s.backButton}>
              <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={p.text} />
            </Pressable>
            <View style={s.flex}>
              <Text style={[s.chatTitle, { color: p.text }]}>{selected.title}</Text>
              <Text style={[s.chatMeta, { color: p.muted }]}>{selected.source ? 'Stored conversation' : 'Local drafts · not delivered'}</Text>
            </View>
          </View>

          <FlatList
            data={selected.messages}
            keyExtractor={item => item.id}
            contentContainerStyle={s.messages}
            ListHeaderComponent={
              selected.recordId ? (
                <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { id: selected.recordId } })} style={[s.summary, { backgroundColor: p.panel, borderColor: p.line }]}>
                  <Text numberOfLines={3} style={[s.summaryText, { color: p.text }]}>{items.find(item => item.id === selected.recordId)?.details || 'No summary stored.'}</Text>
                  <Text style={[s.summaryLink, { color: p.accent }]}>Open conversation record</Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => {
              const outgoing = !item.source;
              return (
                <View style={[s.bubble, { backgroundColor: outgoing ? p.accent : p.panel, alignSelf: outgoing ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[s.bubbleText, { color: outgoing ? p.onAccent : p.text }]}>{item.details || item.title}</Text>
                  <Text style={[s.bubbleMeta, { color: outgoing ? '#DCE7FF' : p.muted }]}>{outgoing ? 'Saved locally · not delivered' : 'Stored message'}</Text>
                </View>
              );
            }}
          />

          {!selected.source ? (
            <View style={[s.composer, { borderTopColor: p.line }]}>
              <TextInput
                accessibilityLabel="Local message draft"
                multiline
                value={draft}
                onChangeText={value => setDrafts(current => ({ ...current, [selected.id]: value }))}
                placeholder="Write a local draft"
                placeholderTextColor={p.muted}
                style={[s.composerInput, { backgroundColor: p.panel, color: p.text, borderColor: p.line }]}
              />
              <Pressable accessibilityRole="button" disabled={sending || !draft.trim()} onPress={() => void saveDraft()} style={[s.saveButton, { backgroundColor: p.accent, opacity: sending || !draft.trim() ? 0.35 : 1 }]}>
                <SymbolView name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }} size={18} tintColor={p.onAccent} />
              </Pressable>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: p.bg }]} edges={embedded ? [] : ['top']}>
      <FlatList
        data={visible}
        keyExtractor={thread => thread.id}
        refreshing={loading}
        onRefresh={() => void load()}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <View>
            {!embedded ? <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Messages</Text> : null}
            <View style={[s.searchWrap, { backgroundColor: p.panel, borderColor: p.line }]}>
              <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={18} tintColor={p.muted} />
              <TextInput accessibilityLabel="Search conversations" value={query} onChangeText={setQuery} placeholder="Search conversations" placeholderTextColor={p.muted} style={[s.searchInput, { color: p.text }]} />
            </View>

            <View style={s.actions}>
              <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { type: 'Conversation', request: String(Date.now()) } })} style={[s.newButton, { backgroundColor: p.accent }]}>
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={16} tintColor={p.onAccent} />
                <Text style={{ color: p.onAccent, fontSize: 13, fontWeight: '600' }}>New</Text>
              </Pressable>
              {['All', 'Local', 'Groups', 'Unread'].map(value => (
                <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={[s.filter, { backgroundColor: filter === value ? p.selected : 'transparent', borderColor: filter === value ? p.accent : p.line }]}>
                  <Text style={[s.filterText, { color: filter === value ? p.accent : p.muted }]}>{value}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[s.empty, { backgroundColor: p.panel, borderColor: p.line }]}>
            <Text style={[s.emptyTitle, { color: p.text }]}>{failed ? 'Couldn’t load conversations' : loading ? 'Loading…' : 'No conversations'}</Text>
            {!loading ? <Text style={[s.emptyText, { color: p.muted }]}>Create a local conversation or change the filter.</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => setSelectedId(item.id)} style={[s.thread, { backgroundColor: p.panel, borderColor: p.line }]}>
            <View style={[s.avatar, { backgroundColor: p.raised }]}>
              <Text style={[s.avatarText, { color: p.accent }]}>{item.group ? 'G' : item.title.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={s.flex}>
              <View style={s.threadTop}>
                <Text numberOfLines={1} style={[s.threadTitle, { color: p.text }]}>{item.title}</Text>
                {item.unread ? <View style={[s.unread, { backgroundColor: p.accent }]} /> : null}
              </View>
              <Text numberOfLines={1} style={[s.threadPreview, { color: p.muted }]}>{item.preview || 'No messages yet'}</Text>
            </View>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={15} tintColor={p.muted} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  list: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 110, maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8, marginBottom: 14 },
  searchWrap: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingLeft: 14, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, paddingHorizontal: 10, paddingVertical: 11, fontSize: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 14 },
  newButton: { minHeight: 36, borderRadius: 18, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 4 },
  filter: { height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, justifyContent: 'center' },
  filterText: { fontSize: 12.5, fontWeight: '600' },
  thread: { minHeight: 68, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
  threadTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  threadTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  threadPreview: { fontSize: 12.5, marginTop: 4 },
  unread: { width: 7, height: 7, borderRadius: 4 },
  empty: { borderRadius: 16, borderWidth: 1, padding: 20, marginTop: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  chatHeader: { minHeight: 62, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  chatTitle: { fontSize: 17, fontWeight: '600' },
  chatMeta: { fontSize: 11.5, marginTop: 2 },
  messages: { padding: 20, gap: 10, maxWidth: 720, width: '100%', alignSelf: 'center' },
  summary: { borderRadius: 15, borderWidth: 1, padding: 16, marginBottom: 10 },
  summaryText: { fontSize: 13, lineHeight: 20 },
  summaryLink: { fontSize: 12.5, fontWeight: '600', marginTop: 10 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11, maxWidth: '84%' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleMeta: { fontSize: 10.5, marginTop: 5 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, padding: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  composerInput: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 16, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14 },
  saveButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
