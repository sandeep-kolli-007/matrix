import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticPressable as Pressable } from './haptic-pressable';

type Props = { label: string; value: string; onChange: (value: string) => void; options?: string[]; numeric?: boolean; integer?: boolean; compact?: boolean; multiline?: boolean; palette: { panel: string; line: string; text: string; muted: string } };
export function TapValue({ label, value, onChange, options = [], numeric, integer, compact, multiline, palette: p }: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState('');
  const choices = [...new Set([...options, ...(value ? [value] : [])])];
  function choose(next: string) { onChange(next); setOpen(false); }
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value || 'Choose'}`} accessibilityState={{ expanded: open }} onPress={() => { setDraft(value); setCustom(false); setOpen(true); }} style={({ pressed }) => ({ minHeight: compact ? 44 : 52, borderWidth: 1, borderColor: p.line, borderRadius: compact ? 10 : 14, backgroundColor: p.panel, padding: compact ? 8 : 14, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.65 : 1 })}><Text style={{ flex: 1, color: value ? p.text : p.muted, textAlign: compact ? 'center' : 'left', fontSize: compact ? 18 : 15, lineHeight: 22 }}>{value || (compact ? '—' : `Choose ${label.toLowerCase()}`)}</Text>{compact ? null : <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={16} tintColor={p.muted} />}</Pressable>
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000077' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss picker" onPress={() => setOpen(false)} style={{ position: 'absolute', inset: 0 }} />
        <View accessibilityViewIsModal style={{ maxHeight: '85%', backgroundColor: p.panel, padding: 20, paddingBottom: Math.max(insets.bottom, 20), borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1, gap: 5 }}><Text accessibilityRole="header" style={{ color: p.text, fontSize: 20, fontWeight: '600' }}>{label}</Text><Text style={{ color: p.muted, fontSize: 13 }}>Choose a preset or add your own.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close picker" onPress={() => setOpen(false)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderColor: p.line, borderWidth: 1 }}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor={p.text} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{choices.map(choice => <Pressable key={choice} accessibilityRole="button" accessibilityState={{ selected: choice === value }} onPress={() => choose(choice)} style={{ minHeight: 44, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: p.line, backgroundColor: choice === value ? '#A5D957' : p.panel }}><Text style={{ color: choice === value ? '#20300F' : p.text }}>{choice}</Text></Pressable>)}</View>
            {numeric ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={() => setDraft(String(Math.max(0, (Number(draft) || 0) - (integer ? 1 : 0.5))))} style={{ padding: 14, minHeight: 44 }}><SymbolView name={{ ios: 'minus', android: 'remove', web: 'remove' }} size={22} tintColor={p.text} /></Pressable>
              <Text style={{ flex: 1, textAlign: 'center', color: p.text, fontSize: 24 }}>{draft || '—'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={() => setDraft(String((Number(draft) || 0) + (integer ? 1 : 0.5)))} style={{ padding: 14, minHeight: 44 }}><SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={22} tintColor={p.text} /></Pressable>
              <Pressable accessibilityRole="button" disabled={!draft} onPress={() => choose(draft)} style={{ padding: 12, minHeight: 44 }}><Text style={{ color: p.text }}>Use</Text></Pressable>
            </View> : null}
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: custom }} onPress={() => setCustom(v => !v)} style={{ paddingVertical: 14, minHeight: 44 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><SymbolView name={{ ios: custom ? 'keyboard.chevron.compact.down' : 'pencil', android: custom ? 'keyboard_hide' : 'edit', web: custom ? 'keyboard_hide' : 'edit' }} size={19} tintColor={p.text} /><Text style={{ color: p.text, fontSize: 15 }}>{custom ? 'Hide custom entry' : 'Custom value'}</Text></View></Pressable>
            {custom ? <View style={{ gap: 10 }}><TextInput accessibilityLabel={`Custom ${label}`} value={draft} onChangeText={setDraft} multiline={multiline} keyboardType={numeric ? integer ? 'number-pad' : 'decimal-pad' : 'default'} placeholder={`Enter ${label.toLowerCase()}`} placeholderTextColor={p.muted} style={{ minHeight: multiline ? 100 : 48, padding: 12, borderWidth: 1, borderColor: p.line, borderRadius: 12, color: p.text }} /><Pressable accessibilityRole="button" onPress={() => choose(draft)} style={{ minHeight: 48, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#A5D957' }}><Text style={{ color: '#20300F', fontWeight: '600' }}>Use custom value</Text></Pressable></View> : null}
            {value ? <Pressable accessibilityRole="button" onPress={() => choose('')} style={{ minHeight: 44, paddingVertical: 12 }}><Text style={{ color: p.muted }}>Clear value</Text></Pressable> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </>;
}
