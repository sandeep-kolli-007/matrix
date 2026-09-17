import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { DataMode, getDataMode, selectDataMode } from '@/data/matrix-source';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function DataConnection() {
  const { appearance } = useLifeOS();
  const dark = appearance === 'dark';
  const color = dark ? '#F3F8F4' : '#13291C';
  const surface = dark ? '#193526' : '#FFFFFF';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(getDataMode());
  const [error, setError] = useState('');
  async function select(next: DataMode) {
    setBusy(true); setError('');
    try { await selectDataMode(next); setMode(next); router.navigate('/'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load data.'); }
    finally { setBusy(false); }
  }
  async function signIn() {
    if (!supabase) return;
    setBusy(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setPassword('');
      await select('account');
    } catch (e) { setError(e instanceof Error ? e.message : 'Sign-in failed.'); }
    finally { setBusy(false); }
  }
  return <ScrollView keyboardShouldPersistTaps="handled" style={{ backgroundColor: dark ? '#091710' : '#F3F7F4' }} contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 60 }}>
    <Text style={{ color, fontSize: 30, fontWeight: '800' }}>MATRIX data</Text>
    <Text style={{ color, lineHeight: 22 }}>Connect your existing account to load every accessible entity. Current source: {mode}.</Text>
    <TextInput accessibilityLabel="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#87998E" style={{ color, backgroundColor: surface, padding: 16, borderRadius: 14 }} />
    <TextInput accessibilityLabel="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#87998E" style={{ color, backgroundColor: surface, padding: 16, borderRadius: 14 }} />
    <Pressable disabled={busy || !email || !password} onPress={() => void signIn()} style={{ padding: 17, backgroundColor: '#13764F', borderRadius: 14, opacity: busy ? 0.5 : 1 }}><Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '700' }}>{busy ? 'Loading…' : 'Sign in and open dashboard'}</Text></Pressable>
    {error ? <Text accessibilityRole="alert" style={{ color: '#E78383' }}>{error}</Text> : null}
    <Pressable disabled={busy} onPress={() => void select('local')} style={{ padding: 16 }}><Text style={{ color }}>Use device-only records</Text></Pressable>
    <Pressable disabled={busy} onPress={() => void supabase?.auth.signOut().then(({ error }) => { if (error) Alert.alert('Could not sign out', error.message); else void select('local'); })} style={{ padding: 16 }}><Text style={{ color }}>Sign out</Text></Pressable>
    {__DEV__ ? <>
      <Text style={{ color, fontSize: 21, fontWeight: '700' }}>Developer scenarios</Text>
      <Text style={{ color, lineHeight: 21 }}>Read-only snapshot fetched from Supabase. No scenario changes server data. Preview lives in memory and resets when the app restarts.</Text>
      {([['full', 'Full database snapshot · 143 records'], ['empty', 'Empty account · 0 records'], ['sparse', 'New account · 3 records'], ['large', 'Stress test · 2,145 records']] as const).map(([value, label]) => <Pressable key={value} disabled={busy} onPress={() => void select(value)} style={{ padding: 18, borderRadius: 15, backgroundColor: surface }}><Text style={{ color }}>{label}</Text></Pressable>)}
    </> : null}
  </ScrollView>;
}
