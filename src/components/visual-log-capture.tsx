import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { TapValue } from './tap-value';
import { EntityFieldInput } from './entity-field-input';
import { fieldsForEntity } from '@/data/entity-fields';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { readLogItems, readWorkoutSets, withWorkoutSets, type WorkoutSet } from '@/data/log-items';
import { AnatomySelector } from './anatomy-selector';

type Palette = {
  panel: string; card?: string; raised: string; line: string; text: string; muted: string;
  accent?: string; selected?: string; onAccent?: string; success?: string; warning?: string; danger?: string;
};
type Props = { values: Record<string, unknown>; palette: Palette; onChange?: (key: string, value: string) => void };

const moods = [
  ['😄', 'Happy', '#FFD166'],
  ['😌', 'Calm', '#68D5C8'],
  ['🙂', 'Okay', '#7FA7FF'],
  ['🤩', 'Excited', '#B78CFF'],
  ['😔', 'Sad', '#7890B6'],
  ['😣', 'Stressed', '#FF8A7A'],
  ['😴', 'Tired', '#9B9FBD'],
  ['😠', 'Angry', '#FF6363'],
] as const;

const energies = [
  ['Low', 1], ['Medium', 2], ['High', 3],
] as const;

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

const foods = [
  { name: 'Chicken breast', calories: '330', protein: '62', carbs: '0', fat: '7' },
  { name: 'Rice', calories: '260', protein: '5', carbs: '57', fat: '1' },
  { name: 'Eggs', calories: '156', protein: '13', carbs: '1', fat: '11' },
  { name: 'Oats', calories: '150', protein: '5', carbs: '27', fat: '3' },
  { name: 'Whey', calories: '120', protein: '24', carbs: '3', fat: '2' },
  { name: 'Banana', calories: '105', protein: '1', carbs: '27', fat: '0' },
] as const;

function metric(value: number | string, label: string, color: string, p: Palette) {
  return (
    <View style={[s.metric, { backgroundColor: p.raised }]}>
      <Text style={[s.metricValue, { color }]}>{value}</Text>
      <Text style={[s.metricLabel, { color: p.muted }]}>{label}</Text>
    </View>
  );
}

