import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CustomInput } from '@/components/ui/custom-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { createDonation } from '@/services/api-service';
import { getCurrentLocation, LocationCoords } from '@/utils/location-service';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = ['🍞 Gıda', '👕 Giyim', '📚 Kitap', '🏠 Ev Eşyası', '❓ Diğer'];

export default function AddDonationScreen({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('🍞 Gıda');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setLocationLoading(true);
    try {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
      } else {
        setLocation({ latitude: 41.0082, longitude: 28.9784, accuracy: 0 });
      }
    } catch (error) {
      setLocation({ latitude: 41.0082, longitude: 28.9784, accuracy: 0 });
    } finally {
      setLocationLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Başlık gereklidir');
      return false;
    }
    if (title.trim().length < 3) {
      setError('Başlık en az 3 karakter olmalıdır');
      return false;
    }
    if (!description.trim()) {
      setError('Açıklama gereklidir');
      return false;
    }
    if (description.trim().length < 10) {
      setError('Açıklama en az 10 karakter olmalıdır');
      return false;
    }
    if (!location) {
      setError('Konum bilgisi gereklidir');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await createDonation({
        title: title.trim(),
        description: description.trim(),
        category: category.replace(/^[^\s]*\s+/, ''),
        quantity: quantity.trim() || undefined,
        expiration_date: expirationDate.trim() || undefined,
        latitude: location!.latitude,
        longitude: location!.longitude,
      });

      Alert.alert('✅ Başarılı', 'Bağışınız başarıyla eklendi!');
      setTitle('');
      setDescription('');
      setCategory('🍞 Gıda');
      setQuantity('');
      setExpirationDate('');
      setError(null);
      onSuccess?.();
    } catch (error) {
      setError('Bağış eklenirken hata oluştu.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (locationLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={styles.loadingText}>Konum alınıyor...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        nestedScrollEnabled={false}
        scrollEventThrottle={16}
        alwaysBounceVertical={false}
        overScrollMode="never"
        scrollEnabled={true}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            🎁 Bağış Ekle
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Sahip olmadığınız eşyaları paylaşın
          </ThemedText>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
          </View>
        )}

        <CustomInput
          placeholder="Bağış başlığı"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            setError(null);
          }}
          editable={!loading}
          maxLength={50}
        />

        <CustomInput
          placeholder="Ayrıntılı açıklama (min 10 karakter)"
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            setError(null);
          }}
          multiline
          numberOfLines={4}
          editable={!loading}
          maxLength={500}
          style={styles.multilineInput}
        />

        <ThemedText style={styles.label}>Kategori Seç</ThemedText>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <PrimaryButton
              key={cat}
              title={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.categoryButton,
                category === cat && styles.categoryButtonActive,
              ]}
              disabled={loading}
            />
          ))}
        </View>

        <ThemedText style={styles.sectionLabel}>İsteğe Bağlı</ThemedText>

        <CustomInput
          placeholder="Miktar (örn: 10 adet)"
          value={quantity}
          onChangeText={setQuantity}
          editable={!loading}
        />

        <CustomInput
          placeholder="Son Kullanma Tarihi"
          value={expirationDate}
          onChangeText={setExpirationDate}
          editable={!loading}
        />

        <View style={styles.locationInfo}>
          <ThemedText style={styles.locationLabel}>📍 Konum</ThemedText>
          <ThemedText style={styles.locationValue}>
            Lat: {location?.latitude.toFixed(4)}
          </ThemedText>
          <ThemedText style={styles.locationValue}>
            Lon: {location?.longitude.toFixed(4)}
          </ThemedText>
        </View>

        <PrimaryButton
          title={loading ? '⏳ Kaydediliyor...' : '✅ Kaydet'}
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1000,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backIcon: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    minWidth: '45%',
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
  },
  locationInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  locationValue: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: '#4CAF50',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  errorText: {
    color: '#c62828',
    fontWeight: '600',
    fontSize: 13,
  },
});
