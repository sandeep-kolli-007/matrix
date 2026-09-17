import { SymbolView } from 'expo-symbols';

// Explicit platform symbols keep every catalog type recognizable in any view.
export const entitySymbols = {
  Task: ['checkmark.square', 'check_box'], Habit: ['repeat', 'repeat'], Goal: ['flag', 'flag'], Project: ['folder', 'folder'],
  Milestone: ['flag.checkered', 'sports_score'], Note: ['note.text', 'description'], Idea: ['lightbulb', 'lightbulb'], List: ['list.bullet', 'format_list_bulleted'],
  Bookmark: ['bookmark', 'bookmark'], Document: ['doc.text', 'description'], Workflow: ['arrow.triangle.branch', 'account_tree'], Reminder: ['bell', 'notifications'],
  Workout: ['dumbbell', 'fitness_center'], Meal: ['fork.knife', 'restaurant'], Recipe: ['book.closed', 'menu_book'], 'Water Log': ['drop', 'water_drop'],
  'Sleep Log': ['bed.double', 'bedtime'], 'Mood Log': ['face.smiling', 'mood'], 'Cycle Log': ['calendar.badge.clock', 'calendar_month'], Symptom: ['waveform.path.ecg', 'monitor_heart'],
  Medication: ['pills', 'medication'], Appointment: ['calendar.badge.plus', 'event_available'], Skincare: ['sparkles', 'auto_awesome'], Grooming: ['scissors', 'content_cut'],
  Person: ['person', 'person'], Relationship: ['person.2', 'people'], 'Family Member': ['person.3', 'family_restroom'], Pet: ['pawprint', 'pets'],
  Birthday: ['birthday.cake', 'cake'], Anniversary: ['heart', 'favorite'], Conversation: ['bubble.left.and.bubble.right', 'forum'], Message: ['bubble.left', 'chat_bubble_outline'],
  Group: ['person.3', 'groups'], 'Family Tree': ['point.3.connected.trianglepath.dotted', 'account_tree'], Memory: ['photo', 'photo'], 'Check-in': ['mappin.and.ellipse', 'pin_drop'],
  Event: ['calendar', 'event'], Meeting: ['video', 'videocam'], Trip: ['airplane', 'flight'], Itinerary: ['map', 'map'], Place: ['mappin.circle', 'place'],
  'Packing List': ['suitcase', 'luggage'], Reservation: ['ticket', 'confirmation_number'], Routine: ['arrow.triangle.2.circlepath', 'autorenew'], Challenge: ['trophy', 'emoji_events'],
  Wish: ['star', 'star_outline'], Purchase: ['cart', 'shopping_cart'], Subscription: ['repeat.circle', 'subscriptions'], 'Wardrobe Log': ['tshirt', 'checkroom'],
  Expense: ['creditcard', 'payments'], Income: ['arrow.down.circle', 'south_west'], Budget: ['chart.pie', 'pie_chart'], Bill: ['doc.plaintext', 'receipt_long'],
  Account: ['building.columns', 'account_balance'], Asset: ['shippingbox', 'inventory_2'], Property: ['house', 'home'], Vehicle: ['car', 'directions_car'],
  Insurance: ['shield.lefthalf.filled', 'verified_user'], Investment: ['chart.line.uptrend.xyaxis', 'trending_up'], Loan: ['banknote', 'request_quote'], 'Financial Goal': ['target', 'savings'],
  Book: ['book', 'menu_book'], Course: ['graduationcap', 'school'], Lesson: ['text.book.closed', 'class'], Skill: ['wrench.and.screwdriver', 'handyman'],
  Practice: ['timer', 'timer'], Journal: ['book.closed', 'auto_stories'], Reflection: ['sun.horizon', 'self_improvement'], Content: ['rectangle.stack', 'perm_media'],
  Movie: ['film', 'movie'], Podcast: ['mic', 'podcasts'], Article: ['newspaper', 'article'], Quote: ['quote.bubble', 'format_quote'],
} as const;

export function EntityIcon({ type, color, size = 24 }: { type: string; color: string; size?: number }) {
  const symbol = entitySymbols[type as keyof typeof entitySymbols];
  return <SymbolView name={symbol ? { ios: symbol[0], android: symbol[1], web: symbol[1] } : { ios: 'square.grid.2x2', android: 'category', web: 'category' }} size={size} tintColor={color} />;
}
