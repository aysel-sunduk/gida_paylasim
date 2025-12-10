# 🔐 Giriş-Kayıt Sistemi Dokümantasyonu

## 📋 **Genel Bakış**

Frontend'de tam bir Authentication (Kimlik Doğrulama) sistemi yazıldı:
- ✅ Kayıt sayfası (Register)
- ✅ Giriş sayfası (Login)
- ✅ "Beni Hatırla" özelliği
- ✅ Token tabanlı kimlik doğrulama
- ✅ Otomatik giriş (Beni Hatırla işaretli ise)
- ✅ Çıkış (Logout)

---

## 🎯 **Kullanıcı Akışı**

```
START
  ↓
AsyncStorage'dan token kontrol et
  ↓
  ├─ Token VAR + RememberMe işaretli
  │  ├─ Profil kontrol (checkProfile)
  │  ├─ Başarılı → Ana sayfa (tabs)
  │  └─ Başarısız → Giriş ekranı
  │
  ├─ Token YOK veya RememberMe işaretsiz
  │  └─ Giriş ekranı
  │
LOGIN EKRANI
  ├─ Email/Şifre gir
  ├─ Beni Hatırla (checkbox)
  └─ Giriş Yap → Ana sayfa
       ↓
  REGISTER EKRANI
  ├─ İsim, Email, Telefon, Şifre gir
  ├─ Kullanıcı tipi seç
  └─ Kayıt Ol → Ana sayfa
       ↓
    TABS (Home + Add Donation)
    ├─ Harita sekmesi
    ├─ Bağış Ekle sekmesi
    ├─ Çıkış butonu (header sağda)
    └─ Çıkış → Giriş ekranı
```

---

## 📁 **Oluşturulan Dosyalar**

### 1. **services/auth-service.ts**
API çağrılarını işler (şuan mock veri)

**Fonksiyonlar:**
- `registerUser(data)` - Kayıt API
- `loginUser(data)` - Giriş API
- `checkProfile(token)` - Profil kontrol (token doğrulama)
- `saveAuthToken(token, user, rememberMe)` - Token kaydet
- `getAuthToken()` - Token al
- `getStoredUser()` - Kullanıcı al
- `getRememberMeStatus()` - Beni hatırla durumu
- `logout()` - Çıkış yap

### 2. **contexts/auth-context.tsx**
Global auth state yönetimi (Context API)

**Kullanım:**
```tsx
const { user, token, isLoading, isSignedIn, signOut } = useAuth();
```

### 3. **app/auth/login.tsx**
Giriş ekranı

**Özellikler:**
- Email/Şifre giriş
- Beni Hatırla checkbox
- Test hesabı bilgisi
- Hata mesajları

### 4. **app/auth/register.tsx**
Kayıt ekranı

**Özellikler:**
- İsim-Soyisim
- Email
- Telefon
- Şifre (doğrulama ile)
- Kullanıcı tipi seçimi (3 tür)
- Validasyon

### 5. **app/_layout.tsx** (Güncellenmiş)
Root layout - Auth akışı kontrol

**Mantık:**
```tsx
if (isSignedIn) {
  // Tabs ekranlarını göster
} else {
  // Auth ekranlarını göster
}
```

### 6. **app/(tabs)/_layout.tsx** (Güncellenmiş)
Tab layout - Çıkış butonu eklendi

---

## 🔄 **Backend Endpoint'leri (Yapılması Gerekli)**

### 1. Kayıt - `POST /auth/register`

**Request:**
```json
{
  "full_name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "password": "sifre123",
  "phone_number": "+905551234567",
  "user_type": "donor"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Kullanıcı başarıyla oluşturuldu",
  "data": {
    "id": 1,
    "full_name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "phone_number": "+905551234567",
    "user_type": "donor",
    "created_at": "2024-12-09T10:30:00Z"
  },
  "token": "eyJhbGc..."
}
```

