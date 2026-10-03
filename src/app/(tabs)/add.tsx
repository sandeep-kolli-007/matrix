import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';

import { EntityIcon } from '@/components/entity-icon';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { entityCatalog } from '@/data/entity-catalog';
import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

const modes = {
  Add: ['Task', 'Note', 'Event', 'Expense', 'Habit', 'Goal', 'Person', 'Place', 'Meal', 'Workout', 'Medication', 'Document', 'Vehicle', 'Asset', 'Trip', 'Purchase', 'Bill', 'Subscription', 'Wish', 'Project'],
  Log: ['Meal', 'Workout', 'Wardrobe Log', 'Water Log', 'Sleep Log', 'Mood Log', 'Cycle Log', 'Symptom', 'Expense', 'Practice', 'Journal', 'Check-in', 'Skincare', 'Grooming'],
  Plan: ['Task', 'Event', 'Meeting', 'Trip', 'Itinerary', 'Goal', 'Project', 'Milestone', 'Routine', 'Reminder', 'Budget', 'Packing List'],
  Remember: ['Note', 'Idea', 'Bookmark', 'Document', 'Person', 'Birthday', 'Anniversary', 'Memory', 'Quote', 'Book', 'Article', 'List'],
} as const;

type Mode = keyof typeof modes;
const accents = ['#4F8CFF', '#39B98A', '#B37FEB', '#E5A33D', '#3EB9CC', '#E56A73'];
const aliases: Record<string, string> = { Meal: 'Food', Medication: 'Medicine', Purchase: 'Shopping', 'Wardrobe Log': 'Dress log' };

export default function AddScreen() {
  const { width, fontScale } = useWindowDimensions();
  const columns = width >= 700 ? 4 : fontScale > 1.3 ? 2 : 3;
  const tileWidth = (Math.min(width, 720) - 40 - (columns - 1) * 10) / columns;
  const { appearance } = useLifeOS();
  const p = matrixTheme(appearance);
  const [mode, setMode] = useState<Mode>('Add');
  const [search, setSearch] = useState('');
  const [all, setAll] = useState(false);

  const query = search.trim().toLowerCase();
  const visible = query
    ? entityCatalog.filter(item => [item.name, aliases[item.name] ?? '', item.group].join(' ').toLowerCase().includes(query))
    : all
      ? entityCatalog
      : modes[mode].map(name => entityCatalog.find(item => item.name === name)!);

  function open(name: string) {
    router.push({ pathname: '/entities', params: { type: name, request: String(Date.now()) } });
  }

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <FlatList
        key={columns}
        data={visible}
        numColumns={columns}
        keyExtractor={item => item.name}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={s.row}
        contentContainerStyle={s.page}
        ListHeaderComponent={
          <View style={s.header}>
            <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Add</Text>
            <Text style={[s.subtitle, { color: p.muted }]}>Capture something in a few taps.</Text>

            <View style={[s.search, { backgroundColor: p.panel, borderColor: p.line }]}>
              <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={18} tintColor={p.muted} />
              <TextInput
                accessibilityLabel="Search what to add"
                value={search}
                onChangeText={setSearch}
                placeholder="Search types"
                placeholderTextColor={p.muted}
                style={[s.searchInput, { color: p.text }]}
                returnKeyType="search"
              />
              {search ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} style={s.clear}>
                  <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} size={18} tintColor={p.muted} />
                </Pressable>
              ) : null}
            </View>

            <View style={[s.segment, { backgroundColor: p.raised }]}>
              {(Object.keys(modes) as Mode[]).map(value => {
                const selected = value === mode && !all && !query;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => { setMode(value); setAll(false); setSearch(''); }}
                    style={[s.segmentItem, selected && { backgroundColor: p.panel }]}
                  >
                    <Text style={[s.segmentText, { color: selected ? p.text : p.muted }]}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.sectionRow}>
              <Text style={[s.sectionTitle, { color: p.text }]}>{query ? 'Results' : all ? 'All types' : mode}</Text>
              <Text style={[s.count, { color: p.muted }]}>{visible.length}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const color = accents[entityCatalog.indexOf(item) % accents.length];
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Create ${item.name}`}
              onPress={() => open(item.name)}
              style={({ pressed }) => [s.tile, { width: tileWidth, backgroundColor: p.panel, borderColor: p.line }, pressed && { opacity: 0.62 }]}
            >
              <View style={[s.icon, { backgroundColor: p.raised }]}>
                <EntityIcon type={item.name} size={23} color={color} />
              </View>
              <Text numberOfLines={2} style={[s.label, { color: p.text }]}>{aliases[item.name] ?? item.name}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[s.emptyTitle, { color: p.text }]}>No matching types</Text>
            <Text style={[s.emptyText, { color: p.muted }]}>Try task, meal, vehicle, workout, or note.</Text>
          </View>
        }
        ListFooterComponent={
          <Pressable
            accessibilityRole="button"
            onPress={() => { setAll(value => !value); setSearch(''); }}
            style={[s.allTypes, { borderColor: p.line }]}
          >
            <Text style={[s.allTypesText, { color: p.accent }]}>{all ? 'Back to quick add' : `Browse all ${entityCatalog.length} types`}</Text>
            <SymbolView name={{ ios: all ? 'arrow.up.left' : 'chevron.right', android: all ? 'arrow_back' : 'chevron_right', web: all ? 'arrow_back' : 'chevron_right' }} size={15} tintColor={p.accent} />
          </Pressable>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 16 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1.1 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingLeft: 14, minHeight: 50, marginTop: 22 },
  searchInput: { flex: 1, paddingHorizontal: 11, paddingVertical: 12, fontSize: 14 },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', padding: 3, borderRadius: 12, marginTop: 14 },
  segmentItem: { flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 13, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  count: { fontSize: 12 },
  row: { gap: 10, marginBottom: 10 },
  tile: { flexGrow: 0, minHeight: 102, borderRadius: 15, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', gap: 9 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12.5, fontWeight: '550' as '500', textAlign: 'center', lineHeight: 17 },
  empty: { paddingVertical: 36, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, marginTop: 5 },
  allTypes: { minHeight: 52, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  allTypesText: { fontSize: 14, fontWeight: '600' },
});
