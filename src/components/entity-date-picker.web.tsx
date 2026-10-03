import { createElement } from 'react';
import { View, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

export function EntityDatePicker({ mode, value, label, onChange }: {
  mode: 'date' | 'time';
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const { appearance } = useLifeOS();
  const p = matrixTheme(appearance);
  return (
    <View style={{
      minHeight: 56,
      borderRadius: 16,
      backgroundColor: p.raised,
      borderWidth: 1,
      borderColor: value ? p.accent : p.line,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: p.selected }}>
        <SymbolView name={{ ios: mode === 'date' ? 'calendar' : 'clock', android: mode === 'date' ? 'calendar_today' : 'schedule', web: mode === 'date' ? 'calendar_today' : 'schedule' }} size={16} tintColor={p.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: p.muted, fontSize: 10.5, fontWeight: '600', marginBottom: 2 }}>{label}</Text>
        {createElement('input', {
          type: mode,
          value,
          'aria-label': label,
          onChange: (event: { target: { value: string } }) => onChange(event.target.value),
          style: {
            minHeight: 26,
            border: 'none',
            outline: 'none',
            padding: 0,
            fontSize: 15,
            width: '100%',
            boxSizing: 'border-box',
            color: p.text,
            background: 'transparent',
            colorScheme: appearance === 'dark' ? 'dark' : 'light',
            fontFamily: 'inherit',
            fontWeight: 600,
          },
        })}
      </View>
    </View>
  );
}
