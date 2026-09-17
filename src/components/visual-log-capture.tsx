import { TapValue } from './tap-value';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { readLogItems, readWorkoutSets, withWorkoutSets, type WorkoutSet } from '@/data/log-items';
import { AnatomySelector } from './anatomy-selector';

type Palette = { panel: string; raised: string; line: string; text: string; muted: string };
type Props = { values: Record<string, unknown>; palette: Palette; onChange?: (key: string, value: string) => void };
const moods = [['😄', 'Happy'], ['😌', 'Calm'], ['🙂', 'Okay'], ['😔', 'Sad'], ['😣', 'Stressed'], ['😴', 'Tired'], ['😠', 'Angry'], ['🤩', 'Excited']];
const exercises: Record<string, string[]> = {
  Chest: ['Bench press', 'Incline press', 'Push-up', 'Chest fly'],
  Calves: ['Standing calf raise', 'Seated calf raise', 'Single-leg calf raise'],
  Glutes: ['Hip thrust', 'Glute bridge', 'Cable kickback'],
  Quads: ['Squat', 'Leg press', 'Leg extension', 'Lunge'],
  Hamstrings: ['Leg curl', 'Romanian deadlift', 'Nordic curl'],
  Abs: ['Crunch', 'Leg raise', 'Cable crunch'],
  Obliques: ['Side plank', 'Cable woodchop', 'Russian twist'],
  Biceps: ['Biceps curl', 'Hammer curl', 'Preacher curl'],
  Triceps: ['Triceps pushdown', 'Triceps extension', 'Close-grip press'],
  Forearms: ['Wrist curl', 'Reverse wrist curl', 'Reverse curl'],
  Hands: ['Hand gripper', 'Plate pinch', 'Finger extension'],
  'Front shoulders': ['Front raise', 'Shoulder press'],
  'Rear shoulders': ['Reverse fly', 'Rear delt row', 'Face pull'],
  'Upper traps': ['Dumbbell shrug', 'Barbell shrug'],
  'Middle traps': ['Prone T raise', 'Wide-grip seated row'],
  Lats: ['Lat pulldown', 'Pull-up', 'Straight-arm pulldown'],
  'Lower back': ['Back extension', 'Bird dog'],
};

export function MoodCapture({ values, palette: p, onChange }: Props) {
  return <View style={s.root}><Text style={[s.heading, { color: p.text }]}>How are you feeling?</Text><Text style={{ color: p.muted }}>Choose what feels closest. No typing needed.</Text>
    <View style={s.wrap}>{moods.filter(([, mood]) => onChange || mood === values.mood).map(([face, mood]) => <Pressable key={mood} disabled={!onChange} accessibilityRole="button" accessibilityLabel={mood} accessibilityState={{ selected: values.mood === mood }} onPress={() => onChange?.('mood', mood)} style={[s.mood, { borderColor: values.mood === mood ? '#8CB747' : p.line, backgroundColor: values.mood === mood ? p.raised : p.panel }]}><Text style={{ fontSize: 32 }}>{face}</Text><Text style={{ color: p.text }}>{mood}</Text>{values.mood === mood ? <Text style={{ color: p.text }}>✓</Text> : null}</Pressable>)}</View>
    {!onChange && !moods.some(([, mood]) => mood === values.mood) ? <Text style={{ color: p.text }}>{String(values.mood || 'Not recorded')}</Text> : null}
    {onChange ? <Text style={[s.hint, { color: p.muted }]}>Your selection is saved only when you tap Save mood. Device-only is on by default.</Text> : null}
  </View>;
}

