import { matrixTheme } from '@/data/matrix-theme';
import { HapticPressable as Pressable } from '@/components/haptic-pressable';
import { EntityIcon } from '@/components/entity-icon';
import { SymbolView } from 'expo-symbols';
import { HabitFrequency } from '@/components/habit-frequency';
import { PresetChoices } from '@/components/preset-choices';
import { TaskProjectPicker } from '@/components/task-project-picker';
import { selectTaskProject } from '@/data/task-projects';
import { WishOverview } from '@/components/wish-overview';
import { tapPresets } from '@/data/tap-presets';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { EntityDefinition, entityCatalog, entityGroups } from '@/data/entity-catalog';
import { fieldsForEntity } from '@/data/entity-fields';
import { creationDateFields } from '@/data/planning';
import { EntityFieldInput } from '@/components/entity-field-input';
import { SpecializedLog } from '@/components/specialized-log';
import { VehicleOverview } from '@/components/vehicle-overview';
import { specializedLogTypes, readLogItems } from '@/data/log-items';
import { relatedEntities } from '@/data/entity-relations';
import { validateEntityInput } from '@/data/entity-validation';
import { LifeEntity, listEntities, removeEntity, saveEntity, setEntityArchived } from '@/data/lifeos-store';
import { useLifeOS } from '@/providers/lifeos-provider';

type Screen = 'catalog' | 'create' | 'detail';

