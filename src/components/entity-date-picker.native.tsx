import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';

import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

function parseValue(mode: 'date' | 'time', value: string) {
  const now = new Date();
  if (mode === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
  if (mode === 'time' && /^\d{2}:\d{2}$/.test(value)) {
    const [hour, minute] = value.split(':').map(Number);
    now.setHours(hour, minute, 0, 0);
  }
  return now;
}

function serialize(mode: 'date' | 'time', date: Date) {
  if (mode === 'date') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function EntityDatePicker({ mode, value, label, onChange }: {
  mode: 'date' | 'time';
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const { appearance } = useLifeOS();
  const p = matrixTheme(appearance);
  const [open, setOpen] = useState(false);
  const date = parseValue(mode, value);

  function changed(event: DateTimePickerEvent, next?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !next) return;
    onChange(serialize(mode, next));
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'Not set'}`}
        onPress={() => setOpen(true)}
        style={{
          minHeight: 56,
          borderRadius: 16,
          backgroundColor: value ? p.selected : p.raised,
          borderWidth: 1,
          borderColor: value ? p.accent : p.line,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
        }}
      >
        <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: value ? p.panel : p.selected }}>
          <SymbolView name={{ ios: mode === 'date' ? 'calendar' : 'clock', android: mode === 'date' ? 'calendar_today' : 'schedule', web: mode === 'date' ? 'calendar_today' : 'schedule' }} size={16} tintColor={p.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: value ? p.text : p.muted, fontSize: 15, fontWeight: value ? '600' : '500' }}>
            {value || (mode === 'date' ? 'Choose date' : 'Choose time')}
          </Text>
        </View>
        <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={16} tintColor={value ? p.accent : p.muted} />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={date}
          mode={mode}
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={changed}
        />
      ) : null}
    </View>
  );
}