export function WorkoutCapture({ values, palette: p, onChange }: Props) {
  const [muscle, setMuscle] = useState('Chest');
  const [custom, setCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const items = readLogItems(values.logItems);
  const commit = (next: typeof items) => onChange?.('logItems', JSON.stringify(next));
  function add(name: string) { if (!name.trim()) return; commit([...items, { name: name.trim(), muscle, setEntries: JSON.stringify([{ weight: '', reps: '' }]) }]); setCustomName(''); setCustom(false); }
  function updateSets(index: number, rows: WorkoutSet[]) { commit(items.map((item, i) => i === index ? withWorkoutSets(item, rows) : item)); }
  return <View style={s.root}>
    <Text style={[s.heading, { color: p.text }]}>Where did you train?</Text><Text style={{ color: p.muted }}>Tap the exact muscle you trained.</Text>
    <AnatomySelector muscle={muscle} onSelect={setMuscle} palette={p} />
    <Text style={[s.heading, { color: p.text }]}>Choose an exercise</Text>
    <View style={s.wrap}>{(exercises[muscle] ?? []).map(name => <Pressable key={name} accessibilityRole="button" accessibilityLabel={`Add ${name}`} onPress={() => add(name)} style={[s.exercise, { backgroundColor: p.panel, borderColor: p.line }]}><Text style={{ color: p.text }}>{name}</Text><Text style={{ color: p.muted, marginTop: 7 }}>＋ Add</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" onPress={() => setCustom(value => !value)} style={s.chip}><Text style={{ color: p.text }}>＋ Custom exercise</Text></Pressable>
    {custom ? <View style={s.wrap}><TextInput accessibilityLabel="Custom exercise name" value={customName} onChangeText={setCustomName} placeholder="Exercise name" placeholderTextColor={p.muted} style={{ flex: 1, minHeight: 48, padding: 12, color: p.text, backgroundColor: p.panel }} /><Pressable accessibilityRole="button" disabled={!customName.trim()} onPress={() => add(customName)} style={s.chip}><Text style={{ color: p.text }}>Add</Text></Pressable></View> : null}
    <Text style={[s.heading, { color: p.text }]}>Your workout · {items.length}</Text>
    <Text style={[s.hint, { color: p.muted }]}>Add as many sets as you need. Record weight and reps for each set; 0 kg means no added weight.</Text>
    {items.map((item, index) => <View key={index} style={[s.bodyCard, { backgroundColor: p.panel, borderColor: p.line, gap: 12 }]}>
      <View style={s.counterRow}><View style={{ flex: 1 }}><Text style={{ color: p.text, fontSize: 17 }}>{item.name}</Text><Text style={{ color: p.muted }}>{item.muscle}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`} onPress={() => commit(items.filter((_, i) => i !== index))} style={s.step}><Text style={{ color: p.muted, fontSize: 24 }}>×</Text></Pressable></View>
      <View style={s.setRow}>
        <Text style={[s.setHeading, { width: 36, color: p.muted }]}>SET</Text>
        <Text style={[s.setHeading, { flex: 1, color: p.muted }]}>KG</Text>
        <Text style={[s.setHeading, { flex: 1, color: p.muted }]}>REPS</Text>
        <View style={{ width: 44 }} />
      </View>
      {readWorkoutSets(item).map((set, setIndex, rows) => <View key={setIndex} style={s.setRow}>
        <View style={[s.setNumber, { backgroundColor: p.raised }]}><Text style={{ color: p.text, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{setIndex + 1}</Text></View>
        <View style={{ flex: 1 }}><TapValue compact label={`${item.name} · set ${setIndex + 1} · kg`} value={set.weight} numeric options={['0', '5', '10', '15', '20', '22.5', '25', '30', '40', '60']} onChange={value => updateSets(index, rows.map((row, i) => i === setIndex ? { ...row, weight: value } : row))} palette={p} /></View>
        <View style={{ flex: 1 }}><TapValue compact label={`${item.name} · set ${setIndex + 1} · reps`} value={set.reps} numeric integer options={['5', '6', '8', '10', '12', '15', '20']} onChange={value => updateSets(index, rows.map((row, i) => i === setIndex ? { ...row, reps: value } : row))} palette={p} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name} set ${setIndex + 1}`} onPress={() => updateSets(index, rows.filter((_, i) => i !== setIndex))} style={s.step}><Text style={{ color: p.muted, fontSize: 22 }}>×</Text></Pressable>
      </View>)}
      <View style={s.wrap}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Add set to ${item.name}`} onPress={() => updateSets(index, [...readWorkoutSets(item), { weight: '', reps: '' }])} style={[s.chip, { backgroundColor: p.raised }]}><Text style={{ color: p.text }}>＋ Add set</Text></Pressable>
        {readWorkoutSets(item).length ? <Pressable accessibilityRole="button" accessibilityLabel={`Copy last set of ${item.name}`} onPress={() => { const rows = readWorkoutSets(item); updateSets(index, [...rows, { ...rows[rows.length - 1] }]); }} style={s.chip}><Text style={{ color: p.text }}>Copy last set</Text></Pressable> : null}
      </View>
    </View>)}
  </View>;
}
const s = StyleSheet.create({ root: { gap: 15, marginBottom: 20 }, heading: { fontSize: 20, fontWeight: '600' }, hint: { fontSize: 12, lineHeight: 18 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, mood: { width: '23%', minHeight: 100, borderRadius: 20, borderWidth: 2, padding: 6, alignItems: 'center', justifyContent: 'center', gap: 7 }, bodyCard: { borderRadius: 20, borderWidth: 1, padding: 15 }, chip: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', borderRadius: 12 }, exercise: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 80 }, setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, setHeading: { textAlign: 'center', fontSize: 11, letterSpacing: 0.6 }, setNumber: { width: 36, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, setInput: { flex: 1, minWidth: 0, minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 8, textAlign: 'center', fontSize: 18, fontVariant: ['tabular-nums'] }, counterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, step: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' } });
