import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base, get_db
from main import app

# In-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Axé Map API" in data["message"]


def test_create_terreiro():
    response = client.post("/api/terreiros", json={
        "nome": "Ilê Axé Opô Afonjá",
        "nacao": "Ketu",
        "descricao": "Um dos mais importantes terreiros de Candomblé Ketu",
        "latitude": -12.9996,
        "longitude": -38.5098,
        "endereco": "Rua Afonjá, São Gonçalo do Retiro, Salvador, BA"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["nome"] == "Ilê Axé Opô Afonjá"
    assert data["nacao"] == "Ketu"
    assert data["id"] is not None


def test_list_terreiros():
    response = client.get("/api/terreiros")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_terreiro():
    # Create first
    response = client.post("/api/terreiros", json={
        "nome": "Terreiro Teste",
        "nacao": "Angola",
        "latitude": -13.0,
        "longitude": -38.5
    })
    created = response.json()
    
    # Get
    response = client.get(f"/api/terreiros/{created['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Terreiro Teste"


def test_filter_by_nacao():
    response = client.get("/api/terreiros?nacao=Ketu")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_search_terreiros():
    response = client.get("/api/terreiros?search=Axé")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_update_terreiro():
    # Create
    response = client.post("/api/terreiros", json={
        "nome": "Terreiro Update",
        "nacao": "Jeje",
        "latitude": -13.0,
        "longitude": -38.5
    })
    created = response.json()
    
    # Update
    response = client.put(f"/api/terreiros/{created['id']}", json={
        "nome": "Terreiro Updated Name"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Terreiro Updated Name"


def test_delete_terreiro():
    # Create
    response = client.post("/api/terreiros", json={
        "nome": "Terreiro Delete",
        "nacao": "Ketu",
        "latitude": -13.0,
        "longitude": -38.5
    })
    created = response.json()
    
    # Delete
    response = client.delete(f"/api/terreiros/{created['id']}")
    assert response.status_code == 200
    
    # Verify
    response = client.get(f"/api/terreiros/{created['id']}")
    assert response.status_code == 404


def test_nacoes_endpoint():
    response = client.get("/api/nacoes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_stats_endpoint():
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_terreiros" in data
    assert "total_nacoes" in data


def test_get_nonexistent_terreiro():
    response = client.get("/api/terreiros/99999")
    assert response.status_code == 404


def test_create_terreiro_invalid_data():
    response = client.post("/api/terreiros", json={
        "nome": "",
        "nacao": "Ketu",
        "latitude": -13.0,
        "longitude": -38.5
    })
    assert response.status_code == 422


def test_nearby_endpoint():
    response = client.get("/api/terreiros/nearby?lat=-13.0&lon=-38.5&radius_km=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_reverse_geocode():
    response = client.get("/api/reverse-geocode?lat=-12.9996&lon=-38.5098")
    assert response.status_code == 200
    data = response.json()
    assert "endereco" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
