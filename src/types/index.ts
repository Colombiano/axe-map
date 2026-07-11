export interface Terreiro {
  id: number;
  nome: string;
  nacao: string;
  descricao?: string;
  historia?: string;
  endereco?: string;
  latitude: number;
  longitude: number;
  foto_url?: string;
  nome_ie?: string;
  nome_mae_pai?: string;
  telefone?: string;
  email?: string;
  site?: string;
  created_at?: string;
  updated_at?: string;
  distance_km?: number;
}

export interface TerreiroCreate {
  nome: string;
  nacao: string;
  descricao?: string;
  historia?: string;
  endereco?: string;
  latitude: number;
  longitude: number;
  foto_url?: string;
  nome_ie?: string;
  nome_mae_pai?: string;
  telefone?: string;
  email?: string;
  site?: string;
}

export interface GPSExtractResult {
  latitude: number;
  longitude: number;
  endereco?: string;
  success: boolean;
  message: string;
}

export interface ReverseGeocodeResult {
  endereco: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  success: boolean;
}

export interface UploadResult {
  filename: string;
  url: string;
  success: boolean;
}

export interface AppStats {
  total_terreiros: number;
  total_nacoes: number;
}

export const NACOES = [
  { value: 'Ketu', label: 'Ketu', color: 'nacao-ketu' },
  { value: 'Jeje', label: 'Jeje', color: 'nacao-jeje' },
  { value: 'Angola', label: 'Angola', color: 'nacao-angola' },
  { value: 'Congo', label: 'Congo', color: 'nacao-congo' },
  { value: 'Ijexá', label: 'Ijexá', color: 'nacao-ijexa' },
  { value: 'Nagô', label: 'Nagô', color: 'nacao-ketu' },
] as const;

export type NacaoType = typeof NACOES[number]['value'];

export function getNacaoColor(nacao: string): string {
  const found = NACOES.find(n => 
    n.value.toLowerCase() === nacao.toLowerCase()
  );
  return found?.color || 'nacao-angola';
}

export function getNacaoLabel(nacao: string): string {
  const found = NACOES.find(n => 
    n.value.toLowerCase() === nacao.toLowerCase()
  );
  return found?.label || nacao;
}
