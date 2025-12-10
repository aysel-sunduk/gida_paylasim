import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface User {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  user_type: 'donor' | 'recipient' | 'shelter_volunteer';
  created_at: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: User;
  token: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
  user_type: 'donor' | 'recipient' | 'shelter_volunteer';
}

export interface LoginData {
  email: string;
  password: string;
}

// Mock veriler (Backend hazır olunca kaldırılacak)
const MOCK_USERS: { [key: string]: RegisterData & { password: string; id: number } } = {
  'test@example.com': {
    id: 1,
    full_name: 'Test Kullanıcı',
    email: 'test@example.com',
    password: 'test123',
    phone_number: '+905551234567',
    user_type: 'donor',
  },
};

let NEXT_USER_ID = 2;

// Token ve kullanıcı verilerini localStorage'a kaydet
export async function saveAuthToken(token: string, user: User, rememberMe: boolean) {
  try {
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    if (rememberMe) {
      await AsyncStorage.setItem('remember_me', 'true');
    } else {
      await AsyncStorage.removeItem('remember_me');
    }
  } catch (error) {
    console.error('Token kaydedilirken hata:', error);
    throw error;
  }
}

// Token'ı localStorage'dan al
export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Token alınırken hata:', error);
    return null;
  }
}

// Kullanıcı verisini localStorage'dan al
export async function getStoredUser(): Promise<User | null> {
  try {
    const userJson = await AsyncStorage.getItem('auth_user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Kullanıcı alınırken hata:', error);
    return null;
  }
}

// "Beni Hatırla" durumunu kontrol et
export async function getRememberMeStatus(): Promise<boolean> {
  try {
    const rememberMe = await AsyncStorage.getItem('remember_me');
    return rememberMe === 'true';
  } catch (error) {
    return false;
  }
}

// Çıkış yap
export async function logout() {
  try {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    await AsyncStorage.removeItem('remember_me');
  } catch (error) {
    console.error('Çıkış yapılırken hata:', error);
    throw error;
  }
}

// KAYIT API ÇAĞRISI
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  // Gerçek API çağrısı (Backend hazır olunca):
  // const response = await axios.post('/auth/register', data);
  // return response.data;

  // Mock veri
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Email zaten var mı kontrol et
      if (MOCK_USERS[data.email]) {
        reject({
          status: 'error',
          message: 'Bu email zaten kayıtlı',
          code: 'EMAIL_ALREADY_EXISTS',
        });
        return;
      }

      // Yeni kullanıcı oluştur
      const newUser: User = {
        id: NEXT_USER_ID++,
        full_name: data.full_name,
        email: data.email,
        phone_number: data.phone_number,
        user_type: data.user_type,
        created_at: new Date().toISOString(),
      };

      // Mock storage'a ekle
      MOCK_USERS[data.email] = { ...data, id: newUser.id };

      const mockToken = `token_${newUser.id}_${Date.now()}`;

      resolve({
        status: 'success',
        message: 'Kullanıcı başarıyla oluşturuldu',
        data: newUser,
        token: mockToken,
      });
    }, 800); // 800ms gecikme (API gibi hisset)
  });
}

// GİRİŞ API ÇAĞRISI
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  // Gerçek API çağrısı (Backend hazır olunca):
  // const response = await axios.post('/auth/login', data);
  // return response.data;

  // Mock veri
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS[data.email];

      // Email veya şifre hatalı
      if (!user || user.password !== data.password) {
        reject({
          status: 'error',
          message: 'Email veya şifre hatalı',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      const mockToken = `token_${user.id}_${Date.now()}`;

      resolve({
        status: 'success',
        message: 'Giriş başarılı',
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          user_type: user.user_type,
          created_at: user.full_name ? new Date().toISOString() : '',
        },
        token: mockToken,
      });
    }, 800);
  });
}

// PROFIL KONTROL (Token ile)
export async function checkProfile(token: string): Promise<User> {
  // Gerçek API çağrısı:
  // const response = await axios.get('/auth/me', {
  //   headers: { Authorization: `Bearer ${token}` }
  // });
  // return response.data.data;

  // Mock veri
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!token || token.length === 0) {
        reject({
          status: 'error',
          message: 'Token geçersiz veya süresi dolmuş',
          code: 'INVALID_TOKEN',
        });
        return;
      }

      // Token'dan user ID'yi çıkart (basit mock)
      try {
        const parts = token.split('_');
        if (parts.length < 2) {
          throw new Error('Token formatı hatalı');
        }
        
        const userId = parseInt(parts[1], 10);
        
        if (isNaN(userId)) {
          throw new Error('User ID parse edilemedi');
        }

        const user = Object.values(MOCK_USERS).find(u => u.id === userId);

        if (!user) {
          reject({
            status: 'error',
            message: 'Kullanıcı bulunamadı',
            code: 'USER_NOT_FOUND',
          });
          return;
        }

        resolve({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          user_type: user.user_type,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        reject({
          status: 'error',
          message: 'Token doğrulama hatası: ' + String(error),
          code: 'TOKEN_ERROR',
        });
      }
    }, 300);
  });
}
