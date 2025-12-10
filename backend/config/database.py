# Gerekli kütüphaneleri içe aktarıyoruz
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# .env dosyasındaki ortam değişkenlerini yükle
load_dotenv()

# Veritabanı URL'sini ortam değişkenlerinden al
DATABASE_URL = os.getenv("DATABASE_URL")

# SQLAlchemy engine oluştur: Veritabanına bağlanmak için kullanılır
engine = create_engine(DATABASE_URL)

# Session sınıfını oluştur: Veritabanı işlemlerini yönetmek için
SessionLocal = sessionmaker(
    autocommit=False,  # İşlemler otomatik commit edilmez
    autoflush=False,   # Otomatik flush yapılmaz
    bind=engine        # Oluşturulan engine ile bağlantı kurulur
)

# Declarative base sınıfı: ORM modelleri bu sınıftan türetilir
Base = declarative_base()
