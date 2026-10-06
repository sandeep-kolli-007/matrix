import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { EntityIcon } from './entity-icon';
import { EntityFieldInput } from './entity-field-input';
import { HapticPressable as Pressable } from './haptic-pressable';
import { TapValue } from './tap-value';
import { TaskProjectPicker } from './task-project-picker';
import { selectTaskProject } from '@/data/task-projects';
import type { EntityField } from '@/data/entity-fields';
import type { LifeEntity } from '@/data/lifeos-store';

type Palette = {
  bg: string; panel: string; card: string; raised: string; text: string; muted: string;
  line: string; accent: string; selected: string; onAccent: string;
  success: string; warning: string; danger: string; cyan: string; violet: string; rose: string; amber: string;
};

type Props = {
  type: string;
  group: string;
  title: string;
  onTitleChange: (value: string) => void;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onValuesChange?: (values: Record<string, string>) => void;
  relatedIds?: string[];
  onRelatedIdsChange?: (ids: string[]) => void;
  fields: EntityField[];
  records: LifeEntity[];
  editingId?: string;
  palette: Palette;
  accent: string;
  accentSoft: string;
  wide?: boolean;
};

const finance = new Set(['Expense', 'Income', 'Budget', 'Bill', 'Account', 'Investment', 'Loan', 'Financial Goal', 'Purchase', 'Subscription']);
const schedule = new Set(['Event', 'Meeting', 'Trip', 'Itinerary', 'Reservation', 'Reminder', 'Routine', 'Challenge', 'Birthday', 'Anniversary']);
const people = new Set(['Person', 'Relationship', 'Family Member', 'Pet', 'Conversation', 'Message', 'Group', 'Family Tree', 'Memory', 'Check-in']);
const health = new Set(['Water Log', 'Sleep Log', 'Cycle Log', 'Symptom', 'Medication', 'Appointment', 'Skincare', 'Grooming', 'Recipe']);
const assets = new Set(['Asset', 'Property', 'Vehicle', 'Insurance', 'Document', 'Wish']);
const learning = new Set(['Book', 'Course', 'Lesson', 'Skill', 'Practice', 'Journal', 'Reflection', 'Content', 'Movie', 'Podcast', 'Article', 'Quote', 'Bookmark']);
const work = new Set(['Task', 'Habit', 'Goal', 'Project', 'Milestone', 'Workflow', 'Idea', 'List', 'Note', 'Packing List', 'Place']);

const typeCopy: Record<string, { eyebrow: string; heading: string; helper: string }> = {
  Task: { eyebrow: 'FAST CAPTURE', heading: 'What needs to get done?', helper: 'Set urgency and timing without turning this into a form.' },
  Habit: { eyebrow: 'ROUTINE BUILDER', heading: 'What do you want to repeat?', helper: 'Choose the rhythm first. Details can stay light.' },
  Goal: { eyebrow: 'OUTCOME', heading: 'Define the finish line', helper: 'Make success visible and give it a target date.' },
  Project: { eyebrow: 'PROJECT SETUP', heading: 'Create a place for the work', helper: 'Status, deadline and owner stay visible at a glance.' },
  Expense: { eyebrow: 'MONEY OUT', heading: 'How much did you spend?', helper: 'Amount first. Then choose where it went and how you paid.' },
  Income: { eyebrow: 'MONEY IN', heading: 'Record incoming money', helper: 'Capture the amount, source and destination account.' },
  Bill: { eyebrow: 'UPCOMING PAYMENT', heading: 'What needs to be paid?', helper: 'Track amount, due date and recurrence.' },
  Account: { eyebrow: 'ACCOUNT', heading: 'Add a money source', helper: 'Institution, type and current balance.' },
  Trip: { eyebrow: 'TRIP PLANNER', heading: 'Where are you going?', helper: 'Destination and dates become the backbone of the trip.' },
  Event: { eyebrow: 'SCHEDULE', heading: 'Put it on your timeline', helper: 'Date, time and place stay together.' },
  Meeting: { eyebrow: 'MEETING', heading: 'Who are you meeting?', helper: 'Attendees, schedule and agenda in one compact flow.' },
  Person: { eyebrow: 'NEW CONTACT', heading: 'Add someone to your circle', helper: 'Start with identity, then add contact details.' },
  'Family Member': { eyebrow: 'FAMILY', heading: 'Add a family member', helper: 'Relationship and useful contact details first.' },
  Vehicle: { eyebrow: 'GARAGE', heading: 'Add a vehicle', helper: 'Identity, odometer and ownership details in one dashboard.' },
  Document: { eyebrow: 'DOCUMENT VAULT', heading: 'Save a document', helper: 'Capture what it is and when it expires.' },
  Wish: { eyebrow: 'WISHLIST', heading: 'Save something you want', helper: 'Price, priority and link stay attached to the wish.' },
  Book: { eyebrow: 'LIBRARY', heading: 'Add a book', helper: 'Track author, status and reading progress.' },
  Course: { eyebrow: 'LEARNING', heading: 'Add a course', helper: 'Provider, status and link become the course card.' },
  Movie: { eyebrow: 'WATCHLIST', heading: 'Add a movie', helper: 'Status and rating are designed like a media card.' },
  'Water Log': { eyebrow: 'HYDRATION', heading: 'Log water in one tap', helper: 'Choose an amount. No keyboard needed.' },
  'Sleep Log': { eyebrow: 'SLEEP', heading: 'How did you sleep?', helper: 'Bedtime, wake time and quality at a glance.' },
  Medication: { eyebrow: 'MEDICATION', heading: 'Add a medication', helper: 'Dose and schedule are the important parts.' },
  Appointment: { eyebrow: 'APPOINTMENT', heading: 'Plan the visit', helper: 'Provider, date, time and location together.' },
};

