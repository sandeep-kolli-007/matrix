import { Text, View, useWindowDimensions } from 'react-native';
import { HapticPressable as Pressable } from './haptic-pressable';
import { selectedWeekdays, toggleWeekday, weekdays, weekdayNames } from '@/data/weekly-schedule';

export function HabitFrequency({ value, onChange, palette: p }: { value: string; onChange: (value: string) => void; palette: { panel: string; text: string; muted: string; line: string; accent: string; onAccent: string } }) {
  const { fontScale } = useWindowDimensions();
  const selected = selectedWeekdays(value);
  return <View style={{ gap: 16, marginBottom: 24 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Daily', 'Weekdays', 'Weekends'].map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: selected.length > 0 && selected.join() === selectedWeekdays(option).join() }} onPress={() => onChange(option)} style={{ flexGrow: 1, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: p.line, borderRadius: 12, backgroundColor: selected.join() === selectedWeekdays(option).join() ? p.accent : p.panel }}><Text style={{ color: selected.join() === selectedWeekdays(option).join() ? p.onAccent : p.text, fontSize: 14 }}>{option}</Text></Pressable>)}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{weekdays.map((day, index) => <Pressable key={day} accessibilityRole="checkbox" accessibilityLabel={`Frequency: ${weekdayNames[index]}`} accessibilityState={{ checked: selected.includes(day) }} onPress={() => onChange(toggleWeekday(value, day))} style={{ flexGrow: 1, flexBasis: Math.max(44, 36 * fontScale), minHeight: 48, paddingHorizontal: 6, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: selected.includes(day) ? p.accent : p.line, backgroundColor: selected.includes(day) ? p.accent : p.panel }}><Text style={{ color: selected.includes(day) ? p.onAccent : p.text, fontSize: 13 }}>{day}</Text></Pressable>)}</View>
    <Text style={{ color: p.muted, fontSize: 12, lineHeight: 18 }}>{value && !selected.length ? `Saved frequency: ${value}. Choose days to replace it.` : selected.length ? `Repeats ${selected.length === 7 ? 'every day' : selected.join(', ')}.` : 'Select the days you want to repeat this habit.'}</Text>
  </View>;
}
