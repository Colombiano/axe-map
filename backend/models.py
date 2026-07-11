from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Terreiro(Base):
    __tablename__ = "terreiros"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False, index=True)
    nacao = Column(String(100), nullable=False)  # Ketu, Jeje, Angola, etc.
    descricao = Column(Text, nullable=True)
    historia = Column(Text, nullable=True)
    endereco = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    foto_url = Column(String(500), nullable=True)
    nome_ie = Column(String(200), nullable=True)  # Nome do Ilê/terreiro completo
    nome_mae_pai = Column(String(200), nullable=True)  # Nome da mãe/pai de santo
    telefone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    site = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
