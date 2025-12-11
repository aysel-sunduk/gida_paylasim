import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CustomInput } from '@/components/ui/custom-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuth } from '@/contexts/auth-context';
import { loginUser, saveAuthToken } from '@/services/auth-service';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Email gereklidir');
      return;
    }
    if (!password) {
      setError('Şifre gereklidir');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({ email: email.trim(), password });

      await saveAuthToken(response.token, response.data);

      await signIn(response.data, response.token);
      
      // Giriş başarılı, ana ekrana git
      router.replace('/(tabs)/home');
    } catch (error: any) {
      setError(error.message || 'Giriş yapılırken hata oluştu');
      console.error('Giriş hatası:', error);
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
            scrollEnabled={true}
          >
            {/* Header */}
            <View style={styles.header}>
          <View style={styles.logoContainer}>
          <ThemedText style={styles.logo}>🍽️</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            Gıda Paylaşım
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Giriş Yap
          </ThemedText>
            </View>

            {/* Hata Mesajı */}
            {error && (
              <View style={styles.errorBanner}>
                <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
              </View>
            )}

            {/* Email */}
            <ThemedText style={styles.fieldLabel}>Email</ThemedText>
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

            {/* Şifre */}
            <ThemedText style={styles.fieldLabel}>Şifre</ThemedText>
            <CustomInput
              placeholder="Şifre"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry
              editable={!loading}
            />

            {/* Giriş Butonu */}
            <PrimaryButton
              title={loading ? '⏳ Giriş yapılıyor...' : ' Giriş Yap'}
              onPress={handleLogin}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
            />

            {/* Kayıt Ol Linki */}
            <View style={styles.signupContainer}>
              <ThemedText style={styles.signupText}>Hesabınız yok mu? </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/auth/register')}
                disabled={loading}
                style={styles.signupLinkButton}
              >
                <ThemedText style={[styles.signupLinkText, loading && styles.linkDisabledText]}>
                  Kayıt Ol
                </ThemedText>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </ThemedView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.0)',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  backRow: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#4CAF50',
    fontWeight: '700',
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
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    color: '#f2f2f2',
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
  button: {
    marginTop: 24,
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  signupText: {
    fontSize: 14,
    color: '#f2f2f2',
  },
  signupLinkButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  signupLinkText: {
    color: '#d8ffd8',
    fontWeight: '700',
  },
  linkDisabledText: {
    opacity: 0.6,
  },
});
