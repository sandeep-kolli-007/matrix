import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { entityCatalog } from '@/data/entity-catalog';
import { LifeEntity, listEntities, saveEntity } from '@/data/lifeos-store';
import { useLifeOS } from '@/providers/lifeos-provider';

const rooms = {
  work: { title: 'Work & Tasks', description: 'Make space for your most meaningful work.', icon: '✓', color: '#65A8FA', types: ['Task', 'Project', 'Milestone', 'Workflow', 'Note'] },
  habits: { title: 'Habit Room', description: 'Small actions. A more intentional day.', icon: '↻', color: '#43CCA3', types: ['Habit', 'Routine', 'Challenge', 'Practice'] },
  goals: { title: 'Goals Room', description: 'Connect today’s actions to tomorrow’s possibilities.', icon: '◎', color: '#B094F5', types: ['Goal', 'Financial Goal', 'Milestone', 'Challenge'] },
  money: { title: 'Money Room', description: 'Know where your money goes and what it makes possible.', icon: '₹', color: '#5AC8A4', types: ['Expense', 'Income', 'Budget', 'Bill', 'Account', 'Subscription', 'Investment', 'Loan', 'Financial Goal', 'Insurance'] },
  body: { title: 'Body Room', description: 'A little care for the person behind the plans.', icon: '♥', color: '#F4889C', types: ['Workout', 'Meal', 'Recipe', 'Water Log', 'Sleep Log', 'Mood Log', 'Cycle Log', 'Symptom', 'Medication', 'Appointment', 'Skincare', 'Grooming'] },
  wardrobe: { title: 'Wardrobe', description: 'What you wore, where you went, and how it felt.', icon: '◇', color: '#A5D957', types: ['Wardrobe Log'] },
  assets: { title: 'Asset Hub', description: 'Everything you own, with the details that matter.', icon: '▣', color: '#76B9E6', types: ['Asset', 'Property', 'Vehicle', 'Insurance', 'Document', 'Purchase'] },
  wishlist: { title: 'Wishlist Room', description: 'Keep a little space for someday.', icon: '☆', color: '#F3BA6F', types: ['Wish', 'Purchase', 'Trip', 'Book', 'Movie'] },
  learning: { title: 'Learning & Growth', description: 'Follow your curiosity, one discovery at a time.', icon: '✦', color: '#C195F1', types: ['Book', 'Course', 'Lesson', 'Skill', 'Practice', 'Journal', 'Reflection', 'Article', 'Quote', 'Podcast'] },
  planning: { title: 'Plans & Moments', description: 'Give the things you look forward to a place.', icon: '▦', color: '#859EEB', types: ['Event', 'Meeting', 'Trip', 'Itinerary', 'Place', 'Packing List', 'Reservation', 'Reminder'] },
} as const;

