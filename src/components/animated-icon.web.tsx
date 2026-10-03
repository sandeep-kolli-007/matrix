import { StyleSheet, Text, View } from 'react-native';

export function AnimatedSplashOverlay() {
  return null;
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
});
