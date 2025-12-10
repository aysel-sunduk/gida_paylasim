from passlib.context import CryptContext
from backend.models.user import User
from backend.config.database import SessionLocal


# Şifre Hashleme Ayarları
# bcrypt algoritması kullanılıyor
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



# Yeni kullanıcı oluştur
# db       : SQLAlchemy Session
# user_data: UserRegister gibi Pydantic input
def create_user(db, user_data):
    
    # Şifreyi hashle
    hashed_password = pwd_context.hash(user_data.password)

    # User nesnesini oluştur
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hashed_password,
        phone_number=user_data.phone_number,
        user_type=user_data.user_type
    )

    # Veritabanına ekle ve commit et
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # ORM objesini güncelle

    return new_user
