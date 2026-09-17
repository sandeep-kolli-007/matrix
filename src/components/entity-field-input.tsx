import { Text, View } from 'react-native';
import { HapticPressable as Pressable, selectionHaptic } from './haptic-pressable';
import { TapValue } from './tap-value';
import { PresetChoices } from './preset-choices';
import { useState } from 'react';
import { tapPresets } from '@/data/tap-presets';
import { EntityField } from '@/data/entity-fields';
import { EntityDatePicker } from './entity-date-picker';
import { selectedWeekdays, toggleWeekday, weekdays, weekdayNames } from '@/data/weekly-schedule';

type Props = { field: EntityField; value: string; onChange: (value: string) => void; hideDateShortcuts?: boolean; palette: { panel: string; line: string; text: string; muted: string } };

export function EntityFieldInput({ field, value, onChange, palette, hideDateShortcuts = false }: Props) {
  const [custom, setCustom] = useState(false);
  const presets = tapPresets(field);
  const direct = !field.input && !field.weeklySchedule && field.keyboard !== 'numeric' && presets.length > 0 && presets.length <= 8;
  const shortcuts = hideDateShortcuts || field.input === 'date' ? [] : (field.options ?? []).map((option) => ({ label: option, value: option }));
  return <View style={{ gap: 8, marginBottom: 16 }}>
    {field.weeklySchedule ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {weekdays.map((day, index) => {
        const checked = selectedWeekdays(value).includes(day);
        return <Pressable key={day} accessibilityRole="checkbox" accessibilityLabel={`${field.label}: ${weekdayNames[index]}`} accessibilityState={{ checked }}
          onPress={() => onChange(toggleWeekday(value, day))} style={{ minWidth: 44, minHeight: 44, borderRadius: 22, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', backgroundColor: checked ? '#A5D957' : palette.panel }}>
          <Text style={{ color: checked ? '#20300F' : palette.muted, fontSize: 12 }}>{day}</Text>
        </Pressable>;
      })}
    </View> : null}
    {field.input ? <EntityDatePicker mode={field.input} value={value} label={field.label} onChange={value => { selectionHaptic(); onChange(value); }} /> : null}
    {direct ? <><PresetChoices label={field.label} options={presets} value={value} onChange={onChange} palette={palette} /><Pressable accessibilityRole="button" accessibilityLabel={`More options for ${field.label}`} accessibilityState={{ expanded: custom }} onPress={() => setCustom(v => !v)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: palette.muted, fontSize: 13 }}>{custom ? 'Hide other values' : 'Other value or clear selection'}</Text></Pressable></> : null}
    {!field.input && (!direct || custom || (!!value && !presets.includes(value))) ? <TapValue label={field.label} value={value} onChange={onChange} options={presets} numeric={field.keyboard === 'numeric'} integer={['reps', 'sets', 'servings', 'cycleDay', 'year'].includes(field.key)} palette={palette} /> : null}
    {field.input && shortcuts.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{shortcuts.map((option) => <Pressable key={option.label} accessibilityRole="button" accessibilityLabel={`${field.label}: ${option.label}`} accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: value === option.value ? '#157952' : palette.panel, borderColor: palette.line, borderWidth: 1 }}><Text style={{ color: value === option.value ? '#FFFFFF' : palette.text }}>{option.label}</Text></Pressable>)}</View> : null}
    {field.weeklySchedule ? <Text style={{ color: palette.muted, fontSize: 11, lineHeight: 16 }}>Choose days or enter a custom frequency. Choosing days replaces custom text. This saves a schedule; notifications are not enabled yet.</Text> : null}
  </View>;
}
