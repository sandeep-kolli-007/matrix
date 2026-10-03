import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';

import { EntityFieldInput } from '@/components/entity-field-input';
import { EntityIcon } from '@/components/entity-icon';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { useRecords } from '@/components/use-records';
import { entityCatalog } from '@/data/entity-catalog';
import { localDay, shiftDay, timelineRecords } from '@/data/timeline';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <FlatList
        data={visible}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={reload}
        contentContainerStyle={s.page}
        ListHeaderComponent={
          <View style={s.header}>
            <View style={s.titleRow}>
              <View style={s.flex}>
                <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Timeline</Text>
                <Text style={[s.subtitle, { color: p.muted }]}>What you captured, day by day.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Choose date" onPress={() => setPicker(value => !value)} style={[s.iconButton, { backgroundColor: p.panel, borderColor: p.line }]}>
                <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} size={19} tintColor={p.text} />
              </Pressable>
            </View>

            {picker ? (
              <View style={{ marginTop: 16 }}>
                <EntityFieldInput
                  field={{ key: 'date', label: 'Timeline date', placeholder: 'YYYY-MM-DD', input: 'date' }}
                  value={day}
                  onChange={value => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(value) && localDay(new Date(`${value}T12:00:00`)) === value) setDay(value);
                  }}
                  palette={p}
                />
              </View>
            ) : null}

            <View style={s.weekHeader}>
              <Pressable onPress={() => setDay(shiftDay(day, -7))} style={s.weekArrow}>
                <SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={17} tintColor={p.muted} />
              </Pressable>
              <Text style={[s.month, { color: p.text }]}>{selected.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
              <Pressable onPress={() => setDay(shiftDay(day, 7))} style={s.weekArrow}>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} tintColor={p.muted} />
              </Pressable>
            </View>

            <View style={s.week}>
              {Array.from({ length: 7 }, (_, index) => {
                const value = shiftDay(start, index);
                const active = value === day;
                const today = value === localDay(new Date());
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={value}
                    accessibilityState={{ selected: active }}
                    onPress={() => setDay(value)}
                    style={[s.day, active && { backgroundColor: p.accent }]}
                  >
                    <Text style={[s.weekday, { color: active ? p.onAccent : p.muted }]}>{weekdays[index]}</Text>
                    <Text style={[s.dayNumber, { color: active ? p.onAccent : p.text }]}>{Number(value.slice(-2))}</Text>
                    <View style={[s.todayDot, { backgroundColor: today && !active ? p.accent : 'transparent' }]} />
                  </Pressable>
                );
              })}
            </View>

            <View style={s.dayTitleRow}>
              <View>
                <Text style={[s.dayTitle, { color: p.text }]}>{selected.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                <Text style={[s.dayCount, { color: p.muted }]}>{visible.length} {visible.length === 1 ? 'item' : 'items'}</Text>
              </View>
              {day !== localDay(new Date()) ? <Pressable onPress={() => setDay(localDay(new Date()))}><Text style={[s.todayLink, { color: p.accent }]}>Today</Text></Pressable> : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
              {['All', 'Health', 'Money', 'Work', 'People'].map(value => (
                <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: area === value }} onPress={() => setArea(value)} style={[s.filter, { backgroundColor: area === value ? p.selected : 'transparent', borderColor: area === value ? p.accent : p.line }]}>
                  <Text style={[s.filterText, { color: area === value ? p.accent : p.muted }]}>{value}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable onPress={() => router.navigate('/plans')} style={[s.plansLink, { borderColor: p.line }]}>
              <Text style={[s.plansText, { color: p.text }]}>Scheduled plans</Text>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={15} tintColor={p.muted} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={[s.empty, { backgroundColor: p.panel, borderColor: p.line }]}>
            <Text style={[s.emptyTitle, { color: p.text }]}>{error ? 'Couldn’t load this day' : loading ? 'Loading…' : 'Nothing captured on this day'}</Text>
            {!loading ? <Text style={[s.emptyText, { color: p.muted }]}>Items you add on this date will appear here.</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/entities', params: { id: item.id } })} style={[s.row, { backgroundColor: p.panel, borderColor: p.line }]}>
            <Text style={[s.time, { color: p.muted }]}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={[s.rowIcon, { backgroundColor: p.raised }]}>
              <EntityIcon type={String(item.metadata.entityType ?? '')} color={p.accent} size={21} />
            </View>
            <View style={s.flex}>
              <Text numberOfLines={1} style={[s.rowTitle, { color: p.text }]}>{item.title}</Text>
              <Text style={[s.rowMeta, { color: p.muted }]}>{String(item.metadata.entityType ?? item.kind)}</Text>
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
  page: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 12 },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1.1 },
  subtitle: { fontSize: 13, marginTop: 3 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 },
  month: { fontSize: 16, fontWeight: '600' },
  weekArrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', marginTop: 8, gap: 4 },
  day: { flex: 1, minHeight: 68, borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 4 },
  weekday: { fontSize: 10.5, fontWeight: '500' },
  dayNumber: { fontSize: 15, fontWeight: '600' },
  todayDot: { width: 4, height: 4, borderRadius: 2 },
  dayTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  dayTitle: { fontSize: 18, fontWeight: '600' },
  dayCount: { fontSize: 12, marginTop: 3 },
  todayLink: { fontSize: 13, fontWeight: '600' },
  filters: { gap: 8, paddingVertical: 14 },
  filter: { height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  filterText: { fontSize: 12.5, fontWeight: '600' },
  plansLink: { minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  plansText: { fontSize: 14, fontWeight: '500' },
  row: { minHeight: 68, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8 },
  time: { width: 48, fontSize: 11 },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, marginTop: 4 },
  empty: { borderRadius: 16, borderWidth: 1, padding: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, lineHeight: 19, marginTop: 5 },
});
