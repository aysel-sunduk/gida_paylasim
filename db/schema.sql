-- 1. KULLANICILAR TABLOSU (users)
-- (Basit bir kullanıcı kaydı ve tipi için)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('donor', 'recipient', 'shelter_volunteer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. GIDA BAĞIŞLARI TABLOSU (donations)
-- (PostGIS'in asıl kullanılacağı tablo)
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER REFERENCES users(id),         -- Hangi kullanıcı bağışladı?
    reserved_by INTEGER REFERENCES users(id),      -- Rezervasyonu yapan kullanıcı
    title VARCHAR(150) NOT NULL,                  -- Örneğin: "3 kg Domates", "Kafe Artık Yemekleri"
    description TEXT,                             -- Detaylı açıklama
    category VARCHAR(50),                         -- Kategori (Gıda, Giyim, vb.)
    quantity VARCHAR(50),                         -- Miktar (ör: "5 porsiyon", "1 kutu", "Bilinmiyor")
    is_for_animals BOOLEAN DEFAULT FALSE,         -- Hayvan barınağı için mi?
    is_reserved BOOLEAN DEFAULT FALSE,            -- İlan rezerve edildi mi?
    is_collected BOOLEAN DEFAULT FALSE,           -- İlan teslim edildi mi?
    
    -- *** POSTGIS KONUM SÜTUNU ***
    -- SRID 4326 (WGS 84 GPS'in kullandığı standart)
    location GEOMETRY(Point, 4326) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Eğer tablo zaten varsa, category kolonunu eklemek için:
-- ALTER TABLE donations ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- 3. KONUM SORGULARINI HIZLANDIRMAK İÇİN İNDEKSLER
-- GIST indeksi, PostGIS coğrafi sorgularını (ST_DWithin gibi) çok hızlı yapar.
CREATE INDEX idx_donations_location ON donations USING GIST (location);