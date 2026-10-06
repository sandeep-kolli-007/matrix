import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';

import { EntityFieldInput } from '@/components/entity-field-input';
import { EntityIcon } from '@/components/entity-icon';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { useRecords } from '@/components/use-records';
import { entityCatalog } from '@/data/entity-catalog';
import { isPreviewReviewMode } from '@/data/matrix-source';
import { matrixGroupColor, matrixTheme } from '@/data/matrix-theme';
import { localDay, shiftDay, timelineRecords } from '@/data/timeline';
import { useLifeOS } from '@/providers/lifeos-provider';

const filters = [
  { label: 'All', group: null },
  { label: 'Tasks', group: 'Productivity' },
  { label: 'Health', group: 'Health' },
  { label: 'Finance', group: 'Finance' },
  { label: 'Work', group: 'Productivity' },
] as const;

export default function Timeline() {
  const records = useRecords();
  const { appearance } = useLifeOS();
  const p = matrixTheme(isPreviewReviewMode ? 'dark' : appearance);
  const [day, setDay] = useState(() => localDay(new Date()));
  const [picker, setPicker] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const selected = new Date(`${day}T12:00:00`);
  const visible = useMemo(() => timelineRecords(records.items, day).filter(item => {
    if (filter !== 'All') {
      if (filter === 'Tasks') {
        if (!['Task', 'Habit', 'Goal', 'Project', 'Milestone'].includes(String(item.metadata.entityType))) return false;
      } else {
        const expected = filters.find(entry => entry.label === filter)?.group;
        const group = item.metadata.group ?? entityCatalog.find(type => type.name === item.metadata.entityType)?.group;
        if (expected && group !== expected) return false;
      }
    }

    if (query.trim()) {
      const haystack = `${item.title} ${item.details ?? ''} ${String(item.metadata.entityType ?? item.kind)} ${String(item.metadata.group ?? '')}`.toLowerCase();
      if (!haystack.includes(query.trim().toLowerCase())) return false;
    }

    return true;
  }), [records.items, day, filter, query]);

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <FlatList
        data={visible}
        keyExtractor={item => item.id}
        refreshing={records.loading}
        onRefresh={records.reload}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.page}
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Timeline</Text>
              <View style={s.actions}>
                <Pressable accessibilityLabel="Search timeline" onPress={() => { setSearchOpen(v => !v); if (searchOpen) setQuery(''); }} style={[s.circleButton, { backgroundColor: p.raised }]}>
                  <SymbolView name={{ ios: searchOpen ? 'xmark' : 'magnifyingglass', android: searchOpen ? 'close' : 'search', web: searchOpen ? 'close' : 'search' }} size={18} tintColor={p.text} />
                </Pressable>
                <Pressable accessibilityLabel="Choose date" onPress={() => setPicker(v => !v)} style={[s.circleButton, { backgroundColor: p.raised }]}>
                  <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} size={18} tintColor={p.text} />
                </Pressable>
              </View>
            </View>

            {searchOpen ? (
              <View style={[s.searchBox, { backgroundColor: p.card, borderColor: query ? p.accent : p.line }]}>
                <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={16} tintColor={p.muted} />
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search this day"
                  placeholderTextColor={p.muted}
                  style={[s.searchInput, { color: p.text }]}
                />
              </View>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
              {filters.map(item => {
                const active = filter === item.label;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => setFilter(item.label)}
                    style={[s.filter, { backgroundColor: active ? p.accent : p.raised }]}
                  >
                    <Text style={[s.filterText, { color: active ? p.onAccent : p.muted }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {picker ? (
              <View style={[s.datePicker, { backgroundColor: p.card, borderColor: p.line }]}>
                <EntityFieldInput
                  field={{ key: 'date', label: 'Timeline date', placeholder: 'YYYY-MM-DD', input: 'date' }}
                  value={day}
                  onChange={value => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) setDay(value);
                  }}
                  palette={p}
                />
              </View>
            ) : null}

            <View style={s.dateRow}>
              <View>
                <Text style={[s.todayLabel, { color: p.text }]}>
                  {day === localDay(new Date()) ? 'Today' : selected.toLocaleDateString(undefined, { weekday: 'long' })}
                </Text>
                <Text style={[s.dateText, { color: p.muted }]}>
                  {selected.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={s.dateNav}>
                <Pressable onPress={() => setDay(shiftDay(day, -1))} style={s.navButton}>
                  <SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={17} tintColor={p.muted} />
                </Pressable>
                <Pressable onPress={() => setDay(shiftDay(day, 1))} style={s.navButton}>
                  <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} tintColor={p.muted} />
                </Pressable>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[s.empty, { backgroundColor: p.card, borderColor: p.line }]}>
            <SymbolView name={{ ios: 'clock.badge.questionmark', android: 'schedule', web: 'schedule' }} size={26} tintColor={p.muted} />
            <View style={s.flex}>
              <Text style={[s.emptyTitle, { color: p.text }]}>{records.error ? 'Couldn’t load timeline' : 'No activity on this date'}</Text>
              <Text style={[s.emptyText, { color: p.muted }]}>Try another date or add something new.</Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const type = String(item.metadata.entityType ?? item.kind);
          const group = String(item.metadata.group ?? 'Other');
          const domain = matrixGroupColor(group, isPreviewReviewMode ? 'dark' : appearance);
          const time = String(item.metadata.time || new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/entities', params: { id: item.id } })}
              style={s.timelineRow}
            >
              <View style={s.timeCol}>
                <Text style={[s.time, { color: p.muted }]}>{time}</Text>
              </View>

              <View style={s.rail}>
                <View style={[s.dot, { backgroundColor: domain.accent, borderColor: p.bg }]} />
                {index < visible.length - 1 ? <View style={[s.line, { backgroundColor: p.line }]} /> : null}
              </View>

              <View style={[s.eventCard, { backgroundColor: p.card, borderColor: p.line }]}>
                <View style={[s.eventIcon, { backgroundColor: domain.soft }]}>
                  <EntityIcon type={type} color={domain.accent} size={21} />
                </View>
                <View style={s.flex}>
                  <Text numberOfLines={1} style={[s.eventTitle, { color: p.text }]}>{item.title}</Text>
                  <Text numberOfLines={2} style={[s.eventMeta, { color: p.muted }]}>
                    {type}{item.details ? ` · ${item.details}` : ''}
                  </Text>
                  {['Workout', 'Meal', 'Purchase', 'Trip', 'Document'].includes(type) ? (
                    <View style={[s.mediaHint, { backgroundColor: domain.soft }]}>
                      <EntityIcon type={type} color={domain.accent} size={15} />
                      <Text style={[s.mediaHintText, { color: domain.accent }]}>
                        {type === 'Workout' ? 'Activity details' : type === 'Meal' ? 'Nutrition logged' : 'Attached details'}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <SymbolView name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }} size={15} tintColor={p.muted} />
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 14, paddingTop: 5, paddingBottom: 118, maxWidth: 660, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '750' as '700', letterSpacing: -0.8 },
  actions: { flexDirection: 'row', gap: 8 },
  circleButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  searchBox: { minHeight: 44, borderRadius: 14, borderWidth: 1, marginTop: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 12, paddingVertical: 10 },
  filters: { gap: 8, paddingVertical: 14 },
  filter: { minHeight: 34, borderRadius: 17, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 11.5, fontWeight: '600' },
  datePicker: { borderRadius: 18, borderWidth: 1, padding: 12, marginBottom: 10 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  todayLabel: { fontSize: 16, fontWeight: '700' },
  dateText: { fontSize: 10.5, marginTop: 2 },
  dateNav: { flexDirection: 'row', gap: 2 },
  navButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  timelineRow: { minHeight: 86, flexDirection: 'row', alignItems: 'stretch' },
  timeCol: { width: 54, paddingTop: 16 },
  time: { fontSize: 9.5, textAlign: 'right', fontVariant: ['tabular-nums'] },
  rail: { width: 26, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, marginTop: 20, zIndex: 2 },
  line: { width: 1, flex: 1, marginTop: 1 },
  eventCard: { flex: 1, minHeight: 74, marginBottom: 8, borderRadius: 16, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: 12.5, fontWeight: '650' as '600' },
  eventMeta: { fontSize: 9.5, lineHeight: 13, marginTop: 3 },
  mediaHint: { alignSelf: 'flex-start', minHeight: 26, borderRadius: 8, marginTop: 7, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  mediaHintText: { fontSize: 9, fontWeight: '600' },
  empty: { minHeight: 82, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 8 },
  emptyTitle: { fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 10.5, marginTop: 3 },
});
