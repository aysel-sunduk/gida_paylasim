import { Donation, DonationCard } from '@/components/donation-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuth } from '@/contexts/auth-context';
import { cancelReservation, deleteDonation, getDonations, getDonationsByLocation, reserveDonation } from '@/services/api-service';
import { getAuthToken } from '@/services/auth-service';
import { calculateDistance, getCurrentLocation, LocationCoords } from '@/utils/location-service';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [displayedDonations, setDisplayedDonations] = useState<Donation[]>([]);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'temiz' | 'atik' | 'reserved'>('all');
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userLocation) {
        loadDonations(userLocation);
      }
    }, [userLocation])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: showMap
        ? undefined
        : () => (
            <TouchableOpacity onPress={() => setShowMap(true)} style={styles.backButton}>
              <ThemedText style={styles.backButtonIcon}>←</ThemedText>
            </TouchableOpacity>
          ),
      headerTitle: 'Harita ve Bağışlar',
    });
  }, [navigation, showMap]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        router.replace('/auth/login');
        return;
      }
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

  const applyFilter = (items: Donation[], key: typeof filter = filter) => {
    switch (key) {
      case 'temiz':
        return items.filter((d) => d.category === 'temiz yemek');
      case 'atik':
        return items.filter((d) => d.category === 'atık yemek');
      case 'reserved':
        return items.filter((d) => d.is_reserved);
      default:
        return items;
    }
  };

  const loadDonations = async (location?: LocationCoords) => {
    try {
      let data: Donation[] = [];
      if (location) {
        data = await getDonationsByLocation(location.latitude, location.longitude, 10);
      } else {
        data = await getDonations();
      }
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
      setDisplayedDonations(applyFilter(enrichedDonations, filter));
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

  const handleReserve = async (donationId: number) => {
    setActioningId(donationId);
    try {
      await reserveDonation(donationId);
      await loadDonations(userLocation || undefined);
      Alert.alert('✔️ Rezervasyon', 'Bağış sizin için rezerve edildi.');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.detail?.message || 'Rezervasyon yapılamadı');
    } finally {
      setActioningId(null);
    }
  };

  const handleCancelReserve = async (donationId: number) => {
    setActioningId(donationId);
    try {
      await cancelReservation(donationId);
      await loadDonations(userLocation || undefined);
      Alert.alert('↩️ Rezervasyon iptal', 'Rezervasyon iptal edildi.');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.detail?.message || 'Rezervasyon iptal edilemedi');
    } finally {
      setActioningId(null);
    }
  };

  const handleEdit = (donationId: number) => {
    router.push({
      pathname: '/(tabs)/add-donation',
      params: { donationId: donationId.toString() },
    });
  };

  const handleDelete = (donationId: number) => {
    Alert.alert('Bağışı Sil', 'Bu bağışı kalıcı olarak silmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setActioningId(donationId);
          try {
            await deleteDonation(donationId);
            await loadDonations(userLocation || undefined);
            Alert.alert(' Silindi', 'Bağış başarıyla silindi.');
          } catch (err: any) {
            Alert.alert('Hata', err?.response?.data?.detail?.message || 'Bağış silinemedi');
          } finally {
            setActioningId(null);
          }
        },
      },
    ]);
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
            title="📋 Bağış Listesini Göster"
            onPress={() => setShowMap(false)}
            style={styles.toggleButton}
          />

          <PrimaryButton
            title="📍"
            accessibilityLabel="Konumuma git"
            onPress={animateToUserLocation}
            style={styles.locationButton}
          />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <View style={styles.listHeaderContainer}>
            {user?.user_type === 'donor' && (
              <View style={styles.filterRow}>
                {[
                  { key: 'all', label: 'Hepsi' },
                  { key: 'temiz', label: 'Temiz' },
                  { key: 'atik', label: 'Atık' },
                  { key: 'reserved', label: 'Rezerve' },
                ].map((f) => (
                  <PrimaryButton
                    key={f.key}
                    title={f.label}
                    onPress={() => {
                      const next = f.key as typeof filter;
                      setFilter(next);
                      setDisplayedDonations(applyFilter(donations, next));
                    }}
                    style={[
                      styles.filterBtn,
                      filter === f.key && styles.filterBtnActive,
                    ]}
                    textStyle={[
                      styles.filterBtnText,
                      filter === f.key && styles.filterBtnTextActive,
                    ]}
                  />
                ))}
              </View>
            )}
            {user?.user_type === 'recipient' && (
              <ThemedText style={styles.infoBanner}>Bu hesapta yalnız temiz yemekler listelenir.</ThemedText>
            )}
            {user?.user_type === 'shelter_volunteer' && (
              <ThemedText style={[styles.infoBanner, styles.infoBannerWarning]}>
                Bu hesapta yalnız atık yemekler listelenir.
              </ThemedText>
            )}
          </View>

          {displayedDonations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>📭</ThemedText>
              <ThemedText style={styles.emptySubText}>
                Bu filtrede henüz bağış bulunmamaktadır
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={displayedDonations}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <DonationCard
                    donation={item}
                    onPress={handleDonationPress}
                  />

                  {user?.user_type === 'donor' && (
                    <View style={styles.ownerActionRow}>
                      <PrimaryButton
                        title=" Düzenle"
                        onPress={() => handleEdit(item.id)}
                        style={styles.editBtn}
                        textStyle={styles.editBtnText}
                        disabled={actioningId === item.id}
                      />
                      <PrimaryButton
                        title=" Sil"
                        onPress={() => handleDelete(item.id)}
                        style={styles.deleteBtn}
                        textStyle={styles.deleteBtnText}
                        disabled={actioningId === item.id}
                      />
                    </View>
                  )}

                  {user?.user_type !== 'donor' && (
                    <View style={styles.actionRow}>
                      {!item.is_reserved && !item.is_collected && (
                        <PrimaryButton
                          title="📌 Rezerve Et"
                          onPress={() => handleReserve(item.id)}
                          disabled={actioningId === item.id}
                          style={styles.reserveBtn}
                          textStyle={styles.reserveBtnText}
                        />
                      )}

                      {item.is_reserved && (item.reserved_by === user?.id || item.donor_id === user?.id) && !item.is_collected && (
                        <PrimaryButton
                          title="↩️ Rezervasyonu İptal"
                          onPress={() => handleCancelReserve(item.id)}
                          disabled={actioningId === item.id}
                          style={styles.cancelBtn}
                          textStyle={styles.cancelBtnText}
                        />
                      )}

                      {item.is_reserved && item.reserved_by !== user?.id && (
                        <ThemedText style={styles.reservedBadge}>Rezerve edildi</ThemedText>
                      )}

                      {/* Teslim alma özelliği kaldırıldı */}
                    </View>
                  )}
                </View>
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
  listHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  backButtonIcon: {
    color: '#333',
    fontSize: 22,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 0,
  },
  filterBtn: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 80,
  },
  filterBtnActive: {
    backgroundColor: '#4CAF50',
  },
  filterBtnText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '700',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#4CAF50',
  },
  cardWrapper: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  ownerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
    backgroundColor: '#eef7ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c5e1ff',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reserveBtn: {
    backgroundColor: '#2e7d32',
    minWidth: 140,
  },
  editBtn: {
    backgroundColor: '#1976d2',
    minWidth: 120,
  },
  cancelBtn: {
    backgroundColor: '#f57c00',
    minWidth: 160,
  },
  deleteBtn: {
    backgroundColor: '#c62828',
    minWidth: 120,
  },
  reserveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  reservedBadge: {
    fontSize: 12,
    color: '#c62828',
    fontWeight: '700',
    backgroundColor: '#ffebee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  collectedBadge: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '700',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  locationButton: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 0,
    backgroundColor: '#2196F3',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  loadingText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  infoBanner: {
    marginTop: 8,
    marginHorizontal: 0,
    marginBottom: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f7ed',
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBannerWarning: {
    backgroundColor: '#fff3e0',
    color: '#ef6c00',
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