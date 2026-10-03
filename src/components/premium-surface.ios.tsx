import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';

export function PremiumSurface({ children, ...props }: PropsWithChildren<ViewProps>) {
  if (!isGlassEffectAPIAvailable()) return <View {...props}>{children}</View>;
  return (
    <GlassView {...props} isInteractive glassEffectStyle="regular">
      {children}
    </GlassView>
  );
}
