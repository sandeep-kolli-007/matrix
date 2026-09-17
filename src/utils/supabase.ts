import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

const authStorage = {
  getItem: (key: string) => typeof window === 'undefined' ? Promise.resolve(null) : AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => typeof window === 'undefined' ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string) => typeof window === 'undefined' ? Promise.resolve() : AsyncStorage.removeItem(key),
};

// Local-first mode remains fully available before a user configures sync.
// Only a publishable/anon key belongs in this client environment.
export const supabase = url && publishableKey
  ? createClient(url, publishableKey, {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
  : null;
