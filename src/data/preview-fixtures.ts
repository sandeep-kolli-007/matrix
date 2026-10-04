import type { LifeEntity } from './lifeos-store';
import { entityCatalog } from './entity-catalog';
import { fieldsForEntity } from './entity-fields';

const variants = ['Primary', 'Recent', 'Planned'];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function day(offset: number) {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() + offset);
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
}

function isoDaysAgo(daysAgo: number, hour: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  value.setHours(hour, 15, 0, 0);
  return value.toISOString();
}

const titles: Record<string, string[]> = {
  Task: ['Review MATRIX dashboard', 'Polish entity forms', 'Prepare production checklist'],
  Habit: ['Morning walk', 'Read 20 minutes', 'Drink enough water'],
  Goal: ['Ship MATRIX v1', 'Build a stronger routine', 'Grow emergency fund'],
  Project: ['MATRIX mobile app', 'Home organization', 'Career roadmap'],
  Milestone: ['Beta review complete', 'Design system locked', 'Release candidate ready'],
  Note: ['Product ideas', 'Weekend notes', 'Things to remember'],
  Idea: ['Smart daily brief', 'Context-aware quick add', 'Better trip planning'],
  List: ['Weekly priorities', 'Groceries', 'Things to pack'],
  Bookmark: ['Design inspiration', 'React Native reference', 'Travel guide'],
  Document: ['Passport copy', 'Insurance document', 'Vehicle service receipt'],
  Workflow: ['Weekly review flow', 'Bill reminder flow', 'Workout logging flow'],
  Reminder: ['Pay electricity bill', 'Call parents', 'Renew subscription'],
  Workout: ['Upper body strength', 'Evening walk', 'Full body workout'],
  Meal: ['Protein breakfast', 'Chicken rice lunch', 'Light dinner'],
  Recipe: ['Air-fryer chicken', 'Overnight oats', 'High-protein bowl'],
  'Water Log': ['Morning hydration', 'Afternoon water', 'Evening hydration'],
  'Sleep Log': ['Last night sleep', 'Weekend sleep', 'Recovery sleep'],
  'Mood Log': ['Calm and focused', 'Energetic afternoon', 'Relaxed evening'],
  'Cycle Log': ['Cycle log · Day 1', 'Cycle log · Day 2', 'Cycle log · Day 3'],
  Symptom: ['Mild headache', 'Knee fatigue', 'Seasonal allergy'],
  Medication: ['Vitamin tablet', 'Prescribed medicine', 'Evening supplement'],
  Appointment: ['Dental check-up', 'Annual health check', 'Physio consultation'],
  Skincare: ['Morning skincare', 'Evening skincare', 'Weekend routine'],
  Grooming: ['Haircut', 'Beard trim', 'Nail care'],
  Person: ['Rahul Varma', 'Ananya Rao', 'Vikram Shah'],
  Relationship: ['Rahul · Friend', 'Ananya · Colleague', 'Vikram · Family'],
  'Family Member': ['Amma', 'Nanna', 'Cousin'],
  Pet: ['Bruno', 'Milo', 'Coco'],
  Birthday: ['Rahul birthday', 'Ananya birthday', 'Family birthday'],
  Anniversary: ['Parents anniversary', 'Friend anniversary', 'Work anniversary'],
  Conversation: ['Family chat', 'MATRIX planning', 'Weekend trip'],
  Message: ['Sounds good to me', 'I will check and update', 'See you tomorrow'],
  Group: ['Family', 'MATRIX team', 'Travel friends'],
  'Family Tree': ['Kolli family', 'Maternal family', 'Extended family'],
  Memory: ['Beach trip memory', 'Family dinner', 'First launch day'],
  'Check-in': ['Check in with Rahul', 'Call home', 'Team follow-up'],
  Event: ['Product review', 'Family dinner', 'Movie night'],
  Meeting: ['Design review', 'Sprint planning', 'Release sync'],
  Trip: ['Hyderabad weekend', 'Kakinada day trip', 'Goa plan'],
  Itinerary: ['Trip · Day 1', 'Trip · Day 2', 'Trip · Day 3'],
  Place: ['Home', 'Gym', 'Favorite cafe'],
  'Packing List': ['Weekend bag', 'Work trip packing', 'Beach trip packing'],
  Reservation: ['Dinner reservation', 'Hotel booking', 'Movie booking'],
  Routine: ['Morning routine', 'Workday shutdown', 'Sunday reset'],
  Challenge: ['10k steps challenge', '30-day reading', 'No-spend weekend'],
  Wish: ['New running shoes', 'Weekend getaway', 'Noise-cancelling headphones'],
  Purchase: ['Groceries', 'Running shoes', 'Phone accessory'],
  Subscription: ['iCloud+', 'Music subscription', 'Streaming service'],
  'Wardrobe Log': ['Office outfit', 'Weekend casual', 'Dinner outfit'],
  Expense: ['Lunch', 'Fuel', 'Groceries'],
  Income: ['Monthly salary', 'Freelance payment', 'Cashback'],
  Budget: ['Monthly spending', 'Travel budget', 'Shopping budget'],
  Bill: ['Electricity bill', 'Mobile bill', 'Internet bill'],
  Account: ['Primary savings', 'Credit card', 'Cash wallet'],
  Asset: ['MacBook Air', 'iPhone', 'Home appliance'],
  Property: ['Family home', 'Rental property', 'Plot'],
  Vehicle: ['Tata Nexon', 'Family scooter', 'Rental car'],
  Insurance: ['Car insurance', 'Health insurance', 'Term insurance'],
  Investment: ['Index fund', 'PPF', 'Equity portfolio'],
  Loan: ['Car loan', 'Personal loan', 'Home loan'],
  'Financial Goal': ['Emergency fund', 'Vacation fund', 'Retirement corpus'],
  Book: ['Atomic Habits', 'Designing Data-Intensive Applications', 'The Psychology of Money'],
  Course: ['Java + Spring Boot', 'System design', 'Advanced React Native'],
  Lesson: ['Collections and streams', 'Caching strategies', 'Animation performance'],
  Skill: ['System design', 'Spring Boot', 'Product design'],
  Practice: ['DSA practice', 'Java coding', 'UI critique'],
  Journal: ['Today journal', 'Weekend reflection', 'Monthly journal'],
  Reflection: ['Weekly review', 'Project retrospective', 'Personal reflection'],
  Content: ['MATRIX launch post', 'Product walkthrough', 'Feature teaser'],
  Movie: ['Interstellar', 'The Dark Knight', 'Dune'],
  Podcast: ['Tech podcast', 'Product podcast', 'Fitness podcast'],
  Article: ['React Native performance', 'Modern mobile UX', 'Database indexing'],
  Quote: ['Keep moving forward', 'Simple scales', 'Consistency compounds'],
};

