import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect } from 'expo-router';

import {
  ActivityRiver,
  EntityGalaxy,
  LifeConstellation,
  LifeStream,
  TodayOrbit,
} from '@/components/home-visuals';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { MatrixLottie } from '@/components/matrix-lottie';
import { formatLocalDate } from '@/data/entity-date';
import { homeSummary } from '@/data/home-summary';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { isPreviewReviewMode } from '@/data/matrix-source';
import { matrixGroupColor, matrixTheme } from '@/data/matrix-theme';
import { entityDashboard } from '@/components/matrix-visuals';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function HomeScreen() {
  const { appearance } = useLifeOS();
  const reviewAppearance = isPreviewReviewMode ? 'dark' : appearance;
  const p = matrixTheme(reviewAppearance);

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

  const active = useMemo(() => items.filter(item => !item.archivedAt), [items]);
  const recent = useMemo(
    () => [...active].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8),
    [active]
  );

  const areas = useMemo(() => dashboard.groupTrends.slice(0, 6).map(group => {
    const tone = matrixGroupColor(group.label, reviewAppearance);
    return {
      label: group.label,
      total: group.total,
      color: tone.accent,
      soft: tone.soft,
      values: group.values,
    };
  }), [dashboard.groupTrends, reviewAppearance]);

  const galaxy = useMemo(() => dashboard.entityTrends.map(entity => {
    const tone = matrixGroupColor(entity.group, reviewAppearance);
    return {
      name: entity.label,
      group: entity.group,
      count: entity.total,
      color: tone.accent,
      soft: tone.soft,
    };
  }), [dashboard.entityTrends, reviewAppearance]);

  const total14 = useMemo(
    () => dashboard.dateKeys.reduce((sum, _, index) =>
      sum + dashboard.groupTrends.reduce((groupSum, group) => groupSum + (group.values[index] ?? 0), 0)
    , 0),
    [dashboard.dateKeys, dashboard.groupTrends]
  );

  const expenseTotal = useMemo(() => active
    .filter(item => item.kind === 'expense')
    .reduce((sum, item) => sum + (Number(item.metadata.amount) || 0), 0), [active]);

  const taskCount = summary.tasks.length;
  const taskDone = summary.completed;
  const activeAreas = areas.filter(area => area.total > 0).length;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.page}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={p.accent} />}
      >
        <View style={s.topbar}>
          <View>
            <Text style={[s.brand, { color: p.muted }]}>LIFEOS</Text>
            <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>{greeting}</Text>
            <Text style={[s.date, { color: p.muted }]}>
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            style={[s.profile, { backgroundColor: p.raised }]}
            accessibilityLabel="Open settings"
          >
            <SymbolView name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} size={29} tintColor={p.text} />
          </Pressable>
        </View>

        <LifeConstellation
          areas={areas}
          palette={p}
          total={active.length}
          onPressArea={label => router.navigate({ pathname: '/(tabs)/matrix', params: { focus: label } })}
        />

        <View style={[s.metricRibbon, { borderColor: p.line }]}>
          <View style={s.metric}>
            <Text style={[s.metricValue, { color: p.text }]}>{summary.today.length}</Text>
            <Text style={[s.metricLabel, { color: p.muted }]}>today</Text>
          </View>
          <View style={[s.divider, { backgroundColor: p.line }]} />
          <View style={s.metric}>
            <Text style={[s.metricValue, { color: p.text }]}>{taskCount ? `${taskDone}/${taskCount}` : '—'}</Text>
            <Text style={[s.metricLabel, { color: p.muted }]}>tasks</Text>
          </View>
          <View style={[s.divider, { backgroundColor: p.line }]} />
          <View style={s.metric}>
            <Text style={[s.metricValue, { color: p.text }]}>{total14}</Text>
            <Text style={[s.metricLabel, { color: p.muted }]}>14d activity</Text>
          </View>
          <View style={[s.divider, { backgroundColor: p.line }]} />
          <View style={s.metric}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[s.metricValue, { color: p.text }]}>
              {expenseTotal ? `₹${Math.round(expenseTotal).toLocaleString('en-IN')}` : '—'}
            </Text>
            <Text style={[s.metricLabel, { color: p.muted }]}>spend</Text>
          </View>
        </View>

        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionEyebrow, { color: p.accent }]}>TODAY ORBIT</Text>
            <Text style={[s.sectionTitle, { color: p.text }]}>What needs your attention</Text>
          </View>
          <Pressable onPress={() => router.navigate('/(tabs)/timeline')}>
            <Text style={[s.link, { color: p.accent }]}>Timeline</Text>
          </Pressable>
        </View>

        {summary.today.length ? (
          <TodayOrbit
            items={summary.today}
            palette={p}
            onPressItem={item => router.navigate({ pathname: '/entities', params: { id: item.id } })}
          />
        ) : (
          <View style={[s.clearState, { backgroundColor: p.panel }]}>
            <MatrixLottie size={110} />
            <Text style={[s.clearTitle, { color: p.text }]}>Nothing pulling at you today</Text>
            <Text style={[s.clearCopy, { color: p.muted }]}>Your orbit is clear. Add something only when it matters.</Text>
            <Pressable onPress={() => router.navigate('/(tabs)/add')} style={[s.clearAction, { backgroundColor: p.accent }]}>
              <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '700' }}>Add something</Text>
            </Pressable>
          </View>
        )}

        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionEyebrow, { color: p.violet }]}>LIFE STREAM</Text>
            <Text style={[s.sectionTitle, { color: p.text }]}>How your life moved</Text>
            <Text style={[s.sectionSub, { color: p.muted }]}>14 days · stacked by life area</Text>
          </View>
          <Pressable onPress={() => router.push('/insights')}>
            <Text style={[s.link, { color: p.accent }]}>Insights</Text>
          </Pressable>
        </View>

        <View style={[s.streamStage, { backgroundColor: p.panel }]}>
          <LifeStream areas={areas} palette={p} height={200} />
          <View style={s.streamFoot}>
            <Text style={[s.streamText, { color: p.muted }]}>14 days ago</Text>
            <View style={[s.streamPulse, { backgroundColor: p.accent }]} />
            <Text style={[s.streamText, { color: p.muted }]}>Today</Text>
          </View>
        </View>

        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionEyebrow, { color: p.cyan }]}>ENTITY GALAXY</Text>
            <Text style={[s.sectionTitle, { color: p.text }]}>Your data has gravity</Text>
            <Text style={[s.sectionSub, { color: p.muted }]}>Bigger bubbles mean more records</Text>
          </View>
          <Pressable onPress={() => router.navigate('/(tabs)/matrix')}>
            <Text style={[s.link, { color: p.accent }]}>Explore all</Text>
          </Pressable>
        </View>

        <EntityGalaxy
          entities={galaxy}
          palette={p}
          onPressEntity={name => router.navigate({ pathname: '/entities', params: { type: name } })}
        />

        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionEyebrow, { color: p.rose }]}>ACTIVITY RIVER</Text>
            <Text style={[s.sectionTitle, { color: p.text }]}>What just happened</Text>
            <Text style={[s.sectionSub, { color: p.muted }]}>A flowing history instead of another list</Text>
          </View>
        </View>

        <ActivityRiver
          items={recent}
          palette={p}
          onPressItem={item => router.navigate({ pathname: '/entities', params: { id: item.id } })}
        />

        <View style={[s.bottomPulse, { backgroundColor: p.panel }]}>
          <MatrixLottie size={84} />
          <View style={s.bottomCopy}>
            <Text style={[s.bottomTitle, { color: p.text }]}>LifeOS is building your pattern map</Text>
            <Text style={[s.bottomText, { color: p.muted }]}>
              {activeAreas} active life areas · {active.length} records · visual insights update automatically.
            </Text>
          </View>
          <Pressable onPress={() => router.navigate('/(tabs)/add')} style={[s.fab, { backgroundColor: p.accent }]}>
            <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={20} tintColor="#fff" />
          </Pressable>
        </View>

        {failed ? (
          <Pressable onPress={() => void load()} style={[s.error, { borderColor: p.danger }]}>
            <Text style={[s.errorTitle, { color: p.text }]}>Couldn’t refresh LifeOS</Text>
            <Text style={[s.errorText, { color: p.muted }]}>Tap to try again.</Text>
          </Pressable>
        ) : null}

        {isPreviewReviewMode ? (
          <Text style={[s.previewNote, { color: p.muted }]}>Preview data enabled for design review</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 14, paddingTop: 5, paddingBottom: 132, maxWidth: 720, width: '100%', alignSelf: 'center' },

  topbar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  brand: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1.6 },
  title: { fontSize: 27, fontWeight: '750' as '700', letterSpacing: -0.8, marginTop: 2 },
  date: { fontSize: 10.5, marginTop: 3 },
  profile: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  metricRibbon: { minHeight: 70, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12 },
  metric: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  metricValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  metricLabel: { fontSize: 8.5, marginTop: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 30 },

  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 28, marginBottom: 12 },
  sectionEyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.35 },
  sectionSub: { fontSize: 9.5, marginTop: 3 },
  link: { fontSize: 10.5, fontWeight: '600' },

  clearState: { minHeight: 240, borderRadius: 30, alignItems: 'center', justifyContent: 'center', padding: 20 },
  clearTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  clearCopy: { fontSize: 10.5, lineHeight: 15, textAlign: 'center', maxWidth: 300, marginTop: 5 },
  clearAction: { minHeight: 40, borderRadius: 13, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginTop: 14 },

  streamStage: { borderRadius: 30, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, overflow: 'hidden' },
  streamFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  streamText: { fontSize: 8.5 },
  streamPulse: { width: 6, height: 6, borderRadius: 3 },

  bottomPulse: { minHeight: 112, borderRadius: 28, marginTop: 30, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  bottomCopy: { flex: 1 },
  bottomTitle: { fontSize: 12.5, fontWeight: '700' },
  bottomText: { fontSize: 9.5, lineHeight: 14, marginTop: 3 },
  fab: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  error: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 },
  errorTitle: { fontSize: 12.5, fontWeight: '600' },
  errorText: { fontSize: 10, marginTop: 3 },
  previewNote: { fontSize: 9, textAlign: 'center', marginTop: 16 },
});