function fallbackCopy(type: string, group: string) {
  if (finance.has(type)) return { eyebrow: 'FINANCE', heading: `Add ${type.toLowerCase()}`, helper: 'Capture the important number first, then classify it.' };
  if (schedule.has(type)) return { eyebrow: 'PLANNING', heading: `Plan ${type.toLowerCase()}`, helper: 'Start with when and where, then add context.' };
  if (people.has(type)) return { eyebrow: 'PEOPLE', heading: `Add ${type.toLowerCase()}`, helper: 'Create the relationship first, then add useful context.' };
  if (health.has(type)) return { eyebrow: 'HEALTH', heading: `Log ${type.toLowerCase()}`, helper: 'Use quick controls for the key signal, not a long form.' };
  if (assets.has(type)) return { eyebrow: 'ASSET', heading: `Add ${type.toLowerCase()}`, helper: 'Build a compact ownership card with the details that matter.' };
  if (learning.has(type)) return { eyebrow: 'LEARNING', heading: `Save ${type.toLowerCase()}`, helper: 'Track status and progress without clutter.' };
  if (work.has(type)) return { eyebrow: 'PRODUCTIVITY', heading: `Create ${type.toLowerCase()}`, helper: 'Keep the entry quick and action-oriented.' };
  return { eyebrow: group.toUpperCase(), heading: `Add ${type.toLowerCase()}`, helper: 'Capture the key details now. Everything else can wait.' };
}

function findField(fields: EntityField[], key: string) {
  return fields.find(field => field.key === key);
}

function titlePlaceholder(type: string) {
  const map: Record<string, string> = {
    Expense: 'Dinner, fuel, groceries…',
    Income: 'Salary, freelance, cashback…',
    Event: 'Dinner, review, birthday…',
    Meeting: 'Design review, team sync…',
    Trip: 'Goa weekend, Japan 2027…',
    Person: 'Full name',
    'Family Member': 'Name',
    Vehicle: 'My Nexon',
    Document: 'Passport, insurance, contract…',
    Book: 'Book title',
    Course: 'Course name',
    Movie: 'Movie title',
    Task: 'Finish API integration',
    Habit: 'Morning walk',
    Goal: 'Build emergency fund',
  };
  return map[type] ?? `${type} name`;
}

