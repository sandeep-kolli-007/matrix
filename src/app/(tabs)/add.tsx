import { matrixTheme } from '@/data/matrix-theme';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { EntityIcon } from '@/components/entity-icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { entityCatalog } from '@/data/entity-catalog';
import { useLifeOS } from '@/providers/lifeos-provider';

const modes = {
  Add: ['Task', 'Note', 'Event', 'Expense', 'Habit', 'Goal', 'Person', 'Place', 'Meal', 'Workout', 'Medication', 'Document', 'Vehicle', 'Asset', 'Trip', 'Purchase', 'Bill', 'Subscription', 'Wish', 'Project'],
  Log: ['Meal', 'Workout', 'Wardrobe Log', 'Water Log', 'Sleep Log', 'Mood Log', 'Cycle Log', 'Symptom', 'Expense', 'Practice', 'Journal', 'Check-in', 'Skincare', 'Grooming'],
  Plan: ['Task', 'Event', 'Meeting', 'Trip', 'Itinerary', 'Goal', 'Project', 'Milestone', 'Routine', 'Reminder', 'Budget', 'Packing List'],
  Remember: ['Note', 'Idea', 'Bookmark', 'Document', 'Person', 'Birthday', 'Anniversary', 'Memory', 'Quote', 'Book', 'Article', 'List'],
} as const;
type Mode = keyof typeof modes;
const colors = ['#48C9A0', '#61A9ED', '#C480E3', '#E7A44B', '#4FC4D7', '#D3B959', '#818BE6', '#D07ABE'];
const aliases: Record<string, string> = { Meal: 'Food', Medication: 'Medicine', Purchase: 'Shopping', 'Wardrobe Log': 'Dress log' };

