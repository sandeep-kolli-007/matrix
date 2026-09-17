import { Text, View } from 'react-native';
import { EntityIcon } from './entity-icon';
import { HapticPressable as Pressable } from './haptic-pressable';

const types: Record<string, string> = {
  Food: 'Meal', Travel: 'Trip', Shopping: 'Purchase', Health: 'Workout', Work: 'Project', Personal: 'Person',
  Car: 'Vehicle', Bike: 'Vehicle', Electronics: 'Asset', Property: 'Property', Jewelry: 'Wish',
  Experience: 'Trip', Gadget: 'Asset', Home: 'Property', Finance: 'Account', Learning: 'Book',
  Friend: 'Person', Family: 'Family Member', Colleague: 'Project', Partner: 'Relationship',
  ID: 'Person', Certificate: 'Document', Contract: 'Document', Warranty: 'Insurance', Insurance: 'Insurance',
  Transport: 'Vehicle', Bills: 'Bill', Entertainment: 'Movie', Cash: 'Income', Card: 'Expense',
  Strength: 'Workout', Cardio: 'Workout', Yoga: 'Practice', Walking: 'Workout', Sport: 'Challenge',
};
export function PresetChoices({ options, value, onChange, palette: p, label }: {
  options: string[]; value: string; onChange: (value: string) => void; label: string;
  palette: { panel: string; line: string; text: string; muted: string };
}) {
  const visual = options.some(option => types[option]);
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {options.map(option => <Pressable key={option} accessibilityRole="button" accessibilityLabel={`${label}: ${option}`} accessibilityState={{ selected: value === option }}
      onPress={() => onChange(option)} style={({ pressed }) => ({ flexBasis: visual ? '30%' : undefined, flexGrow: 1, minHeight: visual ? 76 : 44, padding: 10, gap: 7, borderRadius: 12, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center', borderColor: value === option ? '#A5D957' : p.line, backgroundColor: value === option ? '#A5D957' : p.panel, opacity: pressed ? 0.65 : 1 })}>
      {visual ? <EntityIcon type={types[option] ?? 'List'} color={value === option ? '#20300F' : p.text} size={22} /> : null}
      <Text style={{ color: value === option ? '#20300F' : p.text, fontSize: 13, fontWeight: value === option ? '600' : '400', textAlign: 'center' }}>{option}</Text>
    </Pressable>)}
  </View>;
}
