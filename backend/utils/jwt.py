from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials 
from sqlalchemy.orm import Session
from backend.config.database import SessionLocal
from backend.models.user import User
import os
from dotenv import load_dotenv

# Ortam değişkenlerini yükle
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
# GEÇİCİ: Konsola anahtarı yazdırır (production'da kaldır)
print(f"DEBUG: Yüklenen Gizli Anahtar: {SECRET_KEY}")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))


#  HTTP Bearer şeması (Swagger UI uyumlu)
oauth2_scheme = HTTPBearer()



# JWT TOKEN OLUŞTURMA
# -------------------------
# data: dict, içinde genellikle {"sub": user_id}
# expires_delta: opsiyonel süre (timedelta)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)



#  DB Bağımlılığı: Session oluştur

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# DB'den kullanıcı bul
def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()



# TOKEN'DAN MEVCUT KULLANICIYI AL
def get_current_user(
    token_auth: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    # Hata durumunda fırlatılacak exception
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"status": "error", "message": "Token geçersiz veya süresi dolmuş."},
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # HTTPAuthorizationCredentials.credentials -> sadece token stringi
    token = token_auth.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Login sırasında "sub": user.id olarak gönderilmişti
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except JWTError:
        raise credentials_exception

    # Kullanıcıyı veritabanından çek
    user = get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception

    # Donation router vs. için dict formatında dön
    return {
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "user_type": user.user_type
    }
