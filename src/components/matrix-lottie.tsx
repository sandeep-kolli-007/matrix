import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import LottieView from 'lottie-react-native';

export function MatrixLottie({ size = 132 }: { size?: number }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduceMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <View
      accessibilityLabel="Animated MATRIX data orbit"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <LottieView
        source={require('../../assets/animations/matrix-pulse.json')}
        autoPlay={!reduceMotion}
        loop={!reduceMotion}
        progress={reduceMotion ? 0.25 : undefined}
        style={{ width: size, height: size }}
      />
    </View>
  );
}
