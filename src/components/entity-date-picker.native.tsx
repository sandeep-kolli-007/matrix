import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { useState } from 'react';
import { Modal, Platform, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { formatLocalDate, formatLocalTime, pickerDate } from '@/data/entity-date';
import { useLifeOS } from '@/providers/lifeos-provider';
import { matrixTheme } from '@/data/matrix-theme';
import { SymbolView } from 'expo-symbols';
type Props = { mode: 'date' | 'time'; value: string; label: string; onChange: (value: string) => void };
export function EntityDatePicker({ mode, value, label, onChange }: Props) {
  const { appearance } = useLifeOS();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => pickerDate(value, mode));
  const dark = appearance === 'dark';
  const p = matrixTheme(appearance);
  const displayValue = value ? (mode === 'date' ? pickerDate(value, mode).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : value) : `Select ${mode}`;
  const foreground = dark ? '#F4F8F5' : '#152B20';
  const commit = (date: Date) => onChange(mode === 'date' ? formatLocalDate(date) : formatLocalTime(date));
  function show() {
    const initial = pickerDate(value, mode);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: initial, mode, is24Hour: true, onChange: (event, selected) => { if (event.type === 'set' && selected) commit(selected); } });
    } else { setDraft(initial); setOpen(true); }
  }
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${displayValue}`} accessibilityHint={`Opens the ${mode} picker`} onPress={show} style={{ minHeight: 52, padding: 14, borderWidth: 1, borderColor: p.line, borderRadius: 14, backgroundColor: p.panel, flexDirection: 'row', alignItems: 'center', gap: 12 }}><SymbolView name={{ ios: mode === 'date' ? 'calendar' : 'clock', android: mode === 'date' ? 'calendar_today' : 'schedule', web: mode === 'date' ? 'calendar_today' : 'schedule' }} size={20} tintColor={p.accent} /><Text style={{ flex: 1, color: value ? p.text : p.muted, fontSize: 15 }}>{displayValue}</Text><SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={16} tintColor={p.muted} /></Pressable>
    {Platform.OS === 'ios' ? <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}>
        <View accessibilityViewIsModal style={{ backgroundColor: dark ? '#14231D' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={{ padding: 12 }}><Text style={{ color: foreground }}>Cancel</Text></Pressable>
            <Text accessibilityRole="header" style={{ flex: 1, textAlign: 'center', color: foreground, fontWeight: '700' }}>{label}</Text>
            <Pressable accessibilityRole="button" onPress={() => { commit(draft); setOpen(false); }} style={{ padding: 12 }}><Text style={{ color: dark ? '#68D9AB' : '#157952', fontWeight: '700' }}>Done</Text></Pressable>
          </View>
          {open ? <DateTimePicker value={draft} mode={mode} display="spinner" themeVariant={appearance} textColor={foreground} onChange={(_, selected) => { if (selected) setDraft(selected); }} /> : null}
          <Pressable accessibilityRole="button" onPress={() => { onChange(''); setOpen(false); }} style={{ padding: 14, alignItems: 'center' }}><Text style={{ color: foreground }}>Clear {mode}</Text></Pressable>
        </View>
      </View>
    </Modal> : null}
  </>;
}
