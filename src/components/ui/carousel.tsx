import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Carousel() {
  const items = ['Photo 1', 'Photo 2', 'Photo 3', 'Photo 4', 'Photo 5'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      snapToInterval={332}
      decelerationRate="fast"
    >
      {items.map(item => (
        <View key={item} style={styles.card}>
          <Text style={styles.cardText}>{item}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    display: 'flex',
  },
  card: {
    width: 320,
    height: 180,
    backgroundColor: '#3F51B5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // marginRight: 12,
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});