const groupAccent: Record<string, string> = {
  Productivity: '#4DA3FF',
  Health: '#42D09B',
  People: '#FF7185',
  Planning: '#8B87FF',
  Finance: '#58C7D8',
  Learning: '#B986FF',
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function definitionFor(entity: LifeEntity) {
  return entityCatalog.find((item) => slug(item.name) === entity.kind);
}

export default function EntitiesScreen() {
  const params = useLocalSearchParams<{ type?: string; group?: string; id?: string; title?: string; request?: string; date?: string; deviceOnly?: string }>();
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const palette = matrixTheme(appearance);

  const [screen, setScreen] = useState<Screen>('catalog');
  const [selectedType, setSelectedType] = useState<EntityDefinition | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<LifeEntity | null>(null);
  const [saved, setSaved] = useState<LifeEntity[]>([]);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [deviceOnly, setDeviceOnly] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<LifeEntity | null>(null);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);
  const [relationQuery, setRelationQuery] = useState('');
  const [peopleQuery, setPeopleQuery] = useState('');
  const [peopleSheetOpen, setPeopleSheetOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const expenseAccounts = [...new Set([
    ...saved.filter(record => !record.archivedAt && (record.kind === 'account' || record.metadata.entityType === 'Account')).map(record => record.title),
    'Bank account (UPI)', 'Credit card', 'Debit card', 'UPI Lite', 'Cash', 'Wallet', 'Bank transfer',
    ...(fieldValues.account ? [fieldValues.account] : []),
  ])];
  const eventPeopleIds = useMemo<string[]>(() => {
    try {
      const ids = JSON.parse(fieldValues.peopleIds || '[]');
      return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
    } catch { return []; }
  }, [fieldValues.peopleIds]);
  const eventContacts = saved.filter(person => !person.archivedAt && (['person', 'contact', 'family-member', 'group'].includes(person.kind) || person.metadata.entityType === 'Person')).sort((a, b) => a.title.localeCompare(b.title));

  const [loaded, setLoaded] = useState(false);
  const visualCapture = selectedType?.name === 'Mood Log' || selectedType?.name === 'Workout';
  const captureTitle = title.trim() || (selectedType?.name === 'Mood Log' && fieldValues.mood ? `${fieldValues.mood} · Mood log` : selectedType?.name === 'Workout' && readLogItems(fieldValues.logItems).length ? 'Workout · ' + [...new Set(readLogItems(fieldValues.logItems).map(item => item.muscle).filter(Boolean))].join(', ') : '');
  const refreshToken = useRef(0);
  const savePending = useRef(false);

  const refresh = useCallback(async () => {
    const token = ++refreshToken.current;
    setLoaded(false);
    try {
      const items = await listEntities();
      if (token !== refreshToken.current) return;
      setSaved(items);
      setSelectedEntity(previous => previous ? items.find(item => item.id === previous.id) ?? null : null);
      setLoaded(true);
    }
    catch { if (token === refreshToken.current) Alert.alert('Unable to load', 'Saved items are still on your device. Please try again.'); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); return () => { refreshToken.current++; }; }, [refresh]));
  useEffect(() => {
    if (!params.type && !params.group && !params.id) return;
    if (params.type) {
      const definition = entityCatalog.find((item) => item.name.toLowerCase() === params.type?.toLowerCase());
      if (definition) { startCreate(definition); setTitle(params.title ?? ''); setFieldValues(creationDateFields(definition.name, params.date)); if (params.deviceOnly === 'true' || params.deviceOnly === 'false') setDeviceOnly(params.deviceOnly === 'true'); }
    } else if (params.group && entityGroups.includes(params.group)) {
      setScreen('catalog');
    } else if (params.id) {
      if (!loaded) return;
      const item = saved.find((entity) => entity.id === params.id);
      if (item) openDetail(item);
      else {
        setSelectedEntity(null);
        setScreen('catalog');
        Alert.alert('Item unavailable', 'This item may be archived, deleted, or outside your selected data source. Archived items are available in Settings.');
      }
    }
    router.setParams({ type: undefined, group: undefined, id: undefined, title: undefined, request: undefined, date: undefined, deviceOnly: undefined });
  }, [params.group, params.type, params.id, params.title, params.request, params.date, params.deviceOnly, saved, loaded]);

  function returnToPreviousScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/matrix');
  }

  function startCreate(definition: EntityDefinition) {
    setEditing(null);
    setSelectedType(definition);
    setTitle('');
    setDetails('');
    setFieldValues({});
    setRelatedIds([]);
    setRelationQuery('');
    setDeviceOnly(Boolean(definition.privateByDefault));
    setScreen('create');
  }

  function openDetail(entity: LifeEntity) {
    setSelectedEntity(entity);
    setScreen('detail');
  }

  async function createEntity() {
    if (!selectedType || !captureTitle || savePending.current) return;
    const validationError = validateEntityInput(selectedType.name, captureTitle, fieldValues);
    if (validationError) { Alert.alert('Check your item', validationError); return; }
    savePending.current = true;
    setSaving(true);
    try {
      const entity = await saveEntity({
        id: editing?.id,
        kind: slug(selectedType.name),
        title: captureTitle,
        details: details.trim() || undefined,
        deviceOnly,
        relatedIds,
        metadata: { ...editing?.metadata, entityType: selectedType.name, group: selectedType.group, ...fieldValues },
      });
      await refresh();
      setSelectedEntity(entity);
      setScreen('detail');
    } catch {
      Alert.alert('Could not save', 'Your form is still here. Please try again.');
    } finally {
      savePending.current = false;
      setSaving(false);
    }
  }

  function editEntity(entity: LifeEntity) {
    if (entity.source) { Alert.alert('Read-only data', 'Connected records are read-only during this review.'); return; }
    const definition = definitionFor(entity);
    if (!definition) return;
    setEditing(entity);
    setSelectedType(definition);
    setTitle(entity.title);
    setDetails(entity.details ?? '');
    setDeviceOnly(entity.deviceOnly);
    setRelatedIds(entity.relatedIds ?? []);
    const editableKeys = new Set(fieldsForEntity(definition.name).map((field) => field.key));
    if (definition.name === 'Task') editableKeys.add('projectId');
    if (definition.name === 'Habit') editableKeys.add('goalId');
    if (definition.name === 'Event') editableKeys.add('peopleIds');
    setFieldValues(Object.fromEntries(Object.entries(entity.metadata).filter(([key]) => editableKeys.has(key)).map(([key, value]) => [key, String(value ?? '')])));
    setScreen('create');
  }

  function confirmDelete(entity: LifeEntity) {
    if (entity.source) { Alert.alert('Read-only data', 'This review does not delete database records.'); return; }
    Alert.alert('Delete this item?', 'This removes it from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeEntity(entity.id);
            await refresh();
            setSelectedEntity(null);
            setScreen('catalog');
          } catch { Alert.alert('Could not delete', 'Please try again.'); }
        },
      },
    ]);
  }

  if (screen === 'create' && selectedType) {
    const isLog = specializedLogTypes.includes(selectedType.name);
    const accent = isLog ? '#A5D957' : groupAccent[selectedType.group] ?? '#50D39A';
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled">
          <Header title={isLog ? (selectedType.name === 'Meal' ? 'LOG FOOD' : selectedType.name === 'Workout' ? 'LOG WORKOUT' : selectedType.name === 'Mood Log' ? 'HOW ARE YOU?' : 'WHAT I WORE') : `${editing ? 'Edit' : 'New'} ${selectedType.name}`} onBack={() => { if (editing) setScreen('detail'); else returnToPreviousScreen(); }} palette={palette} />
          {!editing && ['Task', 'Habit'].includes(selectedType.name) ? <View style={[styles.captureTabs, { backgroundColor: palette.panel, borderColor: palette.line }]}>
            {['Task', 'Habit'].map(name => <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: selectedType.name === name }}
              onPress={() => {
                const definition = entityCatalog.find(item => item.name === name)!;
                setSelectedType(definition);
                const keys = new Set(fieldsForEntity(name).map(field => field.key));
                setFieldValues(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
              }} style={[styles.captureTab, { backgroundColor: selectedType.name === name ? palette.raised : 'transparent' }]}>
              <Text style={{ color: selectedType.name === name ? (dark ? '#A5D957' : '#537F1C') : palette.muted, fontSize: 15 }}>{name === 'Task' ? '✓' : '↻'} {name}</Text>
            </Pressable>)}
          </View> : isLog ? null : <View style={[styles.typeHero, { backgroundColor: palette.panel, borderColor: palette.line }]}>
            <View style={[styles.heroIcon, { backgroundColor: `${accent}25` }]}><EntityIcon type={selectedType.name} color={accent} size={26} /></View>
            <View style={styles.flex}>
              <Text style={[styles.heroTitle, { color: palette.text }]}>{selectedType.name}</Text>
              <Text style={[styles.heroSub, { color: palette.muted }]}>{selectedType.group} · MATRIX entity</Text>
            </View>
          </View>}

          <Text style={[styles.label, { color: palette.muted }]}>NAME</Text>
          <TextInput accessibilityLabel={selectedType.name + ' name'} value={title} onChangeText={setTitle} placeholder={selectedType.name + ' name'} placeholderTextColor={palette.muted} autoCapitalize="sentences" returnKeyType="done" style={{ minHeight: 52, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 14, color: palette.text, backgroundColor: palette.panel, fontSize: 16 }} />
          <Text style={[styles.label, { color: palette.muted }]}>NOTES · OPTIONAL</Text>
          <TextInput accessibilityLabel={selectedType.name + ' notes, optional'} value={details} onChangeText={setDetails} multiline placeholder="Add notes (optional)" placeholderTextColor={palette.muted} textAlignVertical="top" style={{ minHeight: 112, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: palette.panel, color: palette.text, fontSize: 15, lineHeight: 22 }} />
          {visualCapture ? <SpecializedLog type={selectedType.name} values={fieldValues} palette={palette} onChange={(key, value) => setFieldValues(current => ({ ...current, [key]: value }))} /> : null}
          {visualCapture ? null : isLog ? <SpecializedLog type={selectedType.name} values={fieldValues} palette={palette} onChange={(key, value) => setFieldValues(current => ({ ...current, [key]: value }))} /> : <View style={styles.dynamicGrid}>
            {fieldsForEntity(selectedType.name).map((item) => (
              <View key={item.key} style={styles.dynamicItem}>
                <Text style={[styles.label, { color: palette.muted }]}>{((selectedType.name === 'Task' && item.key === 'project') || (selectedType.name === 'Habit' && item.key === 'goal')) ? 'PART OF · OPTIONAL' : item.label.toUpperCase()}</Text>
                {selectedType.name === 'Expense' && item.key === 'amount' ? <TextInput accessibilityLabel="Expense amount" value={fieldValues.amount ?? ''} onChangeText={value => { const amount = value.replace(',', '.'); if (/^\d*(\.\d*)?$/.test(amount)) setFieldValues(current => ({ ...current, amount })); }} keyboardType="decimal-pad" inputMode="decimal" placeholder="0.00" placeholderTextColor={palette.muted} style={[styles.field, { color: palette.text, backgroundColor: palette.panel, borderColor: palette.line, marginBottom: 16 }]} /> : selectedType.name === 'Expense' && item.key === 'account' ? <View style={{ marginBottom: 16 }}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Select expense account" accessibilityState={{ expanded: accountPickerOpen }} onPress={() => setAccountPickerOpen(true)} style={{ minHeight: 52, padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: palette.panel, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <SymbolView name={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }} size={22} tintColor={palette.muted} />
                    <Text style={{ flex: 1, color: fieldValues.account ? palette.text : palette.muted }}>{fieldValues.account || 'Select account or payment method'}</Text>
                    <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={18} tintColor={palette.muted} />
                  </Pressable>
                  <Modal visible={accountPickerOpen} transparent animationType="slide" onRequestClose={() => setAccountPickerOpen(false)}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000080' }}>
                      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss account picker" onPress={() => setAccountPickerOpen(false)} style={StyleSheet.absoluteFill} />
                      <SafeAreaView edges={['bottom']} accessibilityViewIsModal style={{ maxHeight: '80%', backgroundColor: palette.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                        <View style={{ padding: 20, flexShrink: 1, gap: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Text accessibilityRole="header" style={{ flex: 1, fontSize: 20, fontWeight: '700', color: palette.text }}>Account / payment method</Text>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close account picker" onPress={() => setAccountPickerOpen(false)} style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={20} tintColor={palette.text} /></Pressable>
                          </View>
                          <ScrollView keyboardShouldPersistTaps="handled">
                            {expenseAccounts.map(account => <Pressable key={account} accessibilityRole="radio" accessibilityState={{ checked: fieldValues.account === account }} onPress={() => { setFieldValues(current => ({ ...current, account })); setAccountPickerOpen(false); }} style={{ minHeight: 52, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: palette.line }}>
                              <Text style={{ flex: 1, color: palette.text, fontSize: 16 }}>{account}</Text>
                              {fieldValues.account === account ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={20} tintColor={palette.accent} /> : null}
                            </Pressable>)}
                          </ScrollView>
                        </View>
                      </SafeAreaView>
                    </View>
                  </Modal>
                </View> : selectedType.name === 'Event' && item.key === 'location' ? <TextInput accessibilityLabel="Event location" value={fieldValues.location ?? ''} onChangeText={location => setFieldValues(current => ({ ...current, location }))} placeholder="Add a location" placeholderTextColor={palette.muted} style={[styles.field, { color: palette.text, backgroundColor: palette.panel, borderColor: palette.line, marginBottom: 16 }]} /> : selectedType.name === 'Event' && item.key === 'people' ? <View style={{ marginBottom: 16 }}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Select event people" accessibilityState={{ expanded: peopleSheetOpen }} onPress={() => { setPeopleQuery(''); setPeopleSheetOpen(true); }} style={{ minHeight: 52, padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: palette.panel, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <SymbolView name={{ ios: 'person.2', android: 'group', web: 'group' }} size={22} tintColor={palette.muted} />
                    <Text numberOfLines={2} style={{ flex: 1, color: fieldValues.people ? palette.text : palette.muted }}>{fieldValues.people || 'Select contacts'}</Text>
                    <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={18} tintColor={palette.muted} />
                  </Pressable>
                  <Modal visible={peopleSheetOpen} transparent animationType="slide" onRequestClose={() => setPeopleSheetOpen(false)}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000080' }}>
                      <Pressable accessibilityRole="button" accessibilityLabel="Close contacts" onPress={() => setPeopleSheetOpen(false)} style={StyleSheet.absoluteFill} />
                      <SafeAreaView edges={['bottom']} accessibilityViewIsModal style={{ height: '80%', backgroundColor: palette.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
                        <View style={{ flex: 1, padding: 20, gap: 12 }}>
                          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: palette.line, alignSelf: 'center' }} />
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 22, fontWeight: '700' }}>All contacts</Text>
                            <Pressable accessibilityRole="button" accessibilityLabel="Done selecting contacts" onPress={() => setPeopleSheetOpen(false)} style={{ minHeight: 44, minWidth: 64, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: palette.accent, fontWeight: '700', fontSize: 16 }}>Done</Text></Pressable>
                          </View>
                  <TextInput accessibilityLabel="Search event contacts" value={peopleQuery} onChangeText={setPeopleQuery} placeholder="Search saved contacts" placeholderTextColor={palette.muted} style={[styles.field, { color: palette.text, backgroundColor: palette.panel, borderColor: palette.line }]} />
                  <Text style={{ color: palette.muted }}>{eventPeopleIds.length} selected · No invitations sent</Text>
                  {!fieldValues.peopleIds && fieldValues.people ? <Text style={{ color: palette.muted }}>Previously saved: {fieldValues.people}</Text> : null}
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
                    {eventContacts.filter(person => person.title.toLowerCase().includes(peopleQuery.toLowerCase())).map(person => {
                      const checked = eventPeopleIds.includes(person.id);
                      return <Pressable key={person.id} accessibilityRole="checkbox" accessibilityLabel={person.title} accessibilityState={{ checked }} onPress={() => {
                        const ids = checked ? eventPeopleIds.filter(id => id !== person.id) : [...eventPeopleIds, person.id];
                        setFieldValues(current => ({ ...current, peopleIds: JSON.stringify(ids), people: ids.map(id => eventContacts.find(contact => contact.id === id)?.title ?? 'Unavailable contact').join(', ') }));
                      }} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderColor: palette.line }}>
                        <SymbolView name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} size={24} tintColor={palette.muted} />
                        <Text style={{ flex: 1, color: palette.text }}>{person.title}</Text>
                        <SymbolView name={{ ios: checked ? 'checkmark.circle.fill' : 'circle', android: checked ? 'check_circle' : 'radio_button_unchecked', web: checked ? 'check_circle' : 'radio_button_unchecked' }} size={22} tintColor={checked ? palette.accent : palette.muted} />
                      </Pressable>;
                    })}
                  </ScrollView>
                  {!eventContacts.length ? <Text style={{ color: palette.muted }}>No saved contacts yet. Add a Person in MATRIX to select them here.</Text> : !eventContacts.some(person => person.title.toLowerCase().includes(peopleQuery.toLowerCase())) ? <Text style={{ color: palette.muted }}>No contacts match your search.</Text> : null}
                
                        </View>
                      </SafeAreaView>
                    </KeyboardAvoidingView>
                  </Modal>
                </View> : selectedType.name === 'Habit' && item.key === 'frequency' ? <HabitFrequency value={fieldValues.frequency ?? ''} onChange={frequency => setFieldValues(current => ({ ...current, frequency }))} palette={palette} /> : ((selectedType.name === 'Task' && item.key === 'project') || (selectedType.name === 'Habit' && item.key === 'goal')) ? <TaskProjectPicker records={saved} taskId={editing?.id} value={fieldValues[item.key + 'Id'] ?? ''} legacyName={fieldValues[item.key] ?? ''} palette={palette} onChange={entity => {
                  const next = selectTaskProject(fieldValues, relatedIds, entity, item.key as 'project' | 'goal');
                  setFieldValues(next.values);
                  setRelatedIds(next.relatedIds);
                }} /> : selectedType.name === 'Task' && item.key === 'priority' ? <View style={{ marginBottom: 16 }}><PresetChoices label="Priority" options={['Low', 'Medium', 'High']} value={fieldValues.priority ?? ''} onChange={value => setFieldValues(current => ({ ...current, priority: value }))} palette={palette} /></View> : <EntityFieldInput
                  hideDateShortcuts
                  field={{ ...item, options: [...new Set([...tapPresets(item), ...saved.filter(record => record.metadata.entityType === selectedType.name).map(record => record.metadata[item.key]).filter((value): value is string => typeof value === 'string' && value.length > 0)])] }}
                  value={fieldValues[item.key] ?? ''}
                  onChange={(value) => setFieldValues((current) => ({ ...current, [item.key]: value }))}
                  palette={palette}
                />}
              </View>
            ))}
          </View>}

          <Text style={[styles.label, { color: palette.muted }]}>RELATED ITEMS · {relatedIds.length} SELECTED</Text>
          <TextInput accessibilityLabel="Find related items" value={relationQuery} onChangeText={setRelationQuery} placeholder="Search saved people, goals, trips…" placeholderTextColor={palette.muted} style={[styles.field, { color: palette.text, backgroundColor: palette.panel, borderColor: palette.line }]} />
          <ScrollView style={{ maxHeight: 220, marginBottom: 20 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {saved.filter((item) => item.id !== editing?.id && item.title.toLowerCase().includes(relationQuery.toLowerCase())).map((item) => (
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: relatedIds.includes(item.id) }} key={item.id} onPress={() => setRelatedIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} style={[styles.relationRow, { backgroundColor: palette.panel, borderColor: palette.line }]}>
                <View style={styles.flex}><Text style={[styles.privacyTitle, { color: palette.text }]}>{item.title}</Text><Text style={[styles.privacyText, { color: palette.muted }]}>{item.kind}{item.deviceOnly ? ' · Device only' : ''}</Text></View><Text style={{ color: '#27B883', fontSize: 21 }}>{relatedIds.includes(item.id) ? '✓' : '+'}</Text>
              </Pressable>
            ))}
            {!saved.some((item) => item.id !== editing?.id && item.title.toLowerCase().includes(relationQuery.toLowerCase())) ? <Text style={[styles.privateHint, { color: palette.muted }]}>No matching items. Save another item first to connect it here.</Text> : null}
          </ScrollView>
          <View style={[styles.privacy, { backgroundColor: palette.panel, borderColor: palette.line }]}>
            <View style={[styles.privacyIcon, { backgroundColor: deviceOnly ? '#18392E' : palette.raised }]}><SymbolView name={{ ios: 'iphone', android: 'smartphone', web: 'smartphone' }} size={20} tintColor={palette.text} /></View>
            <View style={styles.flex}>
              <Text style={[styles.privacyTitle, { color: palette.text }]}>Stay only on this device</Text>
              <Text style={[styles.privacyText, { color: palette.muted }]}>When enabled, this item is excluded from cloud sync.</Text>
            </View>
            <Switch accessibilityLabel="Stay only on this device" value={deviceOnly} onValueChange={setDeviceOnly} trackColor={{ false: '#52605B', true: '#658D35' }} thumbColor="#FFFFFF" />
          </View>
          {selectedType.privateByDefault ? <Text style={[styles.privateHint, { color: palette.muted }]}>Sensitive {selectedType.name.toLowerCase()} data starts as device-only. You are always in control.</Text> : null}

          <Pressable
            disabled={!captureTitle || saving}
            onPress={() => void createEntity()}
            style={({ pressed }) => [styles.primary, { backgroundColor: accent }, (!captureTitle || saving) && styles.disabled, pressed && styles.pressed]}
          >
            {saving ? <ActivityIndicator color="#06140F" /> : <Text style={styles.primaryText}>{editing ? 'Save changes' : selectedType.name === 'Mood Log' ? 'Save mood' : selectedType.name === 'Workout' ? 'Save workout' : `Create ${selectedType.name}`}</Text>}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'detail' && selectedEntity) {
    const definition = definitionFor(selectedEntity);
    const ownedAsset = saved.find(item => item.metadata.entityType === 'Asset' && item.relatedIds?.includes(selectedEntity.id));
    const accent = groupAccent[String(selectedEntity.metadata.group)] ?? '#50D39A';
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.formWrap}>
          <Header title={String(selectedEntity.metadata.entityType ?? definition?.name ?? 'Item')} onBack={returnToPreviousScreen} palette={palette} />
          <View style={[styles.detailCard, { backgroundColor: palette.panel, borderColor: palette.line }]}>
            <View style={[styles.detailGlyph, { backgroundColor: `${accent}22` }]}><EntityIcon type={definition?.name ?? ''} color={accent} size={30} /></View>
            <Text style={[styles.detailTitle, { color: palette.text }]}>{selectedEntity.title}</Text>
            <Text style={[styles.detailMeta, { color: palette.muted }]}>{String(selectedEntity.metadata.group ?? 'Life')} · Updated {new Date(selectedEntity.updatedAt).toLocaleDateString()}</Text>
            {selectedEntity.details ? <Text style={[styles.detailBody, { color: palette.text, borderColor: palette.line }]}>{selectedEntity.details}</Text> : null}
            {definition?.name === 'Wish' ? <WishOverview entity={selectedEntity} asset={ownedAsset} palette={palette} onOpenAsset={() => { if (ownedAsset) openDetail(ownedAsset); }} onAddAsset={() => {
              const wish = selectedEntity;
              startCreate(entityCatalog.find(item => item.name === 'Asset')!);
              setTitle(wish.title);
              setDeviceOnly(wish.deviceOnly);
              setRelatedIds([wish.id]);
              // Target price is not a purchase price. Let the user confirm actual value/date.
            }} /> : null}
            {selectedEntity.kind === 'vehicle' ? <VehicleOverview key={selectedEntity.id} entity={selectedEntity} records={saved} palette={palette} onOpen={openDetail} onAdd={name => { if (selectedEntity.source) { Alert.alert('Read-only vehicle', 'Linked writes to connected data are not enabled yet.'); return; } const definition = entityCatalog.find(item => item.name === name); if (definition) { startCreate(definition); setRelatedIds([selectedEntity.id]); } }} /> : null}
            {definition && specializedLogTypes.includes(definition.name) ? <SpecializedLog type={definition.name} values={selectedEntity.metadata} palette={palette} /> : <View style={[styles.attributeList, { borderColor: palette.line }]}>
              {Object.entries(selectedEntity.metadata).filter(([key, value]) => !['entityType', 'group'].includes(key) && String(value).trim()).map(([key, value]) => (
                <View key={key} style={styles.attributeRow}>
                  <Text style={[styles.attributeKey, { color: palette.muted }]}>{key.replace(/([A-Z])/g, ' $1')}</Text>
                  <Text style={[styles.attributeValue, { color: palette.text }]}>{String(value)}</Text>
                </View>
              ))}
            </View>}
          </View>
          <View style={[styles.statusRow, { backgroundColor: palette.panel, borderColor: palette.line }]}>
            <Text style={[styles.statusIcon, { color: accent }]}>{selectedEntity.deviceOnly ? '⌁' : '↟'}</Text>
            <View style={styles.flex}>
              <Text style={[styles.statusTitle, { color: palette.text }]}>{selectedEntity.source === 'preview' ? 'Developer preview' : selectedEntity.source === 'supabase' ? 'Loaded from Supabase' : selectedEntity.deviceOnly ? 'On this device only' : 'Saved locally'}</Text>
              <Text style={[styles.statusSub, { color: palette.muted }]}>{selectedEntity.source ? 'Read-only record. Reviewing it does not change the database.' : selectedEntity.deviceOnly ? 'This private item will not leave this device.' : 'This item is stored locally. Upload sync is not enabled yet.'}</Text>
            </View>
          </View>
          <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 24 }]}>Related</Text>
          {relatedEntities(selectedEntity, saved).map((item) => <Pressable accessibilityRole="button" key={item.id} onPress={() => openDetail(item)} style={[styles.relationRow, { backgroundColor: palette.panel, borderColor: palette.line }]}><View style={styles.flex}><Text style={[styles.privacyTitle, { color: palette.text }]}>{item.title}</Text><Text style={[styles.privacyText, { color: palette.muted }]}>{item.kind}{item.deviceOnly ? ' · Device only' : ''}</Text></View><Text style={{ color: palette.muted }}>›</Text></Pressable>)}
          {!relatedEntities(selectedEntity, saved).length ? <Text style={[styles.privateHint, { color: palette.muted }]}>Edit this item to connect people, goals, plans, and more.</Text> : null}
          <Pressable onPress={() => startCreate(definition ?? entityCatalog[0])} style={[styles.secondary, { borderColor: palette.line, backgroundColor: palette.panel }]}><Text style={[styles.secondaryText, { color: palette.text }]}>Create another</Text></Pressable>
          {definition ? <Pressable onPress={() => editEntity(selectedEntity)} style={[styles.secondary, { borderColor: palette.line, backgroundColor: palette.panel }]}><Text style={[styles.secondaryText, { color: palette.text }]}>Edit item</Text></Pressable> : null}
          {!selectedEntity.source ? <Pressable accessibilityRole="button" onPress={() => Alert.alert('Archive this item?', 'It will leave your dashboard. Restore it anytime from Settings → Archived items. Relationships and privacy choices will be preserved.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Archive', onPress: () => { void setEntityArchived(selectedEntity.id, true).then(async () => { setSaved(await listEntities()); setScreen('catalog'); }).catch(() => Alert.alert('Could not archive', 'Your item has not been deleted. Please try again.')); } }])} style={[styles.secondary, { borderColor: palette.line, backgroundColor: palette.panel }]}><Text style={[styles.secondaryText, { color: palette.text }]}>Archive item</Text></Pressable> : null}
          <Pressable onPress={() => confirmDelete(selectedEntity)} style={styles.deleteButton}><Text style={styles.deleteText}>Delete item</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Keep deep-linked create/detail routes mounted while their parameters resolve.
  // Bare and legacy catalog routes now belong to the Matrix tab.
  if (params.type || params.id) {
    return <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}><ActivityIndicator accessibilityLabel="Loading item" color={palette.accent} /></SafeAreaView>;
  }
  return <Redirect href="/(tabs)/matrix" />;
}

