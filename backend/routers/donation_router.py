from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text, and_
from backend.schemas.donation import (
    DonationCreate,
    DonationUpdate,
    DonationResponse,
    DonationListResponse,
    DonationDetailResponse,
    DonationCreateResponse
)
from backend.models.donation import Donation
from backend.config.database import SessionLocal
from backend.utils.jwt import get_current_user
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

router = APIRouter()


# DB Bağımlılığı: Session üret
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Helper: Location'ı latitude/longitude olarak döndür
def get_location_coords(db: Session, donation_id: int):
    """PostGIS location'ı latitude/longitude olarak döndürür"""
    result = db.execute(
        text("""
            SELECT ST_Y(location) AS latitude, ST_X(location) AS longitude
            FROM donations WHERE id = :donation_id
        """),
        {"donation_id": donation_id}
    ).first()
    if result:
        return {"latitude": float(result.latitude), "longitude": float(result.longitude)}
    return {"latitude": 0.0, "longitude": 0.0}


# Helper: Donation objesini response formatına çevir
def donation_to_response(db: Session, donation: Donation) -> DonationResponse:
    """Donation objesini DonationResponse formatına çevirir"""
    coords = get_location_coords(db, donation.id)
    return DonationResponse(
        id=donation.id,
        title=donation.title,
        description=donation.description,
        category=donation.category,
        quantity=donation.quantity,
        is_for_animals=donation.is_for_animals,
        is_reserved=donation.is_reserved,
        is_collected=donation.is_collected,
        latitude=coords["latitude"],
        longitude=coords["longitude"],
        created_at=donation.created_at,
        updated_at=donation.updated_at
    )


# GET /donations — Bağışları listele (query params ile filtreleme)
@router.get("/", status_code=200, response_model=DonationListResponse)
def get_donations(
    category: str | None = Query(None, description="Kategori filtresi"),
    latitude: float | None = Query(None, description="Enlem (yakın bağışlar için)"),
    longitude: float | None = Query(None, description="Boylam (yakın bağışlar için)"),
    radius_km: float | None = Query(None, description="Arama yarıçapı (km)"),
    db: Session = Depends(get_db)
):
    # Konum bazlı filtreleme (latitude, longitude varsa PostGIS kullan)
    if latitude is not None and longitude is not None:
        radius_m = (radius_km * 1000) if radius_km else 5000  # Varsayılan 5 km
        
        # PostGIS ile yakın bağışları bul (category filtresi ile birlikte)
        if category:
            query_text = text("""
                SELECT id FROM donations
                WHERE category = :category
                AND ST_DWithin(
                    location,
                    ST_SetSRID(ST_Point(:lng, :lat), 4326),
                    :radius
                )
            """)
            nearby_ids = db.execute(
                query_text,
                {"lng": longitude, "lat": latitude, "radius": radius_m, "category": category}
            ).fetchall()
        else:
            query_text = text("""
                SELECT id FROM donations
                WHERE ST_DWithin(
                    location,
                    ST_SetSRID(ST_Point(:lng, :lat), 4326),
                    :radius
                )
            """)
            nearby_ids = db.execute(
                query_text,
                {"lng": longitude, "lat": latitude, "radius": radius_m}
            ).fetchall()
        
        nearby_id_list = [row[0] for row in nearby_ids]
        if not nearby_id_list:
            return DonationListResponse(data=[], message="Yakın bağış bulunamadı")
        
        # ID listesine göre filtrele
        query = db.query(Donation).filter(Donation.id.in_(nearby_id_list))
        
        # Kategori filtresi zaten SQL'de uygulandı, burada tekrar uygulamaya gerek yok
    else:
        # Konum filtresi yoksa normal SQLAlchemy query kullan
        query = db.query(Donation)
        
        # Kategori filtresi
        if category:
            query = query.filter(Donation.category == category)
    
    # Tüm bağışları al
    donations = query.all()
    
    # Response formatına çevir
    results = [donation_to_response(db, d) for d in donations]
    
    return DonationListResponse(
        data=results,
        message=f"{len(results)} bağış bulundu"
    )


# GET /donations/:id — Tekil bağış detayı
@router.get("/{donation_id}", status_code=200, response_model=DonationDetailResponse)
def get_donation_by_id(donation_id: int, db: Session = Depends(get_db)):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    
    if not donation:
        raise HTTPException(
            status_code=404,
            detail={"status": "error", "message": "Bağış bulunamadı."}
        )
    
    return DonationDetailResponse(
        data=donation_to_response(db, donation),
        message="Bağış detayları"
    )


# POST /donations — Yeni bağış oluştur (Bearer token gerekli, donor olmalı)
@router.post("/", status_code=201, response_model=DonationCreateResponse)
def create_donation(
    data: DonationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Kullanıcı tipi kontrolü (opsiyonel - sadece donor kontrolü yapılabilir)
    # Şu an herkes bağış oluşturabilir, gerekirse kontrol eklenebilir
    
    # Kullanıcının gönderdiği longitude ve latitude'i Point objesine çevir
    point = from_shape(Point(data.longitude, data.latitude), srid=4326)
    
    # Donation nesnesini oluştur
    donation = Donation(
        donor_id=current_user["user_id"],
        title=data.title,
        description=data.description,
        category=data.category,
        quantity=data.quantity,
        is_for_animals=data.is_for_animals,
        location=point
    )
    
    # DB'ye ekle ve commit et
    db.add(donation)
    db.commit()
    db.refresh(donation)
    
    return DonationCreateResponse(
        data=donation_to_response(db, donation),
        message="Bağış başarıyla oluşturuldu"
    )


# PATCH /donations/:id — Bağışı güncelle (opsiyonel)
@router.patch("/{donation_id}", status_code=200, response_model=DonationDetailResponse)
def update_donation(
    donation_id: int,
    data: DonationUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    
    if not donation:
        raise HTTPException(
            status_code=404,
            detail={"status": "error", "message": "Bağış bulunamadı."}
        )
    
    # Sadece bağışı oluşturan kullanıcı güncelleyebilir
    if donation.donor_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail={"status": "error", "message": "Bu bağışı sadece oluşturan kullanıcı güncelleyebilir."}
        )
    
    # Güncelleme alanları
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(donation, field, value)
    
    db.commit()
    db.refresh(donation)
    
    return DonationDetailResponse(
        data=donation_to_response(db, donation),
        message="Bağış başarıyla güncellendi"
    )


# DELETE /donations/:id — Bağışı sil (opsiyonel)
@router.delete("/{donation_id}", status_code=204)
def delete_donation(
    donation_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    
    if not donation:
        raise HTTPException(
            status_code=404,
            detail={"status": "error", "message": "Bağış bulunamadı."}
        )
    
    # Sadece bağışı oluşturan kullanıcı silebilir
    if donation.donor_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail={"status": "error", "message": "Bu bağışı sadece oluşturan kullanıcı silebilir."}
        )
    
    db.delete(donation)
    db.commit()
    
    return None
