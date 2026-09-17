import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { occursOn, scheduledDate } from '@/data/planning';
import { formatLocalDate } from '@/data/entity-date';
import { EntityDatePicker } from '@/components/entity-date-picker';
import { PlansCalendar } from '@/components/plans-calendar';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function PlansScreen() {
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = { bg: dark ? '#091710' : '#F4F8F5', card: dark ? '#172B21' : '#FFFFFF', text: dark ? '#F3F8F5' : '#172D20', muted: dark ? '#A2B7AB' : '#637D6D', accent: dark ? '#68D9AB' : '#157952' };
  const [day, setDay] = useState(() => formatLocalDate(new Date()));
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [overdue, setOverdue] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { setItems(await listEntities()); setError(false); } catch { setItems([]); setError(true); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const shown = items.filter((item) => {
    const date = scheduledDate(item);
    return date && (overdue ? ['task', 'bill', 'milestone', 'goal'].includes(item.kind) && item.metadata.completed !== true && date < formatLocalDate(new Date()) : occursOn(item, day));
  }).sort((a, b) => scheduledDate(a)!.localeCompare(scheduledDate(b)!) || String(a.metadata.time || '99:99').localeCompare(String(b.metadata.time || '99:99')));
  function shift(offset: number) { const date = new Date(`${day}T12:00:00`); date.setDate(date.getDate() + offset); setDay(formatLocalDate(date)); setOverdue(false); }
  return <FlatList style={{ backgroundColor: p.bg }} contentContainerStyle={{ padding: 22, gap: 14, paddingBottom: 60 }} data={shown} keyExtractor={(item) => item.id} refreshing={loading} onRefresh={() => void load()}
    ListHeaderComponent={<View style={{ gap: 18 }}><Text style={{ color: p.text, fontSize: 30, fontWeight: '800' }}>Make time for life</Text><Text style={{ color: p.muted, lineHeight: 22 }}>Your dated tasks, events, reminders and journeys. Trips span their saved dates. Repeating reminders appear on matching days; missing month-end or leap-day dates are skipped. This agenda does not send notifications.</Text>
      <PlansCalendar day={day} items={items} palette={p} onChange={(value) => { setDay(value); setOverdue(false); }} />
      <View style={{ backgroundColor: p.card, padding: 18, borderRadius: 22 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Pressable accessibilityRole="button" accessibilityLabel="Previous day" onPress={() => shift(-1)} style={{ padding: 15 }}><Text style={{ color: p.text }}>‹</Text></Pressable><Text style={{ color: p.text, fontSize: 18, fontWeight: '700' }}>{day}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next day" onPress={() => shift(1)} style={{ padding: 15 }}><Text style={{ color: p.text }}>›</Text></Pressable></View><EntityDatePicker mode="date" label="Agenda date" value={day} onChange={(value) => { if (value) { setDay(value); setOverdue(false); } }} /></View>
      <View style={{ flexDirection: 'row', gap: 12 }}><Pressable accessibilityRole="button" onPress={() => { setDay(formatLocalDate(new Date())); setOverdue(false); }} style={{ padding: 14 }}><Text style={{ color: p.accent }}>Today</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ selected: overdue }} onPress={() => setOverdue(!overdue)} style={{ padding: 14 }}><Text style={{ color: p.accent }}>{overdue ? 'Back to day' : 'Show overdue'}</Text></Pressable></View>
      <Text style={{ color: p.text, fontSize: 20, fontWeight: '700' }}>{overdue ? 'Needs a little attention' : 'Your day'}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{['Task', 'Event', 'Reminder', 'Trip'].map((type) => <Pressable key={type} accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { type, date: day, request: String(Date.now()) } })} style={{ padding: 12 }}><Text style={{ color: p.accent }}>＋ {type}</Text></Pressable>)}</View>
    </View>}
    ListEmptyComponent={<Text style={{ color: p.muted, padding: 18 }}>{error ? 'Could not load plans. Pull down to retry.' : loading ? 'Loading…' : 'Nothing scheduled in this view.'}</Text>}
    renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })} style={{ padding: 20, borderRadius: 22, backgroundColor: p.card, gap: 8 }}><Text style={{ color: p.accent }}>{overdue ? scheduledDate(item) : String(item.metadata.time || 'All day')} · {item.kind}</Text><Text style={{ color: p.text, fontSize: 18, fontWeight: '700' }}>{item.title}</Text><Text style={{ color: p.muted }}>{item.source ? 'Connected record' : item.deviceOnly ? 'Device only' : 'Saved locally'} · View details ›</Text></Pressable>} />;
}
