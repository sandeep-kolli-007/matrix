import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';

import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { useRecords } from '@/components/use-records';
import { isPreviewReviewMode } from '@/data/matrix-source';
import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

type CircleMode = 'Circle' | 'Family' | 'Team' | 'Friends';

const modes: CircleMode[] = ['Circle', 'Family', 'Team', 'Friends'];

export default function PeopleScreen() {
  const records = useRecords();
  const { appearance } = useLifeOS();
  const p = matrixTheme(isPreviewReviewMode ? 'dark' : appearance);
  const [mode, setMode] = useState<CircleMode>('Circle');

  const people = useMemo(() => records.items.filter(item =>
    ['person', 'family-member'].includes(item.kind)
  ), [records.items]);
  const groups = useMemo(() => records.items.filter(item => item.kind === 'group'), [records.items]);

  const filtered = useMemo(() => {
    if (mode === 'Circle') return people;
    if (mode === 'Family') return people.filter(item =>
      item.kind === 'family-member'
      || String(item.metadata.relationship ?? '').toLowerCase().includes('family')
      || ['mother', 'father', 'parent', 'sibling', 'spouse', 'child', 'cousin'].includes(String(item.metadata.relationship ?? '').toLowerCase())
    );
    if (mode === 'Friends') return people.filter(item => String(item.metadata.relationship ?? '').toLowerCase().includes('friend'));
    return people.filter(item =>
      String(item.metadata.relationship ?? '').toLowerCase().includes('colleague')
      || String(item.metadata.category ?? '').toLowerCase().includes('work')
    );
  }, [mode, people]);

  const familyCount = people.filter(item => item.kind === 'family-member' || String(item.metadata.relationship ?? '').toLowerCase().includes('family')).length;
  const friendCount = people.filter(item => String(item.metadata.relationship ?? '').toLowerCase().includes('friend')).length;
  const workCount = people.filter(item => String(item.metadata.relationship ?? '').toLowerCase().includes('colleague')).length;

  const circles = [
    { label: 'Add', count: '', color: p.accent, icon: 'add' },
    { label: 'Family', count: familyCount, color: '#FF7091', icon: 'family_restroom' },
    { label: 'Groups', count: groups.length, color: '#9B68FF', icon: 'groups' },
    { label: 'Friends', count: friendCount, color: '#35D9B0', icon: 'diversity_1' },
    { label: 'Work', count: workCount, color: '#3A91FF', icon: 'work' },
  ];

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.page}>
        <View style={s.header}>
          <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>People</Text>
          <View style={s.actions}>
            <Pressable onPress={() => router.push('/messages')} style={[s.circleButton, { backgroundColor: p.raised }]}>
              <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={17} tintColor={p.text} />
            </Pressable>
            <Pressable onPress={() => router.navigate({ pathname: '/entities', params: { type: 'Person', request: String(Date.now()) } })} style={[s.circleButton, { backgroundColor: p.raised }]}>
              <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={18} tintColor={p.text} />
            </Pressable>
          </View>
        </View>

        <View style={[s.segment, { backgroundColor: p.raised }]}>
          {modes.map(value => {
            const active = value === mode;
            return (
              <Pressable key={value} onPress={() => setMode(value)} style={[s.segmentItem, active && { backgroundColor: p.accent }]}>
                <Text style={[s.segmentText, { color: active ? p.onAccent : p.muted }]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.circleRail}>
          {circles.map((circle, index) => (
            <Pressable
              key={circle.label}
              onPress={() => index === 0
                ? router.navigate({ pathname: '/entities', params: { type: 'Person', request: String(Date.now()) } })
                : setMode(circle.label === 'Family' ? 'Family' : circle.label === 'Friends' ? 'Friends' : circle.label === 'Work' ? 'Team' : 'Circle')}
              style={s.circleItem}
            >
              <View style={[s.bigAvatar, { backgroundColor: `${circle.color}22`, borderColor: `${circle.color}55` }]}>
                <SymbolView name={{ ios: index === 0 ? 'plus' : index === 1 ? 'person.2.fill' : index === 2 ? 'person.3.fill' : index === 3 ? 'heart.fill' : 'briefcase.fill', android: circle.icon as never, web: circle.icon as never }} size={index === 0 ? 20 : 19} tintColor={circle.color} />
              </View>
              <Text numberOfLines={1} style={[s.circleLabel, { color: p.text }]}>{circle.label}</Text>
              {circle.count !== '' ? <Text style={[s.circleCount, { color: p.muted }]}>{circle.count}</Text> : null}
            </Pressable>
          ))}
        </ScrollView>

        <View style={s.sectionHead}>
          <Text style={[s.sectionTitle, { color: p.text }]}>{mode === 'Circle' ? `LifeOS Friends (${filtered.length})` : `${mode} (${filtered.length})`}</Text>
          <Pressable onPress={() => router.push('/messages')}><Text style={[s.seeAll, { color: p.accent }]}>See all</Text></Pressable>
        </View>

        <View style={[s.friendList, { backgroundColor: p.card, borderColor: p.line }]}>
          {filtered.length ? filtered.slice(0, 12).map((item, index) => {
            const initials = item.title.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
            const active = index % 3 !== 1;
            const streak = [12, 5, 8, 21, 4, 17][index % 6];
            const relationship = String(item.metadata.relationship ?? (item.kind === 'family-member' ? 'Family' : 'Connection'));
            return (
              <Pressable
                key={item.id}
                onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })}
                style={[s.friendRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.line }]}
              >
                <View style={[s.avatar, { backgroundColor: ['#243553', '#47304E', '#1F463C', '#3A3422'][index % 4] }]}>
                  <Text style={s.avatarText}>{initials || '?'}</Text>
                  <View style={[s.presence, { backgroundColor: active ? '#32D583' : p.muted, borderColor: p.card }]} />
                </View>
                <View style={s.flex}>
                  <Text numberOfLines={1} style={[s.friendName, { color: p.text }]}>{item.title}</Text>
                  <Text numberOfLines={1} style={[s.friendStatus, { color: p.muted }]}>
                    {active ? '● Active now' : relationship}
                  </Text>
                </View>
                <View style={s.streakWrap}>
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={[s.streak, { color: '#FFB43C' }]}>🔥 {streak} day streak</Text>
                  <Pressable onPress={() => router.push('/messages')} style={[s.chatButton, { backgroundColor: p.raised }]}>
                    <SymbolView name={{ ios: 'message', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }} size={14} tintColor={p.text} />
                  </Pressable>
                </View>
              </Pressable>
            );
          }) : (
            <View style={s.empty}>
              <Text style={[s.emptyTitle, { color: p.text }]}>No people in this circle yet</Text>
              <Text style={[s.emptyText, { color: p.muted }]}>Add someone or change the circle above.</Text>
            </View>
          )}
        </View>

        <View style={[s.importCard, { backgroundColor: p.card, borderColor: p.line }]}>
          <View style={[s.importIcon, { backgroundColor: '#352162' }]}>
            <SymbolView name={{ ios: 'person.crop.circle.badge.plus', android: 'person_add', web: 'person_add' }} size={24} tintColor="#A988FF" />
          </View>
          <View style={s.flex}>
            <Text style={[s.importTitle, { color: p.text }]}>Find Friends on LifeOS</Text>
            <Text style={[s.importCopy, { color: p.muted }]}>Sync contacts to see who’s already here.</Text>
          </View>
          <Pressable onPress={() => router.navigate({ pathname: '/entities', params: { type: 'Person', request: String(Date.now()) } })} style={[s.importButton, { backgroundColor: p.accent }]}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={s.importButtonText}>Import Contacts</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { paddingHorizontal: 14, paddingTop: 5, paddingBottom: 118, maxWidth: 640, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '750' as '700', letterSpacing: -0.8 },
  actions: { flexDirection: 'row', gap: 8 },
  circleButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', padding: 3, borderRadius: 13, marginTop: 10 },
  segmentItem: { flex: 1, minHeight: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 10.5, fontWeight: '600' },
  circleRail: { gap: 13, paddingTop: 16, paddingBottom: 7 },
  circleItem: { width: 62, alignItems: 'center' },
  bigAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  circleLabel: { fontSize: 9.5, fontWeight: '600', marginTop: 6 },
  circleCount: { fontSize: 8.5, marginTop: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 14.5, fontWeight: '700' },
  seeAll: { fontSize: 10.5, fontWeight: '600' },
  friendList: { borderRadius: 19, borderWidth: 1, paddingHorizontal: 12, overflow: 'hidden' },
  friendRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  presence: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2, right: -1, bottom: 1 },
  friendName: { fontSize: 12, fontWeight: '650' as '600' },
  friendStatus: { fontSize: 9.5, marginTop: 3 },
  streakWrap: { width: 88, alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  streak: { fontSize: 8.5, fontWeight: '600' },
  chatButton: { width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: 22, alignItems: 'center' },
  emptyTitle: { fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 10.5, marginTop: 4 },
  importCard: { borderRadius: 19, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  importIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  importTitle: { fontSize: 12, fontWeight: '650' as '600' },
  importCopy: { fontSize: 9.2, lineHeight: 13, marginTop: 3 },
  importButton: { minWidth: 90, maxWidth: 108, minHeight: 38, borderRadius: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  importButtonText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '700' },
});
