from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.sql import func
from backend.config.database import Base

# User tablosu: Sistemdeki kullanıcıları temsil eder
class User(Base):
    __tablename__ = "users"

    # Birincil anahtar
    id = Column(Integer, primary_key=True, index=True)

    # Kullanıcı bilgileri
    full_name = Column(String(100), nullable=False)      # Tam adı
    email = Column(String(100), unique=True, nullable=False)  # E-posta (benzersiz)
    password_hash = Column(String(255), nullable=False)  # Şifre hash'i
    phone_number = Column(String(20), nullable=True)     # Telefon numarası (opsiyonel)
    user_type = Column(String(20), nullable=False)       # Kullanıcı türü (örn. admin, normal)

    # Zaman damgası
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())  # Oluşturulma zamanı
