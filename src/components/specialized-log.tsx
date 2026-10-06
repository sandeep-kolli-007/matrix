import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { StyleSheet, Text, View } from 'react-native';
import { EntityFieldInput } from './entity-field-input';
import { fieldsForEntity } from '@/data/entity-fields';
import { logTotals, readLogItems, readWorkoutSets } from '@/data/log-items';
import { MealCapture, MoodCapture, WardrobeCapture, WorkoutCapture } from './visual-log-capture';

type Palette = { panel: string; raised: string; line: string; text: string; muted: string };
type Props = { type: string; values: Record<string, unknown>; palette: Palette; onChange?: (key: string, value: string) => void };
const labels: Record<string, string> = { calories: 'kcal', protein: 'Protein · g', carbs: 'Carbs · g', fat: 'Fat · g', volume: 'Volume · kg' };

export function SpecializedLog({ type, values, palette: p, onChange }: Props) {
  if (type === 'Mood Log') return <MoodCapture values={values} palette={p} onChange={onChange} />;
  if (type === 'Workout' && onChange) return <WorkoutCapture values={values} palette={p} onChange={onChange} />;
  if (type === 'Meal' && onChange) return <MealCapture values={values} palette={p} onChange={onChange} />;
  if (type === 'Wardrobe Log' && onChange) return <WardrobeCapture values={values} palette={p} onChange={onChange} />;
  const items = readLogItems(values.logItems);
  const totals = logTotals(type, items);
  const food = type === 'Meal';
  const workout = type === 'Workout';
  const sections = food ? [['foodCategory', 'Category', 'Meal', 'Snack', 'Drink'], ['mealType', 'Meal time', 'Breakfast', 'Lunch', 'Dinner', 'Other']]
    : workout ? [['activity', 'Activity', 'Strength', 'Cardio', 'Yoga', 'Sport', 'Other']]
    : [['occasion', 'Where did you wear this?', 'Work', 'Gym', 'Outdoor', 'Home', 'Other'], ['feeling', 'How did you feel?', 'Uncomfortable', 'Low', 'Neutral', 'Good', 'Great']];
  const columns = food ? [['name', 'Food name'], ['portion', 'Portion'], ['calories', 'kcal'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)']]
    : workout ? [['name', 'Exercise'], ['sets', 'Sets'], ['reps', 'Reps'], ['weight', 'Weight (kg)'], ['muscle', 'Muscle group']]
    : [['name', 'Clothing item'], ['slot', 'Top, bottom, footwear…'], ['color', 'Color']];
  function updateItem(index: number, key: string, value: string) {
    onChange?.('logItems', JSON.stringify(items.map((item, i) => i === index ? { ...item, [key]: value } : item)));
  }
  return <View style={s.root}>
    {sections.map(([key, label, ...choices]) => <View key={key} style={s.section}>
      <Text style={[s.caption, { color: p.muted }]}>{label.toUpperCase()}</Text>
      {onChange ? <View style={s.wrap}>{choices.map(choice => <Pressable key={choice} accessibilityRole="button" accessibilityState={{ selected: values[key] === choice }} onPress={() => onChange(key, values[key] === choice ? '' : choice)} style={[s.chip, { backgroundColor: values[key] === choice ? '#A5D957' : p.panel, borderColor: p.line }]}>
        <Text style={{ color: values[key] === choice ? '#20300F' : p.text, fontSize: 12 }}>{choice}</Text>
      </Pressable>)}</View> : <Text style={{ color: p.text }}>{String(values[key] || 'Not recorded')}</Text>}
    </View>)}

    <View style={[s.card, { backgroundColor: p.panel, borderColor: p.line }]}>
      {fieldsForEntity(type).filter(field => ['date', 'time', 'duration', 'heartRate'].includes(field.key)).map(field => <View key={field.key}>
        <Text style={[s.caption, { color: p.muted }]}>{field.label.toUpperCase()}</Text>
        {onChange ? <EntityFieldInput field={field} value={String(values[field.key] ?? '')} onChange={value => onChange(field.key, value)} palette={p} /> : <Text style={[s.value, { color: p.text }]}>{String(values[field.key] || 'Not recorded')}</Text>}
      </View>)}
    </View>

    <View style={s.heading}><Text style={[s.sectionTitle, { color: p.text }]}>{food ? 'Food items' : workout ? 'Exercises' : 'Composition'}</Text><Text style={{ color: p.muted }}>{items.length} items</Text></View>
    {!items.length ? <View style={[s.card, { backgroundColor: p.panel, borderColor: p.line }]}><Text style={{ color: p.muted, lineHeight: 21 }}>{food ? 'Build your meal one item at a time. Nutrition values are entered manually.' : workout ? 'Add the exercises you completed, including sets, reps, and weight.' : 'Record your outfit: top, bottom, footwear, and accessories.'}</Text></View> : null}
    {items.map((item, index) => <View key={index} style={[s.card, { backgroundColor: p.panel, borderColor: p.line }]}>
      <View style={s.heading}><View style={[s.badge, { backgroundColor: p.raised }]}><Text style={{ color: p.text }}>{String(index + 1).padStart(2, '0')}</Text></View>
        <Text style={[s.itemTitle, { color: p.text }]}>{item.name || (food ? 'New food' : workout ? 'New exercise' : 'New clothing item')}</Text>
        {onChange ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove item ${index + 1}`} onPress={() => onChange('logItems', JSON.stringify(items.filter((_, i) => i !== index)))} style={s.remove}><Text style={{ color: p.muted }}>×</Text></Pressable> : null}
      </View>
      {workout && item.setEntries !== undefined ? <View style={{ gap: 8 }}>{readWorkoutSets(item).map((set, i) => <Text key={i} style={{ color: p.text }}>Set {i + 1} · {set.weight || '—'} kg × {set.reps || '—'} reps</Text>)}<Text style={{ color: p.muted }}>{item.muscle}</Text></View> : null}
      {onChange ? <View style={s.wrap}>{columns.map(([key, label]) => <View key={key} style={key === 'name' ? s.full : s.half}>
        <Text style={[s.caption, { color: p.muted }]}>{label}</Text><EntityFieldInput field={{ key, label, placeholder: label, keyboard: ['calories', 'protein', 'carbs', 'fat', 'sets', 'reps', 'weight'].includes(key) ? 'numeric' : 'default', ...(key === 'name' ? { options: food ? ['Rice', 'Eggs', 'Milk', 'Chicken', 'Dal', 'Roti', 'Fruit', 'Vegetables', 'Coffee', 'Tea'] : ['T-shirt', 'Shirt', 'Jeans', 'Trousers', 'Dress', 'Shoes', 'Jacket'] } : {}) }} value={item[key] ?? ''} onChange={value => updateItem(index, key, value)} palette={p} />
      </View>)}</View> : <View style={s.wrap}>{columns.filter(([key]) => key !== 'name' && item[key] && !(workout && item.setEntries !== undefined)).map(([key, label]) => <Text key={key} style={{ color: p.muted }}>{label}: {item[key]}</Text>)}</View>}
    </View>)}
    {onChange ? <Pressable accessibilityRole="button" onPress={() => onChange('logItems', JSON.stringify([...items, { name: '' }]))} style={[s.add, { borderColor: p.line, backgroundColor: p.raised }]}><Text style={{ color: p.text }}>＋ Add {food ? 'food item' : workout ? 'exercise' : 'clothing item'}</Text></Pressable> : null}

    {food || workout ? <>
      <Text style={[s.caption, { color: p.muted }]}>{food ? 'NUTRITION SUMMARY' : 'WORKOUT SUMMARY'}</Text>
      <View style={[s.summary, { backgroundColor: p.panel, borderColor: p.line }]}>{Object.entries(totals).map(([key, total]) => <View key={key} style={s.stat}>
        <Text style={[s.number, { color: p.text }]}>{total === null ? (values[key] ? String(values[key]) : '—') : Number(total.toFixed(1)).toLocaleString()}</Text><Text style={[s.caption, { color: p.muted }]}>{labels[key]}</Text>
      </View>)}</View>
      <Text style={[s.hint, { color: p.muted }]}>Totals require a value on every item. A dash means not recorded, not zero. Workout volume is the sum of each set’s reps × kg.</Text>
      {onChange ? <View style={s.wrap}>{fieldsForEntity(type).filter(field => ['calories', 'protein', 'carbs', 'fat'].includes(field.key)).map(field => <View key={field.key} style={s.half}><Text style={[s.caption, { color: p.muted }]}>{field.label} · optional log total</Text><EntityFieldInput field={field} value={String(values[field.key] ?? '')} onChange={value => onChange(field.key, value)} palette={p} /></View>)}</View> : workout && values.calories ? <Text style={{ color: p.text }}>{String(values.calories)} kcal recorded</Text> : null}
      {workout && items.some(item => item.muscle) ? <View style={[s.card, { backgroundColor: p.panel, borderColor: p.line }]}><Text style={[s.caption, { color: p.muted }]}>MUSCLE GROUPS RECORDED</Text><Text style={{ color: p.text }}>{[...new Set(items.map(item => item.muscle).filter(Boolean))].join(' · ')}</Text></View> : null}
    </> : null}
  </View>;
}

const s = StyleSheet.create({
  root: { gap: 14, marginBottom: 24 }, section: { gap: 9 }, caption: { fontSize: 10, letterSpacing: 0.7, marginBottom: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 16, flex: 1 }, itemTitle: { fontSize: 15, flex: 1 }, badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, full: { width: '100%' }, half: { width: '47%' },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 }, add: { minHeight: 48, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 14, borderRadius: 14, borderWidth: 1 }, stat: { flexGrow: 1 }, number: { fontSize: 24, marginBottom: 6 }, hint: { fontSize: 11, lineHeight: 17 }, value: { fontSize: 15, marginBottom: 12 },
});
