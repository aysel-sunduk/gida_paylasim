import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CustomInput } from '@/components/ui/custom-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuth } from '@/contexts/auth-context';
import { loginUser, saveAuthToken } from '@/services/auth-service';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('test123');
  const [rememberMe, setRememberMe] = useState(false);
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

      await saveAuthToken(response.token, response.data, rememberMe);

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

        {/* Beni Hatırla */}
        <View style={styles.rememberMeContainer}>
          <CustomCheckbox
            value={rememberMe}
            onValueChange={setRememberMe}
            disabled={loading}
          />
          <ThemedText style={styles.rememberMeText}>
            Beni hatırla (otomatik giriş)
          </ThemedText>
        </View>

        {/* Giriş Butonu */}
        <PrimaryButton
          title={loading ? '⏳ Giriş yapılıyor...' : '✅ Giriş Yap'}
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

        {/* Test Bilgisi */}
        <View style={styles.testInfo}>
          <ThemedText style={styles.testLabel}>🔍 Test Hesabı:</ThemedText>
          <ThemedText style={styles.testValue}>Email: test@example.com</ThemedText>
          <ThemedText style={styles.testValue}>Şifre: test123</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// Checkbox Bileşeni
function CustomCheckbox({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      style={[
        styles.radioOuter,
        value && styles.radioOuterActive,
        disabled && styles.radioDisabled,
      ]}
    >
      {value && <View style={styles.radioInner} />}
    </Pressable>
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
    width: 100,
    height: 100,
    borderRadius: 50,
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
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#4CAF50',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  radioDisabled: {
    opacity: 0.5,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666',
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
    color: '#666',
  },
  signupLinkButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  signupLinkText: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  linkDisabledText: {
    opacity: 0.6,
  },
  testInfo: {
    marginTop: 32,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  testLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  testValue: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
