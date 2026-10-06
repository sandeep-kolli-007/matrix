import { Pressable, type PressableProps, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';

// A missing native module in an older development build must never block a tap.
export function selectionHaptic() {
  void import('expo-haptics').then(module => module.selectionAsync()).catch(() => {});
}

export function HapticPressable({ onPress, style, ...props }: PressableProps) {
  function resolvedStyle(state: PressableStateCallbackType): StyleProp<ViewStyle> {
    const base = typeof style === 'function' ? style(state) : style;
    return [
      base,
      state.pressed && {
        opacity: 0.82,
        transform: [{ scale: 0.985 }],
      },
    ];
  }

  return (
    <Pressable
      {...props}
      style={resolvedStyle}
      onPress={event => {
        selectionHaptic();
        onPress?.(event);
      }}
    />
  );
}
