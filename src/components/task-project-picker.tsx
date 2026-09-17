import { useState } from 'react';
import { FlatList, Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import type { LifeEntity } from '@/data/lifeos-store';
import { taskProjectOptions } from '@/data/task-projects';
import { HapticPressable as Pressable } from './haptic-pressable';
import { EntityIcon } from './entity-icon';

export function TaskProjectPicker({ records, taskId, value, legacyName, onChange, palette: p }: {
  records: LifeEntity[]; taskId?: string; value: string; legacyName: string;
  onChange: (record?: LifeEntity) => void;
  palette: { panel: string; line: string; text: string; muted: string; accent: string };
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const options = taskProjectOptions(records, taskId);
  const selected = options.find(record => record.id === value);
  const label = selected?.title ?? (value ? 'Linked item unavailable' : legacyName ? `${legacyName} · select a saved item` : 'Select a plan, trip, goal…');
  function choose(record?: LifeEntity) { onChange(record); setOpen(false); }
  return <View style={{ marginBottom: 16 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Part of: ${label}`} accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={{ minHeight: 52, borderWidth: 1, borderColor: p.line, borderRadius: 14, backgroundColor: p.panel, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <EntityIcon type={String(selected?.metadata.entityType ?? 'Project')} color={p.accent} size={21} />
      <Text style={{ flex: 1, color: selected ? p.text : p.muted, fontSize: 15 }}>{label}</Text>
      <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={16} tintColor={p.muted} />
    </Pressable>
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000077' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss Part of picker" onPress={() => setOpen(false)} style={{ position: 'absolute', inset: 0 }} />
        <View accessibilityViewIsModal style={{ maxHeight: '80%', backgroundColor: p.panel, padding: 20, paddingBottom: Math.max(insets.bottom, 20), borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text accessibilityRole="header" style={{ flex: 1, color: p.text, fontSize: 20, fontWeight: '600' }}>Part of</Text><Pressable accessibilityRole="button" accessibilityLabel="Close Part of picker" onPress={() => setOpen(false)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={20} tintColor={p.text} /></Pressable></View>
          <Text style={{ color: p.muted, fontSize: 13, lineHeight: 19 }}>Choose an existing item to organize this item.</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: !value && !legacyName }} onPress={() => choose()} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: p.accent }}>None · standalone item</Text></Pressable>
          <FlatList data={options} keyExtractor={item => item.id} contentContainerStyle={{ gap: 8 }}
            ListEmptyComponent={<Text style={{ color: p.muted, lineHeight: 21, paddingVertical: 16 }}>No saved projects, trips or plans yet. You can leave this empty and link one after creating it.</Text>}
            renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: item.id === value }} onPress={() => choose(item)} style={{ minHeight: 64, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: item.id === value ? p.accent : p.line, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <EntityIcon type={String(item.metadata.entityType ?? '')} color={p.accent} />
              <View style={{ flex: 1, gap: 4 }}><Text style={{ color: p.text, fontSize: 15 }}>{item.title}</Text><Text style={{ color: p.muted, fontSize: 12 }}>{String(item.metadata.entityType ?? item.kind)}{item.deviceOnly ? ' · Device only' : ''}</Text></View>
              {item.id === value ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={18} tintColor={p.accent} /> : null}
            </Pressable>} />
        </View>
      </View>
    </Modal>
  </View>;
}
