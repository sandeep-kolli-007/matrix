import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { EntityGalaxy, LifeConstellation, LifeStream } from '@/components/home-visuals';
import { MatrixLottie } from '@/components/matrix-lottie';
import { entityDashboard, visualMetrics } from '@/components/matrix-visuals';
import { LifeEntity, listEntities } from '@/data/lifeos-store';
import { isPreviewReviewMode } from '@/data/matrix-source';
import { matrixGroupColor, matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function InsightsScreen() {
  const { appearance } = useLifeOS();
  const reviewAppearance = isPreviewReviewMode ? 'dark' : appearance;
  const p = matrixTheme(reviewAppearance);

  const [items, setItems] = useState<LifeEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<'Overview' | 'Saved'>('Overview');

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

  const metrics = useMemo(() => visualMetrics(items), [items]);
  const dashboard = useMemo(() => entityDashboard(items, 14), [items]);
  const tasks = items.filter(item => item.kind === 'task');
  const done = tasks.filter(item => item.metadata.completed === true).length;
  const privateCount = items.filter(item => item.deviceOnly).length;
  const privacyRate = items.length ? Math.round(privateCount / items.length * 100) : 0;
  const taskRate = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const savedInsights = items.filter(item => item.kind === 'insight');

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

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={p.accent} />}
    >
      <View style={s.header}>
        <View style={s.flex}>
          <Text style={[s.eyebrow, { color: p.muted }]}>MATRIX</Text>
          <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Insights</Text>
          <Text style={[s.subtitle, { color: p.muted }]}>Patterns, motion and balance from your own data.</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} style={[s.iconButton, { backgroundColor: p.raised }]}>
          <SymbolView name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }} size={18} tintColor={p.text} />
        </Pressable>
      </View>

      <View style={[s.modeSwitch, { borderColor: p.line }]}>
        {(['Overview', 'Saved'] as const).map(value => {
          const active = value === mode;
          return (
            <Pressable key={value} onPress={() => setMode(value)} style={[s.mode, active && { backgroundColor: p.selected }]}>
              <Text style={[s.modeText, { color: active ? p.accent : p.muted }]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Pressable onPress={() => void load()} style={[s.error, { borderColor: p.danger }]}>
          <Text style={[s.errorTitle, { color: p.text }]}>Couldn’t load insights</Text>
          <Text style={[s.errorText, { color: p.muted }]}>Tap to try again.</Text>
        </Pressable>
      ) : mode === 'Overview' ? (
        <>
          <View style={[s.signalStage, { backgroundColor: p.panel }]}>
            <View style={[s.signalHalo, { borderColor: p.line }]} />
            <View style={s.signalCore}>
              <MatrixLottie size={160} />
              <View style={s.signalCopy}>
                <Text style={[s.signalValue, { color: p.text }]}>{metrics.pulse}</Text>
                <Text style={[s.signalLabel, { color: p.muted }]}>life pulse</Text>
              </View>
            </View>

            <View style={[s.floatingMetric, s.metricA, { backgroundColor: p.card, borderColor: p.line }]}>
              <Text style={[s.floatValue, { color: p.accent }]}>{metrics.total}</Text>
              <Text style={[s.floatLabel, { color: p.muted }]}>records</Text>
            </View>
            <View style={[s.floatingMetric, s.metricB, { backgroundColor: p.card, borderColor: p.line }]}>
              <Text style={[s.floatValue, { color: p.success }]}>{taskRate}%</Text>
              <Text style={[s.floatLabel, { color: p.muted }]}>tasks</Text>
            </View>
            <View style={[s.floatingMetric, s.metricC, { backgroundColor: p.card, borderColor: p.line }]}>
              <Text style={[s.floatValue, { color: p.violet }]}>{privacyRate}%</Text>
              <Text style={[s.floatLabel, { color: p.muted }]}>on device</Text>
            </View>
          </View>

          <Section
            eyebrow="FLOW"
            title="Your last 14 days"
            subtitle="Every band is a life area. Thickness reflects capture volume."
            color={p.violet}
            text={p.text}
            muted={p.muted}
          />
          <View style={[s.visualStage, { backgroundColor: p.panel }]}>
            <LifeStream areas={areas} palette={p} height={220} />
          </View>

          <Section
            eyebrow="CONSTELLATION"
            title="Where your data lives"
            subtitle="Tap an orbit to move into that life area."
            color={p.cyan}
            text={p.text}
            muted={p.muted}
          />
          <LifeConstellation
            areas={areas}
            palette={p}
            total={items.length}
            onPressArea={label => router.navigate({ pathname: '/(tabs)/matrix', params: { focus: label } })}
          />

          <Section
            eyebrow="GRAVITY"
            title="What has the most weight"
            subtitle="Entity bubbles scale from the volume of saved records."
            color={p.rose}
            text={p.text}
            muted={p.muted}
          />
          <EntityGalaxy
            entities={galaxy}
            palette={p}
            onPressEntity={name => router.navigate({ pathname: '/entities', params: { type: name } })}
          />

          <Pressable onPress={() => router.navigate('/(tabs)/matrix')} style={s.openMatrix}>
            <View style={[s.openMatrixLine, { backgroundColor: p.line }]} />
            <View style={[s.openMatrixIcon, { backgroundColor: p.selected }]}>
              <SymbolView name={{ ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' }} size={18} tintColor={p.accent} />
            </View>
            <View style={s.flex}>
              <Text style={[s.openMatrixTitle, { color: p.text }]}>Enter the full Matrix</Text>
              <Text style={[s.openMatrixText, { color: p.muted }]}>Explore life areas spatially instead of reading another report.</Text>
            </View>
            <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={16} tintColor={p.accent} />
          </Pressable>
        </>
      ) : (
        <View style={s.insightRiver}>
          <View style={[s.insightLine, { backgroundColor: p.line }]} />
          {savedInsights.length ? savedInsights.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}
              style={s.insightMoment}
            >
              <View style={[s.insightNode, { backgroundColor: index % 2 ? p.violet : p.accent, borderColor: p.bg }]} />
              <View style={s.insightCopy}>
                <Text style={[s.insightType, { color: index % 2 ? p.violet : p.accent }]}>
                  {String(item.metadata.subtype ?? 'Observation').toUpperCase()}
                </Text>
                <Text style={[s.insightTitle, { color: p.text }]}>{item.title}</Text>
                {item.details && item.details !== item.title ? (
                  <Text style={[s.insightBody, { color: p.muted }]}>{item.details}</Text>
                ) : null}
              </View>
              <SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} size={13} tintColor={p.muted} />
            </Pressable>
          )) : (
            <View style={[s.savedEmpty, { backgroundColor: p.panel }]}>
              <MatrixLottie size={116} />
              <Text style={[s.savedEmptyTitle, { color: p.text }]}>No saved insights yet</Text>
              <Text style={[s.savedEmptyText, { color: p.muted }]}>Your live visual insights are already available in Overview.</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function Section({
  eyebrow,
  title,
  subtitle,
  color,
  text,
  muted,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  color: string;
  text: string;
  muted: string;
}) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionEyebrow, { color }]}>{eyebrow}</Text>
      <Text style={[s.sectionTitle, { color: text }]}>{title}</Text>
      <Text style={[s.sectionSubtitle, { color: muted }]}>{subtitle}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 96, maxWidth: 760, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eyebrow: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1.4 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '750' as '700', letterSpacing: -0.85, marginTop: 2 },
  subtitle: { fontSize: 10.5, marginTop: 3 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  modeSwitch: { alignSelf: 'flex-start', flexDirection: 'row', minHeight: 38, borderRadius: 19, borderWidth: 1, padding: 3 },
  mode: { minWidth: 88, minHeight: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modeText: { fontSize: 10.5, fontWeight: '600' },

  signalStage: { height: 350, borderRadius: 32, marginTop: 16, overflow: 'hidden', position: 'relative' },
  signalHalo: { position: 'absolute', width: 246, height: 246, borderRadius: 123, borderWidth: 1, left: '50%', top: '50%', marginLeft: -123, marginTop: -123 },
  signalCore: { position: 'absolute', left: '50%', top: '50%', width: 180, height: 180, marginLeft: -90, marginTop: -90, alignItems: 'center', justifyContent: 'center' },
  signalCopy: { position: 'absolute', alignItems: 'center' },
  signalValue: { fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  signalLabel: { fontSize: 9.5, marginTop: 1 },
  floatingMetric: { position: 'absolute', minWidth: 82, minHeight: 58, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  metricA: { top: 28, left: 22 },
  metricB: { top: 42, right: 18 },
  metricC: { bottom: 24, right: 34 },
  floatValue: { fontSize: 17, fontWeight: '700' },
  floatLabel: { fontSize: 8.5, marginTop: 2 },

  section: { marginTop: 28, marginBottom: 11 },
  sectionEyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.2 },
  sectionTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.4, marginTop: 3 },
  sectionSubtitle: { fontSize: 9.5, lineHeight: 14, marginTop: 3 },
  visualStage: { borderRadius: 30, paddingHorizontal: 14, paddingVertical: 12 },

  openMatrix: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 24 },
  openMatrixLine: { position: 'absolute', left: 0, right: 0, top: 0, height: StyleSheet.hairlineWidth },
  openMatrixIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  openMatrixTitle: { fontSize: 12.5, fontWeight: '700' },
  openMatrixText: { fontSize: 9.5, lineHeight: 14, marginTop: 3 },

  insightRiver: { position: 'relative', marginTop: 22, paddingLeft: 18 },
  insightLine: { position: 'absolute', left: 22, top: 12, bottom: 12, width: 1 },
  insightMoment: { minHeight: 94, flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13 },
  insightNode: { width: 11, height: 11, borderRadius: 6, borderWidth: 2, marginTop: 6, marginLeft: -1, zIndex: 2 },
  insightCopy: { flex: 1 },
  insightType: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  insightTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  insightBody: { fontSize: 10, lineHeight: 15, marginTop: 4 },
  savedEmpty: { borderRadius: 30, minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: 20 },
  savedEmptyTitle: { fontSize: 15, fontWeight: '700' },
  savedEmptyText: { fontSize: 10.5, textAlign: 'center', marginTop: 4 },

  error: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 16 },
  errorTitle: { fontSize: 13, fontWeight: '700' },
  errorText: { fontSize: 10, marginTop: 3 },
});
