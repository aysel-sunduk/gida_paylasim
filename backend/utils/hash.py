from passlib.context import CryptContext


#  Şifre Hashleme Ayarları
# -------------------------
# bcrypt algoritması kullanılıyor
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Şifreyi hashle
# -------------------------
# plain_password : Kullanıcının girdiği düz şifre
# return         : Hashlenmiş şifre (veritabanına kaydedilir)
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


#  Şifre doğrulama
# -------------------------
# plain_password  : Kullanıcının girdiği düz şifre
# hashed_password : Veritabanındaki hashlenmiş şifre
# return          : True/False
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
