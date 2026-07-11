from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import shutil
import os
import uuid

from database import engine, get_db
from models import Base, Terreiro
from schemas import (
    TerreiroCreate, TerreiroUpdate, TerreiroResponse,
    GPSExtractResponse, ReverseGeocodeResponse
)
from utils.gps import extract_gps_from_exif, extract_all_metadata
from utils.geocode import reverse_geocode, reverse_geocode_detailed

# Create tables
Base.metadata.create_all(bind=engine)

# Create uploads directory
os.makedirs("uploads/fotos", exist_ok=True)

app = FastAPI(
    title="Axé Map API",
    description="API para mapeamento colaborativo dos terreiros de Candomblé de Salvador",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def read_root():
    return {
        "message": "Axé Map API - Saravá!",
        "docs": "/docs",
        "version": "1.0.0"
    }


# ============== TERREIROS CRUD ==============

@app.get("/api/terreiros", response_model=List[TerreiroResponse])
def list_terreiros(
    skip: int = 0,
    limit: int = 100,
    nacao: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all terreiros with optional filtering."""
    query = db.query(Terreiro)
    
    if nacao:
        query = query.filter(Terreiro.nacao.ilike(f"%{nacao}%"))
    
    if search:
        query = query.filter(
            (Terreiro.nome.ilike(f"%{search}%")) |
            (Terreiro.descricao.ilike(f"%{search}%")) |
            (Terreiro.endereco.ilike(f"%{search}%"))
        )
    
    terreiros = query.offset(skip).limit(limit).all()
    return terreiros


@app.get("/api/terreiros/{terreiro_id}", response_model=TerreiroResponse)
def get_terreiro(terreiro_id: int, db: Session = Depends(get_db)):
    """Get a specific terreiro by ID."""
    terreiro = db.query(Terreiro).filter(Terreiro.id == terreiro_id).first()
    if not terreiro:
        raise HTTPException(status_code=404, detail="Terreiro não encontrado")
    return terreiro


@app.post("/api/terreiros", response_model=TerreiroResponse, status_code=201)
def create_terreiro(terreiro: TerreiroCreate, db: Session = Depends(get_db)):
    """Create a new terreiro."""
    db_terreiro = Terreiro(**terreiro.model_dump())
    db.add(db_terreiro)
    db.commit()
    db.refresh(db_terreiro)
    return db_terreiro


@app.put("/api/terreiros/{terreiro_id}", response_model=TerreiroResponse)
def update_terreiro(
    terreiro_id: int,
    terreiro_update: TerreiroUpdate,
    db: Session = Depends(get_db)
):
    """Update a terreiro."""
    db_terreiro = db.query(Terreiro).filter(Terreiro.id == terreiro_id).first()
    if not db_terreiro:
        raise HTTPException(status_code=404, detail="Terreiro não encontrado")
    
    update_data = terreiro_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_terreiro, field, value)
    
    db.commit()
    db.refresh(db_terreiro)
    return db_terreiro


@app.delete("/api/terreiros/{terreiro_id}")
def delete_terreiro(terreiro_id: int, db: Session = Depends(get_db)):
    """Delete a terreiro."""
    db_terreiro = db.query(Terreiro).filter(Terreiro.id == terreiro_id).first()
    if not db_terreiro:
        raise HTTPException(status_code=404, detail="Terreiro não encontrado")
    
    db.delete(db_terreiro)
    db.commit()
    return {"message": "Terreiro removido com sucesso"}


# ============== NEARBY SEARCH ==============

@app.get("/api/terreiros/nearby")
def find_nearby(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius_km: float = Query(5.0, description="Raio em quilômetros"),
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Find terreiros near a given coordinate using Haversine formula."""
    # Haversine formula
    distance_expr = (
        6371.0 * func.acos(
            func.cos(func.radians(lat)) *
            func.cos(func.radians(Terreiro.latitude)) *
            func.cos(func.radians(Terreiro.longitude) - func.radians(lon)) +
            func.sin(func.radians(lat)) *
            func.sin(func.radians(Terreiro.latitude))
        )
    )
    
    nearby = db.query(
        Terreiro,
        distance_expr.label("distance")
    ).filter(
        distance_expr <= radius_km
    ).order_by(
        distance_expr
    ).limit(limit).all()
    
    results = []
    for terreiro, distance in nearby:
        t_dict = TerreiroResponse.model_validate(terreiro).model_dump()
        t_dict["distance_km"] = round(distance, 2)
        results.append(t_dict)
    
    return results


# ============== GPS & GEOCODING ==============

@app.post("/api/extract-gps", response_model=GPSExtractResponse)
async def extract_gps(file: UploadFile = File(...)):
    """Extract GPS coordinates from an uploaded photo's EXIF data."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")
    
    try:
        contents = await file.read()
        
        # Extract GPS
        coords = extract_gps_from_exif(contents)
        
        if coords:
            lat, lon = coords
            # Get address via reverse geocoding
            endereco = await reverse_geocode(lat, lon)
            
            return GPSExtractResponse(
                latitude=round(lat, 6),
                longitude=round(lon, 6),
                endereco=endereco,
                success=True,
                message="Coordenadas GPS extraídas com sucesso"
            )
        else:
            return GPSExtractResponse(
                latitude=0,
                longitude=0,
                endereco=None,
                success=False,
                message="Nenhum dado GPS encontrado na imagem. Certifique-se de que o GPS está ativado na câmera."
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")


@app.get("/api/reverse-geocode", response_model=ReverseGeocodeResponse)
async def reverse_geocode_endpoint(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180)
):
    """Get address from coordinates."""
    result = await reverse_geocode_detailed(lat, lon)
    return ReverseGeocodeResponse(**result)


# ============== PHOTO UPLOAD ==============

@app.post("/api/upload-foto")
async def upload_foto(file: UploadFile = File(...)):
    """Upload a photo and return the URL."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")
    
    try:
        # Generate unique filename
        ext = os.path.splitext(file.filename or ".jpg")[1]
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join("uploads/fotos", filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "filename": filename,
            "url": f"/uploads/fotos/{filename}",
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload: {str(e)}")


# ============== NAÇÕES ==============

@app.get("/api/nacoes")
def list_nacoes(db: Session = Depends(get_db)):
    """List all distinct nações (traditions)."""
    nacoes = db.query(Terreiro.nacao).distinct().all()
    return [n[0] for n in nacoes if n[0]]


# ============== STATS ==============

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get general statistics."""
    total = db.query(Terreiro).count()
    nacoes = db.query(Terreiro.nacao).distinct().count()
    
    return {
        "total_terreiros": total,
        "total_nacoes": nacoes
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