function EntryHero({ type, group, title, onTitleChange, palette: p, accent, accentSoft }: Pick<Props, 'type' | 'group' | 'title' | 'onTitleChange' | 'palette' | 'accent' | 'accentSoft'>) {
  const copy = typeCopy[type] ?? fallbackCopy(type, group);
  return (
    <View style={[s.hero, { backgroundColor: accentSoft, borderColor: `${accent}66` }]}>
      <View style={[s.heroIcon, { backgroundColor: p.panel }]}>
        <EntityIcon type={type} color={accent} size={27} />
      </View>
      <View style={s.flex}>
        <Text style={[s.eyebrow, { color: accent }]}>{copy.eyebrow}</Text>
        <Text style={[s.heroHeading, { color: p.text }]}>{copy.heading}</Text>
        <Text style={[s.heroHelper, { color: p.muted }]}>{copy.helper}</Text>
      </View>
      <View style={[s.typeBadge, { backgroundColor: p.panel }]}>
        <Text style={[s.typeBadgeText, { color: accent }]}>{type}</Text>
      </View>

      <View style={[s.titleComposer, { backgroundColor: p.panel, borderColor: title ? accent : p.line }]}>
        <TextInput
          accessibilityLabel={`${type} name`}
          value={title}
          onChangeText={onTitleChange}
          placeholder={titlePlaceholder(type)}
          placeholderTextColor={p.muted}
          autoCapitalize="sentences"
          style={[s.titleInput, { color: p.text }]}
        />
        {title ? <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} size={19} tintColor={accent} /> : null}
      </View>
    </View>
  );
}

function FieldTile({ field, value, onChange, palette: p, accent, wide = false }: {
  field: EntityField; value: string; onChange: (value: string) => void; palette: Palette; accent: string; wide?: boolean;
}) {
  return (
    <View style={[s.fieldTile, wide && s.fieldTileWide, { backgroundColor: p.card, borderColor: value ? `${accent}88` : p.line }]}>
      <View style={s.fieldTileHead}>
        <Text style={[s.fieldLabel, { color: p.muted }]}>{field.label}</Text>
        {value ? <View style={[s.valueDot, { backgroundColor: accent }]} /> : null}
      </View>
      <EntityFieldInput field={field} value={value} onChange={onChange} palette={p} />
    </View>
  );
}

