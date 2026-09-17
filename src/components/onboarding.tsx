import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLifeOS } from '@/providers/lifeos-provider';

const steps = [
  { title: 'Your life, connected.', body: 'Organize what matters, see the relationships, and bring your plans, people, and everyday moments together.', symbol: '✦', cardTitle: 'One place for what matters', cardCopy: 'Create tasks, habits, notes, trips, and more. Link related records so their context stays together.' },
  { title: 'Your data. Your choice.', body: 'Choose “Stay only on this device” when creating a private record. You can review its privacy setting in the detail screen.', symbol: '⌾', cardTitle: 'Know where your data lives', cardCopy: 'New records are currently saved locally. Cloud sync and message delivery are not yet available; saved messages are local drafts.' },
  { title: 'Make MATRIX yours.', body: 'Choose light or dark with the theme button above. Your choice is saved, and you can change it later in Settings.', symbol: '◐', cardTitle: 'Start with one thing', cardCopy: 'Use Quick Add to capture something, Life to find it, and Home to see what needs your attention.' },
] as const;

export function Onboarding() {
  const { appearance, completeOnboarding, toggleAppearance } = useLifeOS();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const dark = appearance === 'dark';
  const current = steps[step];
  const text = { color: dark ? '#F3F7F4' : '#183027' };
  const secondary = { color: dark ? '#ABBAB0' : '#596D61' };
  const changeStep = (next: number) => {
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  async function save(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try { await action(); }
    catch { Alert.alert('Could not save', 'Your preferences were not changed. Please try again.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: dark ? '#0A0D0B' : '#F8FAF8' }]}>
      <View style={styles.top}>
        <Text style={[styles.logo, text]}>MATRIX</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={dark ? 'Switch to light theme' : 'Switch to dark theme'} disabled={busy}
          onPress={() => void save(toggleAppearance)} style={[styles.theme, { backgroundColor: dark ? '#202823' : '#E9F1EC' }]}>
          <Text style={[styles.themeText, text]}>{dark ? '☀' : '◐'}</Text>
        </Pressable>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={styles.content}>
        <View style={styles.art} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.orbit, { borderColor: dark ? '#2C4839' : '#CADFD1' }]} />
          <View style={styles.core}><Text style={styles.coreText}>{current.symbol}</Text></View>
        </View>
        <Text accessibilityRole="header" style={[styles.title, text]}>{current.title}</Text>
        <Text style={[styles.body, secondary]}>{current.body}</Text>
        <View style={[styles.card, { backgroundColor: dark ? '#17241D' : '#ECF6EF' }]}>
          <Text style={[styles.cardTitle, text]}>{current.cardTitle}</Text>
          <Text style={[styles.cardCopy, secondary]}>{current.cardCopy}</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Text accessibilityLiveRegion="polite" style={[styles.progress, secondary]}>Step {step + 1} of {steps.length}</Text>
        <View style={styles.actions}>
          {step > 0 ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => changeStep(step - 1)} style={styles.back}><Text style={[styles.backText, text]}>Back</Text></Pressable> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy}
            onPress={() => step < steps.length - 1 ? changeStep(step + 1) : void save(completeOnboarding)}
            style={[styles.button, busy && { opacity: 0.6 }]}>
            <Text style={styles.buttonText}>{busy ? 'Saving…' : step === steps.length - 1 ? 'Get started  →' : 'Continue  →'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  top: { paddingHorizontal: 24, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 22, fontWeight: '800' },
  theme: { height: 48, width: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  themeText: { fontSize: 24 },
  content: { padding: 24, paddingBottom: 32, flexGrow: 1, justifyContent: 'center' },
  art: { height: 220, alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', height: 200, width: 200, borderRadius: 100, borderWidth: 1 },
  core: { height: 100, width: 100, borderRadius: 50, backgroundColor: '#126C4D', alignItems: 'center', justifyContent: 'center' },
  coreText: { fontSize: 42, color: '#fff' },
  title: { fontSize: 38, lineHeight: 44, letterSpacing: -1.4, fontWeight: '800', marginTop: 24 },
  body: { fontSize: 16, lineHeight: 24, marginTop: 16 },
  card: { marginTop: 28, padding: 20, borderRadius: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardCopy: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  footer: { padding: 24, gap: 16 },
  progress: { textAlign: 'center', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12 },
  back: { minHeight: 54, justifyContent: 'center', paddingHorizontal: 16 },
  backText: { fontSize: 16, fontWeight: '600' },
  button: { flex: 1, minHeight: 54, padding: 16, borderRadius: 17, backgroundColor: '#126C4D', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
