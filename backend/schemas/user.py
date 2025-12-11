from pydantic import BaseModel, EmailStr, Field
from enum import Enum

# -------------------------
# Kullanıcı Tipleri Enum
# -------------------------
# Daha güvenli ve tip güvenliği sağlar
class UserType(str, Enum):
    donor = "donor"                   # Bağış yapan
    recipient = "recipient"           # Bağış alan
    shelter_volunteer = "shelter_volunteer"  # Barınak gönüllüsü



# KULLANICI KAYIT (INPUT)
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)  # Tam ad
    email: EmailStr                                               # Geçerli email
    password: str = Field(..., min_length=6, max_length=72)      # Bcrypt sınırı: 72 byte
    phone_number: str | None = None                               # Opsiyonel telefon
    user_type: UserType                                           # Enum tipinde kullanıcı türü



# KULLANICI LOGIN (INPUT)
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=72)  # Bcrypt sınırı



# WT TOKEN CEVABI
class TokenData(BaseModel):
    access_token: str
    token_type: str = "bearer"  # Tip her zaman "bearer"


# -------------------------
#  KULLANICI DETAY (OUTPUT)
# Şifre asla dönmez!
# -------------------------
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: str | None
    user_type: UserType
    created_at: str | None = None

    class Config:
        from_attributes = True  # ORM modeli Pydantic objesine dönüştürür


# Auth Response Formatları
class AuthRegisterResponse(BaseModel):
    status: str = "success"
    message: str
    data: UserResponse
    token: str


class AuthLoginResponse(BaseModel):
    status: str = "success"
    message: str
    data: UserResponse
    token: str


class AuthMeResponse(BaseModel):
    status: str = "success"
    data: UserResponse


class AuthLogoutResponse(BaseModel):
    status: str = "success"
    message: str