from fastapi import FastAPI
from backend.routers import auth_router, donation_router

app = FastAPI()

# Yetkilendirme işlemleri
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])

# Bağış işlemleri
app.include_router(donation_router.router, prefix="/donations", tags=["Donations"])
