import { Alert, Linking, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import type { LifeEntity } from '@/data/lifeos-store';
import { HapticPressable as Pressable } from './haptic-pressable';

export function WishOverview({ entity, asset, onAddAsset, onOpenAsset, palette: p }: {
  entity: LifeEntity; asset?: LifeEntity; onAddAsset: () => void; onOpenAsset: () => void;
  palette: { panel: string; line: string; text: string; muted: string };
}) {
  const url = String(entity.metadata.url ?? '').trim();
  let safeUrl = '';
  try { const parsed = new URL(url); if (['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password) safeUrl = parsed.href; } catch { /* Incomplete links remain non-actionable. */ }
  return <View style={{ gap: 16, marginTop: 20 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} size={24} tintColor="#E28CA9" />
      <Text style={{ color: p.text, fontSize: 17, fontWeight: '600' }}>Wish → Purchase → Own</Text>
    </View>
    <View style={{ borderWidth: 1, borderColor: p.line, borderRadius: 16, padding: 16, gap: 8 }}>
      <Text style={{ color: p.text, fontSize: 15, fontWeight: '600' }}>Price tracking is not connected</Text>
      <Text style={{ color: p.muted, fontSize: 13, lineHeight: 20 }}>Your target and product link are saved. Live prices, comparisons, price history, and price-drop alerts need a product-data provider.</Text>
    </View>
    {safeUrl ? <Pressable accessibilityRole="link" accessibilityLabel="Open saved product link in browser" onPress={() => { void Linking.openURL(safeUrl).catch(() => Alert.alert('Could not open link', 'Please check the saved product link.')); }} style={{ minHeight: 48, borderWidth: 1, borderColor: p.line, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: p.text }}>View product in browser</Text></Pressable> : null}
    <Text style={{ color: p.muted, fontSize: 13, lineHeight: 20 }}>{asset ? 'This wish is linked to an asset you own.' : 'Already bought it? Record an asset with its purchase details. Your original wish stays linked and keeps its privacy setting.'}</Text>
    {!entity.source ? <Pressable accessibilityRole="button" onPress={asset ? onOpenAsset : onAddAsset} style={{ minHeight: 50, padding: 14, borderRadius: 14, backgroundColor: '#A5D957', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#20300F', fontWeight: '600' }}>{asset ? 'View owned asset' : 'Record purchase as an asset'}</Text></Pressable> : null}
  </View>;
}
