import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';

import { DistributionBars, LifeGraph, MotionReveal, SpatialStage, visualMetrics } from '@/components/matrix-visuals';
import { EntityIcon } from '@/components/entity-icon';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { PremiumSurface } from '@/components/premium-surface';
import { useRecords } from '@/components/use-records';
import { entityCatalog, entityGroups } from '@/data/entity-catalog';
import { matrixGroupColor } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function Matrix() {
  const { items, loading, error, reload, p } = useRecords();
  const { appearance } = useLifeOS();
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const [type, setType] = useState<string | null>(null);
  const [group, setGroup] = useState('All');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('Categories');

  const kind = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.kind, (map.get(item.kind) ?? 0) + 1);
    return map;
  }, [items]);
  const visual = useMemo(() => visualMetrics(items), [items]);

  const records = items
    .filter(item => (!type || item.kind === kind(type))
      && (group === 'All' || item.metadata.group === group)
      && `${item.title} ${item.details ?? ''} ${item.kind}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const categories = entityCatalog.filter(item =>
    (group === 'All' || item.group === group)
    && item.name.toLowerCase().includes(query.toLowerCase()));

  const showRecords = Boolean(type) || mode === 'All records' || mode === 'Recent';
  const data = showRecords
    ? records.map(item => ({
        id: item.id,
        title: item.title,
        sub: `${String(item.metadata.entityType ?? item.kind)} · ${new Date(item.updatedAt).toLocaleDateString()}`,
        record: true,
        group: String(item.metadata.group ?? 'Other'),
      }))
    : categories.map(item => ({
        id: item.name,
        title: item.name,
        sub: `${counts.get(kind(item.name)) ?? 0} saved · ${item.group}`,
        record: false,
        group: item.group,
      }));

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={reload}
        contentContainerStyle={s.page}
        ListHeaderComponent={
          <View style={s.header}>
            <View style={s.titleRow}>
              {type ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Back to Matrix" onPress={() => setType(null)} style={s.back}>
                  <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={p.text} />
                </Pressable>
              ) : null}
              <View style={s.flex}>
                <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>{type ?? 'Matrix'}</Text>
                <Text style={[s.subtitle, { color: p.muted }]}>
                  {type ? `${records.length} saved` : `${items.length} items across your life`}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={[s.iconButton, { backgroundColor: p.panel, borderColor: p.line }]}>
                <SymbolView name={{ ios: 'gearshape', android: 'settings', web: 'settings' }} size={19} tintColor={p.text} />
              </Pressable>
            </View>

            {!type ? (
              <MotionReveal>
                <SpatialStage intensity={1.1}>
                  <PremiumSurface style={[s.graphCard, compact && s.graphCardCompact, { backgroundColor: p.panel, borderColor: p.line }]}>
                    <View style={s.graphCopy}>
                      <Text style={[s.kicker, { color: p.accent }]}>LIFE GRAPH</Text>
                      <Text style={[s.graphTitle, { color: p.text }]}>Your world, connected</Text>
                      <Text style={[s.graphBody, { color: p.muted }]}>
                        A spatial view of where your saved records live. Node size reflects record count, not importance.
                      </Text>
                      <View style={s.graphStats}>
                        <View>
                          <Text style={[s.graphMetric, { color: p.text }]}>{visual.total}</Text>
                          <Text style={[s.graphMetricLabel, { color: p.muted }]}>records</Text>
                        </View>
                        <View>
                          <Text style={[s.graphMetric, { color: p.text }]}>{visual.groups.length}</Text>
                          <Text style={[s.graphMetricLabel, { color: p.muted }]}>areas</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[s.graphVisual, compact && s.graphVisualCompact]}>
                      <LifeGraph groups={visual.groups} palette={p} size={compact ? 250 : 238} />
                    </View>
                  </PremiumSurface>
                </SpatialStage>
              </MotionReveal>
            ) : null}

            <View style={[s.search, { backgroundColor: p.raised, borderColor: query ? p.accent : p.line }]}>
              <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={18} tintColor={p.muted} />
              <TextInput
                accessibilityLabel="Search Matrix"
                placeholder={type ? `Search ${type.toLowerCase()}` : 'Search your Matrix'}
                placeholderTextColor={p.muted}
                value={query}
                onChangeText={setQuery}
                style={[s.searchInput, { color: p.text }]}
              />
            </View>

            {!type ? (
              <>
                <View style={[s.segment, { backgroundColor: p.raised }]}>
                  {['Categories', 'All records', 'Recent'].map(value => {
                    const selected = mode === value;
                    return (
                      <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setMode(value)} style={[s.segmentItem, selected && { backgroundColor: p.panel }]}>
                        <Text style={[s.segmentText, { color: selected ? p.text : p.muted }]}>{value}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.groups}>
                  {['All', ...entityGroups].map(value => (
                    <Pressable key={value} onPress={() => setGroup(value)} style={[s.groupChip, { backgroundColor: group === value ? p.selected : 'transparent', borderColor: group === value ? p.accent : p.line }]}>
                      <Text style={[s.groupText, { color: group === value ? p.accent : p.muted }]}>{value}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {mode === 'Categories' && visual.groups.length ? (
                  <MotionReveal delay={90}>
                    <View style={[s.distributionCard, { backgroundColor: p.panel, borderColor: p.line }]}>
                      <View style={s.distributionHead}>
                        <View>
                          <Text style={[s.sectionTitle, { color: p.text, marginTop: 0, marginBottom: 0 }]}>Distribution</Text>
                          <Text style={[s.distributionCopy, { color: p.muted }]}>Saved records by area</Text>
                        </View>
                        <Pressable onPress={() => router.push('/insights')}>
                          <Text style={[s.insightsLink, { color: p.accent }]}>Insights</Text>
                        </Pressable>
                      </View>
                      <DistributionBars data={visual.groups} palette={p} maxItems={6} />
                    </View>
                  </MotionReveal>
                ) : null}
              </>
            ) : (
              <Pressable onPress={() => router.push({ pathname: '/entities', params: { type, request: String(Date.now()) } })} style={[s.addButton, { backgroundColor: p.accent }]}>
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={17} tintColor={p.onAccent} />
                <Text style={{ color: p.onAccent, fontSize: 14, fontWeight: '600' }}>Add {type}</Text>
              </Pressable>
            )}

            <Text style={[s.sectionTitle, { color: p.text }]}>{showRecords ? 'Saved items' : group === 'All' ? 'Categories' : group}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={[s.empty, { backgroundColor: p.panel, borderColor: p.line }]}>
            <Text style={[s.emptyTitle, { color: p.text }]}>{error ? 'Couldn’t load Matrix' : loading ? 'Loading…' : 'No matches'}</Text>
            {!loading ? <Text style={[s.emptyText, { color: p.muted }]}>Try a different search or add something new.</Text> : null}
          </View>
        }
        renderItem={({ item, index }) => {
          const domain = matrixGroupColor(item.group, appearance);
          return (
          <MotionReveal delay={Math.min(index, 7) * 30}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (item.record) router.push({ pathname: '/entities', params: { id: item.id } });
                else {
                  setType(item.id);
                  setQuery('');
                }
              }}
              style={[s.row, { backgroundColor: item.record ? p.panel : domain.soft, borderColor: p.line }]}
            >
              <View style={[s.rowIcon, { backgroundColor: p.panel }]}>
                <EntityIcon type={item.record ? String(items.find(record => record.id === item.id)?.metadata.entityType ?? '') : item.title} color={domain.accent} size={22} />
              </View>
              <View style={s.flex}>
                <Text numberOfLines={1} style={[s.rowTitle, { color: p.text }]}>{item.title}</Text>
                <Text numberOfLines={1} style={[s.rowMeta, { color: p.muted }]}>{item.sub}</Text>
              </View>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={15} tintColor={p.muted} />
            </Pressable>
          </MotionReveal>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, maxWidth: 760, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 12 },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1.1 },
  subtitle: { fontSize: 13, marginTop: 2 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  graphCard: { minHeight: 278, borderRadius: 28, borderWidth: 1, padding: 18, marginTop: 20, flexDirection: 'row', overflow: 'hidden' },
  graphCopy: { flex: 1, minWidth: 0, justifyContent: 'center', zIndex: 2 },
  graphCardCompact: { flexDirection: 'column', minHeight: 0 },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  graphTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.5, marginTop: 7 },
  graphBody: { fontSize: 12.5, lineHeight: 19, marginTop: 8, maxWidth: 330 },
  graphStats: { flexDirection: 'row', gap: 24, marginTop: 22 },
  graphMetric: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  graphMetricLabel: { fontSize: 10.5, marginTop: 2 },
  graphVisual: { width: 250, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  graphVisualCompact: { width: '100%', marginRight: 0, marginTop: 8 },
  search: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderRadius: 14, borderWidth: 1, paddingLeft: 14, marginTop: 18 },
  searchInput: { flex: 1, paddingHorizontal: 11, paddingVertical: 12, fontSize: 14 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 3, marginTop: 14 },
  segmentItem: { flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 13, fontWeight: '600' },
  groups: { gap: 8, paddingVertical: 14 },
  groupChip: { height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  groupText: { fontSize: 12.5, fontWeight: '600' },
  distributionCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 10 },
  distributionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  distributionCopy: { fontSize: 11.5, marginTop: 3 },
  insightsLink: { fontSize: 12.5, fontWeight: '600' },
  addButton: { minHeight: 46, borderRadius: 13, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  row: { minHeight: 68, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  rowIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, marginTop: 4 },
  empty: { borderRadius: 16, borderWidth: 1, padding: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, lineHeight: 19, marginTop: 5 },
});