function sampleValue(type: string, key: string, index: number): string | number | boolean {
  const dateOffset = index === 0 ? 0 : index === 1 ? 2 : -2;
  const dates = day(dateOffset);
  const choices: Record<string, Array<string | number | boolean>> = {
    date: [day(0), day(-1), day(-4)],
    due: [day(0), day(2), day(-1)],
    deadline: [day(7), day(14), day(3)],
    expires: [day(60), day(90), day(120)],
    started: [day(-1), day(-3), day(-7)],
    birthday: ['1994-05-12', '1996-09-21', '1992-12-03'],
    lastContact: [day(0), day(-2), day(-6)],
    start: [day(0), day(3), day(-5)],
    end: [day(2), day(5), day(-2)],
    targetDate: [day(30), day(45), day(60)],
    renewal: [day(20), day(40), day(75)],
    purchased: [day(-120), day(-300), day(-45)],
    insurance: [day(90), day(120), day(180)],
    nextDue: [day(5), day(12), day(18)],
    time: ['09:30', '18:00', '20:15'],
    bedtime: ['22:45', '23:15', '22:30'],
    wakeTime: ['06:30', '07:00', '06:45'],
    amount: ['450', '1250', '2999'],
    balance: ['85000', '23500', '12000'],
    value: ['95000', '65000', '42000'],
    target: ['100000', '500000', '1000000'],
    saved: ['35000', '125000', '240000'],
    emi: ['18000', '12000', '25000'],
    targetPrice: ['4999', '12000', '65000'],
    calories: ['520', '640', '430'],
    protein: ['42', '55', '38'],
    carbs: ['58', '72', '44'],
    fat: ['18', '22', '15'],
    heartRate: ['128', '136', '119'],
    servings: ['2', '3', '1'],
    progress: ['35', '60', '85'],
    rating: ['8', '9', '7'],
    cycleDay: ['1', '8', '16'],
    odometer: ['1450', '8600', '23000'],
    mileage: ['11.5', '14.2', '18.6'],
    nextService: ['5000', '10000', '25000'],
    priority: ['High', 'Medium', 'Low'],
    status: ['In progress', 'Planned', 'Completed'],
    frequency: ['Daily', 'Weekdays', 'Mon, Wed, Fri'],
    repeat: ['Weekly', 'Monthly', 'Never'],
    energy: ['High', 'Medium', 'Low'],
    severity: ['Mild', 'Moderate', 'Severe'],
    flow: ['Light', 'Medium', 'Heavy'],
    quality: ['Good', 'Excellent', 'Fair'],
    mealType: ['Breakfast', 'Lunch', 'Dinner'],
    category: ['Work', 'Personal', 'Lifestyle'],
    account: ['Primary savings', 'Credit card', 'Cash'],
    institution: ['HDFC Bank', 'ICICI Bank', 'Cash'],
    accountType: ['Savings', 'Credit card', 'Cash'],
    phone: ['+91 98765 43210', '+91 91234 56789', '+91 90000 11111'],
    email: ['rahul@example.com', 'ananya@example.com', 'vikram@example.com'],
    url: ['https://example.com/item-1', 'https://example.com/item-2', 'https://example.com/item-3'],
    relationship: ['Friend', 'Colleague', 'Family'],
    relation: ['Parent', 'Sibling', 'Cousin'],
    people: ['Rahul, Ananya', 'Family', 'MATRIX team'],
    members: ['Rahul, Ananya, Vikram', 'Family', 'Team'],
    with: ['Rahul', 'MATRIX team', 'Family'],
    to: ['Rahul', 'MATRIX team', 'Family'],
    channel: ['MATRIX', 'MATRIX', 'MATRIX'],
    destination: ['Hyderabad', 'Kakinada', 'Goa'],
    location: ['Hyderabad', 'Bhimavaram', 'Online'],
    address: ['Bhimavaram, Andhra Pradesh', 'Hyderabad, Telangana', 'Kakinada, Andhra Pradesh'],
    provider: ['Apollo', 'Udemy', 'HDFC'],
    merchant: ['Amazon', 'Local store', 'Flipkart'],
    billing: ['Monthly', 'Yearly', 'Monthly'],
    source: ['Salary', 'Freelance', 'Cashback'],
    instrument: ['Index fund', 'PPF', 'Stocks'],
    lender: ['HDFC Bank', 'ICICI Bank', 'SBI'],
    author: ['James Clear', 'Martin Kleppmann', 'Morgan Housel'],
    level: ['Intermediate', 'Beginner', 'Advanced'],
    duration: ['45 min', '30 min', '60 min'],
    mood: ['Calm', 'Energetic', 'Relaxed'],
    foodCategory: ['Meal', 'Snack', 'Meal'],
    activity: ['Strength', 'Walking', 'Cardio'],
  };

  const list = choices[key];
  if (list) return list[index % list.length];

  if (key === 'completed') return index === 2;
  if (key === 'year') return [2014, 2008, 2021][index];
  if (key.toLowerCase().includes('date')) return dates;
  if (key.toLowerCase().includes('time')) return ['09:30', '14:00', '19:15'][index];

  const friendly = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
  return `${friendly.charAt(0).toUpperCase() + friendly.slice(1)} · ${variants[index]}`;
}

