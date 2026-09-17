import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { listEntities } from '@/data/lifeos-store';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function SettingsScreen() {
  const { appearance, toggleAppearance } = useLifeOS();
  const dark = appearance === 'dark';
  const colors = { background: dark ? '#07110F' : '#F5F8F6', surface: dark ? '#14231D' : '#FFFFFF', text: dark ? '#F4F8F5' : '#152B20', muted: dark ? '#A2B4A9' : '#64776B' };
  const [counts, setCounts] = useState({ all: 0, private: 0 });
  const [changing, setChanging] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    void listEntities().then((items) => { if (active) setCounts({ all: items.length, private: items.filter((item) => item.deviceOnly).length }); })
      .catch(() => Alert.alert('Storage unavailable', 'Please try opening settings again.'));
    return () => { active = false; };
  }, []));
  async function changeAppearance() {
    setChanging(true);
    try { await toggleAppearance(); }
    catch { Alert.alert('Preference not saved', 'Try again to save the appearance setting.'); }
    finally { setChanging(false); }
  }
  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={s.page}>
    <Text style={[s.title, { color: colors.text }]}>Make MATRIX yours</Text>
    <Text style={[s.subtitle, { color: colors.muted }]}>Your appearance, your data, your choice.</Text>
    <View style={[s.card, { backgroundColor: colors.surface }]}>
      <View style={s.row}><View style={s.grow}><Text style={[s.label, { color: colors.text }]}>Dark appearance</Text><Text style={[s.copy, { color: colors.muted }]}>Saved for your next visit</Text></View><Switch accessibilityLabel="Dark appearance" value={dark} disabled={changing} onValueChange={() => void changeAppearance()} trackColor={{ true: '#17815C' }} /></View>
    </View>
    <View style={[s.card, { backgroundColor: colors.surface }]}>
      <Text style={[s.label, { color: colors.text }]}>Your data</Text>
      <View style={s.row}><Text style={[s.copy, { color: colors.muted }]}>Saved items</Text><Text style={[s.number, { color: colors.text }]}>{counts.all}</Text></View>
      <View style={s.row}><Text style={[s.copy, { color: colors.muted }]}>Device-only items</Text><Text style={[s.number, { color: colors.text }]}>{counts.private}</Text></View>
      <Text style={[s.copy, { color: colors.muted }]}>Counts reflect your selected data source. New items are saved locally; connected records are read-only. Device-only items are marked to stay excluded from future sync.</Text>
      <Pressable onPress={() => router.navigate('/entities')} style={s.action}><Text style={s.actionText}>Manage saved items →</Text></Pressable>
      <Pressable onPress={() => router.push('/archive')} style={s.action}><Text style={s.actionText}>Archived items →</Text></Pressable>
    </View>
    <View style={[s.card, { backgroundColor: colors.surface }]}>
      <Text style={[s.label, { color: colors.text }]}>Connected accounts</Text>
      <Pressable onPress={() => router.push('/data-connection')} style={s.action}><Text style={s.actionText}>Connect Supabase / developer scenarios →</Text></Pressable>
      <Text style={[s.copy, { color: colors.muted }]}>Sign in to read your Supabase records, or choose local data. Two-way cloud sync is not enabled. Developer previews never change your database.</Text>
    </View>
    <View style={[s.card, { backgroundColor: colors.surface }]}>
      <Text style={[s.label, { color: colors.text }]}>Explore your life</Text>
      <Pressable style={s.action} onPress={() => router.push('/rooms')}><Text style={s.actionText}>Open your rooms →</Text></Pressable>
      {(['Health', 'Finance', 'People', 'Planning', 'Learning'] as const).map((group) => <Pressable accessibilityRole="button" key={group} style={s.row} onPress={() => router.navigate({ pathname: '/entities', params: { group } })}><Text style={[s.copy, { color: colors.text }]}>{group}</Text><Text style={{ color: colors.muted }}>›</Text></Pressable>)}
      <Pressable style={s.action} onPress={() => router.push('/cycle')}><Text style={s.actionText}>Cycle tracking →</Text></Pressable>
      <Pressable style={s.action} onPress={() => router.push('/insights')}><Text style={s.actionText}>Insights →</Text></Pressable>
    </View>
  </ScrollView>;
}

const s = StyleSheet.create({ page: { padding: 22, paddingBottom: 50, gap: 16 }, title: { fontSize: 28, fontWeight: '800' }, subtitle: { fontSize: 14, lineHeight: 20 }, card: { borderRadius: 22, padding: 20, gap: 12 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 16 }, grow: { flex: 1 }, label: { fontSize: 17, fontWeight: '700' }, copy: { fontSize: 14, lineHeight: 21 }, number: { fontSize: 20, fontWeight: '800' }, action: { paddingVertical: 12 }, actionText: { color: '#21A679', fontSize: 15, fontWeight: '700' } });
