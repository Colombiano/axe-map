import exifread
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import io
from typing import Optional, Tuple


def convert_to_degrees(value) -> float:
    """Convert GPS coordinates to degrees in float format."""
    d = float(value.values[0].num) / float(value.values[0].den)
    m = float(value.values[1].num) / float(value.values[1].den)
    s = float(value.values[2].num) / float(value.values[2].den)
    return d + (m / 60.0) + (s / 3600.0)


def extract_gps_from_exif(file_bytes: bytes) -> Optional[Tuple[float, float]]:
    """Extract GPS coordinates from image EXIF data using exifread."""
    try:
        tags = exifread.process_file(io.BytesIO(file_bytes), details=False)
        
        gps_latitude = tags.get('GPS GPSLatitude')
        gps_latitude_ref = tags.get('GPS GPSLatitudeRef')
        gps_longitude = tags.get('GPS GPSLongitude')
        gps_longitude_ref = tags.get('GPS GPSLongitudeRef')
        
        if gps_latitude and gps_longitude and gps_latitude_ref and gps_longitude_ref:
            lat = convert_to_degrees(gps_latitude)
            if gps_latitude_ref.values[0] != 'N':
                lat = -lat
                
            lon = convert_to_degrees(gps_longitude)
            if gps_longitude_ref.values[0] != 'E':
                lon = -lon
                
            return (lat, lon)
    except Exception:
        pass
    
    # Fallback to PIL
    try:
        image = Image.open(io.BytesIO(file_bytes))
        exif = image._getexif()
        if exif:
            gps_info = {}
            for tag_id, value in exif.items():
                tag = TAGS.get(tag_id, tag_id)
                if tag == "GPSInfo":
                    for gps_tag_id, gps_value in value.items():
                        gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                        gps_info[gps_tag] = gps_value
            
            if "GPSLatitude" in gps_info and "GPSLongitude" in gps_info:
                lat = convert_pil_gps(gps_info["GPSLatitude"])
                if gps_info.get("GPSLatitudeRef") != "N":
                    lat = -lat
                    
                lon = convert_pil_gps(gps_info["GPSLongitude"])
                if gps_info.get("GPSLongitudeRef") != "E":
                    lon = -lon
                    
                return (lat, lon)
    except Exception:
        pass
    
    return None


def convert_pil_gps(value) -> float:
    """Convert PIL GPS tuple to degrees."""
    d, m, s = value
    return float(d) + float(m) / 60.0 + float(s) / 3600.0


def extract_all_metadata(file_bytes: bytes) -> dict:
    """Extract all EXIF metadata from image."""
    metadata = {}
    try:
        tags = exifread.process_file(io.BytesIO(file_bytes), details=False)
        for tag_name, tag_value in tags.items():
            if tag_name not in ['JPEGThumbnail', 'TIFFThumbnail']:
                metadata[tag_name] = str(tag_value)
    except Exception:
        pass
    return metadata
