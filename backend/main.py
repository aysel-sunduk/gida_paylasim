from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import auth_router, donation_router

app = FastAPI()

# CORS: allow Expo/React Native dev clients (adjust origins for prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # set explicit domains in production
    allow_credentials=False,  # leave False while using bearer tokens
    allow_methods=["*"],
    allow_headers=["*"],
)

# Yetkilendirme işlemleri
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])

# Bağış işlemleri
app.include_router(donation_router.router, prefix="/donations", tags=["Donations"])
