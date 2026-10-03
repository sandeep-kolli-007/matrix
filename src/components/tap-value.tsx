import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticPressable as Pressable } from './haptic-pressable';

type Palette = {
  panel: string; line: string; text: string; muted: string;
  accent?: string; selected?: string; raised?: string; onAccent?: string; card?: string;
};

type Props = {
  label: string; value: string; onChange: (value: string) => void; options?: string[];
  numeric?: boolean; integer?: boolean; compact?: boolean; multiline?: boolean; palette: Palette;
};

export function TapValue({ label, value, onChange, options = [], numeric, integer, compact, multiline, palette: p }: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState('');
  const choices = [...new Set([...options, ...(value ? [value] : [])])];
  const accent = p.accent ?? '#416FEA';
  const selected = p.selected ?? '#DCE7FF';
  const raised = p.raised ?? p.panel;
  const onAccent = p.onAccent ?? '#FFFFFF';

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'Choose'}`}
        accessibilityState={{ expanded: open }}
        onPress={() => { setDraft(value); setCustom(false); setOpen(true); }}
        style={({ pressed }) => ({
          minHeight: compact ? 46 : 56,
          borderWidth: 1,
          borderColor: value ? accent : p.line,
          borderRadius: compact ? 12 : 16,
          backgroundColor: value ? selected : raised,
          paddingHorizontal: compact ? 10 : 15,
          paddingVertical: compact ? 8 : 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          opacity: pressed ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.992 : 1 }],
        })}
      >
        {!compact ? (
          <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: value ? p.panel : selected }}>
            <SymbolView name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }} size={16} tintColor={value ? accent : p.muted} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          {!compact ? <Text style={{ color: p.muted, fontSize: 10.5, fontWeight: '600', marginBottom: 2 }}>{label}</Text> : null}
          <Text style={{ color: value ? p.text : p.muted, textAlign: compact ? 'center' : 'left', fontSize: compact ? 18 : 15, lineHeight: 21, fontWeight: value ? '600' : '500' }}>
            {value || (compact ? '—' : 'Choose')}
          </Text>
        </View>
        {compact ? null : <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={16} tintColor={value ? accent : p.muted} />}
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#05070B99' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss picker" onPress={() => setOpen(false)} style={{ position: 'absolute', inset: 0 }} />
          <View accessibilityViewIsModal style={{
            maxHeight: '88%',
            backgroundColor: p.card ?? p.panel,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 20),
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            gap: 16,
            borderWidth: 1,
            borderColor: p.line,
          }}>
            <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: p.line, alignSelf: 'center', marginBottom: 4 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text accessibilityRole="header" style={{ color: p.text, fontSize: 21, fontWeight: '700', letterSpacing: -0.4 }}>{label}</Text>
                <Text style={{ color: p.muted, fontSize: 12.5 }}>Choose a preset or enter your own value.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close picker" onPress={() => setOpen(false)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: raised }}>
                <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={17} tintColor={p.text} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                {choices.map(choice => {
                  const active = choice === value;
                  return (
                    <Pressable
                      key={choice}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => choose(choice)}
                      style={{
                        minHeight: 44,
                        paddingHorizontal: 13,
                        paddingVertical: 10,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: active ? accent : p.line,
                        backgroundColor: active ? selected : raised,
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: active ? accent : p.text, fontWeight: active ? '600' : '500' }}>{choice}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {numeric ? (
                <View style={{ borderRadius: 18, backgroundColor: raised, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={() => setDraft(String(Math.max(0, (Number(draft) || 0) - (integer ? 1 : 0.5))))} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: p.panel }}>
                    <SymbolView name={{ ios: 'minus', android: 'remove', web: 'remove' }} size={20} tintColor={p.text} />
                  </Pressable>
                  <Text style={{ flex: 1, textAlign: 'center', color: p.text, fontSize: 27, fontWeight: '650' as '600', fontVariant: ['tabular-nums'] }}>{draft || '—'}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={() => setDraft(String((Number(draft) || 0) + (integer ? 1 : 0.5)))} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: p.panel }}>
                    <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={20} tintColor={p.text} />
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={!draft} onPress={() => choose(draft)} style={{ minHeight: 44, borderRadius: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: draft ? accent : p.line }}>
                    <Text style={{ color: draft ? onAccent : p.muted, fontWeight: '600' }}>Use</Text>
                  </Pressable>
                </View>
              ) : null}

              <Pressable accessibilityRole="button" accessibilityState={{ expanded: custom }} onPress={() => setCustom(v => !v)} style={{ minHeight: 48, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: raised }}>
                <SymbolView name={{ ios: custom ? 'keyboard.chevron.compact.down' : 'pencil', android: custom ? 'keyboard_hide' : 'edit', web: custom ? 'keyboard_hide' : 'edit' }} size={18} tintColor={accent} />
                <Text style={{ color: p.text, fontSize: 14.5, fontWeight: '500' }}>{custom ? 'Hide custom entry' : 'Enter a custom value'}</Text>
              </Pressable>

              {custom ? (
                <View style={{ gap: 10 }}>
                  <TextInput
                    accessibilityLabel={`Custom ${label}`}
                    value={draft}
                    onChangeText={setDraft}
                    multiline={multiline}
                    keyboardType={numeric ? integer ? 'number-pad' : 'decimal-pad' : 'default'}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    placeholderTextColor={p.muted}
                    style={{
                      minHeight: multiline ? 108 : 54,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: p.line,
                      borderRadius: 16,
                      color: p.text,
                      backgroundColor: raised,
                      fontSize: 15,
                      textAlignVertical: multiline ? 'top' : 'center',
                    }}
                  />
                  <Pressable accessibilityRole="button" onPress={() => choose(draft)} style={{ minHeight: 50, padding: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: accent }}>
                    <Text style={{ color: onAccent, fontWeight: '650' as '600' }}>Use custom value</Text>
                  </Pressable>
                </View>
              ) : null}

              {value ? (
                <Pressable accessibilityRole="button" onPress={() => choose('')} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: p.muted, fontWeight: '500' }}>Clear value</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
