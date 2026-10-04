import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';

import { EntityIcon } from '@/components/entity-icon';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { entityCatalog } from '@/data/entity-catalog';
import { isPreviewReviewMode } from '@/data/matrix-source';
import { matrixGroupColor, matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

const featured = ['Task', 'Note', 'Expense', 'Income', 'Workout', 'Meal', 'Medication', 'Sleep Log', 'Project', 'Habit', 'Document', 'Wish'];

const capture = [
  { label: 'Text', type: 'Note', ios: 'text.alignleft', other: 'notes' },
  { label: 'Voice', type: 'Note', ios: 'mic.fill', other: 'mic' },
  { label: 'Photo', type: 'Memory', ios: 'camera.fill', other: 'photo_camera' },
  { label: 'Scan', type: 'Document', ios: 'viewfinder', other: 'document_scanner' },
  { label: 'Link', type: 'Bookmark', ios: 'link', other: 'link' },
] as const;

const suggestions = [
  { title: 'Log Workout', type: 'Workout', copy: 'Capture exercise and sets', ios: 'figure.run', other: 'fitness_center', tone: '#37D6D2' },
  { title: 'Save Receipt', type: 'Expense', copy: 'Add purchase or bill', ios: 'doc.text.fill', other: 'receipt_long', tone: '#E9EDF3' },
  { title: 'Add Expense', type: 'Expense', copy: 'Track today’s spend', ios: 'indianrupeesign.circle.fill', other: 'payments', tone: '#FF8A52' },
] as const;

export default function AddScreen() {
  const { appearance } = useLifeOS();
  const p = matrixTheme(isPreviewReviewMode ? 'dark' : appearance);
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const columns = width >= 680 ? 4 : 4;
  const tileWidth = (Math.min(width, 640) - 28 - (columns - 1) * 8) / columns;
  const normalized = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (normalized) return entityCatalog.filter(item => `${item.name} ${item.group}`.toLowerCase().includes(normalized));
    if (showAll) return entityCatalog;
    return featured.map(name => entityCatalog.find(item => item.name === name)!).filter(Boolean);
  }, [normalized, showAll]);

  function open(type: string) {
    router.navigate({ pathname: '/entities', params: { type, request: String(Date.now()) } });
  }

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <FlatList
        key={columns}
        data={visible}
        keyExtractor={item => item.name}
        numColumns={columns}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={s.gridRow}
        contentContainerStyle={s.page}
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <View>
                <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Quick Add</Text>
                <Text style={[s.subtitle, { color: p.muted }]}>Capture anything. MATRIX will organize it.</Text>
              </View>
              <Pressable onPress={() => router.replace('/(tabs)')} style={[s.close, { backgroundColor: p.raised }]}>
                <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={17} tintColor={p.text} />
              </Pressable>
            </View>

            <View style={s.captureRow}>
              {capture.map(action => (
                <Pressable key={action.label} onPress={() => open(action.type)} style={s.captureItem}>
                  <View style={[s.captureIcon, { backgroundColor: p.card, borderColor: p.line }]}>
                    <SymbolView name={{ ios: action.ios, android: action.other, web: action.other }} size={18} tintColor={p.text} />
                  </View>
                  <Text style={[s.captureLabel, { color: p.muted }]}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={[s.inputShell, { backgroundColor: p.card, borderColor: query ? p.accent : p.line }]}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Add a task, log a meal, save a link..."
                placeholderTextColor={p.muted}
                style={[s.input, { color: p.text }]}
                returnKeyType="search"
              />
              <Pressable
                accessibilityLabel="Search add types"
                onPress={() => {
                  const first = visible[0];
                  if (first && query.trim()) open(first.name);
                }}
                style={[s.send, { backgroundColor: p.accent }]}
              >
                <SymbolView name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }} size={16} tintColor={p.onAccent} />
              </Pressable>
            </View>

            {!normalized ? (
              <>
                <View style={s.sectionHead}>
                  <Text style={[s.sectionTitle, { color: p.text }]}>Smart Suggestions</Text>
                  <Pressable onPress={() => setShowAll(true)}><Text style={[s.link, { color: p.accent }]}>See all</Text></Pressable>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.suggestions}>
                  {suggestions.map(card => (
                    <Pressable key={card.title} onPress={() => open(card.type)} style={[s.suggestion, { backgroundColor: p.card, borderColor: p.line }]}>
                      <View style={[s.suggestionIcon, { backgroundColor: `${card.tone}20` }]}>
                        <SymbolView name={{ ios: card.ios, android: card.other, web: card.other }} size={18} tintColor={card.tone} />
                      </View>
                      <Text style={[s.suggestionTitle, { color: p.text }]}>{card.title}</Text>
                      <Text style={[s.suggestionCopy, { color: p.muted }]}>{card.copy}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <View style={s.sectionHead}>
              <Text style={[s.sectionTitle, { color: p.text }]}>{normalized ? 'Search results' : showAll ? 'All categories' : 'Choose Category'}</Text>
              <Text style={[s.count, { color: p.muted }]}>{visible.length}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const domain = matrixGroupColor(item.group, isPreviewReviewMode ? 'dark' : appearance);
          return (
            <Pressable
              onPress={() => open(item.name)}
              style={({ pressed }) => [
                s.tile,
                { width: tileWidth, backgroundColor: p.card, borderColor: p.line },
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.78 },
              ]}
            >
              <View style={[s.tileIcon, { backgroundColor: domain.soft }]}>
                <EntityIcon type={item.name} size={19} color={domain.accent} />
              </View>
              <Text numberOfLines={1} style={[s.tileLabel, { color: p.text }]}>{item.name}</Text>
            </Pressable>
          );
        }}
        ListFooterComponent={
          !normalized ? (
            <Pressable onPress={() => setShowAll(v => !v)} style={[s.footerAction, { borderColor: p.line }]}>
              <Text style={[s.footerText, { color: p.accent }]}>{showAll ? 'Show quick categories' : `Browse all ${entityCatalog.length} types`}</Text>
              <SymbolView name={{ ios: showAll ? 'chevron.up' : 'chevron.down', android: showAll ? 'expand_less' : 'expand_more', web: showAll ? 'expand_less' : 'expand_more' }} size={15} tintColor={p.accent} />
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View style={[s.empty, { backgroundColor: p.card, borderColor: p.line }]}>
            <Text style={[s.emptyTitle, { color: p.text }]}>No matching category</Text>
            <Text style={[s.emptyText, { color: p.muted }]}>Try task, expense, meal, workout, vehicle, note, or trip.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 14, paddingTop: 5, paddingBottom: 118, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '750' as '700', letterSpacing: -0.8 },
  subtitle: { fontSize: 11.5, marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  captureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  captureItem: { alignItems: 'center', gap: 6, minWidth: 54 },
  captureIcon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  captureLabel: { fontSize: 9.5, fontWeight: '500' },
  inputShell: { minHeight: 54, borderRadius: 16, borderWidth: 1.5, paddingLeft: 13, paddingRight: 6, marginTop: 17, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 12.5, paddingVertical: 12 },
  send: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.25 },
  link: { fontSize: 10.5, fontWeight: '600' },
  count: { fontSize: 10.5 },
  suggestions: { gap: 8, paddingRight: 14 },
  suggestion: { width: 142, minHeight: 112, borderRadius: 17, borderWidth: 1, padding: 11 },
  suggestionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  suggestionTitle: { fontSize: 11.5, fontWeight: '650' as '600', marginTop: 11 },
  suggestionCopy: { fontSize: 9, lineHeight: 13, marginTop: 3 },
  gridRow: { gap: 8, marginBottom: 8 },
  tile: { minHeight: 82, borderRadius: 15, borderWidth: 1, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 7 },
  tileIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 9.8, fontWeight: '600', textAlign: 'center' },
  footerAction: { minHeight: 50, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  footerText: { fontSize: 11.5, fontWeight: '600' },
  empty: { borderRadius: 16, borderWidth: 1, padding: 18, alignItems: 'center' },
  emptyTitle: { fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 10.5, textAlign: 'center', marginTop: 4 },
});
