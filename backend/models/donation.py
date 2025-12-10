from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from backend.config.database import Base

# Donation tablosu: Bağış ilanlarını temsil eder
class Donation(Base):
    __tablename__ = "donations"

    # Birincil anahtar
    id = Column(Integer, primary_key=True, index=True)

    # Bağışı yapan kullanıcı (isteğe bağlı)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # İlanı rezerve eden kullanıcı (isteğe bağlı, yeni eklenen alan)
    reserved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Temel bilgiler
    title = Column(String(150), nullable=False)        # Bağış başlığı
    description = Column(String, nullable=True)       # Bağış açıklaması
    category = Column(String(50), nullable=True)      # Kategori (Gıda, Giyim, vb.)
    quantity = Column(String(50), nullable=True)      # Miktar bilgisi
    is_for_animals = Column(Boolean, default=False)  # Hayvanlar için mi?

    # Operasyon durumları
    is_reserved = Column(Boolean, default=False)     # Rezerve edildi mi?
    is_collected = Column(Boolean, default=False)    # Toplandı mı?

    # Konum bilgisi (PostGIS Point)
    location = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    # Zaman damgaları
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())  # Oluşturulma zamanı
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now()  # Güncellenme zamanı
    )
