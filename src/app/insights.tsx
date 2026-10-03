import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import {
  DistributionBars,
  LifeGraph,
  LifeOrb,
  MotionReveal,
  Sparkline,
  SpatialStage,
  visualMetrics,
} from '@/components/matrix-visuals';
import { PremiumSurface } from '@/components/premium-surface';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function InsightsScreen() {
  const { appearance } = useLifeOS();
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const p = matrixTheme(appearance);
  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('Overview');

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

  const tasks = items.filter(item => item.kind === 'task');
  const done = tasks.filter(item => item.metadata.completed === true).length;
  const privateCount = items.filter(item => item.deviceOnly).length;
  const insights = items.filter(item => item.kind === 'insight');
  const metrics = useMemo(() => visualMetrics(items), [items]);
  const privacyRate = items.length ? Math.round(privateCount / items.length * 100) : 0;
  const activeThisWeek = metrics.daily.reduce((sum, value) => sum + value, 0);

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={p.accent} />}
    >
      <View style={s.header}>
        <View style={s.flex}>
          <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Insights</Text>
          <Text style={[s.subtitle, { color: p.muted }]}>Patterns from your saved MATRIX data.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={[s.iconButton, { backgroundColor: p.panel, borderColor: p.line }]}>
          <SymbolView name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }} size={19} tintColor={p.text} />
        </Pressable>
      </View>

      <View style={[s.tabs, { backgroundColor: p.raised }]}>
        {['Overview', 'Saved insights'].map(value => {
          const selected = value === tab;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setTab(value)}
              style={[s.tab, selected && { backgroundColor: p.panel }]}
            >
              <Text style={[s.tabText, { color: selected ? p.text : p.muted }]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Pressable onPress={() => void load()} style={[s.state, { backgroundColor: p.panel, borderColor: p.line }]}>
          <Text style={[s.stateTitle, { color: p.text }]}>Couldn’t load insights</Text>
          <Text style={[s.stateText, { color: p.muted }]}>Tap to try again.</Text>
        </Pressable>
      ) : tab === 'Overview' ? (
        <>
          <MotionReveal>
            <SpatialStage intensity={0.8}>
              <PremiumSurface style={[s.hero, compact && s.heroCompact, { backgroundColor: p.panel, borderColor: p.line }]}>
                <View style={s.heroCopy}>
                  <Text style={[s.kicker, { color: p.accent }]}>MATRIX SIGNAL</Text>
                  <Text style={[s.heroTitle, { color: p.text }]}>Life Pulse</Text>
                  <Text style={[s.heroBody, { color: p.muted }]}>
                    A descriptive signal based on task completion, recent activity, and breadth of saved life areas. It is not a health or wellbeing score.
                  </Text>
                  <View style={s.heroFacts}>
                    <View>
                      <Text style={[s.factValue, { color: p.text }]}>{metrics.total}</Text>
                      <Text style={[s.factLabel, { color: p.muted }]}>records</Text>
                    </View>
                    <View>
                      <Text style={[s.factValue, { color: p.text }]}>{metrics.groups.length}</Text>
                      <Text style={[s.factLabel, { color: p.muted }]}>areas</Text>
                    </View>
                    <View>
                      <Text style={[s.factValue, { color: p.text }]}>{activeThisWeek}</Text>
                      <Text style={[s.factLabel, { color: p.muted }]}>this week</Text>
                    </View>
                  </View>
                </View>
                <View style={[s.heroOrb, compact && s.heroOrbCompact]}>
                  <LifeOrb score={metrics.pulse} palette={p} size={compact ? 142 : 160} />
                </View>
              </PremiumSurface>
            </SpatialStage>
          </MotionReveal>

          <View style={s.metricGrid}>
            <MotionReveal delay={60}>
              <View style={[s.metricCard, { backgroundColor: p.panel, borderColor: p.line }]}>
                <View style={[s.metricIcon, { backgroundColor: p.selected }]}>
                  <SymbolView name={{ ios: 'checkmark.circle', android: 'task_alt', web: 'task_alt' }} size={20} tintColor={p.accent} />
                </View>
                <Text style={[s.metricNumber, { color: p.text }]}>{tasks.length ? `${Math.round(done / tasks.length * 100)}%` : '—'}</Text>
                <Text style={[s.metricName, { color: p.text }]}>Task completion</Text>
                <Text style={[s.metricDetail, { color: p.muted }]}>{tasks.length ? `${done} of ${tasks.length} tasks` : 'No tasks yet'}</Text>
              </View>
            </MotionReveal>

            <MotionReveal delay={100}>
              <View style={[s.metricCard, { backgroundColor: p.panel, borderColor: p.line }]}>
                <View style={[s.metricIcon, { backgroundColor: p.selected }]}>
                  <SymbolView name={{ ios: 'lock', android: 'lock', web: 'lock' }} size={20} tintColor={p.accent} />
                </View>
                <Text style={[s.metricNumber, { color: p.text }]}>{privacyRate}%</Text>
                <Text style={[s.metricName, { color: p.text }]}>On-device share</Text>
                <Text style={[s.metricDetail, { color: p.muted }]}>{privateCount} records marked local only</Text>
              </View>
            </MotionReveal>
          </View>

          <MotionReveal delay={120}>
            <View style={[s.chartCard, { backgroundColor: p.panel, borderColor: p.line }]}>
              <View style={s.cardHead}>
                <View>
                  <Text style={[s.cardTitle, { color: p.text }]}>Capture activity</Text>
                  <Text style={[s.cardSubtitle, { color: p.muted }]}>Records created over the last 7 days</Text>
                </View>
                <View style={[s.chartBadge, { backgroundColor: p.selected }]}>
                  <Text style={[s.chartBadgeText, { color: p.accent }]}>{activeThisWeek} total</Text>
                </View>
              </View>
              <Sparkline values={metrics.daily} palette={p} height={126} />
              <View style={s.axisLabels}>
                {['6d', '5d', '4d', '3d', '2d', '1d', 'Today'].map(label => (
                  <Text key={label} style={[s.axisLabel, { color: p.muted }]}>{label}</Text>
                ))}
              </View>
            </View>
          </MotionReveal>

          <MotionReveal delay={150}>
            <View style={[s.chartCard, { backgroundColor: p.panel, borderColor: p.line }]}>
              <View style={s.cardHead}>
                <View>
                  <Text style={[s.cardTitle, { color: p.text }]}>Life areas</Text>
                  <Text style={[s.cardSubtitle, { color: p.muted }]}>Record distribution by category</Text>
                </View>
              </View>
              <DistributionBars data={metrics.groups} palette={p} maxItems={6} />
            </View>
          </MotionReveal>

          <MotionReveal delay={180}>
            <View style={[s.graphCard, { backgroundColor: p.panel, borderColor: p.line }]}>
              <View style={s.cardHead}>
                <View>
                  <Text style={[s.cardTitle, { color: p.text }]}>Relationship field</Text>
                  <Text style={[s.cardSubtitle, { color: p.muted }]}>A spatial view of your record domains</Text>
                </View>
                <Pressable onPress={() => router.navigate('/matrix')}>
                  <Text style={[s.openLink, { color: p.accent }]}>Open Matrix</Text>
                </Pressable>
              </View>
              <SpatialStage intensity={1.2}>
                <LifeGraph groups={metrics.groups} palette={p} size={290} />
              </SpatialStage>
              <Text style={[s.note, { color: p.muted }]}>Node size represents saved record count only. It does not rate importance, balance, or wellbeing.</Text>
            </View>
          </MotionReveal>
        </>
      ) : (
        <>
          <Text style={[s.savedIntro, { color: p.muted }]}>
            Stored insights from your selected data source. These are saved observations, not newly generated advice.
          </Text>
          {insights.map((item, index) => (
            <MotionReveal key={item.id} delay={Math.min(index, 6) * 40}>
              <Pressable accessibilityRole="button" style={[s.savedCard, { backgroundColor: p.panel, borderColor: p.line }]} onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}>
                <View style={s.savedTop}>
                  <View style={[s.metricIcon, { backgroundColor: p.selected }]}>
                    <SymbolView name={{ ios: 'lightbulb', android: 'lightbulb', web: 'lightbulb' }} size={19} tintColor={p.accent} />
                  </View>
                  <Text style={[s.savedType, { color: p.accent }]}>{String(item.metadata.subtype ?? 'Observation')}</Text>
                </View>
                <Text style={[s.savedTitle, { color: p.text }]}>{item.title}</Text>
                {item.details && item.details !== item.title ? <Text style={[s.savedBody, { color: p.muted }]}>{item.details}</Text> : null}
                <Text style={[s.openLink, { color: p.accent }]}>View details</Text>
              </Pressable>
            </MotionReveal>
          ))}
          {!insights.length ? (
            <View style={[s.state, { backgroundColor: p.panel, borderColor: p.line }]}>
              <Text style={[s.stateTitle, { color: p.text }]}>No saved insights yet</Text>
              <Text style={[s.stateText, { color: p.muted }]}>Your visual overview is available above whenever you have saved records.</Text>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 80, gap: 14, maxWidth: 820, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 3, marginTop: 8, marginBottom: 2 },
  tab: { flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },
  hero: { minHeight: 260, borderRadius: 28, borderWidth: 1, padding: 22, flexDirection: 'row', overflow: 'hidden' },
  heroCopy: { flex: 1, justifyContent: 'center' },
  heroCompact: { flexDirection: 'column', minHeight: 0 },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  heroTitle: { fontSize: 29, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8, marginTop: 7 },
  heroBody: { fontSize: 12.5, lineHeight: 19, marginTop: 8, maxWidth: 430 },
  heroFacts: { flexDirection: 'row', gap: 28, marginTop: 24 },
  factValue: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  factLabel: { fontSize: 10.5, marginTop: 2 },
  heroOrb: { width: 184, alignItems: 'center', justifyContent: 'center' },
  heroOrbCompact: { width: '100%', marginTop: 14 },
  metricGrid: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, minHeight: 164, borderRadius: 18, borderWidth: 1, padding: 17 },
  metricIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricNumber: { fontSize: 27, fontWeight: '700', letterSpacing: -0.7, marginTop: 16 },
  metricName: { fontSize: 14, fontWeight: '600', marginTop: 3 },
  metricDetail: { fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  chartCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  cardSubtitle: { fontSize: 11.5, lineHeight: 17, marginTop: 3 },
  chartBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chartBadgeText: { fontSize: 10.5, fontWeight: '600' },
  axisLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 },
  axisLabel: { fontSize: 9.5 },
  graphCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
  openLink: { fontSize: 12.5, fontWeight: '600' },
  note: { fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: -2 },
  savedIntro: { fontSize: 12.5, lineHeight: 19, marginVertical: 4 },
  savedCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  savedTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  savedType: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' },
  savedTitle: { fontSize: 17, fontWeight: '600', lineHeight: 23, marginTop: 14 },
  savedBody: { fontSize: 12.5, lineHeight: 19, marginTop: 7 },
  state: { borderRadius: 16, borderWidth: 1, padding: 20 },
  stateTitle: { fontSize: 16, fontWeight: '600' },
  stateText: { fontSize: 13, lineHeight: 19, marginTop: 5 },
});
