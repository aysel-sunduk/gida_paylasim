from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.config.database import SessionLocal
from backend.models.user import User
from backend.schemas.user import (
    UserRegister, 
    UserLogin, 
    UserResponse,
    AuthRegisterResponse,
    AuthLoginResponse,
    AuthMeResponse,
    UserType
)
from backend.utils.hash import hash_password, verify_password
from backend.utils.jwt import create_access_token, get_current_user

router = APIRouter()


# DB Bağımlılığı: Session oluştur
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# REGISTER — Yeni kullanıcı oluştur
@router.post("/register", status_code=201, response_model=AuthRegisterResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Email daha önce kullanılmış mı kontrol et
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail={"status": "error", "message": "Bu email zaten kayıtlı."}
        )

    # Şifreyi hashle
    hashed_pw = hash_password(user_data.password)

    # Yeni kullanıcı nesnesi oluştur
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hashed_pw,
        phone_number=user_data.phone_number,
        user_type=user_data.user_type.value
    )

    # Veritabanına ekle ve commit et
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # JWT token oluştur
    access_token = create_access_token({"sub": str(new_user.id)})

    # Response formatına uygun döndür
    return AuthRegisterResponse(
        status="success",
        message="Kullanıcı başarıyla kaydedildi",
        data=UserResponse(
            id=new_user.id,
            full_name=new_user.full_name,
            email=new_user.email,
            phone_number=new_user.phone_number,
            user_type=UserType(new_user.user_type),
            created_at=new_user.created_at.isoformat() if new_user.created_at else None
        ),
        token=access_token
    )


# LOGIN — JWT Token oluştur
@router.post("/login", status_code=200, response_model=AuthLoginResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # Email ile kullanıcıyı bul
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail={"status": "error", "message": "Email bulunamadı."}
        )

    # Şifreyi doğrula
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail={"status": "error", "message": "Şifre yanlış."}
        )

    # JWT token oluştur
    access_token = create_access_token({"sub": str(user.id)})

    # Response formatına uygun döndür
    return AuthLoginResponse(
        status="success",
        message="Giriş başarılı",
        data=UserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone_number=user.phone_number,
            user_type=UserType(user.user_type),
            created_at=user.created_at.isoformat() if user.created_at else None
        ),
        token=access_token
    )


# ME — Mevcut kullanıcı bilgilerini getir
@router.get("/me", status_code=200, response_model=AuthMeResponse)
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Token'dan gelen user_id ile kullanıcıyı bul
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail={"status": "error", "message": "Kullanıcı bulunamadı."}
        )

    return AuthMeResponse(
        status="success",
        data=UserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone_number=user.phone_number,
            user_type=UserType(user.user_type),
            created_at=user.created_at.isoformat() if user.created_at else None
        )
    )