function FinanceEntry(props: Props) {
  const { type, fields, values, onChange, palette: p, accent } = props;
  const amountKey = ['Account', 'Investment', 'Asset', 'Property'].includes(type) ? (findField(fields, 'balance') ? 'balance' : 'value') : findField(fields, 'amount') ? 'amount' : findField(fields, 'target') ? 'target' : findField(fields, 'balance') ? 'balance' : '';
  const amountField = amountKey ? findField(fields, amountKey) : undefined;
  const rest = fields.filter(field => field.key !== amountKey);
  const accounts = [...new Set([
    ...props.records.filter(record => record.kind === 'account' && !record.archivedAt).map(record => record.title),
    'Bank account (UPI)', 'Credit card', 'Debit card', 'Cash', 'Wallet',
  ])];

  return (
    <>
      {amountField ? (
        <View style={[s.moneyHero, { backgroundColor: p.card, borderColor: p.line }]}>
          <Text style={[s.moneyLabel, { color: p.muted }]}>{amountField.label.toUpperCase()}</Text>
          <View style={s.moneyRow}>
            <Text style={[s.currency, { color: accent }]}>₹</Text>
            <Text style={[s.moneyValue, { color: p.text }]}>{values[amountKey] || '0'}</Text>
          </View>
          <TapValue
            label={amountField.label}
            value={values[amountKey] ?? ''}
            onChange={value => onChange(amountKey, value)}
            numeric
            options={['100', '250', '500', '1000', '2500', '5000', '10000', '25000']}
            palette={p}
          />
        </View>
      ) : null}

      {fields.some(field => field.key === 'account') ? (
        <View>
          <Text style={[s.sectionTitle, { color: p.text }]}>Payment / account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.choiceRail}>
            {accounts.map(account => {
              const active = values.account === account;
              return (
                <Pressable
                  key={account}
                  onPress={() => onChange('account', account)}
                  style={[s.accountCard, { backgroundColor: active ? p.selected : p.card, borderColor: active ? accent : p.line }]}
                >
                  <View style={[s.accountIcon, { backgroundColor: p.raised }]}>
                    <SymbolView name={{ ios: account === 'Cash' ? 'banknote' : 'creditcard', android: account === 'Cash' ? 'payments' : 'credit_card', web: account === 'Cash' ? 'payments' : 'credit_card' }} size={18} tintColor={active ? accent : p.muted} />
                  </View>
                  <Text numberOfLines={2} style={[s.accountText, { color: active ? accent : p.text }]}>{account}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={s.tileGrid}>
        {rest.filter(field => field.key !== 'account').map((field, index) => (
          <FieldTile key={field.key} field={field} value={values[field.key] ?? ''} onChange={value => onChange(field.key, value)} palette={p} accent={accent} wide={index > 1} />
        ))}
      </View>
    </>
  );
}

function ScheduleEntry(props: Props) {
  const { fields, values, onChange, palette: p, accent } = props;
  const dateFields = fields.filter(field => field.input === 'date' || field.input === 'time');
  const contextFields = fields.filter(field => !dateFields.includes(field));
  return (
    <>
      <View style={[s.scheduleStrip, { backgroundColor: p.card, borderColor: p.line }]}>
        <View style={s.scheduleRail}>
          <View style={[s.scheduleDot, { backgroundColor: accent }]} />
          <View style={[s.scheduleLine, { backgroundColor: p.line }]} />
          <View style={[s.scheduleDot, { backgroundColor: p.violet }]} />
        </View>
        <View style={s.scheduleFields}>
          {dateFields.length ? dateFields.map(field => (
            <View key={field.key} style={s.scheduleField}>
              <Text style={[s.scheduleLabel, { color: p.muted }]}>{field.label}</Text>
              <EntityFieldInput field={field} value={values[field.key] ?? ''} onChange={value => onChange(field.key, value)} palette={p} />
            </View>
          )) : <Text style={[s.supportText, { color: p.muted }]}>This item does not need a fixed time.</Text>}
        </View>
      </View>
      <View style={s.tileGrid}>
        {contextFields.map((field, index) => <FieldTile key={field.key} field={field} value={values[field.key] ?? ''} onChange={value => onChange(field.key, value)} palette={p} accent={accent} wide={index >= 2} />)}
      </View>
    </>
  );
}

function PeopleEntry(props: Props) {
  const { type, fields, values, onChange, palette: p, accent, title } = props;
  const initials = title.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || '+';
  return (
    <>
      <View style={[s.contactCard, { backgroundColor: p.card, borderColor: p.line }]}>
        <View style={[s.contactAvatar, { backgroundColor: props.accentSoft, borderColor: `${accent}66` }]}>
          <Text style={[s.contactInitials, { color: accent }]}>{initials}</Text>
        </View>
        <View style={s.flex}>
          <Text style={[s.contactName, { color: p.text }]}>{title || `New ${type.toLowerCase()}`}</Text>
          <Text style={[s.contactSub, { color: p.muted }]}>Contact card preview</Text>
        </View>
        <View style={s.contactActions}>
          <View style={[s.contactAction, { backgroundColor: p.raised }]}><SymbolView name={{ ios: 'phone.fill', android: 'call', web: 'call' }} size={15} tintColor={accent} /></View>
          <View style={[s.contactAction, { backgroundColor: p.raised }]}><SymbolView name={{ ios: 'message.fill', android: 'chat', web: 'chat' }} size={15} tintColor={accent} /></View>
        </View>
      </View>
      <View style={s.tileGrid}>
        {fields.map((field, index) => <FieldTile key={field.key} field={field} value={values[field.key] ?? ''} onChange={value => onChange(field.key, value)} palette={p} accent={accent} wide={index >= 2} />)}
      </View>
    </>
  );
}

function WaterEntry(props: Props) {
  const { values, onChange, palette: p, accent } = props;
  const current = Number(values.amount) || 0;
  const choices = [250, 500, 750, 1000];
  return (
    <>
      <View style={[s.waterHero, { backgroundColor: p.card, borderColor: p.line }]}>
        <View style={[s.waterRing, { borderColor: accent }]}>
          <SymbolView name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }} size={31} tintColor={accent} />
          <Text style={[s.waterAmount, { color: p.text }]}>{current || '—'}</Text>
          <Text style={[s.waterUnit, { color: p.muted }]}>ml</Text>
        </View>
        <Text style={[s.waterTitle, { color: p.text }]}>How much water?</Text>
        <Text style={[s.waterCopy, { color: p.muted }]}>One tap logs the amount. Adjust only if you need to.</Text>
      </View>
      <View style={s.waterChoices}>
        {choices.map(amount => {
          const active = current === amount;
          return (
            <Pressable key={amount} onPress={() => onChange('amount', String(amount))} style={[s.waterChoice, { backgroundColor: active ? p.selected : p.card, borderColor: active ? accent : p.line }]}>
              <Text style={[s.waterChoiceValue, { color: active ? accent : p.text }]}>{amount}</Text>
              <Text style={[s.waterChoiceUnit, { color: p.muted }]}>ml</Text>
            </Pressable>
          );
        })}
      </View>
      {findField(props.fields, 'time') ? <FieldTile field={findField(props.fields, 'time')!} value={values.time ?? ''} onChange={value => onChange('time', value)} palette={p} accent={accent} wide /> : null}
    </>
  );
}

function SleepEntry(props: Props) {
  const { fields, values, onChange, palette: p, accent } = props;
  const bedtime = findField(fields, 'bedtime');
  const wakeTime = findField(fields, 'wakeTime');
  const quality = findField(fields, 'quality');
  return (
    <>
      <View style={[s.sleepHero, { backgroundColor: '#10132A', borderColor: p.line }]}>
        <View style={s.moonWrap}>
          <SymbolView name={{ ios: 'moon.stars.fill', android: 'bedtime', web: 'bedtime' }} size={42} tintColor="#9B8CFF" />
        </View>
        <Text style={s.sleepTitle}>Sleep window</Text>
        <Text style={s.sleepCopy}>Set when you went to bed and when you woke up.</Text>
      </View>
      <View style={s.clockRow}>
        {bedtime ? <FieldTile field={bedtime} value={values.bedtime ?? ''} onChange={value => onChange('bedtime', value)} palette={p} accent="#9B8CFF" /> : null}
        {wakeTime ? <FieldTile field={wakeTime} value={values.wakeTime ?? ''} onChange={value => onChange('wakeTime', value)} palette={p} accent="#FFB43C" /> : null}
      </View>
      {quality ? (
        <View>
          <Text style={[s.sectionTitle, { color: p.text }]}>How was the sleep?</Text>
          <EntityFieldInput field={quality} value={values.quality ?? ''} onChange={value => onChange('quality', value)} palette={p} />
        </View>
      ) : null}
    </>
  );
}

function AssetEntry(props: Props) {
  const { type, fields, values, onChange, palette: p, accent } = props;
  const primary = type === 'Vehicle' ? ['makeModel', 'registration', 'odometer', 'mileage'] : type === 'Document' ? ['documentType', 'expires'] : fields.slice(0, 4).map(field => field.key);
  const ordered = [...fields].sort((a, b) => primary.indexOf(a.key) - primary.indexOf(b.key));
  return (
    <>
      <View style={[s.assetDashboard, { backgroundColor: p.card, borderColor: p.line }]}>
        <View style={[s.assetVisual, { backgroundColor: props.accentSoft }]}>
          <EntityIcon type={type} color={accent} size={38} />
        </View>
        <View style={s.flex}>
          <Text style={[s.assetTitle, { color: p.text }]}>{type === 'Vehicle' ? values.makeModel || 'Vehicle profile' : type === 'Document' ? values.documentType || 'Document card' : `${type} profile`}</Text>
          <Text style={[s.assetSub, { color: p.muted }]}>{type === 'Vehicle' ? values.registration || 'Registration not set' : 'Key ownership details stay visible here.'}</Text>
        </View>
        {type === 'Document' ? <View style={[s.scanBadge, { backgroundColor: p.selected }]}><SymbolView name={{ ios: 'viewfinder', android: 'document_scanner', web: 'document_scanner' }} size={16} tintColor={accent} /><Text style={[s.scanText, { color: accent }]}>Scan-ready</Text></View> : null}
      </View>
      <View style={s.tileGrid}>
        {ordered.map((field, index) => <FieldTile key={field.key} field={field} value={values[field.key] ?? ''} onChange={value => onChange(field.key, value)} palette={p} accent={accent} wide={index >= 2} />)}
      </View>
    </>
  );
}

function LearningEntry(props: Props) {
  const { type, fields, values, onChange, palette: p, accent } = props;
  const progress = Number(values.progress) || 0;
  return (
    <>
      <View style={[s.mediaCard, { backgroundColor: p.card, borderColor: p.line }]}>
        <View style={[s.mediaCover, { backgroundColor: props.accentSoft }]}>
          <EntityIcon type={type} color={accent} size={34} />
        </View>
        <View style={s.flex}>
          <Text style={[s.mediaKind, { color: accent }]}>{type.toUpperCase()}</Text>
          <Text style={[s.mediaTitle, { color: p.text }]}>{props.title || `Untitled ${type.toLowerCase()}`}</Text>
          {findField(fields, 'progress') ? (
            <>
              <View style={[s.progressTrack, { backgroundColor: p.raised }]}><View style={[s.progressFill, { width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: accent }]} /></View>
              <Text style={[s.progressText, { color: p.muted }]}>{progress}% progress</Text>
            </>
          ) : <Text style={[s.mediaSub, { color: p.muted }]}>Build your library and learning history.</Text>}
        </View>
      </View>
      <View style={s.tileGrid}>
        {fields.map((field, index) => <FieldTile key={field.key} field={field} value={values[field.key] ?? ''} onChange={value => onChange(field.key, value)} palette={p} accent={accent} wide={index >= 2} />)}
      </View>
    </>
  );
}

function WorkEntry(props: Props) {
  const { type, fields, values, onChange, palette: p, accent } = props;
  const priority = values.priority || '';
  const priorityColors: Record<string, string> = { Low: p.success, Medium: p.warning, High: p.danger };
  return (
    <>
      {type === 'Task' ? (
        <View style={s.priorityRow}>
          {['Low', 'Medium', 'High'].map(level => {
            const active = priority === level;
            const color = priorityColors[level];
            return (
              <Pressable key={level} onPress={() => onChange('priority', level)} style={[s.priorityCard, { backgroundColor: active ? `${color}20` : p.card, borderColor: active ? color : p.line }]}>
                <View style={[s.priorityDot, { backgroundColor: color }]} />
                <Text style={[s.priorityText, { color: active ? color : p.text }]}>{level}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={s.tileGrid}>
        {fields.filter(field => !(type === 'Task' && field.key === 'priority')).map((field, index) => {
          const linked = (type === 'Task' && field.key === 'project') || (type === 'Habit' && field.key === 'goal');
          if (linked) {
            return (
              <View key={field.key} style={[s.fieldTile, s.fieldTileWide, { backgroundColor: p.card, borderColor: p.line }]}>
                <Text style={[s.fieldLabel, { color: p.muted }]}>PART OF · OPTIONAL</Text>
                <TaskProjectPicker
                  records={props.records}
                  taskId={props.editingId}
                  value={values[field.key + 'Id'] ?? ''}
                  legacyName={values[field.key] ?? ''}
                  palette={p}
                  onChange={entity => {
                    const next = selectTaskProject(values, props.relatedIds ?? [], entity, field.key as 'project' | 'goal');
                    props.onValuesChange?.(next.values);
                    props.onRelatedIdsChange?.(next.relatedIds);
                  }}
                />
              </View>
            );
          }
          return <FieldTile key={field.key} field={field} value={values[field.key] ?? ''} onChange={value => onChange(field.key, value)} palette={p} accent={accent} wide={index >= 2} />;
        })}
      </View>
    </>
  );
}

export function EntityEntryExperience(props: Props) {
  const { type, group, palette: p, accent, accentSoft } = props;
  let body: React.ReactNode;

  if (type === 'Water Log') body = <WaterEntry {...props} />;
  else if (type === 'Sleep Log') body = <SleepEntry {...props} />;
  else if (finance.has(type)) body = <FinanceEntry {...props} />;
  else if (schedule.has(type)) body = <ScheduleEntry {...props} />;
  else if (people.has(type)) body = <PeopleEntry {...props} />;
  else if (assets.has(type)) body = <AssetEntry {...props} />;
  else if (learning.has(type)) body = <LearningEntry {...props} />;
  else if (work.has(type)) body = <WorkEntry {...props} />;
  else body = null;

  if (!body) {
    body = (
      <View style={s.tileGrid}>
        {props.fields.map((field, index) => <FieldTile key={field.key} field={field} value={props.values[field.key] ?? ''} onChange={value => props.onChange(field.key, value)} palette={p} accent={accent} wide={index >= 2} />)}
      </View>
    );
  }

  return (
    <View style={s.root}>
      <EntryHero type={type} group={group} title={props.title} onTitleChange={props.onTitleChange} palette={p} accent={accent} accentSoft={accentSoft} />
      {body}
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 16, marginBottom: 20 },
  flex: { flex: 1 },
  hero: { borderRadius: 24, borderWidth: 1, padding: 15, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 11 },
  heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  heroHeading: { fontSize: 18.5, lineHeight: 24, fontWeight: '700', letterSpacing: -0.35, marginTop: 3 },
  heroHelper: { fontSize: 10.5, lineHeight: 15, marginTop: 3, maxWidth: 420 },
  typeBadge: { minHeight: 28, borderRadius: 14, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  titleComposer: { width: '100%', minHeight: 58, borderRadius: 17, borderWidth: 1.5, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleInput: { flex: 1, fontSize: 17, fontWeight: '650' as '600', paddingVertical: 12 },
  sectionTitle: { fontSize: 15.5, fontWeight: '700', marginBottom: 8 },
  supportText: { fontSize: 11, lineHeight: 16 },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  fieldTile: { width: '48.5%', minHeight: 118, borderRadius: 18, borderWidth: 1, padding: 12 },
  fieldTileWide: { width: '100%' },
  fieldTileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  fieldLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  valueDot: { width: 6, height: 6, borderRadius: 3 },

  moneyHero: { borderRadius: 22, borderWidth: 1, padding: 15 },
  moneyLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  moneyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginVertical: 10 },
  currency: { fontSize: 25, fontWeight: '600' },
  moneyValue: { fontSize: 40, lineHeight: 45, fontWeight: '750' as '700', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  choiceRail: { gap: 8, paddingRight: 16 },
  accountCard: { width: 118, minHeight: 92, borderRadius: 17, borderWidth: 1, padding: 10, justifyContent: 'space-between' },
  accountIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  accountText: { fontSize: 10.5, lineHeight: 14, fontWeight: '600' },

  scheduleStrip: { borderRadius: 21, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 12 },
  scheduleRail: { width: 18, alignItems: 'center', paddingTop: 18, paddingBottom: 18 },
  scheduleDot: { width: 9, height: 9, borderRadius: 5 },
  scheduleLine: { width: 1, flex: 1, minHeight: 46 },
  scheduleFields: { flex: 1, gap: 6 },
  scheduleField: { minHeight: 76 },
  scheduleLabel: { fontSize: 9.5, fontWeight: '700', marginBottom: 5, textTransform: 'uppercase' },

  contactCard: { borderRadius: 22, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  contactAvatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  contactInitials: { fontSize: 18, fontWeight: '700' },
  contactName: { fontSize: 15, fontWeight: '650' as '600' },
  contactSub: { fontSize: 9.5, marginTop: 3 },
  contactActions: { flexDirection: 'row', gap: 6 },
  contactAction: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  waterHero: { minHeight: 190, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  waterRing: { width: 102, height: 102, borderRadius: 51, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  waterAmount: { fontSize: 22, fontWeight: '700', marginTop: 1 },
  waterUnit: { fontSize: 9 },
  waterTitle: { fontSize: 16, fontWeight: '700', marginTop: 13 },
  waterCopy: { fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 4 },
  waterChoices: { flexDirection: 'row', gap: 7 },
  waterChoice: { flex: 1, minHeight: 66, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  waterChoiceValue: { fontSize: 15, fontWeight: '700' },
  waterChoiceUnit: { fontSize: 8.5, marginTop: 1 },

  sleepHero: { minHeight: 150, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  moonWrap: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#302B5C', alignItems: 'center', justifyContent: 'center' },
  sleepTitle: { color: '#F7FAFF', fontSize: 17, fontWeight: '700', marginTop: 10 },
  sleepCopy: { color: '#969DB7', fontSize: 10.5, marginTop: 3 },
  clockRow: { flexDirection: 'row', gap: 9 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityCard: { flex: 1, minHeight: 54, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  priorityDot: { width: 7, height: 7, borderRadius: 4 },
  priorityText: { fontSize: 10.5, fontWeight: '600' },

  assetDashboard: { borderRadius: 22, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  assetVisual: { width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  assetTitle: { fontSize: 15, fontWeight: '650' as '600' },
  assetSub: { fontSize: 9.5, lineHeight: 14, marginTop: 3 },
  scanBadge: { minHeight: 32, borderRadius: 16, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  scanText: { fontSize: 8.5, fontWeight: '700' },

  mediaCard: { borderRadius: 22, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  mediaCover: { width: 68, height: 88, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mediaKind: { fontSize: 8.5, fontWeight: '700', letterSpacing: 0.8 },
  mediaTitle: { fontSize: 15, fontWeight: '650' as '600', marginTop: 4 },
  mediaSub: { fontSize: 9.5, marginTop: 5 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 11 },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 8.5, marginTop: 4 },
});
