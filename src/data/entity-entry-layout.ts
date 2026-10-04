import type { EntityField } from './entity-fields';

const primaryKeys: Record<string, string[]> = {
  Task: ['due', 'priority', 'project'],
  Habit: ['frequency', 'time', 'goal'],
  Goal: ['deadline', 'area'],
  Project: ['status', 'deadline'],
  Milestone: ['project', 'date'],
  Note: ['folder', 'tags'],
  Idea: ['area', 'nextStep'],
  List: ['collection'],
  Bookmark: ['url', 'collection'],
  Document: ['documentType', 'expires'],
  Workflow: ['trigger', 'action'],
  Reminder: ['date', 'time', 'repeat'],

  Workout: ['date', 'time', 'activity'],
  Meal: ['date', 'mealType', 'foodCategory'],
  Recipe: ['prepTime', 'servings'],
  'Water Log': ['amount', 'time'],
  'Sleep Log': ['bedtime', 'wakeTime', 'quality'],
  'Mood Log': ['mood', 'energy'],
  'Cycle Log': ['date', 'flow', 'cycleDay'],
  Symptom: ['severity', 'started'],
  Medication: ['dose', 'schedule'],
  Appointment: ['provider', 'date', 'time'],

  Person: ['phone', 'birthday'],
  Relationship: ['person', 'relationship', 'closeness'],
  'Family Member': ['relation', 'phone', 'birthday'],
  Pet: ['species', 'birthday'],
  Birthday: ['person', 'date'],
  Anniversary: ['people', 'date'],
  Conversation: ['with', 'topic'],
  Message: ['to', 'channel'],
  Group: ['members', 'purpose'],
  Memory: ['people', 'date', 'place'],
  'Check-in': ['person', 'date'],

  Event: ['date', 'time', 'location'],
  Meeting: ['with', 'date', 'time'],
  Trip: ['destination', 'start', 'end'],
  Itinerary: ['trip', 'day', 'activity'],
  Place: ['category', 'address'],
  'Packing List': ['trip', 'items'],
  Reservation: ['venue', 'date', 'time'],
  Routine: ['frequency', 'time'],
  Challenge: ['duration', 'target'],
  Wish: ['category', 'targetPrice', 'priority'],
  Purchase: ['amount', 'account', 'merchant'],
  Subscription: ['amount', 'billing', 'renewal'],
  'Wardrobe Log': ['occasion', 'feeling'],

  Expense: ['amount', 'category', 'account'],
  Income: ['amount', 'source', 'account'],
  Budget: ['amount', 'period', 'category'],
  Bill: ['amount', 'due', 'account'],
  Account: ['accountType', 'balance', 'institution'],
  Asset: ['category', 'value'],
  Property: ['value', 'ownership'],
  Vehicle: ['vehicleType', 'makeModel', 'registration'],
  Insurance: ['provider', 'renewal'],
  Investment: ['instrument', 'value'],
  Loan: ['balance', 'emi', 'nextDue'],
  'Financial Goal': ['target', 'saved', 'deadline'],

  Book: ['author', 'status', 'progress'],
  Course: ['provider', 'status'],
  Lesson: ['course', 'date'],
  Skill: ['level', 'target'],
  Practice: ['skill', 'duration'],
  Journal: ['date', 'mood'],
  Reflection: ['period'],
  Content: ['format', 'status', 'channel'],
  Movie: ['status', 'rating'],
  Podcast: ['show', 'episode'],
  Article: ['source', 'status'],
  Quote: ['author', 'source'],
};

export function entryFieldGroups(type: string, fields: EntityField[]) {
  const preferred = primaryKeys[type] ?? fields.slice(0, 2).map(field => field.key);
  const priority = new Map(preferred.map((key, index) => [key, index]));
  const primary = fields
    .filter(field => priority.has(field.key))
    .sort((a, b) => (priority.get(a.key) ?? 99) - (priority.get(b.key) ?? 99))
    .slice(0, 3);
  const primarySet = new Set(primary.map(field => field.key));
  const extra = fields.filter(field => !primarySet.has(field.key));
  return { primary, extra };
}

export function prefersTap(field: EntityField) {
  if (field.input || field.weeklySchedule || field.options?.length) return true;
  if (field.keyboard === 'numeric') return true;
  return new Set([
    'priority','status','category','area','relationship','relation','closeness',
    'frequency','repeat','energy','severity','flow','quality','mealType',
    'account','accountType','billing','period','activity','mood','occasion',
    'feeling','vehicleType','ownership','documentType','instrument','level',
    'format','channel','duration','schedule','species','rating','progress',
    'owner','day',
  ]).has(field.key);
}
