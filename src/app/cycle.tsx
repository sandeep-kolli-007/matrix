import { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LifeEntity, listEntities, saveEntity } from '@/data/lifeos-store';
import { fieldsForEntity } from '@/data/entity-fields';
import { validateEntityInput } from '@/data/entity-validation';
import { formatLocalDate } from '@/data/entity-date';
import { EntityFieldInput } from '@/components/entity-field-input';
import { useLifeOS } from '@/providers/lifeos-provider';

const fields = fieldsForEntity('Cycle Log');
export default function CycleScreen() {
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const p = { bg: dark ? '#07110F' : '#F5F8F6', panel: dark ? '#14251D' : '#FFFFFF', text: dark ? '#F4F8F5' : '#173122', muted: dark ? '#A5B8AD' : '#607366', accent: dark ? '#A8E65A' : '#126C4D', line: dark ? '#2A4234' : '#DFEAE3' };
  const [values, setValues] = useState<Record<string, string>>(() => ({ date: formatLocalDate(new Date()) }));
  const [notes, setNotes] = useState('');
  const [deviceOnly, setDeviceOnly] = useState(true);
  const [busy, setBusy] = useState(false);
  const [records, setRecords] = useState<LifeEntity[]>([]);
  const [error, setError] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const pending = useRef(false);
  const loadToken = useRef(0);
  const refresh = useCallback(async () => {
    const token = ++loadToken.current;
    try {
      const items = await listEntities();
      if (token !== loadToken.current) return;
      setRecords(items.filter(item => ['cycle-log', 'cycle'].includes(item.kind)).sort((a, b) =>
        String(b.metadata.date ?? b.createdAt).localeCompare(String(a.metadata.date ?? a.createdAt))));
      setError(false);
    } catch { if (token === loadToken.current) setError(true); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); return () => { loadToken.current++; }; }, [refresh]));
  async function log() {
    if (pending.current || savedId) return;
    const validation = !values.date?.trim() ? 'Choose a date for this log.' : validateEntityInput('Cycle Log', 'Cycle log', values);
    if (validation) { Alert.alert('Check your log', validation); return; }
    pending.current = true; setBusy(true);
    try {
      const saved = await saveEntity({
        kind: 'cycle-log', title: 'Cycle log · ' + values.date.trim(), details: notes.trim(), deviceOnly,
        metadata: { entityType: 'Cycle Log', ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])) },
      });
      setSavedId(saved.id);
      await refresh();
    } catch { Alert.alert('Could not save', 'Your input is still here. Please try again.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <FlatList style={{ backgroundColor: p.bg }} contentContainerStyle={s.page} data={records} keyExtractor={item => item.id}
    keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={s.header}>
      <Text style={[s.eyebrow, { color: p.accent }]}>PERSONAL CARE</Text>
      <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>Cycle journal</Text>
      <Text style={[s.copy, { color: p.muted }]}>Record your own observations. MATRIX does not infer cycle phases or predict fertility from these logs.</Text>
      <View style={[s.card, { backgroundColor: p.panel }]}>
        {savedId ? <View style={s.header}>
          <Text accessibilityLiveRegion="polite" style={[s.heading, { color: p.text }]}>Log saved{deviceOnly ? ' on this device' : ' locally'}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { id: savedId } })} style={[s.button, { backgroundColor: p.accent }]}><Text style={{ color: dark ? '#07110F' : '#fff' }}>View / edit saved log →</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => { setSavedId(null); setValues({ date: formatLocalDate(new Date()) }); setNotes(''); setDeviceOnly(true); }} style={s.button}><Text style={{ color: p.accent }}>Add another log</Text></Pressable>
        </View> : <>
          <View pointerEvents={busy ? 'none' : 'auto'} accessibilityElementsHidden={false}>
            {fields.map(field => <View key={field.key}><Text style={[s.label, { color: p.text }]}>{field.label}{field.key === 'date' ? ' *' : ' (optional)'}</Text><EntityFieldInput field={field} value={values[field.key] ?? ''} onChange={value => setValues(previous => ({ ...previous, [field.key]: value }))} palette={p} /></View>)}
            <Text style={[s.label, { color: p.text }]}>Notes (optional)</Text>
            <TextInput accessibilityLabel="Cycle log notes" editable={!busy} multiline value={notes} onChangeText={setNotes} placeholder="Anything you want to remember…" placeholderTextColor={p.muted} style={[s.notes, { color: p.text, borderColor: p.line }]} />
          </View>
          <View style={s.privacy}><View style={{ flex: 1 }}><Text style={[s.label, { color: p.text }]}>Stay only on this device</Text><Text style={[s.copy, { color: p.muted }]}>Enabled by default for this sensitive record.</Text></View><Switch accessibilityLabel="Stay only on this device" disabled={busy} value={deviceOnly} onValueChange={setDeviceOnly} /></View>
          <Text style={[s.copy, { color: p.muted }]}>All new logs are currently saved locally. Turning this off records your sync preference; cloud sync is not yet available.</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void log()} style={[s.button, { backgroundColor: p.accent, opacity: busy ? 0.6 : 1 }]}><Text style={{ color: dark ? '#07110F' : '#fff', fontWeight: '700' }}>{busy ? 'Saving…' : 'Save log'}</Text></Pressable>
        </>}
      </View>
      <Text accessibilityRole="header" style={[s.heading, { color: p.text }]}>Saved logs · {records.length}</Text>
      {error ? <Pressable accessibilityRole="button" onPress={() => void refresh()} style={s.button}><Text style={{ color: p.accent }}>Could not refresh logs. Retry →</Text></Pressable> : null}
    </View>}
    ListEmptyComponent={<Text style={[s.copy, { color: p.muted }]}>{error ? 'Saved data has not been changed.' : 'Your saved logs will appear here.'}</Text>}
    renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/entities', params: { id: item.id } })} style={[s.entry, { backgroundColor: p.panel }]}>
      <Text style={[s.heading, { color: p.text }]}>{item.title}</Text>
      <Text style={[s.copy, { color: p.muted }]}>{String(item.metadata.date ?? 'Date not recorded')}{item.deviceOnly ? ' · Device only' : ''}{item.source ? ' · Read only' : ''}</Text>
      <Text style={[s.copy, { color: p.muted }]}>{[item.metadata.flow, item.metadata.symptoms].filter(Boolean).join(' · ') || 'Open details →'}</Text>
    </Pressable>} />;
}
const s = StyleSheet.create({
  page: { padding: 22, paddingBottom: 60 }, header: { gap: 16, marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, title: { fontSize: 32, fontWeight: '800' },
  copy: { fontSize: 14, lineHeight: 21 }, card: { borderRadius: 22, padding: 18, gap: 18 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 }, heading: { fontSize: 18, fontWeight: '700' },
  notes: { minHeight: 100, borderWidth: 1, borderRadius: 16, padding: 14, textAlignVertical: 'top', fontSize: 15 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 12 }, button: { minHeight: 48, padding: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  entry: { padding: 18, borderRadius: 18, gap: 8, marginBottom: 12 },
});
