import { HapticPressable as Pressable, selectionHaptic } from '@/components/haptic-pressable';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { bodyMaps } from '@/data/body-map-paths';

export const regionLabels: Record<string, string> = { hands: 'Hands', abdominals: 'Abs', obliques: 'Obliques', calves: 'Calves', quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', forearms: 'Forearms', biceps: 'Biceps', triceps: 'Triceps', 'front-shoulders': 'Front shoulders', 'rear-shoulders': 'Rear shoulders', traps: 'Upper traps', 'traps-middle': 'Middle traps', lats: 'Lats', lowerback: 'Lower back', chest: 'Chest' };
type Props = { muscle: string; onSelect: (muscle: string) => void; palette: { text: string; muted: string; panel: string; raised: string; line: string } };

export function AnatomySelector({ muscle, onSelect, palette: p }: Props) {
  const [female, setFemale] = useState(false);
  const [back, setBack] = useState(false);
  const shapes = bodyMaps[female ? (back ? 'femaleBack' : 'femaleFront') : (back ? 'maleBack' : 'maleFront')];
  const regions = [...new Set(shapes.map(shape => shape.region).filter(region => regionLabels[region]))];
  function select(region: string) { onSelect(regionLabels[region]); }
  return <View style={{ gap: 14, padding: 14, borderWidth: 1, borderColor: p.line, backgroundColor: p.panel, borderRadius: 20 }}>
    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>{[['Male', !female, () => setFemale(false)], ['Female', female, () => setFemale(true)], ['Front', !back, () => setBack(false)], ['Back', back, () => setBack(true)]].map(([label, selected, action]) => <Pressable key={String(label)} accessibilityRole="button" accessibilityLabel={`${label} body view`} accessibilityState={{ selected: Boolean(selected) }} onPress={action as () => void} style={{ minHeight: 44, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 12, backgroundColor: selected ? p.raised : p.panel }}><Text style={{ color: p.text }}>{String(label)}</Text></Pressable>)}</View>
    <Svg width="100%" height={390} viewBox="0 0 660.46 1206.46" accessibilityLabel={`${female ? 'Female' : 'Male'} ${back ? 'back' : 'front'} muscle map`}>
      {shapes.map((shape, index) => {
        const group = regionLabels[shape.region];
        const selected = group === muscle;
        return <Path key={index} d={shape.d} fill={shape.fill === 'none' ? 'none' : selected ? '#A5D957' : p.raised} stroke={shape.stroke === 'none' ? 'none' : p.muted} strokeWidth={shape.width} strokeLinecap="round" strokeLinejoin="round" onPress={group ? () => { selectionHaptic(); select(shape.region); } : undefined} pointerEvents={group ? 'auto' : 'none'} />;
      })}
    </Svg>
    <Text accessibilityLiveRegion="polite" style={{ color: p.text, textAlign: 'center', fontSize: 16 }}>{muscle} exercises</Text>
    {!regions.some(region => regionLabels[region] === muscle) ? <Text style={{ color: p.muted, textAlign: 'center' }}>{muscle} is on the other side. Switch the body view to see it.</Text> : null}
    <Text style={{ color: p.muted, fontSize: 11, lineHeight: 17 }}>Tap any body region or use the labels below. Body view changes the illustration, not your profile.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{regions.map(region => <Pressable key={region} accessibilityRole="button" accessibilityLabel={`Select ${regionLabels[region]}`} accessibilityState={{ selected: regionLabels[region] === muscle }} onPress={() => select(region)} style={{ minHeight: 44, paddingHorizontal: 11, borderRadius: 10, backgroundColor: regionLabels[region] === muscle ? p.raised : p.panel, justifyContent: 'center', borderWidth: 1, borderColor: p.line }}><Text style={{ color: p.text, fontSize: 12 }}>{regionLabels[region]}</Text></Pressable>)}</View>
  </View>;
}
