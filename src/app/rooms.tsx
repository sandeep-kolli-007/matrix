import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { entityCatalog } from '@/data/entity-catalog';
import { LifeEntity, listEntities, saveEntity } from '@/data/lifeos-store';
import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

const rooms = {
  work: { title: 'Work', description: 'Tasks, projects and milestones.', icon: { ios: 'checkmark.circle', android: 'task_alt', web: 'task_alt' }, types: ['Task', 'Project', 'Milestone', 'Workflow', 'Note'] },
  habits: { title: 'Habits', description: 'Habits, routines and challenges.', icon: { ios: 'repeat', android: 'repeat', web: 'repeat' }, types: ['Habit', 'Routine', 'Challenge', 'Practice'] },
  goals: { title: 'Goals', description: 'Goals, milestones and progress.', icon: { ios: 'target', android: 'track_changes', web: 'track_changes' }, types: ['Goal', 'Financial Goal', 'Milestone', 'Challenge'] },
  money: { title: 'Money', description: 'Spending, budgets and accounts.', icon: { ios: 'indianrupeesign.circle', android: 'payments', web: 'payments' }, types: ['Expense', 'Income', 'Budget', 'Bill', 'Account', 'Subscription', 'Investment', 'Loan', 'Financial Goal', 'Insurance'] },
  body: { title: 'Health', description: 'Workouts, meals and health logs.', icon: { ios: 'heart', android: 'favorite', web: 'favorite' }, types: ['Workout', 'Meal', 'Recipe', 'Water Log', 'Sleep Log', 'Mood Log', 'Cycle Log', 'Symptom', 'Medication', 'Appointment', 'Skincare', 'Grooming'] },
  wardrobe: { title: 'Wardrobe', description: 'Outfits and wardrobe history.', icon: { ios: 'tshirt', android: 'checkroom', web: 'checkroom' }, types: ['Wardrobe Log'] },
  assets: { title: 'Assets', description: 'Assets, vehicles and documents.', icon: { ios: 'shippingbox', android: 'inventory_2', web: 'inventory_2' }, types: ['Asset', 'Property', 'Vehicle', 'Insurance', 'Document', 'Purchase'] },
  wishlist: { title: 'Wishlist', description: 'Things you want to buy or experience.', icon: { ios: 'heart.circle', android: 'favorite_border', web: 'favorite_border' }, types: ['Wish', 'Purchase', 'Trip', 'Book', 'Movie'] },
  learning: { title: 'Learning', description: 'Books, courses and learning.', icon: { ios: 'book', android: 'menu_book', web: 'menu_book' }, types: ['Book', 'Course', 'Lesson', 'Skill', 'Practice', 'Journal', 'Reflection', 'Article', 'Quote', 'Podcast'] },
  planning: { title: 'Planning', description: 'Events, trips and reminders.', icon: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }, types: ['Event', 'Meeting', 'Trip', 'Itinerary', 'Place', 'Packing List', 'Reservation', 'Reminder'] },
} as const;

