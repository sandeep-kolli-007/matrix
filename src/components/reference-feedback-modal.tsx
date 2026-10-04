import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import type { LifeEntity } from '@/data/lifeos-store';

type Palette = {
  bg: string;
  card: string;
  raised: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
};

function configuration(entity: LifeEntity) {
  const type = String(entity.metadata.entityType ?? entity.kind);
  if (type === 'Workout') return {
    title: 'Workout Logged',
    color: '#FFB43C',
    ios: 'figure.run',
    other: 'fitness_center',
    detail: [entity.metadata.duration, entity.metadata.calories && `${entity.metadata.calories} kcal`].filter(Boolean).join(' · ') || 'Activity saved',
  };
  if (type === 'Expense') return {
    title: 'Expense Added',
    color: '#FFB43C',
    ios: 'wallet.bifold.fill',
    other: 'account_balance_wallet',
    detail: entity.metadata.amount ? `₹${Number(entity.metadata.amount).toLocaleString('en-IN')}` : entity.title,
  };
  if (type === 'Wish') return {
    title: 'Saved to Wishlist',
    color: '#9B68FF',
    ios: 'heart.fill',
    other: 'favorite',
    detail: entity.metadata.targetPrice ? `${entity.title} · ₹${Number(entity.metadata.targetPrice).toLocaleString('en-IN')}` : entity.title,
  };
  if (type === 'Task') return {
    title: 'Task Added',
    color: '#35D99B',
    ios: 'checkmark',
    other: 'check',
    detail: entity.title,
  };
  return {
    title: `${type} Added`,
    color: '#35D99B',
    ios: 'checkmark',
    other: 'check',
    detail: entity.title,
  };
}

export function ReferenceFeedbackModal({
  entity,
  palette,
  onView,
  onAnother,
}: {
  entity: LifeEntity | null;
  palette: Palette;
  onView: () => void;
  onAnother: () => void;
}) {
  if (!entity) return null;
  const config = configuration(entity);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onView}>
      <View style={s.backdrop}>
        <View style={[s.card, { backgroundColor: palette.card, borderColor: palette.line }]}>
          {Array.from({ length: 12 }, (_, index) => (
            <View
              key={index}
              style={[
                s.confetti,
                {
                  backgroundColor: ['#35D99B', '#2188FF', '#9B68FF', '#FFB43C', '#FF6F91'][index % 5],
                  left: `${8 + ((index * 17) % 82)}%`,
                  top: 18 + ((index * 31) % 88),
                  transform: [{ rotate: `${index * 23}deg` }],
                },
              ]}
            />
          ))}
          <View style={[s.successRing, { borderColor: config.color, backgroundColor: `${config.color}18` }]}>
            <View style={[s.successCore, { backgroundColor: config.color }]}>
              <SymbolView name={{ ios: config.ios as never, android: config.other as never, web: config.other as never }} size={31} tintColor="#FFFFFF" />
            </View>
          </View>

          <Text style={[s.title, { color: palette.text }]}>{config.title}</Text>
          <Text style={[s.detail, { color: palette.text }]}>{config.detail}</Text>
          <Text style={[s.sub, { color: palette.muted }]}>Saved to MATRIX and available in your timeline.</Text>

          {String(entity.metadata.entityType) === 'Workout' ? (
            <View style={s.metrics}>
              {[
                ['Calories', entity.metadata.calories || '—'],
                ['Duration', entity.metadata.duration || '—'],
                ['Heart rate', entity.metadata.heartRate ? `${entity.metadata.heartRate} bpm` : '—'],
              ].map(([label, value]) => (
                <View key={String(label)} style={[s.metric, { backgroundColor: palette.raised }]}>
                  <Text style={[s.metricValue, { color: palette.text }]}>{String(value)}</Text>
                  <Text style={[s.metricLabel, { color: palette.muted }]}>{String(label)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={s.actions}>
            <Pressable onPress={onView} style={[s.primary, { backgroundColor: palette.accent }]}>
              <Text style={[s.primaryText, { color: palette.onAccent }]}>View details</Text>
            </Pressable>
            <Pressable onPress={onAnother} style={[s.secondary, { backgroundColor: palette.raised, borderColor: palette.line }]}>
              <Text style={[s.secondaryText, { color: palette.text }]}>Add another</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#02050BCC', alignItems: 'center', justifyContent: 'center', padding: 22 },
  card: { width: '100%', maxWidth: 380, borderRadius: 28, borderWidth: 1, paddingHorizontal: 22, paddingTop: 30, paddingBottom: 20, alignItems: 'center', overflow: 'hidden' },
  confetti: { position: 'absolute', width: 5, height: 10, borderRadius: 2, opacity: 0.88 },
  successRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  successCore: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 21, fontWeight: '750' as '700', letterSpacing: -0.4, marginTop: 20 },
  detail: { fontSize: 14.5, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  sub: { fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 5 },
  metrics: { width: '100%', flexDirection: 'row', gap: 7, marginTop: 18 },
  metric: { flex: 1, minHeight: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  metricValue: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  metricLabel: { fontSize: 8.5, marginTop: 3 },
  actions: { width: '100%', flexDirection: 'row', gap: 8, marginTop: 22 },
  primary: { flex: 1, minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  secondary: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 11.5, fontWeight: '700' },
  secondaryText: { fontSize: 11.5, fontWeight: '650' as '600' },
});