**Error (400/409):**
```json
{
  "status": "error",
  "message": "Bu email zaten kayıtlı",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

---

### 2. Giriş - `POST /auth/login`

**Request:**
```json
{
  "email": "ahmet@example.com",
  "password": "sifre123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Giriş başarılı",
  "data": {
    "id": 1,
    "full_name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "phone_number": "+905551234567",
    "user_type": "donor",
    "created_at": "2024-12-09T10:30:00Z"
  },
  "token": "eyJhbGc..."
}
```

**Error (401):**
```json
{
  "status": "error",
  "message": "Email veya şifre hatalı",
  "code": "INVALID_CREDENTIALS"
}
```

---

### 3. Profil Kontrol - `GET /auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "full_name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "phone_number": "+905551234567",
    "user_type": "donor",
    "created_at": "2024-12-09T10:30:00Z"
  }
}
```

**Error (401):**
```json
{
  "status": "error",
  "message": "Token geçersiz veya süresi dolmuş",
  "code": "INVALID_TOKEN"
}
```

---

## 🗄️ **Veritabanı - Users Tablosu**

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- ← Şifreler HASH'lanmalı!
    phone_number VARCHAR(20),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('donor', 'recipient', 'shelter_volunteer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Önemli:**
- ✅ `email` UNIQUE (aynı email 2 kez kaydı engelle)
- ✅ `password_hash` - Şifreler bcrypt ile hash'lanmalı
- ✅ `user_type` - 3 seçenek: donor, recipient, shelter_volunteer
- ❌ Konum tutulmaz (donations tablosunda var)

---

## 💾 **LocalStorage Yapısı**

Frontend'de şu bilgiler localStorage'da tutulur:

| Key | Örnek Değer | Açıklama |
|-----|-------------|---------|
| `auth_token` | `eyJhbGc...` | JWT token |
| `auth_user` | `{id:1, email:...}` | Kullanıcı bilgisi |
| `remember_me` | `true` | Beni hatırla işareti |

---

## 🧪 **Test Hesapları (Mock)**

### Test Kullanıcısı 1
```
Email: test@example.com
Şifre: test123
Tipi: Bağışçı
```

**Şifreyi değiştirmek için:**
`services/auth-service.ts` dosyasındaki `MOCK_USERS` objesini düzenle.

---

## 🔧 **Backend'den Kaldırılacak Mock Kodlar**

Frontend production'a gidince, şu mock kodları sil:

**services/auth-service.ts:**
```tsx
// ❌ Sil:
const MOCK_USERS = {...}
let NEXT_USER_ID = 2

// ✅ Koy (gerçek API):
const apiClient = axios.create({...})

export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
}

export async function checkProfile(token: string): Promise<User> {
  const response = await apiClient.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
}
```

---

## 🎨 **UI Özellikleri**

✅ **Responsive Design**
- SafeAreaInsets ile tüm cihazlara uyum
- Tablet/telefon uyumlu layout

✅ **Kullanıcı Dostu**
- Emoji ikonlar
- Renkli butonlar
- Hata banner'ları
- Form validasyon
- Loading states

✅ **Güvenlik (Frontend Tarafında)**
- Şifre doğrulama
- Email format kontrol
- Telefon format kontrol
- Token localStorage'da güvenli tutulur

---

## 🚀 **Çalıştırma**

```bash
cd frontend
npm install
npm start

# Web tarayıcı (en hızlı test)
# Yazı: w
```

**İlk açıldığında:**
1. Giriş ekranı görülecek
2. Test hesabı yazılı:
   - Email: test@example.com
   - Şifre: test123
3. "Beni Hatırla" işaretlenirse → Bir daha giriş yaptırmaz
4. Harita sekmesine gidebilecek

---

## ⚠️ **Yapılması Gerekenler**

### Backend Tarafında:
- [ ] JWT token generation
- [ ] Password hashing (bcrypt)
- [ ] Email validation
- [ ] Rate limiting (brute-force koruması)
- [ ] CORS konfigürasyonu
- [ ] Token refresh endpoint

### Frontend Tarafında:
- [ ] API_BASE_URL'i environment variable'dan al
- [ ] Mock kod production'da kaldır
- [ ] Token refresh logic (opsiyonel)
- [ ] Social login (opsiyonel)
- [ ] Password reset (opsiyonel)

---

## 📞 **Sorunlar?**

Mock veri test etmek için:
- Giriş ekranında yazılı test hesabı kullan
- "Kayıt Ol" ile yeni hesap oluştur (test)
- "Beni Hatırla" işaretle → Uygulamayı kapatıp açtığında direkt ana sayfaya gidecek

Başarılı! 🎉