export default function AddScreen() {
  const { width, fontScale } = useWindowDimensions();
  const columns = width >= 600 ? 4 : fontScale > 1.3 ? 2 : 3;
  const tileWidth = (width - 40 - (columns - 1) * 12) / columns;
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = matrixTheme(appearance);
  const [mode, setMode] = useState<Mode>('Add');
  const [search, setSearch] = useState('');
  const [all, setAll] = useState(false);
  const query = search.trim().toLowerCase();
  const visible = query ? entityCatalog.filter(item => [item.name, aliases[item.name] ?? '', item.group].join(' ').toLowerCase().includes(query))
    : all ? entityCatalog : modes[mode].map(name => entityCatalog.find(item => item.name === name)!);
  function open(name: string) { router.push({ pathname: '/entities', params: { type: name, request: String(Date.now()) } }); }
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: p.bg }}>
    <FlatList key={columns} data={visible} numColumns={columns} keyExtractor={item => item.name} keyboardShouldPersistTaps="handled" columnWrapperStyle={s.row} contentContainerStyle={s.page}
      ListHeaderComponent={<View style={s.header}>
        <View style={s.titleRow}><View style={{ flex: 1 }}><Text style={[s.eyebrow, { color: p.accent }]}>M A T R I X</Text><Text style={[s.title, { color: p.text }]}>Add to your life</Text></View><View style={[s.spark, { backgroundColor: p.card, borderColor: p.line }]}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={26} tintColor={p.accent} /></View></View>
        <Text style={[s.subtitle, { color: p.muted }]}>One tap to capture. Everything in its place.</Text>
        <View style={[s.search, { backgroundColor: p.card, borderColor: p.line }]}><SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={19} tintColor={p.muted} /><TextInput accessibilityLabel="Search what to add" value={search} onChangeText={setSearch} placeholder="What would you like to add?" placeholderTextColor={p.muted} style={[s.searchInput, { color: p.text }]} returnKeyType="search" />{search ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} style={s.clear}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor={p.muted} /></Pressable> : null}</View>
        <View style={[s.tabs, { borderColor: p.line, backgroundColor: p.card }]}>{(Object.keys(modes) as Mode[]).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === mode && !all && !query }} onPress={() => { setMode(value); setAll(false); setSearch(''); }} style={[s.tab, { backgroundColor: value === mode && !all && !query ? p.accent : 'transparent' }]}><Text style={[s.tabText, { color: value === mode && !all && !query ? p.onAccent : p.muted }]}>{value}</Text></Pressable>)}</View>
        <View style={s.sectionRow}><Text style={[s.eyebrow, { color: p.muted }]}>{query ? 'SEARCH RESULTS' : all ? 'ALL ENTITY TYPES' : mode === 'Log' ? 'CAPTURE YOUR DAY' : mode === 'Plan' ? 'MAKE ROOM FOR WHAT’S NEXT' : mode === 'Remember' ? 'KEEP WHAT MATTERS' : 'WHAT WOULD YOU LIKE TO ADD?'}</Text><Text style={{ color: p.muted, fontSize: 11 }}>{visible.length}</Text></View>
      </View>}
      renderItem={({ item }) => { const color = colors[entityCatalog.indexOf(item) % colors.length]; return <Pressable accessibilityRole="button" accessibilityLabel={'Create ' + item.name} onPress={() => open(item.name)} style={({ pressed }) => [s.tile, { width: tileWidth, backgroundColor: p.card, borderColor: pressed ? p.accent : p.line, opacity: pressed ? 0.7 : 1 }]}>
        <View style={[s.icon, { backgroundColor: color + '14' }]}><EntityIcon type={item.name} size={26} color={color} /></View><Text style={[s.label, { color: p.text }]}>{aliases[item.name] ?? item.name}</Text>
      </Pressable>; }}
      ListEmptyComponent={<View style={s.empty}><Text style={{ color: p.text }}>No matching types</Text><Text style={{ color: p.muted }}>Try food, vehicle, workout, or note.</Text></View>}
      ListFooterComponent={<View style={s.footer}>
        <Pressable accessibilityRole="button" onPress={() => { setAll(value => !value); setSearch(''); }} style={[s.more, { backgroundColor: p.card, borderColor: p.line }]}><SymbolView name={{ ios: all ? 'arrow.left' : 'square.grid.2x2', android: all ? 'arrow_back' : 'apps', web: all ? 'arrow_back' : 'apps' }} size={20} tintColor={p.accent} /><Text style={{ color: p.text, fontSize: 14, fontWeight: '600' }}>{all ? 'Back to quick capture' : 'All ' + entityCatalog.length + ' entity types'}</Text></Pressable>
        <View style={[s.guide, { backgroundColor: p.card, borderColor: p.line }]}><SymbolView name={{ ios: 'arrow.turn.down.right', android: 'arrow_forward', web: 'arrow_forward' }} size={24} tintColor={p.accent} /><View style={{ flex: 1, gap: 5 }}><Text style={{ color: p.text, fontSize: 14 }}>Choose it. Capture it. Connect it.</Text><Text style={[s.help, { color: p.muted }]}>Tap a type to add details, connect related items, and choose device-only privacy.</Text></View></View>
        <Text style={[s.help, { color: p.muted, textAlign: 'center' }]}>Saved records appear in Timeline and Matrix.</Text>
      </View>} />
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { padding: 20, paddingBottom: 110 }, header: { gap: 15, marginBottom: 12 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 1.1 }, title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.7, marginTop: 7 }, subtitle: { fontSize: 14, lineHeight: 18 },
  spark: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 13, paddingLeft: 14, minHeight: 52 },
  searchInput: { flex: 1, padding: 12, fontSize: 13 }, clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, tabs: { flexDirection: 'row', padding: 4, borderWidth: 1, borderRadius: 14, gap: 3 }, tab: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, tabText: { fontSize: 13, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }, row: { gap: 12, marginBottom: 12 }, tile: { flexGrow: 0, minHeight: 108, paddingVertical: 16, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 9 }, icon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, label: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 18 }, footer: { gap: 16, marginTop: 8 }, more: { flexDirection: 'row', gap: 10, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12 }, guide: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1 }, help: { fontSize: 12, lineHeight: 18 }, empty: { paddingVertical: 25, gap: 8 },
});
