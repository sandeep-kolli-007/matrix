import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { LifeEntity } from '@/data/lifeos-store';
import { monthCells, occursOn } from '@/data/planning';
type Props = { day: string; onChange: (day: string) => void; items: LifeEntity[]; palette: { card: string; text: string; muted: string; accent: string } };
export function PlansCalendar({ day, onChange, items, palette: p }: Props) {
  const month = day.slice(0, 7);
  const cells = useMemo(() => monthCells(`${month}-01`), [month]);
  const counts = useMemo(() => new Map(cells.filter((value): value is string => !!value).map((value) => [value, items.filter((item) => occursOn(item, value)).length])), [cells, items]);
  function shift(offset: number) { const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset); onChange(date.toISOString().slice(0, 10)); }
  return <View style={{ backgroundColor: p.card, padding: 12, borderRadius: 24, gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => shift(-1)} style={{ padding: 16 }}><Text style={{ color: p.text }}>‹</Text></Pressable><Text accessibilityRole="header" style={{ color: p.text, fontSize: 18, fontWeight: '700' }}>{new Date(`${month}-01T12:00:00Z`).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => shift(1)} style={{ padding: 16 }}><Text style={{ color: p.text }}>›</Text></Pressable></View>
    <View style={{ flexDirection: 'row' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => <Text key={i} style={{ width: '14.2857%', textAlign: 'center', color: p.muted }}>{label}</Text>)}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{cells.map((value, i) => <View key={value ?? `blank-${i}`} style={{ width: '14.2857%' }}>{value ? <Pressable accessibilityRole="button" accessibilityLabel={`${value}, ${counts.get(value) ?? 0} scheduled items`} accessibilityState={{ selected: value === day }} onPress={() => onChange(value)} style={{ minHeight: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: value === day ? '#157952' : 'transparent' }}><Text style={{ color: value === day ? '#FFFFFF' : p.text }}>{Number(value.slice(8))}</Text><Text style={{ fontSize: 9, color: value === day ? '#FFFFFF' : p.accent }}>{counts.get(value) ? '●' : ' '}</Text></Pressable> : null}</View>)}</View>
    <Text style={{ color: p.muted, fontSize: 12, padding: 8 }}>● A plan, trip or repeating reminder</Text>
  </View>;
}
