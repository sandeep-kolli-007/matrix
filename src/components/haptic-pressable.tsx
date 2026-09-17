import { Pressable, type PressableProps } from 'react-native';

// A missing native module in an older development build must never block a tap.
export function selectionHaptic() {
  void import('expo-haptics').then(module => module.selectionAsync()).catch(() => {});
}
export function HapticPressable({ onPress, ...props }: PressableProps) {
  return <Pressable {...props} onPress={event => { selectionHaptic(); onPress?.(event); }} />;
}
