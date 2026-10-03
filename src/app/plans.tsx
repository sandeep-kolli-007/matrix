import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { EntityDatePicker } from '@/components/entity-date-picker';
import { PlansCalendar } from '@/components/plans-calendar';
import { formatLocalDate } from '@/data/entity-date';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { matrixTheme } from '@/data/matrix-theme';
import { occursOn, scheduledDate } from '@/data/planning';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function PlansScreen() {
  const { appearance } = useLifeOS();
  const p = matrixTheme(appearance);
  const [day, setDay] = useState(() => formatLocalDate(new Date()));
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [overdue, setOverdue] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listEntities());
      setError(false);
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const shown = items.filter(item => {
    const date = scheduledDate(item);
    return date && (
      overdue
        ? ['task', 'bill', 'milestone', 'goal'].includes(item.kind) && item.metadata.completed !== true && date < formatLocalDate(new Date())
        : occursOn(item, day)
    );
  }).sort((a, b) =>
    scheduledDate(a)!.localeCompare(scheduledDate(b)!)
    || String(a.metadata.time || '99:99').localeCompare(String(b.metadata.time || '99:99')));

  function shift(offset: number) {
    const date = new Date(`${day}T12:00:00`);
    date.setDate(date.getDate() + offset);
    setDay(formatLocalDate(date));
    setOverdue(false);
  }

  return (
    <FlatList
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={s.page}
      data={shown}
      keyExtractor={item => item.id}
      refreshing={loading}
      onRefresh={() => void load()}
      ListHeaderComponent={
        <View style={s.header}>
          <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Plans</Text>
          <Text style={[s.subtitle, { color: p.muted }]}>Tasks, events and reminders by date.</Text>

          <PlansCalendar day={day} items={items} palette={p} onChange={value => { setDay(value); setOverdue(false); }} />

          <View style={[s.dateCard, { backgroundColor: p.panel, borderColor: p.line }]}>
            <View style={s.dateNav}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous day" onPress={() => shift(-1)} style={s.navButton}>
                <SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={17} tintColor={p.muted} />
              </Pressable>
              <Text style={[s.dateText, { color: p.text }]}>{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long' })}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Next day" onPress={() => shift(1)} style={s.navButton}>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} tintColor={p.muted} />
              </Pressable>
            </View>
            <EntityDatePicker mode="date" label="Agenda date" value={day} onChange={value => { if (value) { setDay(value); setOverdue(false); } }} />
          </View>

          <View style={s.modeRow}>
            <Pressable onPress={() => { setDay(formatLocalDate(new Date())); setOverdue(false); }} style={[s.mode, { backgroundColor: !overdue ? p.selected : 'transparent', borderColor: !overdue ? p.accent : p.line }]}>
              <Text style={[s.modeText, { color: !overdue ? p.accent : p.muted }]}>Day</Text>
            </Pressable>
            <Pressable accessibilityState={{ selected: overdue }} onPress={() => setOverdue(true)} style={[s.mode, { backgroundColor: overdue ? p.selected : 'transparent', borderColor: overdue ? p.accent : p.line }]}>
              <Text style={[s.modeText, { color: overdue ? p.accent : p.muted }]}>Overdue</Text>
            </Pressable>
          </View>

          <View style={s.sectionHead}>
            <Text style={[s.sectionTitle, { color: p.text }]}>{overdue ? 'Needs attention' : 'Schedule'}</Text>
          </View>

          <View style={s.quickAdd}>
            {['Task', 'Event', 'Reminder', 'Trip'].map(type => (
              <Pressable key={type} accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { type, date: day, request: String(Date.now()) } })} style={[s.quickButton, { backgroundColor: p.panel, borderColor: p.line }]}>
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={14} tintColor={p.accent} />
                <Text style={[s.quickText, { color: p.text }]}>{type}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={[s.empty, { backgroundColor: p.panel, borderColor: p.line }]}>
          <Text style={[s.emptyTitle, { color: p.text }]}>{error ? 'Couldn’t load plans' : loading ? 'Loading…' : overdue ? 'Nothing overdue' : 'Nothing scheduled'}</Text>
          {!loading ? <Text style={[s.emptyText, { color: p.muted }]}>Add a task, event, reminder, or trip to this date.</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })} style={[s.item, { backgroundColor: p.panel, borderColor: p.line }]}>
          <View style={s.flex}>
            <Text style={[s.itemMeta, { color: p.muted }]}>{overdue ? scheduledDate(item) : String(item.metadata.time || 'All day')} · {String(item.metadata.entityType ?? item.kind)}</Text>
            <Text style={[s.itemTitle, { color: p.text }]}>{item.title}</Text>
            <Text style={[s.itemMeta, { color: p.muted }]}>{item.source ? 'Connected' : item.deviceOnly ? 'On device' : 'Local'}</Text>
          </View>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={15} tintColor={p.muted} />
        </Pressable>
      )}
    />
  );
}

const s = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 80, gap: 10, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { gap: 14, marginBottom: 8 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: -7 },
  dateCard: { borderRadius: 16, borderWidth: 1, padding: 12 },
  dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 15, fontWeight: '600' },
  modeRow: { flexDirection: 'row', gap: 8 },
  mode: { minHeight: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: 16, justifyContent: 'center' },
  modeText: { fontSize: 13, fontWeight: '600' },
  sectionHead: { marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  quickAdd: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickButton: { minHeight: 40, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  quickText: { fontSize: 12.5, fontWeight: '500' },
  flex: { flex: 1 },
  item: { minHeight: 76, borderRadius: 15, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTitle: { fontSize: 15, fontWeight: '600', marginVertical: 4 },
  itemMeta: { fontSize: 12 },
  empty: { borderRadius: 16, borderWidth: 1, padding: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, lineHeight: 19, marginTop: 5 },
});
