import type { 
  Terreiro, 
  TerreiroCreate, 
  GPSExtractResult, 
  ReverseGeocodeResult,
  UploadResult,
  AppStats 
} from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Terreiros CRUD
export async function listTerreiros(params?: { 
  skip?: number; 
  limit?: number; 
  nacao?: string;
  search?: string;
}): Promise<Terreiro[]> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params?.nacao) searchParams.set('nacao', params.nacao);
  if (params?.search) searchParams.set('search', params.search);
  
  return fetchAPI<Terreiro[]>(`/api/terreiros?${searchParams}`);
}

export async function getTerreiro(id: number): Promise<Terreiro> {
  return fetchAPI<Terreiro>(`/api/terreiros/${id}`);
}

export async function createTerreiro(terreiro: TerreiroCreate): Promise<Terreiro> {
  return fetchAPI<Terreiro>('/api/terreiros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(terreiro),
  });
}

export async function updateTerreiro(id: number, terreiro: Partial<TerreiroCreate>): Promise<Terreiro> {
  return fetchAPI<Terreiro>(`/api/terreiros/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(terreiro),
  });
}

export async function deleteTerreiro(id: number): Promise<void> {
  await fetchAPI(`/api/terreiros/${id}`, { method: 'DELETE' });
}

// Nearby search
export async function findNearby(
  lat: number, 
  lon: number, 
  radiusKm: number = 5
): Promise<(Terreiro & { distance_km: number })[]> {
  return fetchAPI<(Terreiro & { distance_km: number })[]>(
    `/api/terreiros/nearby?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`
  );
}

// GPS & Geocoding
export async function extractGPS(file: File): Promise<GPSExtractResult> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/api/extract-gps`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro ao extrair GPS' }));
    throw new Error(error.detail);
  }
  
  return response.json();
}

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  return fetchAPI<ReverseGeocodeResult>(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
}

// Photo upload
export async function uploadFoto(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/api/upload-foto`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro no upload' }));
    throw new Error(error.detail);
  }
  
  return response.json();
}

// Nações
export async function listNacoes(): Promise<string[]> {
  return fetchAPI<string[]>('/api/nacoes');
}

// Stats
export async function getStats(): Promise<AppStats> {
  return fetchAPI<AppStats>('/api/stats');
}

// Extract GPS locally (client-side fallback)
export async function extractGPSLocally(file: File): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        resolve(null);
        return;
      }
      
      try {
        const view = new DataView(buffer);
        
        // Check for JPEG
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(null);
          return;
        }
        
        let offset = 2;
        while (offset < view.byteLength) {
          const marker = view.getUint16(offset, false);
          
          if (marker === 0xFFD9) break; // EOI
          
          if ((marker & 0xFF00) !== 0xFF00) {
            offset++;
            continue;
          }
          
          // APP1 marker (EXIF)
          if (marker === 0xFFE1) {
            const segmentLength = view.getUint16(offset + 2, false);
            const exifOffset = offset + 4;
            
            // Check for EXIF header
            const exifHeader = getString(view, exifOffset, 4);
            if (exifHeader === 'Exif') {
              const tiffOffset = exifOffset + 6;
              const isLittleEndian = view.getUint16(tiffOffset, false) === 0x4949;
              
              // Read IFD0 pointer
              const ifd0Offset = view.getUint32(tiffOffset + 4, isLittleEndian);
              const gpsInfo = readGPSInfo(view, tiffOffset, ifd0Offset, isLittleEndian);
              
              if (gpsInfo) {
                resolve(gpsInfo);
                return;
              }
            }
            
            offset += 2 + segmentLength;
          } else if (marker === 0xFFD8 || marker === 0xFFD9 || 
                     (marker & 0xFF00) === 0xFF00 && marker >= 0xFFD0 && marker <= 0xFFD9) {
            offset += 2;
          } else {
            const segmentLength = view.getUint16(offset + 2, false);
            offset += 2 + segmentLength;
          }
        }
        
        resolve(null);
      } catch {
        resolve(null);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function getString(view: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(view.getUint8(offset + i));
  }
  return str;
}

function readGPSInfo(
  view: DataView, 
  tiffStart: number, 
  ifdOffset: number, 
  littleEndian: boolean
): { latitude: number; longitude: number } | null {
  try {
    const numEntries = view.getUint16(tiffStart + ifdOffset, littleEndian);
    
    let gpsIFDPointer: number | null = null;
    
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
      const tag = view.getUint16(entryOffset, littleEndian);
      
      if (tag === 0x8825) { // GPSInfo tag
        gpsIFDPointer = view.getUint32(entryOffset + 8, littleEndian);
        break;
      }
    }
    
    if (gpsIFDPointer === null) return null;
    
    const gpsNumEntries = view.getUint16(tiffStart + gpsIFDPointer, littleEndian);
    let latRef: string | null = null;
    let latValues: number[] | null = null;
    let lonRef: string | null = null;
    let lonValues: number[] | null = null;
    
    for (let i = 0; i < gpsNumEntries; i++) {
      const entryOffset = tiffStart + gpsIFDPointer + 2 + i * 12;
      const tag = view.getUint16(entryOffset, littleEndian);
      
      if (tag === 1) { // GPSLatitudeRef
        latRef = getString(view, entryOffset + 8, 1);
      } else if (tag === 2) { // GPSLatitude
        const numComponents = view.getUint32(entryOffset + 4, littleEndian);
        const valueOffset = view.getUint32(entryOffset + 8, littleEndian);
        latValues = readRationalArray(view, tiffStart + valueOffset, numComponents, littleEndian);
      } else if (tag === 3) { // GPSLongitudeRef
        lonRef = getString(view, entryOffset + 8, 1);
      } else if (tag === 4) { // GPSLongitude
        const numComponents = view.getUint32(entryOffset + 4, littleEndian);
        const valueOffset = view.getUint32(entryOffset + 8, littleEndian);
        lonValues = readRationalArray(view, tiffStart + valueOffset, numComponents, littleEndian);
      }
    }
    
    if (latValues && lonValues && latRef && lonRef) {
      const latitude = (latValues[0] + latValues[1] / 60 + latValues[2] / 3600) * (latRef === 'N' ? 1 : -1);
      const longitude = (lonValues[0] + lonValues[1] / 60 + lonValues[2] / 3600) * (lonRef === 'E' ? 1 : -1);
      return { latitude, longitude };
    }
    
    return null;
  } catch {
    return null;
  }
}

function readRationalArray(
  view: DataView, 
  offset: number, 
  count: number, 
  littleEndian: boolean
): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const numerator = view.getUint32(offset + i * 8, littleEndian);
    const denominator = view.getUint32(offset + i * 8 + 4, littleEndian);
    values.push(denominator !== 0 ? numerator / denominator : 0);
  }
  return values;
}
