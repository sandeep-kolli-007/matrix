import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect } from 'expo-router';

import { EntityIcon } from '@/components/entity-icon';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import {
  AmbientMatrixAnimation,
  DonutDistribution,
  MicroBars,
  MotionReveal,
  MultiTrendChart,
  entityDashboard,
} from '@/components/matrix-visuals';
import { entityCatalog } from '@/data/entity-catalog';
import { formatLocalDate } from '@/data/entity-date';
import { homeSummary } from '@/data/home-summary';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { matrixGroupColor, matrixTheme } from '@/data/matrix-theme';
import { scheduledDate } from '@/data/planning';
import { useLifeOS } from '@/providers/lifeos-provider';

const quick = [
  { title: 'Task', type: 'Task', ios: 'checkmark.circle', other: 'task_alt' },
  { title: 'Meal', type: 'Meal', ios: 'fork.knife', other: 'restaurant' },
  { title: 'Workout', type: 'Workout', ios: 'figure.strengthtraining.traditional', other: 'fitness_center' },
  { title: 'Expense', type: 'Expense', ios: 'creditcard', other: 'payments' },
  { title: 'Mood', type: 'Mood Log', ios: 'face.smiling', other: 'sentiment_satisfied' },
] as const;

export default function HomeScreen() {
  const { appearance } = useLifeOS();
  const { width } = useWindowDimensions();
  const p = matrixTheme(appearance);
  const compact = width < 620;
  const columns = width >= 860 ? 4 : width >= 620 ? 3 : 2;

  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [day, setDay] = useState(() => formatLocalDate(new Date()));
  const request = useRef(0);

  const load = useCallback(async () => {
    const token = ++request.current;
    setLoading(true);
    setDay(formatLocalDate(new Date()));
    try {
      const records = await listEntities();
      if (token === request.current) {
        setItems(records);
        setFailed(false);
      }
    } catch {
      if (token === request.current) setFailed(true);
    } finally {
      if (token === request.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current++; };
  }, [load]));

  const summary = useMemo(() => homeSummary(items, day), [items, day]);
  const dashboard = useMemo(() => entityDashboard(items, 14), [items]);

  const byType = useMemo(() => {
    const map = new Map<string, LifeEntity[]>();
    for (const item of items) {
      const type = String(item.metadata.entityType ?? item.kind);
      map.set(type, [...(map.get(type) ?? []), item]);
    }
    return map;
  }, [items]);

  const entitySignals = useMemo(() => {
    const trendMap = new Map(dashboard.entityTrends.map(item => [item.label, item]));
    return entityCatalog
      .map(definition => {
        const records = byType.get(definition.name) ?? [];
        const trend = trendMap.get(definition.name);
        return {
          ...definition,
          count: records.length,
          values: trend?.values ?? [0, 0, 0, 0, 0, 0, 0],
          latest: trend?.updatedAt ?? '',
        };
      })
      .sort((a, b) => Number(b.count > 0) - Number(a.count > 0) || b.count - a.count || a.name.localeCompare(b.name));
  }, [byType, dashboard.entityTrends]);

  const groupSeries = useMemo(() => dashboard.groupTrends.slice(0, 5).map(item => {
    const domain = matrixGroupColor(item.label, appearance);
    return { label: item.label, color: domain.accent, values: item.values };
  }), [appearance, dashboard.groupTrends]);

  const groupDistribution = useMemo(() => dashboard.groupTrends.slice(0, 6).map(item => {
    const domain = matrixGroupColor(item.label, appearance);
    return { label: item.label, value: item.total, color: domain.accent };
  }), [appearance, dashboard.groupTrends]);

  const recent = useMemo(() => [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8), [items]);
  const activeTypes = entitySignals.filter(item => item.count > 0).length;
  const privateCount = items.filter(item => item.deviceOnly).length;
  const todayItems = summary.today.slice(0, 6);

  const now = new Date();
  const create = (type: string) => router.navigate({ pathname: '/entities', params: { type, request: String(Date.now()) } });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: p.bg }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.page}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={p.accent} />}
      >
        <View style={s.topBar}>
          <View>
            <Text style={[s.eyebrow, { color: p.muted }]}>MATRIX</Text>
            <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Your life, live.</Text>
            <Text style={[s.date, { color: p.muted }]}>
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={[s.iconButton, { backgroundColor: p.raised }]}>
            <SymbolView name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} size={19} tintColor={p.text} />
          </Pressable>
        </View>

        <MotionReveal>
          <View style={[s.hero, compact && s.heroCompact, { backgroundColor: p.card }]}>
            <View style={s.heroCopy}>
              <View style={s.heroHeader}>
                <View>
                  <Text style={[s.sectionKicker, { color: p.accent }]}>14-DAY ACTIVITY</Text>
                  <Text style={[s.heroTitle, { color: p.text }]}>Everything moving through MATRIX</Text>
                </View>
                <Pressable onPress={() => router.push('/insights')} style={[s.insightButton, { backgroundColor: p.selected }]}>
                  <Text style={[s.insightButtonText, { color: p.accent }]}>Insights</Text>
                  <SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} size={13} tintColor={p.accent} />
                </Pressable>
              </View>

              <View style={s.trendLegend}>
                {groupSeries.map(item => (
                  <View key={item.label} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[s.legendText, { color: p.muted }]}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <MultiTrendChart series={groupSeries} palette={p} height={compact ? 150 : 178} />

              <View style={s.axisRow}>
                <Text style={[s.axisText, { color: p.muted }]}>14 days ago</Text>
                <Text style={[s.axisText, { color: p.muted }]}>Today</Text>
              </View>
            </View>

            <View style={[s.heroMotion, compact && s.heroMotionCompact, { backgroundColor: p.subtle }]}>
              <AmbientMatrixAnimation palette={p} height={118} />
              <View style={s.heroMetrics}>
                <View>
                  <Text style={[s.heroMetric, { color: p.text }]}>{items.length}</Text>
                  <Text style={[s.heroMetricLabel, { color: p.muted }]}>records</Text>
                </View>
                <View>
                  <Text style={[s.heroMetric, { color: p.text }]}>{activeTypes}</Text>
                  <Text style={[s.heroMetricLabel, { color: p.muted }]}>active types</Text>
                </View>
              </View>
            </View>
          </View>
        </MotionReveal>

        <View style={s.statGrid}>
          {[
            { label: 'Today', value: summary.today.length, icon: 'calendar_today', ios: 'calendar', tone: p.accent },
            { label: 'Tasks done', value: summary.tasks.length ? `${summary.completed}/${summary.tasks.length}` : '—', icon: 'task_alt', ios: 'checkmark.circle', tone: p.success },
            { label: 'On device', value: privateCount, icon: 'shield_lock', ios: 'lock.shield', tone: p.violet },
            { label: 'Life areas', value: dashboard.groupTrends.length, icon: 'grid_view', ios: 'square.grid.2x2', tone: p.cyan },
          ].map((item, index) => (
            <MotionReveal key={item.label} delay={50 + index * 35}>
              <View style={[s.stat, { backgroundColor: p.card }]}>
                <View style={[s.statIcon, { backgroundColor: p.raised }]}>
                  <SymbolView name={{ ios: item.ios, android: item.icon, web: item.icon }} size={18} tintColor={item.tone} />
                </View>
                <Text style={[s.statValue, { color: p.text }]}>{item.value}</Text>
                <Text style={[s.statLabel, { color: p.muted }]}>{item.label}</Text>
              </View>
            </MotionReveal>
          ))}
        </View>

        <View style={s.sectionHeader}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>Life areas</Text>
            <Text style={[s.sectionSubtitle, { color: p.muted }]}>Where your saved data lives</Text>
          </View>
          <Pressable onPress={() => router.navigate('/matrix')}>
            <Text style={[s.sectionLink, { color: p.accent }]}>Matrix</Text>
          </Pressable>
        </View>

        <MotionReveal delay={120}>
          <View style={[s.distribution, compact && s.distributionCompact, { backgroundColor: p.card }]}>
            <DonutDistribution data={groupDistribution} palette={p} size={compact ? 150 : 170} />
            <View style={s.areaList}>
              {groupDistribution.map(item => (
                <View key={item.label} style={s.areaRow}>
                  <View style={[s.areaIcon, { backgroundColor: matrixGroupColor(item.label, appearance).soft }]}>
                    <View style={[s.areaDot, { backgroundColor: item.color }]} />
                  </View>
                  <Text style={[s.areaName, { color: p.text }]}>{item.label}</Text>
                  <Text style={[s.areaCount, { color: p.muted }]}>{item.value}</Text>
                </View>
              ))}
              {!groupDistribution.length ? <Text style={[s.emptyText, { color: p.muted }]}>Add a few records and your distribution will appear here.</Text> : null}
            </View>
          </View>
        </MotionReveal>

        <View style={s.sectionHeader}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>Quick capture</Text>
            <Text style={[s.sectionSubtitle, { color: p.muted }]}>The things you log most often</Text>
          </View>
          <Pressable onPress={() => router.navigate('/add')}>
            <Text style={[s.sectionLink, { color: p.accent }]}>All types</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickRail}>
          {quick.map((item, index) => {
            const definition = entityCatalog.find(entity => entity.name === item.type);
            const domain = matrixGroupColor(definition?.group, appearance);
            return (
              <MotionReveal key={item.type} delay={150 + index * 25}>
                <Pressable onPress={() => create(item.type)} style={[s.quickCard, { backgroundColor: domain.soft }]}>
                  <View style={[s.quickIcon, { backgroundColor: p.panel }]}>
                    <SymbolView name={{ ios: item.ios, android: item.other, web: item.other }} size={20} tintColor={domain.accent} />
                  </View>
                  <Text style={[s.quickTitle, { color: p.text }]}>{item.title}</Text>
                  <Text style={[s.quickHint, { color: domain.accent }]}>Add now</Text>
                </Pressable>
              </MotionReveal>
            );
          })}
        </ScrollView>

        <View style={s.sectionHeader}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>Today</Text>
            <Text style={[s.sectionSubtitle, { color: p.muted }]}>Scheduled and active</Text>
          </View>
          <Pressable onPress={() => router.push('/plans')}>
            <Text style={[s.sectionLink, { color: p.accent }]}>Plans</Text>
          </Pressable>
        </View>

        <View style={[s.todayBlock, { backgroundColor: p.card }]}>
          {todayItems.length ? todayItems.map((item, index) => {
            const type = String(item.metadata.entityType ?? item.kind);
            const domain = matrixGroupColor(String(item.metadata.group), appearance);
            const due = scheduledDate(item);
            return (
              <Pressable
                key={item.id}
                onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}
                style={[s.feedRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.line }]}
              >
                <View style={[s.feedIcon, { backgroundColor: domain.soft }]}>
                  <EntityIcon type={type} color={domain.accent} size={20} />
                </View>
                <View style={s.flex}>
                  <Text numberOfLines={1} style={[s.feedTitle, { color: p.text }]}>{item.title}</Text>
                  <Text numberOfLines={1} style={[s.feedMeta, { color: p.muted }]}>
                    {type}{due ? ` · ${due}` : ''}
                  </Text>
                </View>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={14} tintColor={p.muted} />
              </Pressable>
            );
          }) : (
            <View style={s.emptyState}>
              <SymbolView name={{ ios: 'checkmark.circle', android: 'task_alt', web: 'task_alt' }} size={24} tintColor={p.success} />
              <View style={s.flex}>
                <Text style={[s.emptyTitle, { color: p.text }]}>Nothing scheduled right now</Text>
                <Text style={[s.emptyText, { color: p.muted }]}>Your day is open. Add something when you need it.</Text>
              </View>
            </View>
          )}
        </View>

        <View style={s.sectionHeader}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>Entity signals</Text>
            <Text style={[s.sectionSubtitle, { color: p.muted }]}>All {entitySignals.length} entity types · 7-day micro trends</Text>
          </View>
        </View>

        <View style={s.entityGrid}>
          {entitySignals.map((item, index) => {
            const domain = matrixGroupColor(item.group, appearance);
            return (
              <MotionReveal key={item.name} delay={Math.min(index, 10) * 20}>
                <Pressable
                  onPress={() => router.navigate({ pathname: '/entities', params: { type: item.name } })}
                  style={[
                    s.entityTile,
                    { width: `${100 / columns - 1.2}%`, backgroundColor: item.count ? domain.soft : p.card },
                  ]}
                >
                  <View style={s.entityTop}>
                    <View style={[s.entityIcon, { backgroundColor: p.panel }]}>
                      <EntityIcon type={item.name} color={item.count ? domain.accent : p.muted} size={18} />
                    </View>
                    <Text style={[s.entityCount, { color: item.count ? domain.accent : p.muted }]}>{item.count}</Text>
                  </View>
                  <Text numberOfLines={1} style={[s.entityName, { color: p.text }]}>{item.name}</Text>
                  <Text numberOfLines={1} style={[s.entityGroup, { color: p.muted }]}>{item.group}</Text>
                  <View style={s.microWrap}>
                    <MicroBars values={item.values} color={domain.accent} trackColor={p.line} height={26} />
                  </View>
                </Pressable>
              </MotionReveal>
            );
          })}
        </View>

        <View style={s.sectionHeader}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>Recent activity</Text>
            <Text style={[s.sectionSubtitle, { color: p.muted }]}>Latest updates across MATRIX</Text>
          </View>
        </View>

        <View style={[s.recentBlock, { backgroundColor: p.card }]}>
          {recent.length ? recent.map((item, index) => {
            const type = String(item.metadata.entityType ?? item.kind);
            const domain = matrixGroupColor(String(item.metadata.group), appearance);
            return (
              <Pressable
                key={item.id}
                onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}
                style={[s.feedRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.line }]}
              >
                <View style={[s.feedIcon, { backgroundColor: domain.soft }]}>
                  <EntityIcon type={type} color={domain.accent} size={20} />
                </View>
                <View style={s.flex}>
                  <Text numberOfLines={1} style={[s.feedTitle, { color: p.text }]}>{item.title}</Text>
                  <Text numberOfLines={1} style={[s.feedMeta, { color: p.muted }]}>
                    {type} · {new Date(item.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                {item.deviceOnly ? <SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} size={13} tintColor={p.violet} /> : null}
              </Pressable>
            );
          }) : (
            <View style={s.emptyState}>
              <Text style={[s.emptyText, { color: p.muted }]}>Your recent records will appear here.</Text>
            </View>
          )}
        </View>

        {failed ? (
          <Pressable onPress={() => void load()} style={[s.errorCard, { backgroundColor: p.card, borderColor: p.danger }]}>
            <Text style={[s.errorTitle, { color: p.text }]}>Some data couldn’t be loaded</Text>
            <Text style={[s.emptyText, { color: p.muted }]}>Tap to try again.</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 130, maxWidth: 900, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginBottom: 4 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1.2 },
  date: { fontSize: 12.5, marginTop: 5 },
  iconButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  hero: { borderRadius: 28, padding: 18, flexDirection: 'row', gap: 16, overflow: 'hidden' },
  heroCompact: { flexDirection: 'column' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  sectionKicker: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1.1 },
  heroTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.45, marginTop: 5, maxWidth: 410 },
  insightButton: { minHeight: 34, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  insightButtonText: { fontSize: 11.5, fontWeight: '600' },
  trendLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 17, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 9.5 },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -3 },
  axisText: { fontSize: 9.5 },
  heroMotion: { width: 190, borderRadius: 22, padding: 14, justifyContent: 'space-between' },
  heroMotionCompact: { width: '100%' },
  heroMetrics: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  heroMetric: { fontSize: 22, fontWeight: '700', letterSpacing: -0.6 },
  heroMetricLabel: { fontSize: 9.5, marginTop: 1 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 10 },
  stat: { width: '100%', minWidth: 140, borderRadius: 18, padding: 14 },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 23, fontWeight: '700', letterSpacing: -0.6, marginTop: 14 },
  statLabel: { fontSize: 11, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 30, marginBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.35 },
  sectionSubtitle: { fontSize: 11.5, marginTop: 3 },
  sectionLink: { fontSize: 12.5, fontWeight: '600' },

  distribution: { borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 18 },
  distributionCompact: { alignItems: 'stretch' },
  areaList: { flex: 1, gap: 9 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  areaIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  areaDot: { width: 7, height: 7, borderRadius: 4 },
  areaName: { flex: 1, fontSize: 12.5, fontWeight: '500' },
  areaCount: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },

  quickRail: { gap: 9, paddingRight: 18 },
  quickCard: { width: 118, minHeight: 116, borderRadius: 20, padding: 13, justifyContent: 'space-between' },
  quickIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickTitle: { fontSize: 14, fontWeight: '650' as '600' },
  quickHint: { fontSize: 10.5, fontWeight: '600' },

  todayBlock: { borderRadius: 22, paddingHorizontal: 14 },
  recentBlock: { borderRadius: 22, paddingHorizontal: 14 },
  feedRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  feedIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  feedTitle: { fontSize: 14, fontWeight: '600' },
  feedMeta: { fontSize: 11.5, marginTop: 3 },
  emptyState: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  emptyTitle: { fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 11.5, lineHeight: 17 },

  entityGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 },
  entityTile: { minHeight: 124, borderRadius: 19, padding: 13 },
  entityTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entityIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  entityCount: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  entityName: { fontSize: 12.5, fontWeight: '600', marginTop: 10 },
  entityGroup: { fontSize: 9.5, marginTop: 2 },
  microWrap: { marginTop: 12 },

  errorCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginTop: 16 },
  errorTitle: { fontSize: 14, fontWeight: '600' },
});
