import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';

import { EntityFieldInput } from '@/components/entity-field-input';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { DayFlow, DayPulse } from '@/components/timeline-visuals';
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
  { label: 'People', group: 'People' },
  { label: 'Plans', group: 'Planning' },
] as const;

export default function Timeline() {
  const records = useRecords();
  const { appearance } = useLifeOS();
  const reviewAppearance = isPreviewReviewMode ? 'dark' : appearance;
  const p = matrixTheme(reviewAppearance);
  const [day, setDay] = useState(() => localDay(new Date()));
  const [picker, setPicker] = useState(false);
  const [filter, setFilter] = useState('All');

  const selected = new Date(`${day}T12:00:00`);
  const visible = useMemo(() => timelineRecords(records.items, day).filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Tasks') return ['Task', 'Habit', 'Goal', 'Project', 'Milestone'].includes(String(item.metadata.entityType));
    const expected = filters.find(item => item.label === filter)?.group;
    const group = item.metadata.group ?? entityCatalog.find(type => type.name === item.metadata.entityType)?.group;
    return expected ? group === expected : true;
  }), [records.items, day, filter]);

  const moments = useMemo(() => visible.map(item => {
    const group = String(item.metadata.group ?? entityCatalog.find(type => type.name === item.metadata.entityType)?.group ?? 'Other');
    const tone = matrixGroupColor(group, reviewAppearance);
    const time = String(item.metadata.time || new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    return { item, color: tone.accent, soft: tone.soft, time };
  }), [reviewAppearance, visible]);

  const areaCount = new Set(visible.map(item => String(item.metadata.group ?? 'Other'))).size;
  const isToday = day === localDay(new Date());

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.page}
        refreshControl={<RefreshControl refreshing={records.loading} onRefresh={records.reload} tintColor={p.accent} />}
      >
        <View style={s.header}>
          <View>
            <Text style={[s.eyebrow, { color: p.muted }]}>YOUR DAY IN MOTION</Text>
            <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Timeline</Text>
          </View>
          <View style={s.actions}>
            <Pressable onPress={() => setPicker(v => !v)} style={[s.circleButton, { backgroundColor: p.raised }]}>
              <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} size={17} tintColor={p.text} />
            </Pressable>
            <Pressable onPress={() => router.navigate('/(tabs)/add')} style={[s.circleButton, { backgroundColor: p.accent }]}>
              <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={18} tintColor="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={s.dateNavigator}>
          <Pressable onPress={() => setDay(shiftDay(day, -1))} style={s.navButton}>
            <SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={18} tintColor={p.muted} />
          </Pressable>
          <View style={s.dateCopy}>
            <Text style={[s.datePrimary, { color: p.text }]}>
              {isToday ? 'Today' : selected.toLocaleDateString(undefined, { weekday: 'long' })}
            </Text>
            <Text style={[s.dateSecondary, { color: p.muted }]}>
              {selected.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <Pressable onPress={() => setDay(shiftDay(day, 1))} style={s.navButton}>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={18} tintColor={p.muted} />
          </Pressable>
        </View>

        {picker ? (
          <View style={[s.datePicker, { backgroundColor: p.panel }]}>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
          {filters.map(item => {
            const active = filter === item.label;
            return (
              <Pressable
                key={item.label}
                onPress={() => setFilter(item.label)}
                style={[s.filter, { backgroundColor: active ? p.selected : 'transparent', borderColor: active ? p.accent : p.line }]}
              >
                <Text style={[s.filterText, { color: active ? p.accent : p.muted }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <DayPulse count={visible.length} categories={areaCount} palette={p} />

        <View style={s.flowHead}>
          <Text style={[s.flowEyebrow, { color: p.violet }]}>DAY FLOW</Text>
          <Text style={[s.flowTitle, { color: p.text }]}>
            {visible.length ? 'Your moments, connected' : 'A quiet day'}
          </Text>
          <Text style={[s.flowSub, { color: p.muted }]}>
            {visible.length
              ? 'Scroll through the motion of your day instead of reading a log.'
              : 'No records match this date and filter.'}
          </Text>
        </View>

        <DayFlow
          moments={moments}
          palette={p}
          onPress={item => router.push({ pathname: '/entities', params: { id: item.id } })}
        />

        {visible.length > 10 ? (
          <Pressable onPress={() => setFilter('All')} style={s.more}>
            <Text style={[s.moreText, { color: p.accent }]}>+ {visible.length - 10} more moments in this day</Text>
          </Pressable>
        ) : null}

        {records.error ? (
          <Pressable onPress={records.reload} style={[s.error, { borderColor: p.danger }]}>
            <Text style={[s.errorTitle, { color: p.text }]}>Couldn’t refresh timeline</Text>
            <Text style={[s.errorText, { color: p.muted }]}>Tap to try again.</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 14, paddingTop: 5, paddingBottom: 122, maxWidth: 660, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.2 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '750' as '700', letterSpacing: -0.8, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  circleButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  dateNavigator: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  navButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  dateCopy: { alignItems: 'center' },
  datePrimary: { fontSize: 16, fontWeight: '700' },
  dateSecondary: { fontSize: 9.5, marginTop: 2 },
  datePicker: { borderRadius: 20, padding: 12, marginBottom: 8 },

  filters: { gap: 8, paddingVertical: 10 },
  filter: { minHeight: 34, borderRadius: 17, borderWidth: 1, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 10.5, fontWeight: '600' },

  flowHead: { marginTop: 4, marginBottom: 4 },
  flowEyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.2 },
  flowTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.35, marginTop: 3 },
  flowSub: { fontSize: 9.5, lineHeight: 14, marginTop: 3 },

  more: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontSize: 10.5, fontWeight: '600' },

  error: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 12 },
  errorTitle: { fontSize: 12.5, fontWeight: '700' },
  errorText: { fontSize: 9.5, marginTop: 3 },
});
