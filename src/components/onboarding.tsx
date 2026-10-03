import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

const steps = [
  {
    title: 'Everything in one place',
    body: 'Keep tasks, people, plans, health logs, money, notes and more in one system.',
    icon: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
    points: ['Capture in a few taps', 'Link related items', 'Find everything later'],
  },
  {
    title: 'You control your data',
    body: 'Choose what stays on this device and always see where a record came from.',
    icon: { ios: 'lock.shield', android: 'shield_lock', web: 'shield_lock' },
    points: ['On-device privacy option', 'Clear source labels', 'No hidden uploads'],
  },
  {
    title: 'Start with today',
    body: 'Use Home for what matters now, Timeline for history, and Matrix for the full library.',
    icon: { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' },
    points: ['Review your day', 'Add as you go', 'Organize when you need to'],
  },
] as const;

export function Onboarding() {
  const { appearance, completeOnboarding, toggleAppearance } = useLifeOS();
  const p = matrixTheme(appearance);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const current = steps[step];

  const changeStep = (next: number) => {
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  async function save(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      await action();
    } catch {
      Alert.alert('Could not save', 'Your preferences were not changed. Please try again.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: p.bg }]}>
      <View style={s.top}>
        <Text style={[s.brand, { color: p.text }]}>MATRIX</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={appearance === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          disabled={busy}
          onPress={() => void save(toggleAppearance)}
          style={[s.themeButton, { backgroundColor: p.panel, borderColor: p.line }]}
        >
          <SymbolView
            name={{ ios: appearance === 'dark' ? 'sun.max' : 'moon', android: appearance === 'dark' ? 'light_mode' : 'dark_mode', web: appearance === 'dark' ? 'light_mode' : 'dark_mode' }}
            size={19}
            tintColor={p.text}
          />
        </Pressable>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.icon, { backgroundColor: p.selected }]}>
          <SymbolView name={current.icon} size={34} tintColor={p.accent} />
        </View>

        <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>{current.title}</Text>
        <Text style={[s.body, { color: p.muted }]}>{current.body}</Text>

        <View style={[s.card, { backgroundColor: p.panel, borderColor: p.line }]}>
          {current.points.map((point, index) => (
            <View key={point} style={[s.point, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.line }]}>
              <View style={[s.check, { backgroundColor: p.selected }]}>
                <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={13} tintColor={p.accent} />
              </View>
              <Text style={[s.pointText, { color: p.text }]}>{point}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <View style={s.dots}>
          {steps.map((_, index) => <View key={index} style={[s.dot, { backgroundColor: index === step ? p.accent : p.line }]} />)}
        </View>
        <View style={s.actions}>
          {step > 0 ? (
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => changeStep(step - 1)} style={[s.secondary, { borderColor: p.line }]}>
              <Text style={[s.secondaryText, { color: p.text }]}>Back</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy, busy }}
            disabled={busy}
            onPress={() => step < steps.length - 1 ? changeStep(step + 1) : void save(completeOnboarding)}
            style={[s.primary, { backgroundColor: p.accent }, busy && { opacity: 0.55 }]}
          >
            <Text style={[s.primaryText, { color: p.onAccent }]}>{busy ? 'Saving…' : step === steps.length - 1 ? 'Start using MATRIX' : 'Continue'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  top: { paddingHorizontal: 24, paddingTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 16, fontWeight: '700', letterSpacing: 1.8 },
  themeButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 70, paddingBottom: 32, flexGrow: 1, maxWidth: 620, width: '100%', alignSelf: 'center' },
  icon: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 34, lineHeight: 40, letterSpacing: -1.1, fontWeight: '700', marginTop: 28 },
  body: { fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 520 },
  card: { marginTop: 30, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  point: { minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pointText: { fontSize: 14, fontWeight: '500' },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 22, gap: 18, maxWidth: 620, width: '100%', alignSelf: 'center' },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 10 },
  secondary: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '600' },
  primary: { flex: 1, minHeight: 52, borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 15, fontWeight: '600' },
});
