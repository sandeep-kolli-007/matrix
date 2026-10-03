import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { listEntities } from '@/data/lifeos-store';
import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function SettingsScreen() {
  const { appearance, toggleAppearance } = useLifeOS();
  const p = matrixTheme(appearance);
  const dark = appearance === 'dark';
  const [counts, setCounts] = useState({ all: 0, private: 0 });
  const [changing, setChanging] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    void listEntities()
      .then(items => { if (active) setCounts({ all: items.length, private: items.filter(item => item.deviceOnly).length }); })
      .catch(() => Alert.alert('Storage unavailable', 'Please try opening settings again.'));
    return () => { active = false; };
  }, []));

  async function changeAppearance() {
    setChanging(true);
    try {
      await toggleAppearance();
    } catch {
      Alert.alert('Preference not saved', 'Try again to save the appearance setting.');
    } finally {
      setChanging(false);
    }
  }

  const Row = ({ title, detail, onPress, trailing }: { title: string; detail?: string; onPress?: () => void; trailing?: React.ReactNode }) => (
    <Pressable disabled={!onPress} onPress={onPress} style={[s.row, { borderBottomColor: p.line }]}>
      <View style={s.flex}>
        <Text style={[s.rowTitle, { color: p.text }]}>{title}</Text>
        {detail ? <Text style={[s.rowDetail, { color: p.muted }]}>{detail}</Text> : null}
      </View>
      {trailing ?? (onPress ? <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={15} tintColor={p.muted} /> : null)}
    </Pressable>
  );

  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Settings</Text>

      <Text style={[s.section, { color: p.muted }]}>APPEARANCE</Text>
      <View style={[s.group, { backgroundColor: p.panel, borderColor: p.line }]}>
        <Row
          title="Dark mode"
          detail="Use a dark appearance across MATRIX"
          trailing={<Switch accessibilityLabel="Dark appearance" value={dark} disabled={changing} onValueChange={() => void changeAppearance()} trackColor={{ false: p.raised, true: p.accent }} />}
        />
      </View>

      <Text style={[s.section, { color: p.muted }]}>DATA</Text>
      <View style={[s.group, { backgroundColor: p.panel, borderColor: p.line }]}>
        <Row title="Saved items" detail={`${counts.all} total`} onPress={() => router.navigate('/entities')} />
        <Row title="On-device items" detail={`${counts.private} stay local`} />
        <Row title="Archive" detail="Restore previously archived items" onPress={() => router.push('/archive')} />
        <Row title="Data source" detail="Local data and Supabase connection" onPress={() => router.push('/data-connection')} />
      </View>

      <Text style={[s.section, { color: p.muted }]}>LIFE AREAS</Text>
      <View style={[s.group, { backgroundColor: p.panel, borderColor: p.line }]}>
        <Row title="Rooms" detail="Browse work, health, money and more" onPress={() => router.push('/rooms')} />
        <Row title="Cycle tracking" onPress={() => router.push('/cycle')} />
        <Row title="Insights" onPress={() => router.push('/insights')} />
      </View>

      <Text style={[s.footnote, { color: p.muted }]}>
        New items are saved locally. Connected records are read-only in this build. Items marked “on device” remain excluded from future cloud sync.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 70, maxWidth: 720, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1, marginBottom: 18 },
  section: { fontSize: 11, fontWeight: '600', letterSpacing: 0.7, marginTop: 18, marginBottom: 8, marginLeft: 4 },
  group: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { minHeight: 60, paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTitle: { fontSize: 14.5, fontWeight: '500' },
  rowDetail: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  footnote: { fontSize: 11.5, lineHeight: 18, marginTop: 18, paddingHorizontal: 4 },
});
