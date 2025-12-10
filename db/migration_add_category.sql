-- Donations tablosuna category kolonu ekleme
-- Eğer tablo zaten varsa bu migration'ı çalıştırın

ALTER TABLE donations ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Mevcut kayıtlar için varsayılan değer atanabilir (opsiyonel)
-- UPDATE donations SET category = 'Gıda' WHERE category IS NULL;

