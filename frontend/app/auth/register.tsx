import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CustomInput } from '@/components/ui/custom-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuth } from '@/contexts/auth-context';
import { registerUser, saveAuthToken } from '@/services/auth-service';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const USER_TYPES = [
  { label: '🍞 Bağışçı', value: 'donor' as const },
  { label: '👥 Alıcı', value: 'recipient' as const },
  { label: '🏠 Barınağa Gönüllü', value: 'shelter_volunteer' as const },
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState<'donor' | 'recipient' | 'shelter_volunteer'>('donor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      setError('İsim-Soyisim gereklidir');
      return false;
    }
    if (fullName.trim().length < 3) {
      setError('İsim-Soyisim en az 3 karakter olmalıdır');
      return false;
    }
    if (!email.trim()) {
      setError('Email gereklidir');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Geçerli bir email adresi girin');
      return false;
    }
    if (!password) {
      setError('Şifre gereklidir');
      return false;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return false;
    }
    if (!phoneNumber.trim()) {
      setError('Telefon numarası gereklidir');
      return false;
    }
    if (!/^\+?[0-9\s\-\(\)]{10,}$/.test(phoneNumber.replace(/\s/g, ''))) {
      setError('Geçerli bir telefon numarası girin');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await registerUser({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        phone_number: phoneNumber.trim(),
        user_type: userType,
      });

      await saveAuthToken(response.token, response.data);

      await signIn(response.data, response.token);
      
      // Kayıt başarılı, ana ekrana git
      router.replace('/(tabs)/home');
    } catch (error: any) {
      setError(error.message || 'Kayıt olurken hata oluştu');
      console.error('Kayıt hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/image/arkaplan.png')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: 'transparent' }]}>
          <ScrollView
            contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            nestedScrollEnabled={false}
            scrollEventThrottle={16}
            alwaysBounceVertical={false}
            overScrollMode="never"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <ThemedText style={styles.logo}>🍽️</ThemedText>
              </View>
              <ThemedText type="title" style={styles.title}>
                Kayıt Ol
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Gıda Paylaşım topluluğuna katıl
              </ThemedText>
            </View>

            {/* Hata Mesajı */}
            {error && (
              <View style={styles.errorBanner}>
                <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
              </View>
            )}

            {/* İsim-Soyisim */}
            <CustomInput
              placeholder="İsim Soyisim"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setError(null);
              }}
              editable={!loading}
              autoCapitalize="words"
            />

            {/* Email */}
            <CustomInput
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Telefon */}
            <CustomInput
              placeholder="Telefon Numarası (05511234567)"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                setError(null);
              }}
              editable={!loading}
              keyboardType="phone-pad"
            />

            {/* Şifre */}
            <CustomInput
              placeholder="Şifre (min 6 karakter)"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry
              editable={!loading}
            />

            {/* Şifre Onayla */}
            <CustomInput
              placeholder="Şifreyi Onayla"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              secureTextEntry
              editable={!loading}
            />

            {/* Kullanıcı Tipi Seçimi */}
            <ThemedText style={styles.label}>Kullanıcı Tipi Seç</ThemedText>
            <View style={styles.userTypeGrid}>
              {USER_TYPES.map((type, index) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setUserType(type.value)}
                  disabled={loading}
                  style={[
                    styles.userTypeButton,
                    index === 2 && styles.userTypeButtonFullWidth,
                    userType === type.value && styles.userTypeButtonActive,
                    loading && styles.userTypeButtonDisabled,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.userTypeButtonText,
                      userType === type.value && styles.userTypeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Kayıt Ol Butonu */}
            <PrimaryButton
              title={loading ? '⏳ Kaydediliyor...' : '✅ Kayıt Ol'}
              onPress={handleRegister}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
            />

            {/* Giriş Linki */}
            <View style={styles.loginContainer}>
              <ThemedText style={styles.loginText}>Zaten hesabınız var mı? </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/auth/login')}
                disabled={loading}
                style={styles.loginLinkButton}
              >
                <ThemedText
                  style={[styles.loginLinkText, loading && styles.linkDisabledText]}
                >
                  Giriş Yap
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Bilgi */}
            <View style={styles.infoBox}>
              <ThemedText style={styles.infoTitle}>ℹ️ Kullanıcı Türleri:</ThemedText>
              <ThemedText style={styles.infoText}>
                🍞 <ThemedText style={{ fontWeight: 'bold' }}>Bağışçı</ThemedText> - Gıda bağışı yapan kişi
              </ThemedText>
              <ThemedText style={styles.infoText}>
                👥 <ThemedText style={{ fontWeight: 'bold' }}>Alıcı</ThemedText> - Bağış alan kişi
              </ThemedText>
              <ThemedText style={styles.infoText}>
                🏠 <ThemedText style={{ fontWeight: 'bold' }}>Barınak Gönüllüsü</ThemedText> - Hayvan barınağı için
              </ThemedText>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  bgImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    paddingVertical: 20,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    fontSize: 52,
    textAlign: 'center',
  },
  backRow: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
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
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
    color: '#f2f2f2',
  },
  userTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
    width: '100%',
  },
  userTypeButton: {
    width: '48%',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minHeight: 50,
  },
  userTypeButtonFullWidth: {
    width: '100%',
    marginTop: 0,
  },
  userTypeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  userTypeButtonDisabled: {
    opacity: 0.5,
  },
  userTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  userTypeButtonTextActive: {
    color: '#FFF',
  },
  button: {
    marginTop: 0,
    marginBottom: 16,
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  loginLinkText: {
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 14,
  },
  linkDisabledText: {
    opacity: 0.6,
  },
  infoBox: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    lineHeight: 16,
  },
});
