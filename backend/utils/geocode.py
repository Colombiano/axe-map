import httpx
from typing import Optional


NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"


async def reverse_geocode(latitude: float, longitude: float) -> Optional[str]:
    """Get address from coordinates using Nominatim (OpenStreetMap)."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                NOMINATIM_URL,
                params={
                    "lat": latitude,
                    "lon": longitude,
                    "format": "json",
                    "addressdetails": 1,
                    "accept-language": "pt-BR"
                },
                headers={"User-Agent": "AxeMap/1.0 (axemap@example.com)"},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                address = data.get("display_name", "")
                return address
    except Exception:
        pass
    
    return None


async def reverse_geocode_detailed(latitude: float, longitude: float) -> dict:
    """Get detailed address components from coordinates."""
    result = {
        "endereco": "",
        "cidade": None,
        "estado": None,
        "pais": None,
        "bairro": None,
        "success": False
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                NOMINATIM_URL,
                params={
                    "lat": latitude,
                    "lon": longitude,
                    "format": "json",
                    "addressdetails": 1,
                    "accept-language": "pt-BR"
                },
                headers={"User-Agent": "AxeMap/1.0 (axemap@example.com)"},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                address = data.get("address", {})
                
                result["endereco"] = data.get("display_name", "")
                result["cidade"] = address.get("city") or address.get("town") or address.get("municipality")
                result["estado"] = address.get("state")
                result["pais"] = address.get("country")
                result["bairro"] = address.get("suburb") or address.get("neighbourhood")
                result["success"] = True
    except Exception:
        pass
    
    return result
