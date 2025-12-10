import AsyncStorage from '@react-native-async-storage/async-storage';

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

import { apiLogin, apiMe, apiRegister } from './api-service';

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

// KAYIT API ÇAĞRISI (gerçek endpoint)
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const response = await apiRegister(data);
  return {
    status: response.status || 'success',
    message: response.message || 'Kayıt başarılı',
    data: response.data,
    token: response.token,
  };
}

// GİRİŞ API ÇAĞRISI (gerçek endpoint)
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const response = await apiLogin(data);
  return {
    status: response.status || 'success',
    message: response.message || 'Giriş başarılı',
    data: response.data,
    token: response.token,
  };
}

// PROFIL KONTROL (Token ile)
export async function checkProfile(token: string): Promise<User> {
  const response = await apiMe(token);
  return response.data || response;
}
