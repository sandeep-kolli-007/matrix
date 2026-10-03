import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 360;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const exit = new Keyframe({
    0: { opacity: 1, transform: [{ scale: 1 }] },
    100: { opacity: 0, transform: [{ scale: 0.98 }], easing: Easing.out(Easing.quad) },
  });

  const mark = (
    <View style={s.mark}>
      <Text style={s.markText}>M</Text>
    </View>
  );

  return animate ? (
    <Animated.View
      entering={exit.duration(DURATION).withCallback(finished => {
        'worklet';
        if (finished) scheduleOnRN(setVisible, false);
      })}
      style={s.overlay}
    >
      {mark}
      <Text style={s.wordmark}>MATRIX</Text>
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setAnimate(true));
      }}
      style={s.overlay}
    >
      {mark}
      <Text style={s.wordmark}>MATRIX</Text>
    </View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={s.iconContainer}>
      <View style={s.mark}>
        <Text style={s.markText}>M</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0B0D10',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  iconContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#2F6FED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '700',
    letterSpacing: -1,
  },
  wordmark: {
    color: '#F4F6F8',
    marginTop: 16,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
});
