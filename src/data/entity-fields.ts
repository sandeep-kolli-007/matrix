export type EntityField = {
  key: string;
  label: string;
  placeholder: string;
  keyboard?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url';
  input?: 'date' | 'time';
  options?: string[];
  weeklySchedule?: boolean;
};

const field = (key: string, label: string, placeholder: string, keyboard: EntityField['keyboard'] = 'default'): EntityField => ({ key, label, placeholder, keyboard });

const schedules = [field('date', 'Date', 'Today'), field('time', 'Time', '9:00 AM')];
const money = [field('amount', 'Amount', '₹0', 'numeric'), field('account', 'Account', 'Primary account')];
const people = [field('person', 'Person', 'Choose a person'), field('relationship', 'Relationship', 'Friend, family, colleague…')];

export const entityFields: Record<string, EntityField[]> = {
  Task: [field('due', 'Due date', 'Today'), field('priority', 'Priority', 'Medium'), field('project', 'Project', 'Choose a project')],
  Habit: [field('frequency', 'Frequency', 'Daily'), field('time', 'Reminder time', '7:00 AM'), field('goal', 'Linked goal', 'Choose a goal')],
  Goal: [field('target', 'Target', 'What does success look like?'), field('deadline', 'Target date', 'Choose a date'), field('area', 'Life area', 'Health, work, finance…')],
  Project: [field('status', 'Status', 'Planning'), field('deadline', 'Deadline', 'Choose a date'), field('owner', 'Owner', 'Me')],
  Milestone: [field('project', 'Project', 'Choose a project'), field('date', 'Target date', 'Choose a date')],
  Note: [field('folder', 'Collection', 'Personal'), field('tags', 'Tags', 'Add tags')],
  Idea: [field('area', 'Area', 'Product, life, creative…'), field('nextStep', 'Next step', 'What will move this forward?')],
  List: [field('items', 'First items', 'Milk, book tickets, call Rahul…'), field('collection', 'Collection', 'Choose a collection')],
  Bookmark: [field('url', 'Link', 'https://', 'url'), field('collection', 'Collection', 'Reading list')],
  Document: [field('documentType', 'Document type', 'ID, contract, certificate…'), field('expires', 'Expiry date', 'Optional')],
  Workflow: [field('trigger', 'Trigger', 'When this happens…'), field('action', 'Action', 'Then do this…')],
  Reminder: [...schedules, field('repeat', 'Repeat', 'Never')],
  Workout: [...schedules, field('activity', 'Activity', 'Strength'), field('duration', 'Duration', '45 min'), field('calories', 'Calories', 'Optional', 'numeric'), field('heartRate', 'Average heart rate', 'bpm', 'numeric'), field('logItems', 'Exercises', '')],
  Meal: [...schedules, field('foodCategory', 'Category', 'Meal'), field('mealType', 'Meal', 'Breakfast'), field('calories', 'Calories', 'Optional', 'numeric'), field('protein', 'Protein', 'Optional', 'numeric'), field('carbs', 'Carbs', 'Optional', 'numeric'), field('fat', 'Fat', 'Optional', 'numeric'), field('logItems', 'Food items', '')],
  'Wardrobe Log': [field('date', 'Date', 'Today'), field('occasion', 'Occasion', 'Work'), field('feeling', 'Feeling', 'Good'), field('logItems', 'Composition', '')],
  Recipe: [field('ingredients', 'Ingredients', 'Add ingredients'), field('prepTime', 'Prep time', '20 min'), field('servings', 'Servings', '2', 'numeric')],
  'Water Log': [field('amount', 'Amount', '250 ml', 'numeric'), field('time', 'Time', 'Now')],
  'Sleep Log': [field('bedtime', 'Bedtime', '10:30 PM'), field('wakeTime', 'Wake time', '6:30 AM'), field('quality', 'Sleep quality', 'Good')],
  'Mood Log': [field('mood', 'Mood', 'Calm, happy, stressed…'), field('energy', 'Energy', 'High, medium, low'), field('trigger', 'What influenced it?', 'Optional')],
  'Cycle Log': [field('date', 'Date', 'YYYY-MM-DD'), field('cycleDay', 'Cycle day', '1', 'numeric'), field('flow', 'Flow', 'Light, medium, heavy'), field('symptoms', 'Symptoms', 'Cramps, headache…')],
  Symptom: [field('severity', 'Severity', 'Mild, moderate, severe'), field('started', 'Started', 'Today'), field('bodyArea', 'Body area', 'Optional')],
  Medication: [field('dose', 'Dose', 'e.g. 10 mg'), field('schedule', 'Schedule', 'Once daily'), field('prescriber', 'Prescriber', 'Optional')],
  Appointment: [field('provider', 'Provider', 'Doctor or clinic'), ...schedules, field('location', 'Location', 'Clinic or video link')],
  Skincare: [field('routine', 'Routine', 'Morning or evening'), field('products', 'Products', 'Cleanser, serum, SPF…'), field('result', 'Skin response', 'Optional')],
  Grooming: [field('routine', 'Routine', 'Haircut, beard, nails…'), field('frequency', 'Repeat', 'Every 4 weeks')],
  Person: [field('phone', 'Phone', '+91', 'phone-pad'), field('email', 'Email', 'name@example.com', 'email-address'), field('birthday', 'Birthday', 'Choose a date')],
  Relationship: [...people, field('closeness', 'Closeness', 'Close'), field('lastContact', 'Last contact', 'Today')],
  'Family Member': [field('relation', 'Relation', 'Parent, sibling, cousin…'), field('phone', 'Phone', '+91', 'phone-pad'), field('birthday', 'Birthday', 'Choose a date')],
  Pet: [field('species', 'Species', 'Dog, cat…'), field('birthday', 'Birthday', 'Choose a date'), field('vet', 'Vet', 'Optional')],
  Birthday: [field('person', 'Person', 'Choose a person'), field('date', 'Birthday', 'Choose a date'), field('gift', 'Gift idea', 'Optional')],
  Anniversary: [field('people', 'People', 'Who is celebrating?'), field('date', 'Date', 'Choose a date'), field('repeat', 'Repeat', 'Yearly')],
  Conversation: [field('with', 'With', 'Choose people'), field('topic', 'Topic', 'What did you discuss?'), field('followUp', 'Follow-up', 'Optional')],
  Message: [field('to', 'To', 'Choose a person or group'), field('channel', 'Channel', 'MATRIX'), field('sendAt', 'Send', 'Now')],
  Group: [field('members', 'Members', 'Add people'), field('purpose', 'Purpose', 'Family, team, trip…')],
  'Family Tree': [field('rootPerson', 'Root person', 'Choose a person'), field('branch', 'Family branch', 'Optional')],
  Memory: [field('people', 'People', 'Who was there?'), field('date', 'Date', 'When did this happen?'), field('place', 'Place', 'Where?')],
  'Check-in': [field('person', 'Person', 'Choose a person'), field('date', 'Date', 'Today'), field('topic', 'Topic', 'How are they doing?')],
  Event: [...schedules, field('location', 'Location', 'Add a place'), field('people', 'People', 'Invite people')],
  Meeting: [field('with', 'With', 'Add attendees'), ...schedules, field('agenda', 'Agenda', 'What will you cover?')],
  Trip: [field('destination', 'Destination', 'Where are you going?'), field('start', 'Start date', 'Choose a date'), field('end', 'End date', 'Choose a date')],
  Itinerary: [field('trip', 'Trip', 'Choose a trip'), field('day', 'Day', 'Day 1'), field('activity', 'Activity', 'What is planned?')],
  Place: [field('address', 'Address', 'Search or enter address'), field('category', 'Category', 'Home, restaurant, gym…')],
  'Packing List': [field('trip', 'Trip', 'Choose a trip'), field('items', 'Items', 'Passport, charger, clothes…')],
  Reservation: [field('venue', 'Venue', 'Hotel, restaurant…'), field('reference', 'Confirmation', 'Booking reference'), ...schedules],
  Routine: [field('frequency', 'Frequency', 'Daily'), field('time', 'Start time', '7:00 AM'), field('steps', 'Steps', 'Add routine steps')],
  Challenge: [field('duration', 'Duration', '30 days'), field('target', 'Target', 'What will you accomplish?'), field('people', 'People', 'Optional')],
  Wish: [field('category', 'Category', 'Experience, item, someday…'), field('url', 'Product link · optional', 'https://', 'url'), field('targetPrice', 'Target price · optional', '₹0', 'numeric'), field('merchant', 'Store · optional', 'Store or seller'), field('priority', 'Priority', 'Medium'), field('targetDate', 'Target date', 'Optional')],
  Purchase: [...money, field('merchant', 'Merchant', 'Store or seller'), field('date', 'Date', 'Today')],
  Subscription: [...money, field('billing', 'Billing cycle', 'Monthly'), field('renewal', 'Next renewal', 'Choose a date')],
  Expense: [...money, field('category', 'Category', 'Food, travel, shopping…'), field('date', 'Date', 'Today')],
  Income: [...money, field('source', 'Source', 'Salary, freelance…'), field('date', 'Date', 'Today')],
  Budget: [field('amount', 'Budget limit', '₹0', 'numeric'), field('period', 'Period', 'Monthly'), field('category', 'Category', 'All spending')],
  Bill: [...money, field('due', 'Due date', 'Choose a date'), field('repeat', 'Repeat', 'Monthly')],
  Account: [field('institution', 'Institution', 'Bank or provider'), field('accountType', 'Account type', 'Savings, card, cash…'), field('balance', 'Balance', '₹0', 'numeric')],
  Asset: [field('category', 'Asset type', 'Electronics, jewelry…'), field('value', 'Current value', '₹0', 'numeric'), field('purchased', 'Purchase date', 'Optional')],
  Property: [field('address', 'Address', 'Property address'), field('value', 'Estimated value', '₹0', 'numeric'), field('ownership', 'Ownership', 'Owned, rented…')],
  Vehicle: [field('makeModel', 'Make & model', 'Honda City'), field('registration', 'Registration', 'Vehicle number'), field('vehicleType', 'Vehicle type', 'Car, bike, other'), field('odometer', 'Odometer (km)', '0', 'numeric'), field('mileage', 'Mileage (km/l)', 'Optional', 'numeric'), field('nextService', 'Service at (km)', 'Optional', 'numeric'), field('purchased', 'Purchase date', 'Optional'), field('insurance', 'Insurance renewal', 'Choose a date')],
  Insurance: [field('provider', 'Provider', 'Insurance company'), field('policy', 'Policy number', 'Policy ID'), field('renewal', 'Renewal date', 'Choose a date')],
  Investment: [field('instrument', 'Instrument', 'Stock, fund, deposit…'), field('value', 'Current value', '₹0', 'numeric'), field('return', 'Return', 'Optional')],
  Loan: [field('lender', 'Lender', 'Bank or person'), field('balance', 'Balance', '₹0', 'numeric'), field('emi', 'Monthly payment', '₹0', 'numeric'), field('nextDue', 'Next due', 'Choose a date')],
  'Financial Goal': [field('target', 'Target amount', '₹0', 'numeric'), field('saved', 'Saved so far', '₹0', 'numeric'), field('deadline', 'Target date', 'Choose a date')],
  Book: [field('author', 'Author', 'Author name'), field('status', 'Status', 'Want to read'), field('progress', 'Progress', '0%', 'numeric')],
  Course: [field('provider', 'Provider', 'School or platform'), field('status', 'Status', 'In progress'), field('url', 'Course link', 'https://', 'url')],
  Lesson: [field('course', 'Course', 'Choose a course'), field('topic', 'Topic', 'What did you learn?'), field('date', 'Date', 'Today')],
  Skill: [field('level', 'Current level', 'Beginner'), field('target', 'Target', 'What do you want to achieve?'), field('practice', 'Practice plan', '3 times a week')],
  Practice: [field('skill', 'Skill', 'Choose a skill'), field('duration', 'Duration', '30 min'), field('result', 'What improved?', 'Add a reflection')],
  Journal: [field('date', 'Date', 'Today'), field('mood', 'Mood', 'How do you feel?'), field('prompt', 'Prompt', 'What is on your mind?')],
  Reflection: [field('period', 'Period', 'Today, this week…'), field('wentWell', 'What went well?', 'Add a win'), field('improve', 'What could improve?', 'Add a thought')],
  Content: [field('format', 'Format', 'Video, post, newsletter…'), field('status', 'Status', 'Idea'), field('channel', 'Channel', 'Where will it live?')],
  Movie: [field('year', 'Year', 'Release year', 'numeric'), field('status', 'Status', 'Watchlist'), field('rating', 'Rating', 'Optional', 'numeric')],
  Podcast: [field('show', 'Show', 'Podcast name'), field('episode', 'Episode', 'Episode title'), field('url', 'Link', 'https://', 'url')],
  Article: [field('source', 'Source', 'Publication or author'), field('url', 'Link', 'https://', 'url'), field('status', 'Status', 'Read later')],
  Quote: [field('author', 'Author', 'Who said it?'), field('source', 'Source', 'Book, talk, conversation…'), field('tags', 'Tags', 'Wisdom, work, life…')],
};