type RoomKey = keyof typeof rooms;
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default function RoomsScreen() {
  const { room } = useLocalSearchParams<{ room?: string }>();
  const active = room && room in rooms ? rooms[room as RoomKey] : null;
  const { appearance } = useLifeOS();
  const p = matrixTheme(appearance);
  const [entities, setEntities] = useState<LifeEntity[]>([]);
  const [filter, setFilter] = useState('All');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setEntities(await listEntities());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh();
    setFilter('All');
  }, [refresh, room]));

  const roomItems = active ? entities.filter(item => active.types.some(name => slug(name) === item.kind)) : [];
  const items = filter === 'All' ? roomItems : roomItems.filter(item => item.kind === slug(filter));

  async function toggleComplete(item: LifeEntity) {
    if (busy) return;
    if (item.source) {
      Alert.alert('Read-only data', 'Connected records are read-only in this build.');
      return;
    }
    setBusy(item.id);
    try {
      await saveEntity({ ...item, metadata: { ...item.metadata, completed: !item.metadata.completed } });
      await refresh();
    } catch {
      Alert.alert('Could not update', 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View style={s.flex}>
          <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>{active?.title ?? 'Rooms'}</Text>
          <Text style={[s.subtitle, { color: p.muted }]}>{active?.description ?? 'Browse your life by area.'}</Text>
        </View>
        {active ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back to all rooms" onPress={() => router.replace('/rooms')} style={[s.iconButton, { backgroundColor: p.panel, borderColor: p.line }]}>
            <SymbolView name={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }} size={19} tintColor={p.text} />
          </Pressable>
        ) : null}
      </View>

      {!active ? (
        <View style={s.grid}>
          {Object.entries(rooms).map(([key, value]) => {
            const count = entities.filter(item => value.types.some(type => slug(type) === item.kind)).length;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                style={[s.room, { backgroundColor: p.panel, borderColor: p.line }]}
                onPress={() => router.push({ pathname: '/rooms', params: { room: key } })}
              >
                <View style={[s.roomIcon, { backgroundColor: p.raised }]}>
                  <SymbolView name={value.icon} size={22} tintColor={p.accent} />
                </View>
                <Text style={[s.roomTitle, { color: p.text }]}>{value.title}</Text>
                <Text style={[s.small, { color: p.muted }]}>{count} {count === 1 ? 'item' : 'items'}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <>
          {(room === 'planning' || room === 'work') ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/plans')} style={[s.linkRow, { borderColor: p.line }]}>
              <Text style={[s.linkTitle, { color: p.text }]}>Open scheduled plans</Text>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={15} tintColor={p.muted} />
            </Pressable>
          ) : null}

          {error ? (
            <Pressable onPress={() => void refresh()} style={[s.state, { backgroundColor: p.panel, borderColor: p.line }]}>
              <Text style={[s.stateTitle, { color: p.text }]}>Couldn’t load this room</Text>
              <Text style={[s.small, { color: p.muted }]}>Tap to try again.</Text>
            </Pressable>
          ) : null}

          <View style={[s.metrics, { backgroundColor: p.panel, borderColor: p.line }]}>
            {[
              ['Saved', roomItems.length],
              ['On device', roomItems.filter(item => item.deviceOnly).length],
              ['Completed', roomItems.filter(item => item.metadata.completed === true).length],
            ].map(([label, value], index) => (
              <View key={String(label)} style={[s.metric, index > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: p.line }]}>
                <Text style={[s.metricValue, { color: p.text }]}>{value}</Text>
                <Text style={[s.metricLabel, { color: p.muted }]}>{label}</Text>
              </View>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
            {['All', ...active.types].map(type => (
              <Pressable
                key={type}
                onPress={() => setFilter(type)}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === type }}
                style={[s.chip, { backgroundColor: filter === type ? p.selected : 'transparent', borderColor: filter === type ? p.accent : p.line }]}
              >
                <Text style={[s.chipText, { color: filter === type ? p.accent : p.muted }]}>{type}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={s.sectionHead}>
            <Text style={[s.sectionTitle, { color: p.text }]}>{filter === 'All' ? 'Items' : filter}</Text>
            <Pressable
              onPress={() => router.navigate({ pathname: '/entities', params: { type: filter === 'All' ? active.types[0] : filter, request: String(Date.now()) } })}
              style={[s.addButton, { backgroundColor: p.accent }]}
            >
              <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={16} tintColor={p.onAccent} />
              <Text style={{ color: p.onAccent, fontSize: 13, fontWeight: '600' }}>Add</Text>
            </Pressable>
          </View>

          {!items.length ? (
            <View style={[s.state, { backgroundColor: p.panel, borderColor: p.line }]}>
              <Text style={[s.stateTitle, { color: p.text }]}>Nothing here yet</Text>
              <Text style={[s.small, { color: p.muted }]}>Add your first {filter === 'All' ? 'item' : filter.toLowerCase()}.</Text>
            </View>
          ) : items.map(item => (
            <View key={item.id} style={[s.item, { backgroundColor: p.panel, borderColor: p.line }]}>
              {['task', 'milestone', 'goal'].includes(item.kind) ? (
                <Pressable accessibilityRole="checkbox" accessibilityLabel={`Complete ${item.title}`} accessibilityState={{ checked: item.metadata.completed === true, disabled: !!busy }} disabled={!!busy} onPress={() => void toggleComplete(item)} style={[s.check, { borderColor: item.metadata.completed ? p.accent : p.line, backgroundColor: item.metadata.completed ? p.selected : 'transparent' }]}>
                  {item.metadata.completed ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={14} tintColor={p.accent} /> : null}
                </Pressable>
              ) : (
                <View style={[s.typeIcon, { backgroundColor: p.raised }]}>
                  <Text style={{ color: p.accent, fontWeight: '700' }}>{String(item.metadata.entityType ?? item.kind).slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <Pressable accessibilityRole="button" style={s.itemBody} onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}>
                <Text numberOfLines={1} style={[s.itemTitle, { color: p.text }, item.metadata.completed === true && s.completed]}>{item.title}</Text>
                <Text numberOfLines={1} style={[s.small, { color: p.muted }]}>{String(item.metadata.entityType ?? item.kind)}{item.deviceOnly ? ' · On device' : ''}</Text>
              </Pressable>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={15} tintColor={p.muted} />
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 80, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  room: { width: '48.4%', minHeight: 132, padding: 16, borderRadius: 16, borderWidth: 1 },
  roomIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  roomTitle: { fontSize: 16, fontWeight: '600' },
  small: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  linkRow: { minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkTitle: { fontSize: 14, fontWeight: '500' },
  metrics: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, paddingVertical: 14 },
  metric: { flex: 1, paddingHorizontal: 14 },
  metricValue: { fontSize: 19, fontWeight: '600' },
  metricLabel: { fontSize: 11.5, marginTop: 3 },
  filters: { gap: 8, paddingVertical: 4 },
  chip: { height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  chipText: { fontSize: 12.5, fontWeight: '600' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  addButton: { minHeight: 40, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
  state: { padding: 20, borderRadius: 16, borderWidth: 1 },
  stateTitle: { fontSize: 16, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 15, padding: 12, minHeight: 66 },
  itemBody: { flex: 1, minHeight: 40, justifyContent: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  check: { height: 34, width: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  typeIcon: { height: 34, width: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  completed: { textDecorationLine: 'line-through', opacity: 0.55 },
});
