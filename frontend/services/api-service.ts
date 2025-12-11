import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api-client';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

export interface DonationCreate {
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  quantity?: string;
  expiration_date?: string;
  is_for_animals?: boolean;
  is_reserved?: boolean;
  is_collected?: boolean;
}

export interface Donation extends DonationCreate {
  id: number;
  created_at: string;
  updated_at?: string;
  is_reserved?: boolean;
  donor_id?: number | null;
  reserved_by?: number | null;
  is_collected?: boolean;
  is_for_animals?: boolean;
}

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },
  DONATIONS: {
    ROOT: '/donations',
    BY_ID: (id: number) => `/donations/${id}`,
    RESERVE: (id: number) => `/donations/${id}/reserve`,
    CANCEL_RESERVATION: (id: number) => `/donations/${id}/cancel_reservation`,
  },
};

async function authHeaders() {
  const token = await AsyncStorage.getItem('auth_token');
  console.log('authHeaders token =>', token);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// -------- AUTH --------
export async function apiLogin(payload: { email: string; password: string }) {
  const res = await apiClient.post(ENDPOINTS.AUTH.LOGIN, payload);
  return res.data;
}

export async function apiRegister(payload: {
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
  user_type: 'donor' | 'recipient' | 'shelter_volunteer';
}) {
  const res = await apiClient.post(ENDPOINTS.AUTH.REGISTER, payload);
  return res.data;
}

export async function apiMe(token: string) {
  const res = await apiClient.get(ENDPOINTS.AUTH.ME, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function apiLogout() {
  const headers = await authHeaders();
  const res = await apiClient.post(ENDPOINTS.AUTH.LOGOUT, null, { headers });
  return res.data;
}

// -------- DONATIONS --------
export async function getDonations(params?: {
  category?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}) {
  const headers = await authHeaders();
  const res = await apiClient.get<ApiResponse<Donation[]>>(ENDPOINTS.DONATIONS.ROOT, {
    params,
    headers,
  });
  return res.data?.data || res.data;
}

export async function getDonationById(id: number) {
  const res = await apiClient.get<ApiResponse<Donation>>(ENDPOINTS.DONATIONS.BY_ID(id));
  return res.data?.data || res.data;
}

export async function createDonation(payload: DonationCreate) {
  const headers = await authHeaders();
  const res = await apiClient.post<ApiResponse<Donation>>(ENDPOINTS.DONATIONS.ROOT, payload, { headers });
  return res.data?.data || res.data;
}

export async function updateDonation(id: number, payload: Partial<DonationCreate>) {
  const headers = await authHeaders();
  const res = await apiClient.patch<ApiResponse<Donation>>(ENDPOINTS.DONATIONS.BY_ID(id), payload, { headers });
  return res.data?.data || res.data;
}

export async function deleteDonation(id: number) {
  const headers = await authHeaders();
  const res = await apiClient.delete<ApiResponse<void>>(ENDPOINTS.DONATIONS.BY_ID(id), { headers });
  return res.data;
}

export async function reserveDonation(id: number) {
  const headers = await authHeaders();
  const res = await apiClient.post<ApiResponse<Donation>>(ENDPOINTS.DONATIONS.RESERVE(id), null, { headers });
  return res.data?.data || res.data;
}

export async function cancelReservation(id: number) {
  const headers = await authHeaders();
  const res = await apiClient.post<ApiResponse<Donation>>(ENDPOINTS.DONATIONS.CANCEL_RESERVATION(id), null, { headers });
  return res.data?.data || res.data;
}

export async function getDonationsByLocation(latitude: number, longitude: number, radiusKm: number = 10) {
  const headers = await authHeaders();
  const res = await apiClient.get<ApiResponse<Donation[]>>(ENDPOINTS.DONATIONS.ROOT, {
    params: { latitude, longitude, radius_km: radiusKm },
    headers,
  });
  return res.data?.data || res.data;
}
