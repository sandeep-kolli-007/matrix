import type { EntityField } from './entity-fields';
const choices: Record<string, string[]> = {
  status: ['Planning', 'In progress', 'Completed', 'On hold'],
  relationship: ['Friend', 'Family', 'Colleague', 'Partner'], relation: ['Parent', 'Sibling', 'Child', 'Partner', 'Cousin'],
  closeness: ['Close', 'Very close', 'Acquaintance'], area: ['Health', 'Work', 'Finance', 'Personal', 'Learning'],
  folder: ['Personal', 'Work', 'Ideas'], collection: ['Personal', 'Work', 'Favorites', 'Reading list'],
  category: ['Personal', 'Work', 'Health', 'Food', 'Travel', 'Shopping', 'Other'],
  duration: ['5 min', '15 min', '30 min', '45 min', '60 min'], prepTime: ['5 min', '15 min', '30 min', '60 min'],
  frequency: ['Daily', 'Weekly', 'Monthly'], schedule: ['Once daily', 'Twice daily', 'Weekly', 'As needed'],
  billing: ['Monthly', 'Yearly', 'Weekly'], period: ['Today', 'This week', 'Monthly', 'Yearly'],
  species: ['Dog', 'Cat', 'Bird', 'Fish', 'Other'], vehicleType: ['Car', 'Bike', 'Other'],
  ownership: ['Owned', 'Rented', 'Shared'], accountType: ['Savings', 'Current', 'Card', 'Cash'],
  documentType: ['ID', 'Certificate', 'Contract', 'Warranty', 'Insurance'],
  instrument: ['Stock', 'Fund', 'Deposit', 'Bond', 'Other'], level: ['Beginner', 'Intermediate', 'Advanced'],
  format: ['Video', 'Post', 'Newsletter', 'Photo', 'Audio'], channel: ['MATRIX', 'Phone', 'Email', 'In person'],
  activity: ['Strength', 'Cardio', 'Yoga', 'Sport', 'Walking', 'Other'],
  mood: ['Happy', 'Calm', 'Okay', 'Sad', 'Stressed', 'Tired'],
  occasion: ['Work', 'Gym', 'Outdoor', 'Home', 'Party', 'Travel'], feeling: ['Uncomfortable', 'Neutral', 'Good', 'Great'],
  slot: ['Top', 'Bottom', 'Footwear', 'Outerwear', 'Accessory'], color: ['Black', 'White', 'Blue', 'Green', 'Red', 'Beige'],
  portion: ['1 serving', '2 servings', 'Half serving', '1 cup', '100 g', '200 g'],
  symptoms: ['Cramps', 'Headache', 'Fatigue', 'Bloating', 'None'],
  owner: ['Me'], sendAt: ['Now'], day: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
};
export function tapPresets(field: EntityField): string[] {
  if (field.options?.length) return field.options;
  if (field.keyboard === 'numeric') {
    if (['servings', 'cycleDay', 'sets'].includes(field.key)) return ['1', '2', '3', '4', '5', '6', '7'];
    if (field.key === 'reps') return ['5', '6', '8', '10', '12', '15', '20'];
    if (field.key === 'weight') return ['0', '5', '10', '15', '20', '22.5', '25', '30', '40', '60'];
    if (field.key === 'rating') return ['1', '2', '3', '4', '5'];
    if (field.key === 'progress') return ['0', '25', '50', '75', '100'];
    if (field.key === 'year') return Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));
    return ['0', '50', '100', '250', '500', '1000'];
  }
  return choices[field.key] ?? [];
}
