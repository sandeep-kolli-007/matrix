import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';
import ContactsScreen from '../profile';
import MessagesScreen from '../messages';

type PeopleTab = 'Chats' | 'Contacts' | 'Groups' | 'Calls';

export default function People() {
  const [tab, setTab] = useState<PeopleTab>('Chats');
  const { appearance } = useLifeOS();
  const p = matrixTheme(appearance);

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: p.bg }]}>
      <View style={s.header}>
        <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>People</Text>
        <Text style={[s.subtitle, { color: p.muted }]}>Conversations and connections.</Text>
        <View style={[s.segment, { backgroundColor: p.raised }]}>
          {(['Chats', 'Contacts', 'Groups', 'Calls'] as const).map(value => {
            const selected = value === tab;
            return (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setTab(value)} style={[s.segmentItem, selected && { backgroundColor: p.panel }]}>
                <Text style={[s.segmentText, { color: selected ? p.text : p.muted }]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={s.content}>
        {tab === 'Chats' ? <MessagesScreen embedded /> : null}
        {tab === 'Contacts' ? <ContactsScreen /> : null}
        {tab === 'Groups' ? <MessagesScreen groupsOnly embedded /> : null}
        {tab === 'Calls' ? (
          <View style={[s.empty, { backgroundColor: p.panel, borderColor: p.line }]}>
            <Text style={[s.emptyTitle, { color: p.text }]}>Calls aren’t connected yet</Text>
            <Text style={[s.emptyText, { color: p.muted }]}>MATRIX won’t show call activity until calling is actually enabled.</Text>
            <Pressable onPress={() => setTab('Contacts')} style={[s.action, { backgroundColor: p.accent }]}>
              <Text style={{ color: p.onAccent, fontWeight: '600' }}>Browse contacts</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1.1 },
  subtitle: { fontSize: 13, marginTop: 3 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 3, marginTop: 18 },
  segmentItem: { flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 12.5, fontWeight: '600' },
  content: { flex: 1 },
  empty: { marginHorizontal: 20, marginTop: 16, borderWidth: 1, borderRadius: 16, padding: 20, maxWidth: 680, alignSelf: 'center', width: '90%' },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  action: { minHeight: 44, borderRadius: 12, paddingHorizontal: 16, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 16 },
});