type RoomKey = keyof typeof rooms;
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default function RoomsScreen() {
  const { room } = useLocalSearchParams<{ room?: string }>();
  const active = room && room in rooms ? rooms[room as RoomKey] : null;
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = { bg: dark ? '#07110F' : '#F6F9F7', card: dark ? '#14251D' : '#FFFFFF', text: dark ? '#F4F8F5' : '#173122', muted: dark ? '#9CB4A6' : '#667D6F', line: dark ? '#2A4234' : '#DFEAE3' };
  const [entities, setEntities] = useState<LifeEntity[]>([]);
  const [filter, setFilter] = useState('All');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    try { setEntities(await listEntities()); setError(false); }
    catch { setError(true); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); setFilter('All'); }, [refresh, room]));
  const roomItems = active ? entities.filter((item) => active.types.some((name) => slug(name) === item.kind)) : [];
  const items = filter === 'All' ? roomItems : roomItems.filter((item) => item.kind === slug(filter));
  async function toggleComplete(item: LifeEntity) {
    if (busy) return;
    if (item.source) { Alert.alert('Read-only data', 'Connected records are read-only during this review.'); return; }
    setBusy(item.id);
    try {
      await saveEntity({ ...item, metadata: { ...item.metadata, completed: !item.metadata.completed } });
      await refresh();
    } catch { Alert.alert('Could not update', 'Please try again.'); }
    finally { setBusy(null); }
  }
  return <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={s.page}>
    <Text style={[s.overline, { color: p.muted }]}>YOUR LIFE, IN FOCUS</Text>
    <Text style={[s.title, { color: p.text }]}>{active?.title ?? 'Your rooms'}</Text>
    <Text style={[s.description, { color: p.muted }]}>{active?.description ?? 'A quiet place for every part of your life.'}</Text>
    {!active ? <Pressable accessibilityRole="button" onPress={() => router.push('/explore')} style={[s.chip, { backgroundColor: p.card }]}><Text style={{ color: p.text }}>Explore connections across your rooms →</Text></Pressable> : null}
    {room === 'planning' || room === 'work' ? <Pressable accessibilityRole="button" onPress={() => router.push('/plans')} style={s.retry}><Text style={{ color: p.text }}>Open daily agenda & overdue plans →</Text></Pressable> : null}
    {error ? <Pressable onPress={() => void refresh()} style={s.retry}><Text style={{ color: p.text }}>Could not load your items. Tap to retry.</Text></Pressable> : null}
    {!active ? <View style={s.grid}>{Object.entries(rooms).map(([key, value]) => {
      const count = entities.filter((item) => value.types.some((type) => slug(type) === item.kind)).length;
      return <Pressable key={key} accessibilityRole="button" style={[s.room, { backgroundColor: p.card, borderColor: p.line }]} onPress={() => router.push({ pathname: '/rooms', params: { room: key } })}><Text style={[s.icon, { color: value.color }]}>{value.icon}</Text><Text style={[s.roomTitle, { color: p.text }]}>{value.title}</Text><Text style={[s.small, { color: p.muted }]}>{count} saved items</Text></Pressable>;
    })}</View> : <>
      <View style={s.metrics}>
        <View style={[s.metric, { backgroundColor: p.card }]}><Text style={[s.number, { color: active.color }]}>{roomItems.length}</Text><Text style={[s.small, { color: p.muted }]}>Saved items</Text></View>
        <View style={[s.metric, { backgroundColor: p.card }]}><Text style={[s.number, { color: active.color }]}>{roomItems.filter((item) => item.deviceOnly).length}</Text><Text style={[s.small, { color: p.muted }]}>Device only</Text></View>
        <View style={[s.metric, { backgroundColor: p.card }]}><Text style={[s.number, { color: active.color }]}>{roomItems.filter((item) => item.metadata.completed === true).length}</Text><Text style={[s.small, { color: p.muted }]}>Completed</Text></View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{['All', ...active.types].map((type) => <Pressable key={type} onPress={() => setFilter(type)} accessibilityRole="button" accessibilityState={{ selected: filter === type }} style={[s.chip, { backgroundColor: filter === type ? active.color : p.card }]}><Text style={{ color: filter === type ? '#0A2417' : p.text, fontSize: 12, fontWeight: '600' }}>{type}</Text></Pressable>)}</ScrollView>
      <View style={s.heading}><Text style={[s.section, { color: p.text }]}>{filter === 'All' ? 'In this room' : filter}</Text><Pressable onPress={() => router.navigate({ pathname: '/entities', params: { type: filter === 'All' ? active.types[0] : filter, request: String(Date.now()) } })} style={[s.add, { backgroundColor: active.color }]}><Text style={s.addText}>＋ Add</Text></Pressable></View>
      {!items.length ? <View style={[s.empty, { backgroundColor: p.card, borderColor: p.line }]}><Text style={[s.icon, { color: active.color }]}>{active.icon}</Text><Text style={[s.roomTitle, { color: p.text }]}>A fresh start</Text><Text style={[s.description, { color: p.muted }]}>Add your first {filter === 'All' ? 'item' : filter.toLowerCase()} to make this space yours.</Text></View> : items.map((item) => <View key={item.id} style={[s.item, { backgroundColor: p.card, borderColor: p.line }]}>
        {['task', 'milestone', 'goal'].includes(item.kind) ? <Pressable accessibilityRole="checkbox" accessibilityLabel={`Complete ${item.title}`} accessibilityState={{ checked: item.metadata.completed === true, disabled: !!busy }} disabled={!!busy} onPress={() => void toggleComplete(item)} style={[s.check, { borderColor: active.color }]}><Text style={{ color: active.color }}>{item.metadata.completed ? '✓' : ''}</Text></Pressable> : null}
        <Pressable accessibilityRole="button" style={s.itemBody} onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}><Text style={[s.itemTitle, { color: p.text }, item.metadata.completed === true && s.completed]}>{item.title}</Text><Text style={[s.small, { color: p.muted }]}>{String(item.metadata.entityType ?? item.kind)}{item.deviceOnly ? ' · Private' : ''}</Text>{item.details ? <Text numberOfLines={2} style={[s.small, { color: p.muted }]}>{item.details}</Text> : null}</Pressable><Text style={{ color: p.muted }}>›</Text>
      </View>)}
      <Text style={[s.section, { color: p.text, marginTop: 12 }]}>Capture something new</Text>
      <View style={s.types}>{active.types.map((name) => <Pressable key={name} onPress={() => router.navigate({ pathname: '/entities', params: { type: name, request: String(Date.now()) } })} style={[s.chip, { backgroundColor: p.card }]}><Text style={{ color: p.text, fontSize: 13 }}>{entityCatalog.find((item) => item.name === name)?.icon} {name}</Text></Pressable>)}</View>
    </>}
  </ScrollView>;
}

const s = StyleSheet.create({ page: { padding: 22, paddingBottom: 60, gap: 15 }, overline: { fontSize: 10, fontWeight: '800', letterSpacing: 2 }, title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 }, description: { fontSize: 14, lineHeight: 21 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, room: { width: '48%', padding: 19, borderRadius: 22, borderWidth: 1, minHeight: 160, gap: 9 }, icon: { fontSize: 30, fontWeight: '700' }, roomTitle: { fontSize: 17, fontWeight: '700' }, small: { fontSize: 12, lineHeight: 18, marginTop: 3 }, metrics: { flexDirection: 'row', gap: 10, marginTop: 4 }, metric: { flex: 1, padding: 15, borderRadius: 18 }, number: { fontSize: 25, fontWeight: '800' }, filters: { gap: 8, paddingVertical: 5 }, chip: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: 20 }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, section: { fontSize: 19, fontWeight: '800' }, add: { borderRadius: 15, paddingVertical: 10, paddingHorizontal: 16 }, addText: { color: '#0A2417', fontSize: 13, fontWeight: '800' }, empty: { padding: 28, borderRadius: 22, borderWidth: 1, alignItems: 'center', gap: 12 }, item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 19, padding: 16 }, itemBody: { flex: 1, minHeight: 44, justifyContent: 'center' }, itemTitle: { fontSize: 15, fontWeight: '700' }, check: { height: 30, width: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, completed: { textDecorationLine: 'line-through', opacity: 0.6 }, types: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, retry: { padding: 18 } });
