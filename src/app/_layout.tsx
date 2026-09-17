import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import '@/data/matrix-source';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { LifeOSProvider, useLifeOS } from '@/providers/lifeos-provider';
import { Onboarding } from '@/components/onboarding';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return <LifeOSProvider><AppShell /></LifeOSProvider>;
}

function AppShell() {
  const { appearance, hydrated, onboarded } = useLifeOS();
  if (!hydrated) return null;
  // First launch must dismiss the native splash too, before onboarding can be used.
  if (!onboarded) return <><Onboarding /><AnimatedSplashOverlay /></>;
  return (
    <ThemeProvider value={appearance === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="entities" options={{ headerShown: false }} />
        <Stack.Screen name="insights" options={{ title: 'MATRIX Insights' }} />
        <Stack.Screen name="cycle" options={{ title: 'Cycle Tracking' }} />
        <Stack.Screen name="explore" options={{ title: 'Explore' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings & Preferences' }} />
        <Stack.Screen name="archive" options={{ title: 'Archive' }} />
        <Stack.Screen name="plans" options={{ title: 'Plans' }} />
        <Stack.Screen name="rooms" options={{ title: 'Life rooms' }} />
        <Stack.Screen name="data-connection" options={{ title: 'MATRIX data' }} />
      </Stack>
    </ThemeProvider>
  );
}
