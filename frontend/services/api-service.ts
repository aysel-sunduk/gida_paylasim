// import axios from 'axios';

// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

export interface DonationCreate {
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  quantity?: string;
  expiration_date?: string;
}

export interface Donation extends DonationCreate {
  id: number;
  created_at: string;
  status: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

// Mock veri - GEÇICI TEST VERİSİ
const MOCK_DONATIONS: Donation[] = [
  {
    id: 1,
    title: 'Günlük Ekmek',
    description: 'Taze ve sağlıklı günlük ekmek',
    category: 'Gıda',
    quantity: '10 adet',
    latitude: 41.0082,
    longitude: 28.9784,
    created_at: '2024-12-09',
    status: 'aktif',
  },
  {
    id: 2,
    title: 'Kış Ceketi',
    description: 'Giyilmiş kış ceketi, iyi durumda',
    category: 'Giyim',
    latitude: 41.0150,
    longitude: 28.9750,
    created_at: '2024-12-08',
    status: 'aktif',
  },
  {
    id: 3,
    title: 'Türkçe Romanı',
    description: 'Ödüllü Türk yazarın romanı',
    category: 'Kitap',
    latitude: 41.0050,
    longitude: 28.9850,
    created_at: '2024-12-07',
    status: 'aktif',
  },
  {
    id: 4,
    title: 'Sandalye',
    description: 'Ahşap sandalye, sağlam ve temiz',
    category: 'Ev Eşyası',
    latitude: 41.0200,
    longitude: 28.9600,
    created_at: '2024-12-06',
    status: 'aktif',
  },
  {
    id: 5,
    title: 'Çay Seti',
    description: 'Porselenli, 6 kişilik çay seti',
    category: 'Ev Eşyası',
    latitude: 41.0100,
    longitude: 28.9900,
    created_at: '2024-12-05',
    status: 'aktif',
  },
];

// Bağışları Listele (MOCK)
export async function getDonations(): Promise<Donation[]> {
  // Gerçek API çağrısı (backend hazır olunca):
  // const response = await apiClient.get<ApiResponse<Donation[]>>('/donations');
  // return response.data.data;

  // Şimdilik mock veri döndür
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_DONATIONS);
    }, 500); // 500ms gecikme ekle (gerçek API gibi hisset)
  });
}

// Belirli Bağış Detayları (MOCK)
export async function getDonationById(id: number): Promise<Donation> {
  // Gerçek API çağrısı (backend hazır olunca):
  // const response = await apiClient.get<ApiResponse<Donation>>(`/donations/${id}`);
  // return response.data.data;

  return new Promise((resolve, reject) => {
    const donation = MOCK_DONATIONS.find(d => d.id === id);
    if (donation) {
      setTimeout(() => resolve(donation), 300);
    } else {
      reject(new Error('Bağış bulunamadı'));
    }
  });
}

// Yeni Bağış Oluştur (MOCK)
export async function createDonation(donation: DonationCreate): Promise<Donation> {
  // Gerçek API çağrısı (backend hazır olunca):
  // const response = await apiClient.post<ApiResponse<Donation>>('/donations', donation);
  // return response.data.data;

  return new Promise((resolve) => {
    const newDonation: Donation = {
      ...donation,
      id: Math.max(...MOCK_DONATIONS.map(d => d.id), 0) + 1,
      created_at: new Date().toISOString().split('T')[0],
      status: 'aktif',
    };
    MOCK_DONATIONS.push(newDonation);
    setTimeout(() => resolve(newDonation), 500);
  });
}

// Bağış Güncelle (MOCK)
export async function updateDonation(id: number, donationUpdate: Partial<DonationCreate>): Promise<Donation> {
  // Gerçek API çağrısı (backend hazır olunca):
  // const response = await apiClient.put<ApiResponse<Donation>>(`/donations/${id}`, donationUpdate);
  // return response.data.data;

  return new Promise((resolve, reject) => {
    const index = MOCK_DONATIONS.findIndex(d => d.id === id);
    if (index !== -1) {
      MOCK_DONATIONS[index] = { ...MOCK_DONATIONS[index], ...donationUpdate };
      setTimeout(() => resolve(MOCK_DONATIONS[index]), 300);
    } else {
      reject(new Error('Bağış bulunamadı'));
    }
  });
}

// Bağış Sil (MOCK)
export async function deleteDonation(id: number): Promise<void> {
  // Gerçek API çağrısı (backend hazır olunca):
  // await apiClient.delete(`/donations/${id}`);

  return new Promise((resolve, reject) => {
    const index = MOCK_DONATIONS.findIndex(d => d.id === id);
    if (index !== -1) {
      MOCK_DONATIONS.splice(index, 1);
      setTimeout(() => resolve(), 300);
    } else {
      reject(new Error('Bağış bulunamadı'));
    }
  });
}

// Konuma Göre Bağışları Filtrele (MOCK)
export async function getDonationsByLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<Donation[]> {
  // Gerçek API çağrısı (backend hazır olunca):
  // const response = await apiClient.get<ApiResponse<Donation[]>>('/donations/search', {
  //   params: { latitude, longitude, radius_km: radiusKm },
  // });
  // return response.data.data;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_DONATIONS); // Basit versiyon, filtreleme yapabilirsin
    }, 400);
  });
}

// Kategori Bazlı Filtrele (MOCK)
export async function getDonationsByCategory(category: string): Promise<Donation[]> {
  // Gerçek API çağrısı (backend hazır olunca):
  // const response = await apiClient.get<ApiResponse<Donation[]>>('/donations/category', {
  //   params: { category },
  // });
  // return response.data.data;

  return new Promise((resolve) => {
    const filtered = MOCK_DONATIONS.filter(d => d.category === category);
    setTimeout(() => resolve(filtered), 300);
  });
}
