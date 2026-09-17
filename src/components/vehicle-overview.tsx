import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LifeEntity } from '@/data/lifeos-store';
import { relatedEntities } from '@/data/entity-relations';

type Props = { entity: LifeEntity; records: LifeEntity[]; palette: { text: string; muted: string; panel: string; line: string }; onOpen: (entity: LifeEntity) => void; onAdd: (type: string) => void };
export function VehicleOverview({ entity, records, palette: p, onOpen, onAdd }: Props) {
  const [tab, setTab] = useState('Overview');
  const linked = relatedEntities(entity, records);
  const kinds: Record<string, string[]> = { Logs: ['expense', 'note'], Expenses: ['expense', 'bill'], Documents: ['document', 'insurance'], Reminders: ['reminder', 'task'] };
  const visible = tab === 'Overview' ? linked : linked.filter(item => kinds[tab]?.includes(item.kind));
  return <View style={{ gap: 18, marginTop: 18 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{['Overview', 'Logs', 'Expenses', 'Documents', 'Reminders'].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === tab }} onPress={() => setTab(value)} style={{ minHeight: 44, padding: 12, borderRadius: 12, backgroundColor: value === tab ? '#A5D957' : p.panel }}><Text style={{ color: value === tab ? '#20300F' : p.text }}>{value}</Text></Pressable>)}</View>
    {tab === 'Overview' ? <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{[['registration', 'Registration'], ['odometer', 'Odometer · km'], ['mileage', 'Mileage · km/l'], ['nextService', 'Service at · km'], ['insurance', 'Insurance renewal'], ['purchased', 'Purchased']].map(([key, label]) => <View key={key} style={{ width: '47%', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: p.line }}><Text style={{ color: p.muted, fontSize: 11, marginBottom: 8 }}>{label}</Text><Text style={{ color: p.text }}>{String(entity.metadata[key] || 'Not recorded')}</Text></View>)}</View><Text style={{ color: p.text, fontSize: 17 }}>Quick actions</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[['Expense', '＋ Log expense / fuel'], ['Note', '＋ Service / wash note'], ['Document', '＋ Document'], ['Reminder', '＋ Reminder']].map(([type, label]) => <Pressable key={type} accessibilityRole="button" onPress={() => onAdd(type)} style={{ padding: 14, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: p.line }}><Text style={{ color: p.text }}>{label}</Text></Pressable>)}</View></> : <Pressable accessibilityRole="button" onPress={() => onAdd(tab === 'Documents' ? 'Document' : tab === 'Reminders' ? 'Reminder' : 'Expense')} style={{ minHeight: 44 }}><Text style={{ color: p.text }}>＋ Add linked {tab.toLowerCase().replace(/s$/, '')}</Text></Pressable>}
    <Text style={{ color: p.muted }}>{tab === 'Overview' ? 'Related activity' : tab} · {visible.length}</Text>
    {visible.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => onOpen(item)} style={{ padding: 16, borderBottomWidth: 1, borderColor: p.line, gap: 6 }}><Text style={{ color: p.text }}>{item.title} ›</Text><Text style={{ color: p.muted }}>{item.kind} · {new Date(item.createdAt).toLocaleDateString()}</Text></Pressable>)}
    {!visible.length ? <Text style={{ color: p.muted }}>Nothing linked here yet. Add a record to keep this vehicle’s history together.</Text> : null}
  </View>;
}
