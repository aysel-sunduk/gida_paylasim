from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

FoodCategory = Literal["temiz yemek", "atık yemek"]

# BAĞIŞ OLUŞTURMA İSTEĞİ (INPUT)
class DonationCreate(BaseModel):
    title: str                        # Bağış başlığı
    description: str | None = None    # Açıklama (opsiyonel)
    category: FoodCategory            # Kategori: temiz yemek / atık yemek
    quantity: str | None = None       # Miktar bilgisi (opsiyonel)
    is_for_animals: bool = False      # Hayvanlar için mi?
    latitude: float                    # Konum: enlem
    longitude: float                   # Konum: boylam


# BAĞIŞ GÜNCELLEME İSTEĞİ (INPUT)
class DonationUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: FoodCategory | None = None
    quantity: str | None = None
    is_for_animals: bool | None = None
    is_reserved: bool | None = None
    is_collected: bool | None = None


# BAĞIŞ DETAYI (OUTPUT)
class DonationResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    category: str | None = None
    quantity: str | None = None
    is_for_animals: bool
    is_reserved: bool
    reserved_by: int | None = None
    is_collected: bool
    latitude: float
    longitude: float
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


# API Response Formatları
class DonationListResponse(BaseModel):
    data: list[DonationResponse]
    message: str


class DonationDetailResponse(BaseModel):
    data: DonationResponse
    message: str | None = None


class DonationCreateResponse(BaseModel):
    data: DonationResponse
    message: str | None = None