function specializedMetadata(type: string, index: number): Record<string, string | number | boolean | null> {
  if (type === 'Workout') {
    return {
      activity: ['Strength', 'Walking', 'Full body'][index],
      duration: ['50 min', '35 min', '60 min'][index],
      calories: ['320', '180', '410'][index],
      logItems: JSON.stringify([
        {
          name: index === 1 ? 'Walking' : 'Dumbbell chest press',
          muscle: index === 1 ? 'Cardio' : 'Chest',
          setEntries: JSON.stringify(index === 1 ? [{ weight: '0', reps: '1' }] : [
            { weight: '17.5', reps: '10' },
            { weight: '17.5', reps: '9' },
            { weight: '15', reps: '10' },
          ]),
        },
      ]),
    };
  }
  if (type === 'Meal') {
    return {
      mealType: ['Breakfast', 'Lunch', 'Dinner'][index],
      calories: ['480', '650', '520'][index],
      protein: ['42', '58', '46'][index],
      carbs: ['45', '72', '50'][index],
      fat: ['16', '20', '18'][index],
      logItems: JSON.stringify([
        {
          name: ['Oats + whey', 'Chicken rice bowl', 'Chicken salad'][index],
          calories: ['480', '650', '520'][index],
          protein: ['42', '58', '46'][index],
          carbs: ['45', '72', '50'][index],
          fat: ['16', '20', '18'][index],
        },
      ]),
    };
  }
  if (type === 'Wardrobe Log') {
    return {
      occasion: ['Work', 'Casual', 'Dinner'][index],
      feeling: ['Sharp', 'Comfortable', 'Confident'][index],
      logItems: JSON.stringify([{ name: ['Blue shirt + chinos', 'T-shirt + jeans', 'Black shirt + trousers'][index] }]),
    };
  }
  if (type === 'Mood Log') {
    return {
      mood: ['Calm', 'Energetic', 'Relaxed'][index],
      energy: ['High', 'Medium', 'Low'][index],
      trigger: ['Productive morning', 'Good workout', 'Quiet evening'][index],
    };
  }
  return {};
}

