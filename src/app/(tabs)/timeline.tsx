import { useMemo, useState } from 'react';
import { EntityIcon } from '@/components/entity-icon';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { entityCatalog } from '@/data/entity-catalog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRecords } from '@/components/use-records';
import { EntityFieldInput } from '@/components/entity-field-input';
import { localDay, shiftDay, timelineRecords } from '@/data/timeline';

export default function Timeline() {
  const { items, loading, error, reload, p } = useRecords();
  const [day, setDay] = useState(() => localDay(new Date()));
  const [picker, setPicker] = useState(false);
  const [area, setArea] = useState('All');
  const selected = new Date(`${day}T12:00:00`);
  const start = shiftDay(day, -((selected.getDay() + 6) % 7));
  const visible = useMemo(() => timelineRecords(items, day).filter(item => {
    if (area === 'All') return true;
    const group = item.metadata.group ?? entityCatalog.find(type => type.name === item.metadata.entityType)?.group;
    return group === ({ Health: 'Health', Money: 'Finance', Work: 'Productivity', People: 'People' } as Record<string, string>)[area];
  }), [items, day, area]);
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: p.bg }}><FlatList data={visible} keyExtractor={item => item.id} refreshing={loading} onRefresh={reload} contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}
    ListHeaderComponent={<View style={{ gap: 18, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: p.text, fontSize: 30, fontWeight: '700' }}>Timeline</Text><Pressable accessibilityRole="button" onPress={() => setPicker(value => !value)} style={{ padding: 12 }}><Text style={{ color: p.accent }}>Choose date</Text></Pressable></View>
      {picker ? <EntityFieldInput field={{ key: 'date', label: 'Timeline date', placeholder: 'YYYY-MM-DD', input: 'date' }} value={day} onChange={value => { if (/^\d{4}-\d{2}-\d{2}$/.test(value) && localDay(new Date(`${value}T12:00:00`)) === value) setDay(value); }} palette={p} /> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{[['‹ Previous', -7], ['Next ›', 7]].map(([label, offset]) => <Pressable key={label} accessibilityRole="button" onPress={() => setDay(shiftDay(day, Number(offset)))} style={{ padding: 12 }}><Text style={{ color: p.accent }}>{label}</Text></Pressable>)}</View>
      <View style={{ flexDirection: 'row', gap: 4 }}>{Array.from({ length: 7 }, (_, index) => { const value = shiftDay(start, index); return <Pressable key={value} accessibilityRole="button" accessibilityLabel={value} accessibilityState={{ selected: value === day }} onPress={() => setDay(value)} style={{ flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: value === day ? p.accent : p.panel }}><Text style={{ color: value === day ? p.onAccent : p.muted, fontSize: 10 }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</Text><Text style={{ color: value === day ? p.onAccent : p.text }}>{Number(value.slice(-2))}</Text></Pressable>; })}</View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: p.text }}>{selected.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text><Pressable accessibilityRole="button" onPress={() => setDay(localDay(new Date()))} style={{ minHeight: 44 }}><Text style={{ color: p.accent }}>Today</Text></Pressable></View>
      <Text style={{ color: p.muted }}>Added on this day · {visible.length} records. Scheduled plans are separate.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{['All', 'Health', 'Money', 'Work', 'People'].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: area === value }} onPress={() => setArea(value)} style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: area === value ? p.accent : p.line, backgroundColor: area === value ? p.accent : p.panel }}><Text style={{ color: area === value ? p.onAccent : p.text, fontSize: 13 }}>{value}</Text></Pressable>)}</ScrollView>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/plans')} style={{ minHeight: 44 }}><Text style={{ color: p.accent }}>Open scheduled plans →</Text></Pressable>
    </View>}
    ListEmptyComponent={<Text style={{ color: p.muted }}>{error ? 'Unable to load. Pull down to retry.' : loading ? 'Loading…' : 'Nothing was added on this day.'}</Text>}
    renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/entities', params: { id: item.id } })} style={{ flexDirection: 'row', gap: 12, padding: 14, backgroundColor: p.panel, borderRadius: 16, borderWidth: 1, borderColor: p.line }}><Text style={{ color: p.muted, width: 65, fontSize: 11 }}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text><EntityIcon type={String(item.metadata.entityType ?? '')} color={p.accent} size={24} /><View style={{ flex: 1, gap: 7 }}><Text style={{ color: p.text, fontSize: 16 }}>{item.title}</Text><Text style={{ color: p.muted }}>{String(item.metadata.entityType ?? item.kind)}</Text></View><Text style={{ color: p.accent }}>›</Text></Pressable>} /></SafeAreaView>;
}
