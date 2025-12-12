import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CustomInput } from '@/components/ui/custom-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { createDonation, getDonationById, updateDonation } from '@/services/api-service';
import { getCurrentLocation, LocationCoords } from '@/utils/location-service';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
  { label: '🍽️ Temiz Yemek', value: 'temiz yemek' },
  { label: '♻️ Atık Yemek', value: 'atık yemek' },
];

export default function AddDonationScreen({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const navigation = useNavigation();
  const { donationId } = useLocalSearchParams<{ donationId?: string }>();
  const isEditMode = Boolean(donationId);
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value']>('temiz yemek');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [prefillLoading, setPrefillLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode) {
      requestLocation();
    }
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode || !donationId) return;

    const loadDonation = async () => {
      setPrefillLoading(true);
      try {
        const existing = await getDonationById(Number(donationId));
        setTitle(existing.title ?? '');
        setDescription(existing.description ?? '');
        setCategory((existing.category as (typeof CATEGORIES)[number]['value']) || 'temiz yemek');
        setQuantity(existing.quantity ?? '');
        setExpirationDate(existing.expiration_date ?? '');
        setLocation({
          latitude: existing.latitude,
          longitude: existing.longitude,
          accuracy: 0,
        });
        setError(null);
      } catch (err) {
        setError('Bağış bilgisi alınamadı. Lütfen tekrar deneyin.');
        console.error(err);
      } finally {
        setPrefillLoading(false);
        setLocationLoading(false);
      }
    };

    loadDonation();
  }, [donationId, isEditMode]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackButton}
          accessibilityLabel="Geri"
        >
          <ThemedText style={styles.headerBackIcon}>←</ThemedText>
        </TouchableOpacity>
      ),
      headerTitle: isEditMode ? 'Bağışı Güncelle' : 'Bağış Ekle',
    });
  }, [isEditMode, navigation, router]);

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
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        quantity: quantity.trim() || undefined,
      };

      if (isEditMode && donationId) {
        await updateDonation(Number(donationId), payload);
        Alert.alert('✅ Güncellendi', 'Bağış kaydı güncellendi.');
        onSuccess?.();
        router.back();
      } else {
        await createDonation({
          ...payload,
          expiration_date: expirationDate.trim() || undefined,
          latitude: location!.latitude,
          longitude: location!.longitude,
        });

        Alert.alert('✅ Başarılı', 'Bağışınız başarıyla eklendi!');
        setTitle('');
        setDescription('');
        // Varsayılan kategoriyi backend'in kabul ettiği değere sıfırla
        setCategory('temiz yemek');
        setQuantity('');
        setExpirationDate('');
        setError(null);
        onSuccess?.();
      }
    } catch (error) {
      setError(isEditMode ? 'Bağış güncellenirken hata oluştu.' : 'Bağış eklenirken hata oluştu.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (locationLoading || prefillLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={styles.loadingText}>
          {prefillLoading ? 'Bağış bilgileri yükleniyor...' : 'Konum alınıyor...'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + 20, paddingTop: 16 },
        ]}
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
            Bağış Ekle
          </ThemedText>
          <ThemedText style={styles.subtitle}>
          Fazlalıkları değerli kılın
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
              key={cat.value}
              title={cat.label}
              onPress={() => setCategory(cat.value)}
              style={[
                styles.categoryButton,
                category === cat.value && styles.categoryButtonActive,
              ]}
              textStyle={[
                styles.categoryButtonText,
                category === cat.value && styles.categoryButtonTextActive,
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
            Lat: {location?.latitude?.toFixed(4) ?? '—'}
          </ThemedText>
          <ThemedText style={styles.locationValue}>
            Lon: {location?.longitude?.toFixed(4) ?? '—'}
          </ThemedText>
          <PrimaryButton
            title={locationLoading ? '⏳ Konum alınıyor' : '📡 Konumu Yenile'}
            onPress={requestLocation}
            disabled={locationLoading || loading}
            style={styles.refreshLocationButton}
            textStyle={styles.refreshLocationText}
          />
        </View>

        <PrimaryButton
          title={
            loading
              ? '⏳ Kaydediliyor...'
              : isEditMode
              ? '💾 Güncelle'
              : '✅ Kaydet'
          }
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
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    color: '#1f1f1f',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
  },
  headerBackButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBackIcon: {
    fontSize: 22,
    color: '#333',
    fontWeight: '700',
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
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    height: 48,
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#2e7d32',
  },
  categoryButtonText: {
    color: '#1b1b1b',
    fontWeight: '700',
  },
  categoryButtonTextActive: {
    color: '#fff',
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
  refreshLocationButton: {
    marginTop: 8,
    backgroundColor: '#2196F3',
  },
  refreshLocationText: {
    fontSize: 13,
    fontWeight: '700',
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
