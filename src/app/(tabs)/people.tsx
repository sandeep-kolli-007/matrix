import { matrixTheme } from '@/data/matrix-theme';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MessagesScreen from '../messages';
import ContactsScreen from '../profile';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function People() {
  const [tab, setTab] = useState('Chats');
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = matrixTheme(appearance); const { bg, text } = p;
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bg }}><View style={{ padding: 20, gap: 12 }}><Text style={{ color: text, fontSize: 30, fontWeight: '700' }}>People</Text><View style={{ flexDirection: 'row', gap: 6 }}>{['Chats', 'Calls', 'Contacts', 'Groups'].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === tab }} onPress={() => setTab(value)} style={{ minHeight: 44, padding: 12, borderRadius: 12, backgroundColor: tab === value ? p.accent : p.panel }}><Text style={{ color: tab === value ? p.onAccent : text }}>{value}</Text></Pressable>)}</View></View>
    {tab === 'Chats' ? <MessagesScreen embedded /> : tab === 'Contacts' ? <ContactsScreen /> : tab === 'Groups' ? <MessagesScreen groupsOnly embedded /> : <View style={{ padding: 24, gap: 20 }}><Text style={{ color: text, lineHeight: 24 }}>Voice and video calling are not connected yet. No calls have been placed through MATRIX.</Text><Pressable accessibilityRole="button" onPress={() => setTab('Contacts')} style={{ minHeight: 44 }}><Text style={{ color: text }}>Browse contacts →</Text></Pressable></View>}
    {tab === 'Groups' ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/entities', params: { type: 'Group' } })} style={{ padding: 18 }}><Text style={{ color: text }}>＋ Create group record</Text></Pressable> : null}
  </SafeAreaView>;
}
