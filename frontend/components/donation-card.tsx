import { Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const { width } = Dimensions.get('window');

export interface Donation {
  id: number;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  distance?: number;
  quantity?: string;
  expiration_date?: string;
}

export type DonationCardProps = {
  donation: Donation;
  onPress: (donation: Donation) => void;
};

export function DonationCard({ donation, onPress }: DonationCardProps) {
  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      'Gıda': '🍞',
      'Giyim': '👕',
      'Kitap': '📚',
      'Ev Eşyası': '🏠',
      'Diğer': '❓',
    };
    return emojiMap[category] || '📦';
  };

  const getDistanceColor = (distance?: number) => {
    if (!distance) return '#4CAF50';
    const km = distance / 1000;
    if (km < 1) return '#00BCD4';
    if (km < 5) return '#4CAF50';
    return '#FF9800';
  };

  return (
    <TouchableOpacity 
      onPress={() => onPress(donation)}
      activeOpacity={0.7}
    >
      <ThemedView style={styles.card}>
        <ThemedView style={styles.cardHeader}>
          <ThemedText style={styles.categoryEmoji}>
            {getCategoryEmoji(donation.category)}
          </ThemedText>
          <ThemedView style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={1}>
              {donation.title}
            </ThemedText>
            <ThemedText style={styles.category}>{donation.category}</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedText style={styles.description} numberOfLines={2}>
          {donation.description}
        </ThemedText>

        <ThemedView style={styles.footer}>
          {donation.distance !== undefined && (
            <ThemedView style={[styles.distanceBadge, { backgroundColor: getDistanceColor(donation.distance) + '20' }]}>
              <ThemedText style={[styles.distance, { color: getDistanceColor(donation.distance) }]}>
                📍 {(donation.distance / 1000).toFixed(1)} km
              </ThemedText>
            </ThemedView>
          )}

          {donation.quantity && (
            <ThemedText style={styles.quantity}>📦 {donation.quantity}</ThemedText>
          )}

          {donation.expiration_date && (
            <ThemedText style={styles.expiration}>📅 {donation.expiration_date}</ThemedText>
          )}
        </ThemedView>

        <ThemedText style={styles.tapHint}>👆 Detaylar için dokunun</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 15,
    marginBottom: 2,
    color: '#222',
  },
  category: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  distanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  distance: {
    fontSize: 12,
    fontWeight: '700',
  },
  quantity: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  expiration: {
    fontSize: 12,
    color: '#d32f2f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffe0b2',
    borderRadius: 4,
  },
  tapHint: {
    fontSize: 10,
    color: '#aaa',
    fontStyle: 'italic',
  },
});

