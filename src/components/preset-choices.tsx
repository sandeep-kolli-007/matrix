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

type Palette = {
  panel: string;
  line: string;
  text: string;
  muted: string;
  accent?: string;
  selected?: string;
  raised?: string;
  onAccent?: string;
};

export function PresetChoices({ options, value, onChange, palette: p, label }: {
  options: string[]; value: string; onChange: (value: string) => void; label: string;
  palette: Palette;
}) {
  const visual = options.some(option => types[option]);
  const accent = p.accent ?? '#416FEA';
  const selected = p.selected ?? '#DCE7FF';
  const raised = p.raised ?? p.panel;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
      {options.map(option => {
        const active = value === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${option}`}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            style={({ pressed }) => ({
              flexBasis: visual ? '30%' : undefined,
              flexGrow: 1,
              minHeight: visual ? 82 : 46,
              paddingHorizontal: 12,
              paddingVertical: visual ? 12 : 10,
              gap: 8,
              borderRadius: visual ? 16 : 14,
              borderWidth: active ? 1.5 : 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: active ? accent : p.line,
              backgroundColor: active ? selected : raised,
              opacity: pressed ? 0.72 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
          >
            {visual ? (
              <View style={{
                width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? p.panel : selected,
              }}>
                <EntityIcon type={types[option] ?? 'List'} color={active ? accent : p.text} size={21} />
              </View>
            ) : null}
            <Text style={{
              color: active ? accent : p.text,
              fontSize: 13,
              fontWeight: active ? '650' as '600' : '500',
              textAlign: 'center',
            }}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
