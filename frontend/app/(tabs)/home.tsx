import { Donation, DonationCard } from '@/components/donation-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuth } from '@/contexts/auth-context';
import { getDonations } from '@/services/api-service';
import { calculateDistance, getCurrentLocation, LocationCoords } from '@/utils/location-service';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [displayedDonations, setDisplayedDonations] = useState<Donation[]>([]);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      let location = await getCurrentLocation();
      if (!location) {
        location = { latitude: 41.0082, longitude: 28.9784, accuracy: 0 };
      }
      setUserLocation(location);
      await loadDonations(location);
    } catch (error) {
      setError('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadDonations = async (location?: LocationCoords) => {
    try {
      const data = await getDonations();
      const enrichedDonations = data.map((donation) => {
        let distance: number | undefined;
        if (location) {
          distance = calculateDistance(
            location.latitude,
            location.longitude,
            donation.latitude,
            donation.longitude
          );
        }
        return { ...donation, distance } as Donation;
      });

      enrichedDonations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setDonations(enrichedDonations);
      setDisplayedDonations(enrichedDonations);
    } catch (error) {
      console.error('Bağışları yüklerken hata:', error);
      setError('Bağışlar yüklenemedi');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
        await loadDonations(location);
      } else {
        await loadDonations(userLocation || undefined);
      }
    } catch (error) {
      setError('Yenileme sırasında hata oluştu');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDonationPress = (donation: Donation) => {
    Alert.alert(
      donation.title,
      `${donation.description}\n\nKategori: ${donation.category}\nUzaklık: ${((donation.distance || 0) / 1000).toFixed(2)} km`,
      [{ text: 'Kapat', style: 'cancel' }]
    );
  };

  const animateToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={styles.loadingText}>Veriler yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {error && (
        <View style={styles.errorBanner}>
          <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
          <PrimaryButton
            title="Tekrar Dene"
            onPress={loadInitialData}
            style={styles.retryButton}
          />
        </View>
      )}

      {showMap ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: userLocation?.latitude || 41.0082,
              longitude: userLocation?.longitude || 28.9784,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                title="Benim Konumum"
                pinColor="#4CAF50"
              />
            )}

            {donations.map((donation) => (
              <Marker
                key={donation.id}
                coordinate={{
                  latitude: donation.latitude,
                  longitude: donation.longitude,
                }}
                title={donation.title}
                description={donation.category}
                onPress={() => handleDonationPress(donation)}
              />
            ))}
          </MapView>

          <PrimaryButton
            title="📋 Bağış Listemi Göster"
            onPress={() => setShowMap(false)}
            style={styles.toggleButton}
          />

          <PrimaryButton
            title="📍 Konumuma Git"
            onPress={animateToUserLocation}
            style={styles.locationButton}
          />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <PrimaryButton
            title="🗺️ Haritayı Göster"
            onPress={() => setShowMap(true)}
            style={styles.toggleButton}
          />
          {user?.user_type === 'donor' && (
            <ThemedText style={styles.infoBanner}>
              📢 Sadece Bağışçı rolünde bağış ekleyebilirsiniz.
            </ThemedText>
          )}

          {donations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>📭</ThemedText>
              <ThemedText style={styles.emptySubText}>
                Henüz bağış bulunmamaktadır
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={displayedDonations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <DonationCard
                  donation={item}
                  onPress={handleDonationPress}
                />
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4CAF50']}
                />
              }
            />
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  listContainer: {
    flex: 1,
  },
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#4CAF50',
  },
  locationButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 8,
    backgroundColor: '#2196F3',
  },
  loadingText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  infoBanner: {
    marginTop: 8,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f7ed',
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 4,
  },
  errorText: {
    color: '#c62828',
    marginBottom: 10,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#f44336',
  },
});