export function MoodCapture({ values, palette: p, onChange }: Props) {
  const accent = p.accent ?? '#6E8FFF';
  const selectedMood = String(values.mood ?? '');
  const energy = String(values.energy ?? '');

  return (
    <View style={s.root}>
      <View style={s.experienceHeader}>
        <View style={[s.heroGlyph, { backgroundColor: p.selected ?? p.raised }]}>
          <Text style={{ fontSize: 30 }}>{moods.find(([, mood]) => mood === selectedMood)?.[0] ?? '🙂'}</Text>
        </View>
        <View style={s.flex}>
          <Text style={[s.eyebrow, { color: accent }]}>MOOD CHECK-IN</Text>
          <Text style={[s.heading, { color: p.text }]}>How do you feel right now?</Text>
          <Text style={[s.support, { color: p.muted }]}>One tap is enough. Add context only if you want to.</Text>
        </View>
      </View>

      <View style={s.moodGrid}>
        {moods.filter(([, mood]) => onChange || mood === selectedMood).map(([face, mood, color]) => {
          const active = selectedMood === mood;
          return (
            <Pressable
              key={mood}
              disabled={!onChange}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange?.('mood', mood)}
              style={[s.moodCard, { backgroundColor: active ? `${color}22` : p.card ?? p.panel, borderColor: active ? color : p.line }]}
            >
              <Text style={s.moodFace}>{face}</Text>
              <Text style={[s.moodName, { color: p.text }]}>{mood}</Text>
              {active ? <View style={[s.selectedDot, { backgroundColor: color }]} /> : null}
            </Pressable>
          );
        })}
      </View>

      {onChange ? (
        <>
          <Text style={[s.sectionLabel, { color: p.muted }]}>ENERGY</Text>
          <View style={s.energyRow}>
            {energies.map(([label, level]) => {
              const active = energy === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => onChange('energy', label)}
                  style={[s.energyCard, { backgroundColor: active ? p.selected ?? p.raised : p.card ?? p.panel, borderColor: active ? accent : p.line }]}
                >
                  <View style={s.energyBars}>
                    {[1, 2, 3].map(bar => <View key={bar} style={[s.energyBar, { height: 8 + bar * 5, backgroundColor: bar <= level ? (active ? accent : p.muted) : p.line }]} />)}
                  </View>
                  <Text style={[s.energyText, { color: active ? accent : p.text }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {onChange ? (
        <View style={[s.contextBox, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
          <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={17} tintColor={accent} />
          <TextInput
            value={String(values.trigger ?? '')}
            onChangeText={value => onChange('trigger', value)}
            placeholder="What influenced this mood? · optional"
            placeholderTextColor={p.muted}
            style={[s.contextInput, { color: p.text }]}
          />
        </View>
      ) : null}
    </View>
  );
}

export function WorkoutCapture({ values, palette: p, onChange }: Props) {
  const accent = p.accent ?? '#6E8FFF';
  const success = p.success ?? '#35D99B';
  const [muscle, setMuscle] = useState('Chest');
  const [custom, setCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const items = readLogItems(values.logItems);
  const commit = (next: typeof items) => onChange?.('logItems', JSON.stringify(next));

  function add(name: string) {
    if (!name.trim()) return;
    commit([...items, { name: name.trim(), muscle, setEntries: JSON.stringify([{ weight: '', reps: '' }]) }]);
    setCustomName('');
    setCustom(false);
  }

  function updateSets(index: number, rows: WorkoutSet[]) {
    commit(items.map((item, i) => i === index ? withWorkoutSets(item, rows) : item));
  }

  const stats = useMemo(() => {
    const sets = items.reduce((sum, item) => sum + readWorkoutSets(item).length, 0);
    const volume = items.reduce((sum, item) => sum + readWorkoutSets(item).reduce((setSum, row) => setSum + (Number(row.weight) || 0) * (Number(row.reps) || 0), 0), 0);
    return { sets, volume };
  }, [items]);

  return (
    <View style={s.root}>
      <View style={[s.workoutHero, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
        <View style={[s.workoutHeroIcon, { backgroundColor: '#FFB43C20' }]}>
          <SymbolView name={{ ios: 'figure.strengthtraining.traditional', android: 'fitness_center', web: 'fitness_center' }} size={30} tintColor="#FFB43C" />
        </View>
        <View style={s.flex}>
          <Text style={[s.eyebrow, { color: '#FFB43C' }]}>WORKOUT BUILDER</Text>
          <Text style={[s.heading, { color: p.text }]}>{items.length ? `${items.length} exercises in this session` : 'Build your session'}</Text>
          <Text style={[s.support, { color: p.muted }]}>Pick a muscle, add exercises, then log each set.</Text>
        </View>
      </View>

      <View style={s.summaryStrip}>
        {metric(items.length, 'Exercises', '#FFB43C', p)}
        {metric(stats.sets, 'Sets', accent, p)}
        {metric(stats.volume ? Math.round(stats.volume).toLocaleString() : '—', 'Volume kg', success, p)}
      </View>

      <View style={s.sessionMetaGrid}>
        {fieldsForEntity('Workout').filter(field => ['date', 'time', 'duration', 'heartRate'].includes(field.key)).map(field => (
          <View key={field.key} style={[s.sessionMetaCard, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
            <Text style={[s.sessionMetaLabel, { color: p.muted }]}>{field.label}</Text>
            <EntityFieldInput field={field} value={String(values[field.key] ?? '')} onChange={value => onChange?.(field.key, value)} palette={p} />
          </View>
        ))}
      </View>

      <View>
        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionTitle, { color: p.text }]}>Target area</Text>
            <Text style={[s.sectionCopy, { color: p.muted }]}>Tap the muscle you trained</Text>
          </View>
          <View style={[s.livePill, { backgroundColor: p.selected ?? p.raised }]}>
            <View style={[s.liveDot, { backgroundColor: success }]} />
            <Text style={[s.liveText, { color: accent }]}>{muscle}</Text>
          </View>
        </View>
        <View style={[s.anatomyShell, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
          <AnatomySelector muscle={muscle} onSelect={setMuscle} palette={p} />
        </View>
      </View>

      <View>
        <Text style={[s.sectionTitle, { color: p.text }]}>Add exercise</Text>
        <Text style={[s.sectionCopy, { color: p.muted }]}>Popular for {muscle}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.exerciseRail}>
          {(exercises[muscle] ?? []).map(name => (
            <Pressable
              key={name}
              onPress={() => add(name)}
              style={[s.exerciseCard, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}
            >
              <View style={[s.exerciseIcon, { backgroundColor: p.selected ?? p.raised }]}>
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={17} tintColor={accent} />
              </View>
              <Text numberOfLines={2} style={[s.exerciseName, { color: p.text }]}>{name}</Text>
              <Text style={[s.exerciseMuscle, { color: p.muted }]}>{muscle}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable onPress={() => setCustom(v => !v)} style={[s.customAction, { backgroundColor: p.raised }]}>
          <SymbolView name={{ ios: 'plus.circle', android: 'add_circle_outline', web: 'add_circle_outline' }} size={18} tintColor={accent} />
          <Text style={[s.customActionText, { color: p.text }]}>Custom exercise</Text>
        </Pressable>

        {custom ? (
          <View style={[s.customComposer, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="Exercise name"
              placeholderTextColor={p.muted}
              style={[s.customInput, { color: p.text }]}
            />
            <Pressable disabled={!customName.trim()} onPress={() => add(customName)} style={[s.customAdd, { backgroundColor: customName.trim() ? accent : p.line }]}>
              <Text style={{ color: p.onAccent ?? '#fff', fontWeight: '700' }}>Add</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View>
        <Text style={[s.sectionTitle, { color: p.text }]}>Session</Text>
        <Text style={[s.sectionCopy, { color: p.muted }]}>{items.length ? 'Log weight and reps. Copy the previous set when useful.' : 'Exercises you add will appear here.'}</Text>
      </View>

      {!items.length ? (
        <View style={[s.emptyWorkout, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
          <View style={[s.emptyWorkoutIcon, { backgroundColor: p.selected ?? p.raised }]}>
            <SymbolView name={{ ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' }} size={26} tintColor={accent} />
          </View>
          <Text style={[s.emptyWorkoutTitle, { color: p.text }]}>No exercises yet</Text>
          <Text style={[s.emptyWorkoutCopy, { color: p.muted }]}>Choose a muscle above and add your first exercise.</Text>
        </View>
      ) : null}

      {items.map((item, index) => {
        const rows = readWorkoutSets(item);
        const itemVolume = rows.reduce((sum, row) => sum + (Number(row.weight) || 0) * (Number(row.reps) || 0), 0);
        return (
          <View key={index} style={[s.sessionCard, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
            <View style={s.sessionHeader}>
              <View style={[s.sessionNumber, { backgroundColor: p.selected ?? p.raised }]}>
                <Text style={[s.sessionNumberText, { color: accent }]}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <View style={s.flex}>
                <Text style={[s.sessionTitle, { color: p.text }]}>{item.name}</Text>
                <Text style={[s.sessionSub, { color: p.muted }]}>{item.muscle}{itemVolume ? ` · ${Math.round(itemVolume).toLocaleString()} kg volume` : ''}</Text>
              </View>
              <Pressable onPress={() => commit(items.filter((_, i) => i !== index))} style={s.iconAction}>
                <SymbolView name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} size={17} tintColor={p.danger ?? '#FF6B78'} />
              </Pressable>
            </View>

            <View style={s.setHeader}>
              <Text style={[s.setHeaderText, { color: p.muted, width: 34 }]}>SET</Text>
              <Text style={[s.setHeaderText, { color: p.muted, flex: 1 }]}>KG</Text>
              <Text style={[s.setHeaderText, { color: p.muted, flex: 1 }]}>REPS</Text>
              <View style={{ width: 36 }} />
            </View>

            {rows.map((set, setIndex) => (
              <View key={setIndex} style={s.setRow}>
                <View style={[s.setNumber, { backgroundColor: p.raised }]}>
                  <Text style={[s.setNumberText, { color: p.text }]}>{setIndex + 1}</Text>
                </View>
                <View style={s.setInput}>
                  <TapValue compact label={`Set ${setIndex + 1} weight`} value={set.weight} numeric options={['0', '5', '7.5', '10', '12.5', '15', '17.5', '20', '25', '30']} onChange={value => updateSets(index, rows.map((row, i) => i === setIndex ? { ...row, weight: value } : row))} palette={p} />
                </View>
                <View style={s.setInput}>
                  <TapValue compact label={`Set ${setIndex + 1} reps`} value={set.reps} numeric integer options={['5', '6', '8', '10', '12', '15', '20']} onChange={value => updateSets(index, rows.map((row, i) => i === setIndex ? { ...row, reps: value } : row))} palette={p} />
                </View>
                <Pressable onPress={() => updateSets(index, rows.filter((_, i) => i !== setIndex))} style={s.removeSet}>
                  <SymbolView name={{ ios: 'minus.circle', android: 'remove_circle_outline', web: 'remove_circle_outline' }} size={19} tintColor={p.muted} />
                </Pressable>
              </View>
            ))}

            <View style={s.sessionActions}>
              <Pressable onPress={() => updateSets(index, [...rows, { weight: '', reps: '' }])} style={[s.sessionButton, { backgroundColor: p.selected ?? p.raised }]}>
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={15} tintColor={accent} />
                <Text style={[s.sessionButtonText, { color: accent }]}>Add set</Text>
              </Pressable>
              {rows.length ? (
                <Pressable onPress={() => updateSets(index, [...rows, { ...rows[rows.length - 1] }])} style={[s.sessionButton, { backgroundColor: p.raised }]}>
                  <SymbolView name={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }} size={14} tintColor={p.text} />
                  <Text style={[s.sessionButtonText, { color: p.text }]}>Copy last</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function MealCapture({ values, palette: p, onChange }: Props) {
  const accent = p.accent ?? '#6E8FFF';
  const items = readLogItems(values.logItems);
  const commit = (next: typeof items) => onChange?.('logItems', JSON.stringify(next));
  const totals = useMemo(() => {
    const keys = ['calories', 'protein', 'carbs', 'fat'] as const;
    return Object.fromEntries(keys.map(key => [key, items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)])) as Record<typeof keys[number], number>;
  }, [items]);

  function addFood(food: typeof foods[number]) {
    commit([...items, { ...food }]);
  }

  function updateItem(index: number, key: string, value: string) {
    commit(items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <View style={s.root}>
      <View style={[s.mealHero, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
        <View style={[s.mealPlate, { backgroundColor: '#35D99B18', borderColor: '#35D99B55' }]}>
          <SymbolView name={{ ios: 'fork.knife', android: 'restaurant', web: 'restaurant' }} size={28} tintColor="#35D99B" />
        </View>
        <View style={s.flex}>
          <Text style={[s.eyebrow, { color: '#35D99B' }]}>MEAL COMPOSER</Text>
          <Text style={[s.heading, { color: p.text }]}>Build what you ate</Text>
          <Text style={[s.support, { color: p.muted }]}>Add foods, then adjust the nutrition if needed.</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.mealTypeRail}>
        {mealTypes.map(type => {
          const active = String(values.mealType ?? '') === type;
          return (
            <Pressable key={type} onPress={() => onChange?.('mealType', type)} style={[s.mealType, { backgroundColor: active ? p.selected ?? p.raised : p.card ?? p.panel, borderColor: active ? accent : p.line }]}>
              <Text style={[s.mealTypeText, { color: active ? accent : p.text }]}>{type}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.mealMetaRow}>
        {fieldsForEntity('Meal').filter(field => ['date', 'time'].includes(field.key)).map(field => (
          <View key={field.key} style={[s.mealMetaCard, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
            <EntityFieldInput field={field} value={String(values[field.key] ?? '')} onChange={value => onChange?.(field.key, value)} palette={p} />
          </View>
        ))}
      </View>

      <View style={s.macroGrid}>
        {metric(Math.round(totals.calories) || '—', 'kcal', '#FFB43C', p)}
        {metric(Math.round(totals.protein) || '—', 'Protein g', '#35D99B', p)}
        {metric(Math.round(totals.carbs) || '—', 'Carbs g', '#3A91FF', p)}
        {metric(Math.round(totals.fat) || '—', 'Fat g', '#FF6F91', p)}
      </View>

      <View>
        <Text style={[s.sectionTitle, { color: p.text }]}>Quick foods</Text>
        <Text style={[s.sectionCopy, { color: p.muted }]}>Tap to add a starting point</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.foodRail}>
          {foods.map(food => (
            <Pressable key={food.name} onPress={() => addFood(food)} style={[s.foodCard, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
              <View style={[s.foodIcon, { backgroundColor: '#35D99B18' }]}>
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={15} tintColor="#35D99B" />
              </View>
              <Text numberOfLines={1} style={[s.foodName, { color: p.text }]}>{food.name}</Text>
              <Text style={[s.foodMacro, { color: p.muted }]}>{food.calories} kcal · {food.protein}g P</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={s.sectionHead}>
        <View>
          <Text style={[s.sectionTitle, { color: p.text }]}>Your meal</Text>
          <Text style={[s.sectionCopy, { color: p.muted }]}>{items.length ? `${items.length} food items` : 'Nothing added yet'}</Text>
        </View>
        <Pressable onPress={() => commit([...items, { name: '' }])} style={[s.smallAdd, { backgroundColor: p.selected ?? p.raised }]}>
          <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={14} tintColor={accent} />
          <Text style={[s.smallAddText, { color: accent }]}>Custom</Text>
        </Pressable>
      </View>

      {items.map((item, index) => (
        <View key={index} style={[s.foodEditor, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
          <View style={s.foodEditorHeader}>
            <View style={[s.foodNumber, { backgroundColor: p.raised }]}>
              <Text style={[s.foodNumberText, { color: accent }]}>{index + 1}</Text>
            </View>
            <TextInput
              value={item.name ?? ''}
              onChangeText={value => updateItem(index, 'name', value)}
              placeholder="Food name"
              placeholderTextColor={p.muted}
              style={[s.foodTitleInput, { color: p.text }]}
            />
            <Pressable onPress={() => commit(items.filter((_, i) => i !== index))} style={s.iconAction}>
              <SymbolView name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} size={17} tintColor={p.danger ?? '#FF6B78'} />
            </Pressable>
          </View>
          <View style={s.foodFields}>
            {[
              ['calories', 'kcal'], ['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat'],
            ].map(([key, label]) => (
              <View key={key} style={s.foodField}>
                <Text style={[s.foodFieldLabel, { color: p.muted }]}>{label}</Text>
                <TapValue compact label={label} value={item[key] ?? ''} numeric options={key === 'calories' ? ['100', '200', '300', '400', '500', '600'] : ['5', '10', '20', '30', '40', '50']} onChange={value => updateItem(index, key, value)} palette={p} />
              </View>
            ))}
          </View>
        </View>
      ))}

      {!items.length ? (
        <View style={[s.emptyMeal, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
          <SymbolView name={{ ios: 'takeoutbag.and.cup.and.straw', android: 'restaurant', web: 'restaurant' }} size={30} tintColor={p.muted} />
          <Text style={[s.emptyWorkoutTitle, { color: p.text }]}>Start with a food</Text>
          <Text style={[s.emptyWorkoutCopy, { color: p.muted }]}>Use a quick food above or create a custom item.</Text>
        </View>
      ) : null}
    </View>
  );
}


export function WardrobeCapture({ values, palette: p, onChange }: Props) {
  const accent = p.accent ?? '#9B68FF';
  const items = readLogItems(values.logItems);
  const commit = (next: typeof items) => onChange?.('logItems', JSON.stringify(next));
  const occasions = ['Work', 'Gym', 'Outdoor', 'Home', 'Dinner', 'Travel'];
  const feelings = ['Comfortable', 'Sharp', 'Relaxed', 'Confident', 'Experimental'];
  const slots = ['Top', 'Bottom', 'Footwear', 'Layer', 'Accessory'];

  function addSlot(slot: string) {
    commit([...items, { name: '', slot, color: '' }]);
  }

  function updateItem(index: number, key: string, value: string) {
    commit(items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  return (
    <View style={s.root}>
      <View style={[s.wardrobeHero, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
        <View style={[s.wardrobeIcon, { backgroundColor: '#9B68FF20' }]}>
          <SymbolView name={{ ios: 'tshirt.fill', android: 'checkroom', web: 'checkroom' }} size={30} tintColor="#9B68FF" />
        </View>
        <View style={s.flex}>
          <Text style={[s.eyebrow, { color: '#9B68FF' }]}>OUTFIT BUILDER</Text>
          <Text style={[s.heading, { color: p.text }]}>What are you wearing?</Text>
          <Text style={[s.support, { color: p.muted }]}>Build the outfit by piece instead of filling a form.</Text>
        </View>
      </View>

      <View>
        <Text style={[s.sectionTitle, { color: p.text }]}>Occasion</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.choiceRail}>
          {occasions.map(value => {
            const active = values.occasion === value;
            return (
              <Pressable key={value} onPress={() => onChange?.('occasion', value)} style={[s.mealType, { backgroundColor: active ? p.selected ?? p.raised : p.card ?? p.panel, borderColor: active ? accent : p.line }]}>
                <Text style={[s.mealTypeText, { color: active ? accent : p.text }]}>{value}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View>
        <Text style={[s.sectionTitle, { color: p.text }]}>How does it feel?</Text>
        <View style={s.feelingGrid}>
          {feelings.map(value => {
            const active = values.feeling === value;
            return (
              <Pressable key={value} onPress={() => onChange?.('feeling', value)} style={[s.feelingCard, { backgroundColor: active ? p.selected ?? p.raised : p.card ?? p.panel, borderColor: active ? accent : p.line }]}>
                <Text style={[s.feelingText, { color: active ? accent : p.text }]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={s.sectionHead}>
        <View>
          <Text style={[s.sectionTitle, { color: p.text }]}>Outfit pieces</Text>
          <Text style={[s.sectionCopy, { color: p.muted }]}>{items.length ? `${items.length} pieces added` : 'Start with a slot below'}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.slotRail}>
        {slots.map(slot => (
          <Pressable key={slot} onPress={() => addSlot(slot)} style={[s.slotCard, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
            <View style={[s.slotIcon, { backgroundColor: '#9B68FF18' }]}>
              <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={16} tintColor="#9B68FF" />
            </View>
            <Text style={[s.slotText, { color: p.text }]}>{slot}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {items.map((item, index) => (
        <View key={index} style={[s.outfitCard, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
          <View style={[s.outfitSwatch, { backgroundColor: item.color ? item.color.toLowerCase() : '#9B68FF22' }]}>
            <EntityIcon type="Wardrobe Log" color={accent} size={22} />
          </View>
          <View style={s.flex}>
            <Text style={[s.outfitSlot, { color: accent }]}>{item.slot || 'Piece'}</Text>
            <TextInput
              value={item.name ?? ''}
              onChangeText={value => updateItem(index, 'name', value)}
              placeholder={`Name the ${String(item.slot || 'item').toLowerCase()}`}
              placeholderTextColor={p.muted}
              style={[s.outfitName, { color: p.text }]}
            />
            <TextInput
              value={item.color ?? ''}
              onChangeText={value => updateItem(index, 'color', value)}
              placeholder="Color · optional"
              placeholderTextColor={p.muted}
              style={[s.outfitColor, { color: p.muted }]}
            />
          </View>
          <Pressable onPress={() => commit(items.filter((_, i) => i !== index))} style={s.iconAction}>
            <SymbolView name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} size={17} tintColor={p.danger ?? '#FF6B78'} />
          </Pressable>
        </View>
      ))}

      {!items.length ? (
        <View style={[s.emptyMeal, { backgroundColor: p.card ?? p.panel, borderColor: p.line }]}>
          <SymbolView name={{ ios: 'tshirt', android: 'checkroom', web: 'checkroom' }} size={31} tintColor={p.muted} />
          <Text style={[s.emptyWorkoutTitle, { color: p.text }]}>Build the outfit</Text>
          <Text style={[s.emptyWorkoutCopy, { color: p.muted }]}>Add top, bottom, footwear and accessories as separate pieces.</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 16, marginBottom: 22 },
  flex: { flex: 1 },
  eyebrow: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1.2 },
  heading: { fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.45, marginTop: 4 },
  support: { fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  experienceHeader: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  heroGlyph: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 },
  moodCard: { width: '23.5%', minHeight: 96, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  moodFace: { fontSize: 28 },
  moodName: { fontSize: 10.5, fontWeight: '600' },
  selectedDot: { width: 6, height: 6, borderRadius: 3 },
  sectionLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1 },
  energyRow: { flexDirection: 'row', gap: 8 },
  energyCard: { flex: 1, minHeight: 72, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 7 },
  energyBars: { height: 26, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  energyBar: { width: 5, borderRadius: 3 },
  energyText: { fontSize: 10.5, fontWeight: '600' },
  contextBox: { minHeight: 54, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13 },
  contextInput: { flex: 1, fontSize: 12.5, paddingVertical: 12 },

  workoutHero: { minHeight: 94, borderRadius: 22, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sessionMetaCard: { width: '48.5%', minHeight: 92, borderRadius: 16, borderWidth: 1, padding: 10 },
  sessionMetaLabel: { fontSize: 8.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 },
  workoutHeroIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  summaryStrip: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, minHeight: 70, borderRadius: 16, padding: 11, justifyContent: 'center' },
  metricValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  metricLabel: { fontSize: 9.5, marginTop: 3 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { fontSize: 16.5, fontWeight: '700', letterSpacing: -0.25 },
  sectionCopy: { fontSize: 10.5, marginTop: 3 },
  livePill: { minHeight: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 9.5, fontWeight: '700' },
  anatomyShell: { borderRadius: 22, borderWidth: 1, padding: 8, marginTop: 10 },
  exerciseRail: { gap: 8, paddingTop: 10, paddingRight: 20 },
  exerciseCard: { width: 132, minHeight: 104, borderRadius: 17, borderWidth: 1, padding: 11, justifyContent: 'space-between' },
  exerciseIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exerciseName: { fontSize: 11.5, lineHeight: 15, fontWeight: '600', marginTop: 8 },
  exerciseMuscle: { fontSize: 9, marginTop: 3 },
  customAction: { minHeight: 46, borderRadius: 14, marginTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  customActionText: { fontSize: 11.5, fontWeight: '600' },
  customComposer: { minHeight: 56, borderRadius: 16, borderWidth: 1, marginTop: 8, padding: 6, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  customInput: { flex: 1, fontSize: 13, paddingVertical: 10 },
  customAdd: { minHeight: 42, borderRadius: 12, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  emptyWorkout: { borderRadius: 20, borderWidth: 1, minHeight: 156, alignItems: 'center', justifyContent: 'center', padding: 18 },
  emptyWorkoutIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyWorkoutTitle: { fontSize: 14, fontWeight: '650' as '600', marginTop: 11 },
  emptyWorkoutCopy: { fontSize: 10.5, lineHeight: 15, marginTop: 4, textAlign: 'center', maxWidth: 280 },
  sessionCard: { borderRadius: 20, borderWidth: 1, padding: 13, gap: 11 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sessionNumber: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sessionNumberText: { fontSize: 10, fontWeight: '700' },
  sessionTitle: { fontSize: 14, fontWeight: '650' as '600' },
  sessionSub: { fontSize: 9.5, marginTop: 2 },
  iconAction: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  setHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  setHeaderText: { fontSize: 8.5, fontWeight: '700', letterSpacing: 0.7, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  setNumber: { width: 34, minHeight: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  setNumberText: { fontSize: 11.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  setInput: { flex: 1 },
  removeSet: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  sessionActions: { flexDirection: 'row', gap: 8 },
  sessionButton: { minHeight: 40, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  sessionButtonText: { fontSize: 10.5, fontWeight: '600' },

  mealHero: { minHeight: 92, borderRadius: 22, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealPlate: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mealTypeRail: { gap: 7, paddingRight: 14 },
  mealMetaRow: { flexDirection: 'row', gap: 8 },
  mealMetaCard: { flex: 1, minHeight: 74, borderRadius: 15, borderWidth: 1, padding: 8 },
  mealType: { minHeight: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  mealTypeText: { fontSize: 10.5, fontWeight: '600' },
  macroGrid: { flexDirection: 'row', gap: 7 },
  foodRail: { gap: 8, paddingTop: 10, paddingRight: 20 },
  foodCard: { width: 134, minHeight: 100, borderRadius: 17, borderWidth: 1, padding: 11 },
  foodIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  foodName: { fontSize: 11.5, fontWeight: '600', marginTop: 10 },
  foodMacro: { fontSize: 8.8, marginTop: 3 },
  smallAdd: { minHeight: 32, borderRadius: 16, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallAddText: { fontSize: 9.5, fontWeight: '600' },
  foodEditor: { borderRadius: 19, borderWidth: 1, padding: 12, gap: 11 },
  foodEditorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodNumber: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  foodNumberText: { fontSize: 10, fontWeight: '700' },
  foodTitleInput: { flex: 1, fontSize: 13.5, fontWeight: '600', paddingVertical: 8 },
  foodFields: { flexDirection: 'row', gap: 6 },
  foodField: { flex: 1, gap: 4 },
  foodFieldLabel: { fontSize: 8.5, textAlign: 'center', fontWeight: '600' },
  emptyMeal: { minHeight: 145, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  wardrobeHero: { minHeight: 92, borderRadius: 22, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  wardrobeIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  choiceRail: { gap: 7, paddingRight: 14 },
  feelingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  feelingCard: { minHeight: 42, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  feelingText: { fontSize: 10.5, fontWeight: '600' },
  slotRail: { gap: 8, paddingRight: 14 },
  slotCard: { width: 94, minHeight: 78, borderRadius: 16, borderWidth: 1, padding: 10, justifyContent: 'space-between' },
  slotIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  slotText: { fontSize: 10.5, fontWeight: '600' },
  outfitCard: { minHeight: 90, borderRadius: 18, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  outfitSwatch: { width: 52, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  outfitSlot: { fontSize: 8.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  outfitName: { fontSize: 13.5, fontWeight: '600', paddingVertical: 4 },
  outfitColor: { fontSize: 10.5, paddingVertical: 3 },
});