export function fieldsForEntity(name: string): EntityField[] {
  const categories: Record<string, string[]> = {
    Wish: ['Travel', 'Gadget', 'Home', 'Experience', 'Car', 'Other'],
    Asset: ['Electronics', 'Property', 'Jewelry', 'Other'],
    Expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'],
    Place: ['Home', 'Work', 'Gym', 'Restaurant', 'Hospital', 'Other'],
  };
  const dates = new Set(['date', 'due', 'deadline', 'expires', 'started', 'birthday', 'lastContact', 'start', 'end', 'targetDate', 'renewal', 'purchased', 'insurance', 'nextDue']);
  const times = new Set(['time', 'bedtime', 'wakeTime']);
  const choices: Record<string, string[]> = {
    priority: ['Low', 'Medium', 'High'],
    energy: ['Low', 'Medium', 'High'],
    severity: ['Mild', 'Moderate', 'Severe'],
    flow: ['Spotting', 'Light', 'Medium', 'Heavy'],
    quality: ['Poor', 'Fair', 'Good', 'Excellent'],
    mealType: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
    repeat: ['Never', 'Daily', 'Weekly', 'Monthly', 'Yearly'],
  };
  return (entityFields[name] ?? [field('date', 'Date', 'Today'), field('category', 'Category', 'Optional')]).map((item) => ({
    ...item,
    ...(item.key === 'category' && categories[name] ? { options: categories[name] } : {}),
    ...(item.key === 'frequency' && ['Habit', 'Routine'].includes(name) ? { weeklySchedule: true, options: ['Daily', 'Weekdays', 'Weekends'] } : {}),
    ...(dates.has(item.key) ? { input: 'date' as const, placeholder: 'YYYY-MM-DD' } : {}),
    ...(times.has(item.key) ? { input: 'time' as const, placeholder: 'HH:MM (24-hour)' } : {}),
    ...(choices[item.key] ? { options: choices[item.key] } : {}),
  }));
}
