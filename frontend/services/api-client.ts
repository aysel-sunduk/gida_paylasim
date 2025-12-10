import axios from 'axios';
import { Platform } from 'react-native';

function normalizeBaseUrl(url?: string) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function pickBaseUrl() {
  const raw =
    normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL) ||
    normalizeBaseUrl(process.env.API_BASE_URL) ||
    '';

  // Android emülatörde 127.0.0.1/localhost yerine 10.0.2.2 kullan
  if (Platform.OS === 'android') {
    if (raw.includes('127.0.0.1') || raw.includes('localhost')) {
      return raw.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2');
    }
  }

  if (raw) return raw;

  // Varsayılan fallback: Android emülatör için 10.0.2.2, diğerleri için localhost
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://localhost:8000';
}

const API_BASE_URL = pickBaseUrl();
console.log('API_BASE_URL =>', API_BASE_URL);
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;

