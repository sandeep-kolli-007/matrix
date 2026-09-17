import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

type Appearance = 'light' | 'dark';

type LifeOSContextValue = {
  appearance: Appearance;
  hydrated: boolean;
  onboarded: boolean;
  toggleAppearance: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const APPEARANCE_KEY = 'lifeos:appearance';
const ONBOARDING_KEY = 'lifeos:onboarded';
const LifeOSContext = createContext<LifeOSContextValue | null>(null);

export function LifeOSProvider({ children }: PropsWithChildren) {
  const [appearance, setAppearance] = useState<Appearance>('light');
  const [onboarded, setOnboarded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    // Independent reads keep a failed theme read from resetting completed onboarding.
    Promise.allSettled([AsyncStorage.getItem(APPEARANCE_KEY), AsyncStorage.getItem(ONBOARDING_KEY)])
      .then(([saved, onboardingState]) => {
        if (!active) return;
        if (saved.status === 'fulfilled' && (saved.value === 'dark' || saved.value === 'light')) setAppearance(saved.value);
        if (onboardingState.status === 'fulfilled') setOnboarded(onboardingState.value === 'complete');
        if (saved.status === 'rejected' || onboardingState.status === 'rejected') {
          Alert.alert('Some preferences unavailable', 'Preferences that could be loaded are still applied. Your saved data has not been changed. Restart MATRIX to retry.');
        }
        setHydrated(true);
      });
    return () => { active = false; };
  }, []);

  const value = useMemo<LifeOSContextValue>(() => ({
    appearance,
    hydrated,
    onboarded,
    toggleAppearance: async () => {
      const next = appearance === 'light' ? 'dark' : 'light';
      await AsyncStorage.setItem(APPEARANCE_KEY, next);
      setAppearance(next);
    },
    completeOnboarding: async () => {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'complete');
      setOnboarded(true);
    },
  }), [appearance, hydrated, onboarded]);

  return <LifeOSContext.Provider value={value}>{children}</LifeOSContext.Provider>;
}

export function useLifeOS() {
  const context = useContext(LifeOSContext);
  if (!context) throw new Error('useLifeOS must be used within LifeOSProvider');
  return context;
}
