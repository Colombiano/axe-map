from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TerreiroBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    nacao: str = Field(..., min_length=1, max_length=100)
    descricao: Optional[str] = None
    historia: Optional[str] = None
    endereco: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    nome_ie: Optional[str] = None
    nome_mae_pai: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    site: Optional[str] = None


class TerreiroCreate(TerreiroBase):
    foto_url: Optional[str] = None


class TerreiroUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=200)
    nacao: Optional[str] = Field(None, min_length=1, max_length=100)
    descricao: Optional[str] = None
    historia: Optional[str] = None
    endereco: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    foto_url: Optional[str] = None
    nome_ie: Optional[str] = None
    nome_mae_pai: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    site: Optional[str] = None


class TerreiroResponse(TerreiroBase):
    id: int
    foto_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GPSExtractResponse(BaseModel):
    latitude: float
    longitude: float
    endereco: Optional[str] = None
    success: bool
    message: str


class ReverseGeocodeResponse(BaseModel):
    endereco: str
    cidade: Optional[str] = None
    estado: Optional[str] = None
    pais: Optional[str] = None
    success: bool