function titleFor(type: string, index: number) {
  return titles[type]?.[index] ?? `${type} · ${variants[index]}`;
}

function previewId(type: string, index: number) {
  return `preview-${slug(type)}-${index + 1}`;
}

export function buildPreviewEntities(): LifeEntity[] {
  const records: LifeEntity[] = [];

  entityCatalog.forEach((definition, typeIndex) => {
    for (let index = 0; index < 3; index++) {
      const fieldMetadata = Object.fromEntries(
        fieldsForEntity(definition.name).map(field => [field.key, sampleValue(definition.name, field.key, index)])
      );
      const createdDaysAgo = (typeIndex * 3 + index * 2) % 14;
      const createdAt = isoDaysAgo(createdDaysAgo, 8 + ((typeIndex + index) % 10));
      const updatedAt = isoDaysAgo(Math.min(createdDaysAgo, index), 11 + ((typeIndex + index) % 8));

      const metadata: Record<string, string | number | boolean | null> = {
        entityType: definition.name,
        group: definition.group,
        ...fieldMetadata,
        ...specializedMetadata(definition.name, index),
      };

      if (definition.name === 'Task') {
        metadata.completed = index === 2;
        metadata.priority = ['High', 'Medium', 'Low'][index];
        metadata.project = ['MATRIX mobile app', 'UI polish', 'Production readiness'][index];
      }
      if (definition.name === 'Habit') metadata.completed = index === 2;
      if (definition.name === 'Conversation') {
        metadata.subtype = index === 0 ? 'group_thread' : 'direct_thread';
        metadata.unread = index === 1;
      }
      if (definition.name === 'Message') {
        metadata.threadId = previewId('Conversation', index);
        metadata.recipient = titles.Conversation[index];
        metadata.delivery = 'preview';
      }
      if (definition.name === 'Group') metadata.member_count = [5, 8, 4][index];
      if (definition.name === 'Expense') metadata.amount = ['450', '2100', '799'][index];
      if (definition.name === 'Income') metadata.amount = ['120000', '18000', '850'][index];

      records.push({
        id: previewId(definition.name, index),
        kind: slug(definition.name),
        title: titleFor(definition.name, index),
        details: `Preview record for ${definition.name.toLowerCase()} UI testing.`,
        deviceOnly: definition.privateByDefault === true || index === 2,
        createdAt,
        updatedAt,
        source: 'preview',
        metadata,
      });
    }
  });

  const relationTargets: Record<string, string> = {
    Task: 'Project',
    Habit: 'Goal',
    Milestone: 'Project',
    Lesson: 'Course',
    Practice: 'Skill',
    Itinerary: 'Trip',
    'Packing List': 'Trip',
    Reservation: 'Trip',
    Birthday: 'Person',
    'Check-in': 'Person',
    Relationship: 'Person',
  };

  return records.map(record => {
    const type = String(record.metadata.entityType);
    const target = relationTargets[type];
    if (!target) return record;
    const index = Math.max(0, Number(record.id.split('-').pop()) - 1);
    return { ...record, relatedIds: [previewId(target, index)] };
  });
}

export const previewEntityCount = entityCatalog.length * 3;
