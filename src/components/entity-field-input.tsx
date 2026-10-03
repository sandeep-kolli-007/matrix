import { useState } from 'react';
import { Text, View } from 'react-native';
import { HapticPressable as Pressable, selectionHaptic } from './haptic-pressable';
import { TapValue } from './tap-value';
import { PresetChoices } from './preset-choices';
import { tapPresets } from '@/data/tap-presets';
import { EntityField } from '@/data/entity-fields';
import { EntityDatePicker } from './entity-date-picker';
import { selectedWeekdays, toggleWeekday, weekdays, weekdayNames } from '@/data/weekly-schedule';

type Palette = {
  panel: string; line: string; text: string; muted: string;
  accent?: string; selected?: string; raised?: string; onAccent?: string; card?: string;
};

type Props = {
  field: EntityField;
  value: string;
  onChange: (value: string) => void;
  hideDateShortcuts?: boolean;
  palette: Palette;
};

export function EntityFieldInput({ field, value, onChange, palette, hideDateShortcuts = false }: Props) {
  const [custom, setCustom] = useState(false);
  const presets = tapPresets(field);
  const direct = !field.input && !field.weeklySchedule && field.keyboard !== 'numeric' && presets.length > 0 && presets.length <= 8;
  const shortcuts = hideDateShortcuts || field.input === 'date' ? [] : (field.options ?? []).map(option => ({ label: option, value: option }));
  const accent = palette.accent ?? '#416FEA';
  const selected = palette.selected ?? '#DCE7FF';
  const raised = palette.raised ?? palette.panel;

  return (
    <View style={{ gap: 10, marginBottom: 18 }}>
      {field.weeklySchedule ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {weekdays.map((day, index) => {
              const checked = selectedWeekdays(value).includes(day);
              return (
                <Pressable
                  key={day}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${field.label}: ${weekdayNames[index]}`}
                  accessibilityState={{ checked }}
                  onPress={() => onChange(toggleWeekday(value, day))}
                  style={{
                    minWidth: 46,
                    minHeight: 46,
                    borderRadius: 15,
                    borderWidth: 1,
                    borderColor: checked ? accent : palette.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: checked ? selected : raised,
                  }}
                >
                  <Text style={{ color: checked ? accent : palette.muted, fontSize: 12.5, fontWeight: checked ? '650' as '600' : '500' }}>{day}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ color: palette.muted, fontSize: 11, lineHeight: 16 }}>
            Choose repeat days. Notifications are configured separately.
          </Text>
        </>
      ) : null}

      {field.input ? (
        <EntityDatePicker mode={field.input} value={value} label={field.label} onChange={next => { selectionHaptic(); onChange(next); }} />
      ) : null}

      {direct ? (
        <>
          <PresetChoices label={field.label} options={presets} value={value} onChange={onChange} palette={palette} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`More options for ${field.label}`}
            accessibilityState={{ expanded: custom }}
            onPress={() => setCustom(v => !v)}
            style={{ minHeight: 42, justifyContent: 'center', alignItems: 'flex-start' }}
          >
            <Text style={{ color: accent, fontSize: 12.5, fontWeight: '600' }}>{custom ? 'Hide custom value' : 'Enter another value'}</Text>
          </Pressable>
        </>
      ) : null}

      {!field.input && (!direct || custom || (!!value && !presets.includes(value))) ? (
        <TapValue
          label={field.label}
          value={value}
          onChange={onChange}
          options={presets}
          numeric={field.keyboard === 'numeric'}
          integer={['reps', 'sets', 'servings', 'cycleDay', 'year'].includes(field.key)}
          palette={palette}
        />
      ) : null}

      {field.input && shortcuts.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {shortcuts.map(option => {
            const active = value === option.value;
            return (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                accessibilityLabel={`${field.label}: ${option.label}`}
                accessibilityState={{ selected: active }}
                onPress={() => onChange(option.value)}
                style={{
                  minHeight: 42,
                  justifyContent: 'center',
                  paddingHorizontal: 13,
                  borderRadius: 14,
                  backgroundColor: active ? selected : raised,
                  borderColor: active ? accent : palette.line,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: active ? accent : palette.text, fontWeight: active ? '600' : '500' }}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
