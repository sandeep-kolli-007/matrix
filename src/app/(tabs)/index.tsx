import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect } from 'expo-router';

import { EntityIcon } from '@/components/entity-icon';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { MicroBars, Sparkline, entityDashboard } from '@/components/matrix-visuals';
import { formatLocalDate } from '@/data/entity-date';
import { homeSummary } from '@/data/home-summary';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { isPreviewReviewMode } from '@/data/matrix-source';
import { matrixGroupColor, matrixTheme } from '@/data/matrix-theme';
import { scheduledDate } from '@/data/planning';
import { useLifeOS } from '@/providers/lifeos-provider';

const areaIcons: Record<string, { ios: string; other: string }> = {
  Productivity: { ios: 'checkmark.circle.fill', other: 'task_alt' },
  Health: { ios: 'heart.fill', other: 'favorite' },
  People: { ios: 'person.2.fill', other: 'group' },
  Planning: { ios: 'calendar', other: 'calendar_today' },
  Finance: { ios: 'banknote.fill', other: 'payments' },
  Learning: { ios: 'book.fill', other: 'menu_book' },
};

export default function HomeScreen() {
  const { appearance } = useLifeOS();
  const reviewAppearance = isPreviewReviewMode ? 'dark' : appearance;
  const p = matrixTheme(reviewAppearance);
  const { width } = useWindowDimensions();
  const compact = width < 560;

  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [day, setDay] = useState(() => formatLocalDate(new Date()));
  const token = useRef(0);

  const load = useCallback(async () => {
    const current = ++token.current;
    setLoading(true);
    setDay(formatLocalDate(new Date()));
    try {
      const records = await listEntities();
      if (current === token.current) {
        setItems(records);
        setFailed(false);
      }
    } catch {
      if (current === token.current) setFailed(true);
    } finally {
      if (current === token.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { token.current++; };
  }, [load]));

  const summary = useMemo(() => homeSummary(items, day), [items, day]);
  const dashboard = useMemo(() => entityDashboard(items, 14), [items]);

  const recent = useMemo(
    () => [...items].filter(item => !item.archivedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    [items]
  );

  const expenses30d = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return items
      .filter(item => item.kind === 'expense' && Date.parse(item.createdAt) >= cutoff)
      .reduce((sum, item) => sum + (Number(item.metadata.amount) || 0), 0);
  }, [items]);

  const eventCountToday = summary.today.filter(item => ['event', 'meeting', 'appointment', 'reservation'].includes(item.kind)).length;
  const taskDueToday = summary.today.filter(item => item.kind === 'task').length;
  const habitRecords = items.filter(item => item.kind === 'habit');
  const habitDone = habitRecords.filter(item => item.metadata.completed === true).length;

  const activityValues = dashboard.dateKeys.map((_, index) =>
    dashboard.groupTrends.reduce((sum, group) => sum + (group.values[index] ?? 0), 0)
  );
  const activityTotal = activityValues.reduce((sum, value) => sum + value, 0);
  const activityAverage = activityValues.length ? activityTotal / activityValues.length : 0;
  const activityPeak = Math.max(0, ...activityValues);

  const lifeAreas = dashboard.groupTrends.slice(0, 6).map(item => {
    const definition = matrixGroupColor(item.label, reviewAppearance);
    const recent7 = items.filter(record =>
      record.metadata.group === item.label &&
      Date.now() - Date.parse(record.updatedAt) <= 7 * 86400000
    ).length;
    return { ...item, recent7, ...definition };
  });

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const glance = [
    {
      label: 'Tasks due',
      value: taskDueToday,
      detail: summary.overdue.length ? `${summary.overdue.length} overdue` : 'No overdue tasks',
      color: '#4D8DFF',
      ios: 'checkmark.circle.fill',
      other: 'task_alt',
    },
    {
      label: 'Today',
      value: eventCountToday,
      detail: eventCountToday === 1 ? 'event on calendar' : 'events on calendar',
      color: '#9B68FF',
      ios: 'calendar',
      other: 'event',
    },
    {
      label: 'Habits',
      value: habitRecords.length ? `${habitDone}/${habitRecords.length}` : '—',
      detail: habitRecords.length ? 'marked complete' : 'No habits yet',
      color: '#31C89B',
      ios: 'repeat.circle.fill',
      other: 'repeat',
    },
    {
      label: '30-day spend',
      value: expenses30d ? `₹${Math.round(expenses30d).toLocaleString('en-IN')}` : '—',
      detail: 'recorded expenses',
      color: '#FFB43C',
      ios: 'banknote.fill',
      other: 'payments',
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.page}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={p.accent} />}
      >
        <View style={s.topbar}>
          <View style={s.flex}>
            <Text style={[s.eyebrow, { color: p.muted }]}>LIFEOS</Text>
            <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>{greeting}</Text>
            <Text style={[s.date, { color: p.muted }]}>
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/settings')} style={[s.profile, { backgroundColor: p.raised }]}>
            <SymbolView name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} size={29} tintColor={p.text} />
          </Pressable>
        </View>

        <View style={[s.commandCard, { backgroundColor: p.card, borderColor: p.line }]}>
          <View style={s.commandCopy}>
            <Text style={[s.commandKicker, { color: p.accent }]}>TODAY</Text>
            <Text style={[s.commandTitle, { color: p.text }]}>
              {summary.today.length ? `${summary.today.length} things need your attention` : 'Your day is clear'}
            </Text>
            <Text style={[s.commandBody, { color: p.muted }]}>
              {summary.overdue.length
                ? `${summary.overdue.length} overdue item${summary.overdue.length === 1 ? '' : 's'} need review.`
                : 'Everything scheduled for today is organised below.'}
            </Text>
          </View>
          <Pressable onPress={() => router.navigate('/(tabs)/add')} style={[s.primaryAction, { backgroundColor: p.accent }]}>
            <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={16} tintColor={p.onAccent} />
            <Text style={[s.primaryActionText, { color: p.onAccent }]}>Add</Text>
          </Pressable>
        </View>

        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>At a glance</Text>
            <Text style={[s.sectionSubtitle, { color: p.muted }]}>The numbers that matter today</Text>
          </View>
        </View>

        <View style={s.glanceGrid}>
          {glance.map((item) => (
            <View key={item.label} style={[s.glanceCard, { width: compact ? '48.6%' : '24%', backgroundColor: p.card, borderColor: p.line }]}>
              <View style={[s.glanceIcon, { backgroundColor: `${item.color}1E` }]}>
                <SymbolView name={{ ios: item.ios as never, android: item.other as never, web: item.other as never }} size={17} tintColor={item.color} />
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[s.glanceValue, { color: p.text }]}>{item.value}</Text>
              <Text style={[s.glanceLabel, { color: p.text }]}>{item.label}</Text>
              <Text numberOfLines={1} style={[s.glanceDetail, { color: p.muted }]}>{item.detail}</Text>
            </View>
          ))}
        </View>

        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>Today</Text>
            <Text style={[s.sectionSubtitle, { color: p.muted }]}>Scheduled and active</Text>
          </View>
          <Pressable onPress={() => router.navigate('/(tabs)/timeline')}>
            <Text style={[s.sectionLink, { color: p.accent }]}>Timeline</Text>
          </Pressable>
        </View>

        <View style={[s.agenda, { backgroundColor: p.card, borderColor: p.line }]}>
          {summary.today.slice(0, 6).length ? summary.today.slice(0, 6).map((item, index) => {
            const type = String(item.metadata.entityType ?? item.kind);
            const group = String(item.metadata.group ?? 'Other');
            const domain = matrixGroupColor(group, reviewAppearance);
            const due = scheduledDate(item);
            return (
              <Pressable
                key={item.id}
                onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}
                style={[s.agendaRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.line }]}
              >
                <View style={[s.agendaIcon, { backgroundColor: domain.soft }]}>
                  <EntityIcon type={type} color={domain.accent} size={19} />
                </View>
                <View style={s.flex}>
                  <Text numberOfLines={1} style={[s.agendaTitle, { color: p.text }]}>{item.title}</Text>
                  <Text numberOfLines={1} style={[s.agendaMeta, { color: p.muted }]}>
                    {type}{item.details ? ` · ${item.details}` : ''}
                  </Text>
                </View>
                <Text style={[s.agendaTime, { color: p.muted }]}>
                  {String(item.metadata.time || (due === day ? 'Today' : due || ''))}
                </Text>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={13} tintColor={p.muted} />
              </Pressable>
            );
          }) : (
            <View style={s.emptyRow}>
              <View style={[s.emptyIcon, { backgroundColor: `${p.success}1C` }]}>
                <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={18} tintColor={p.success} />
              </View>
              <View style={s.flex}>
                <Text style={[s.emptyTitle, { color: p.text }]}>Nothing scheduled</Text>
                <Text style={[s.emptyText, { color: p.muted }]}>Use Add when you want to capture something.</Text>
              </View>
            </View>
          )}
        </View>

        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>Life areas</Text>
            <Text style={[s.sectionSubtitle, { color: p.muted }]}>Your information, organised by domain</Text>
          </View>
          <Pressable onPress={() => router.navigate('/(tabs)/matrix')}>
            <Text style={[s.sectionLink, { color: p.accent }]}>Open Matrix</Text>
          </Pressable>
        </View>

        <View style={s.areaGrid}>
          {lifeAreas.map(area => {
            const icon = areaIcons[area.label] ?? { ios: 'square.grid.2x2.fill', other: 'grid_view' };
            return (
              <Pressable
                key={area.label}
                onPress={() => router.navigate({ pathname: '/(tabs)/matrix', params: { focus: area.label } })}
                style={[s.areaCard, { width: compact ? '48.6%' : '32%', backgroundColor: p.card, borderColor: p.line }]}
              >
                <View style={s.areaTop}>
                  <View style={[s.areaIcon, { backgroundColor: area.soft }]}>
                    <SymbolView name={{ ios: icon.ios as never, android: icon.other as never, web: icon.other as never }} size={18} tintColor={area.accent} />
                  </View>
                  <Text style={[s.areaCount, { color: area.accent }]}>{area.total}</Text>
                </View>
                <Text style={[s.areaTitle, { color: p.text }]}>{area.label}</Text>
                <Text style={[s.areaMeta, { color: p.muted }]}>{area.recent7} updated this week</Text>
                <View style={s.areaTrend}>
                  <MicroBars values={area.values.slice(-7)} color={area.accent} trackColor={p.line} height={24} />
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>Activity trend</Text>
            <Text style={[s.sectionSubtitle, { color: p.muted }]}>New records over the last 14 days</Text>
          </View>
          <Pressable onPress={() => router.push('/insights')}>
            <Text style={[s.sectionLink, { color: p.accent }]}>Insights</Text>
          </Pressable>
        </View>

        <View style={[s.trendCard, { backgroundColor: p.card, borderColor: p.line }]}>
          <View style={s.trendMetrics}>
            <View>
              <Text style={[s.trendMetricValue, { color: p.text }]}>{activityTotal}</Text>
              <Text style={[s.trendMetricLabel, { color: p.muted }]}>14-day total</Text>
            </View>
            <View>
              <Text style={[s.trendMetricValue, { color: p.text }]}>{activityAverage.toFixed(1)}</Text>
              <Text style={[s.trendMetricLabel, { color: p.muted }]}>daily avg</Text>
            </View>
            <View>
              <Text style={[s.trendMetricValue, { color: p.text }]}>{activityPeak}</Text>
              <Text style={[s.trendMetricLabel, { color: p.muted }]}>peak day</Text>
            </View>
          </View>
          <View style={s.trendPlot}>
            <Sparkline values={activityValues} palette={p} height={132} />
          </View>
          <View style={s.axis}>
            <Text style={[s.axisText, { color: p.muted }]}>14 days ago</Text>
            <Text style={[s.axisText, { color: p.muted }]}>Today</Text>
          </View>
        </View>

        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>Recent activity</Text>
            <Text style={[s.sectionSubtitle, { color: p.muted }]}>Latest changes across LifeOS</Text>
          </View>
        </View>

        <View style={[s.recentCard, { backgroundColor: p.card, borderColor: p.line }]}>
          {recent.map((item, index) => {
            const type = String(item.metadata.entityType ?? item.kind);
            const domain = matrixGroupColor(String(item.metadata.group ?? 'Other'), reviewAppearance);
            return (
              <Pressable
                key={item.id}
                onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}
                style={[s.recentRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.line }]}
              >
                <View style={[s.recentIcon, { backgroundColor: domain.soft }]}>
                  <EntityIcon type={type} color={domain.accent} size={18} />
                </View>
                <View style={s.flex}>
                  <Text numberOfLines={1} style={[s.recentTitle, { color: p.text }]}>{item.title}</Text>
                  <Text numberOfLines={1} style={[s.recentMeta, { color: p.muted }]}>{type} · {new Date(item.updatedAt).toLocaleDateString()}</Text>
                </View>
                {item.deviceOnly ? <SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} size={12} tintColor={p.violet} /> : null}
              </Pressable>
            );
          })}
        </View>

        {failed ? (
          <Pressable onPress={() => void load()} style={[s.error, { borderColor: p.danger }]}>
            <Text style={[s.emptyTitle, { color: p.text }]}>Couldn’t refresh LifeOS</Text>
            <Text style={[s.emptyText, { color: p.muted }]}>Tap to try again.</Text>
          </Pressable>
        ) : null}

        {isPreviewReviewMode ? <Text style={[s.previewNote, { color: p.muted }]}>Preview data enabled for design review</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 124, maxWidth: 760, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  topbar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '750' as '700', letterSpacing: -0.8, marginTop: 1 },
  date: { fontSize: 10.5, marginTop: 3 },
  profile: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  commandCard: { borderRadius: 22, borderWidth: 1, padding: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  commandCopy: { flex: 1 },
  commandKicker: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  commandTitle: { fontSize: 18, lineHeight: 23, fontWeight: '700', letterSpacing: -0.35, marginTop: 5 },
  commandBody: { fontSize: 10.5, lineHeight: 15, marginTop: 5 },
  primaryAction: { minHeight: 42, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  primaryActionText: { fontSize: 11.5, fontWeight: '700' },

  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 24, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 10.5, lineHeight: 14, marginTop: 2 },
  sectionLink: { fontSize: 10.5, fontWeight: '600' },

  glanceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  glanceCard: { minHeight: 126, borderRadius: 18, borderWidth: 1, padding: 12 },
  glanceIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  glanceValue: { fontSize: 20, fontWeight: '750' as '700', letterSpacing: -0.5, marginTop: 12 },
  glanceLabel: { fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  glanceDetail: { fontSize: 8.8, marginTop: 2 },

  agenda: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, overflow: 'hidden' },
  agendaRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  agendaIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  agendaTitle: { fontSize: 12, fontWeight: '650' as '600' },
  agendaMeta: { fontSize: 9, marginTop: 3 },
  agendaTime: { maxWidth: 54, fontSize: 9, textAlign: 'right', fontVariant: ['tabular-nums'] },
  emptyRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 10 },
  emptyIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 12.5, fontWeight: '600' },
  emptyText: { fontSize: 9.5, lineHeight: 14, marginTop: 2 },

  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  areaCard: { minHeight: 132, borderRadius: 18, borderWidth: 1, padding: 12 },
  areaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  areaIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  areaCount: { fontSize: 17, fontWeight: '700' },
  areaTitle: { fontSize: 12, fontWeight: '650' as '600', marginTop: 10 },
  areaMeta: { fontSize: 9, marginTop: 2 },
  areaTrend: { marginTop: 10 },

  trendCard: { borderRadius: 20, borderWidth: 1, padding: 14 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 8.8 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -3 },
  axisText: { fontSize: 8.5 },

  recentCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, overflow: 'hidden' },
  recentRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  recentIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  recentTitle: { fontSize: 11.5, fontWeight: '600' },
  recentMeta: { fontSize: 8.8, marginTop: 3 },

  error: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 },
  previewNote: { fontSize: 8.5, textAlign: 'center', marginTop: 16 },
});
