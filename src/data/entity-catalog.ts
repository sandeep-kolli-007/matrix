export type EntityDefinition = { name: string; group: string; icon: string; color: string; privateByDefault?: boolean };

const groups: Array<[string, string[], string, string]> = [
  ['Productivity',['Task','Habit','Goal','Project','Milestone','Note','Idea','List','Bookmark','Document','Workflow','Reminder'],'✓','#E1F3FF'],
  ['Health',['Workout','Meal','Recipe','Water Log','Sleep Log','Mood Log','Cycle Log','Symptom','Medication','Appointment','Skincare','Grooming'],'♥','#DDF7E9'],
  ['People',['Person','Relationship','Family Member','Pet','Birthday','Anniversary','Conversation','Message','Group','Family Tree','Memory','Check-in'],'♟','#FFE2E2'],
  ['Planning',['Event','Meeting','Trip','Itinerary','Place','Packing List','Reservation','Routine','Challenge','Wish','Purchase','Subscription','Wardrobe Log'],'▦','#E5E8FF'],
  ['Finance',['Expense','Income','Budget','Bill','Account','Asset','Property','Vehicle','Insurance','Investment','Loan','Financial Goal'],'▣','#E5F4FF'],
  ['Learning',['Book','Course','Lesson','Skill','Practice','Journal','Reflection','Content','Movie','Podcast','Article','Quote'],'✦','#F0E9FF'],
];

export const entityCatalog: EntityDefinition[] = groups.flatMap(([group, names, icon, color]) =>
  names.map((name) => ({ name, group, icon, color, privateByDefault: ['Cycle Log','Symptom','Medication','Mood Log','Sleep Log','Financial Goal'].includes(name) }))
);

export const entityGroups = [...new Set(entityCatalog.map((entity) => entity.group))];