function Header({ title, onBack, palette }: { title: string; onBack: () => void; palette: { text: string; muted: string } }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={palette.text} /></Pressable>
      <Text numberOfLines={1} style={[styles.headerTitle, { color: palette.text }]}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  relationRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 15, borderWidth: 1, padding: 14, marginTop: 8, minHeight: 58 },
  wrap: { padding: 20, paddingBottom: 120 },
  formWrap: { padding: 20, paddingBottom: 130 },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
  sub: { fontSize: 13, marginTop: 2 },
  totalBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  totalText: { fontSize: 11, fontWeight: '800' },
  search: { height: 48, borderRadius: 16, marginTop: 20, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1 },
  searchIcon: { fontSize: 21 },
  input: { flex: 1, fontSize: 14 },
  filters: { gap: 8, paddingVertical: 16 },
  filter: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 18, borderWidth: 1 },
  filterSelected: { backgroundColor: '#127855', borderColor: '#127855' },
  filterText: { fontSize: 11, fontWeight: '700' },
  filterSelectedText: { color: '#FFFFFF' },
  section: { marginBottom: 22 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionCount: { fontSize: 12, fontWeight: '700' },
  savedRow: { gap: 10 },
  savedCard: { width: 152, minHeight: 122, borderRadius: 18, padding: 14, borderWidth: 1 },
  savedIcon: { fontSize: 22, fontWeight: '900' },
  savedTitle: { fontSize: 14, fontWeight: '800', marginTop: 12 },
  savedType: { fontSize: 10, marginTop: 3 },
  deviceBadge: { fontSize: 9, marginTop: 9, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31.3%', minHeight: 128, borderRadius: 18, padding: 12, borderWidth: 1 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  tileIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 17, fontWeight: '900' },
  name: { fontSize: 12, fontWeight: '900', marginTop: 11 },
  groupName: { fontSize: 9, marginTop: 3 },
  private: { fontSize: 8, fontWeight: '800', marginTop: 7 },
  header: { flexDirection: 'row', alignItems: 'center', height: 44, marginBottom: 20 },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  backText: { fontSize: 36, lineHeight: 38 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '900' },
  headerSpacer: { width: 44 },
  typeHero: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, padding: 18, borderWidth: 1, marginBottom: 25 },
  captureTabs: { flexDirection: 'row', padding: 4, borderWidth: 1, borderRadius: 8, marginBottom: 24 },
  captureTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  heroIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  heroIconText: { fontSize: 23, fontWeight: '900' },
  heroTitle: { fontSize: 20, fontWeight: '900' },
  heroSub: { fontSize: 13, marginTop: 4 },
  label: { fontSize: 12, fontWeight: '900', letterSpacing: 1.1, marginBottom: 8, marginLeft: 4 },
  field: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, minHeight: 50, fontSize: 14, marginBottom: 20 },
  details: { minHeight: 132, paddingTop: 15, textAlignVertical: 'top' },
  dynamicGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10 },
  dynamicItem: { width: '100%' },
  dynamicField: { marginBottom: 16 },
  privacy: { flexDirection: 'row', alignItems: 'center', borderRadius: 19, borderWidth: 1, padding: 14, gap: 12 },
  privacyIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  privacyTitle: { fontSize: 13, fontWeight: '900' },
  privacyText: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  privateHint: { fontSize: 10, lineHeight: 15, margin: 12 },
  primary: { height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  primaryText: { color: '#06140F', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  detailCard: { borderRadius: 24, borderWidth: 1, padding: 22, alignItems: 'center' },
  detailGlyph: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  detailGlyphText: { fontSize: 30, fontWeight: '900' },
  detailTitle: { fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: 17 },
  detailMeta: { fontSize: 11, marginTop: 6 },
  detailBody: { width: '100%', fontSize: 14, lineHeight: 21, marginTop: 22, paddingTop: 19, borderTopWidth: 1 },
  attributeList: { width: '100%', marginTop: 20, paddingTop: 12, borderTopWidth: 1 },
  attributeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 7 },
  attributeKey: { fontSize: 11, textTransform: 'capitalize' },
  attributeValue: { flex: 1, textAlign: 'right', fontSize: 11, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 19, borderWidth: 1, padding: 15, marginTop: 14 },
  statusIcon: { fontSize: 24, fontWeight: '900' },
  statusTitle: { fontSize: 13, fontWeight: '900' },
  statusSub: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  secondary: { height: 50, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  secondaryText: { fontSize: 13, fontWeight: '900' },
  deleteButton: { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  deleteText: { color: '#FF6676', fontSize: 12, fontWeight: '800' },
});
