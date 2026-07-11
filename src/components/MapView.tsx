import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import type { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Terreiro } from '@/types';
import { getNacaoColor, getNacaoLabel } from '@/types';
import { Button } from '@/components/ui/button';
import { Navigation, ExternalLink } from 'lucide-react';

// Fix Leaflet default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Salvador center coordinates
const SALVADOR_CENTER: LatLngTuple = [-12.9714, -38.5014];

interface MapViewProps {
  terreiros: Terreiro[];
  selectedTerreiro?: Terreiro | null;
  onSelectTerreiro: (terreiro: Terreiro) => void;
  userLocation?: GeolocationPosition | null;
}

// Map controller component
function MapController({ 
  selectedTerreiro,
  userLocation 
}: { 
  selectedTerreiro?: Terreiro | null;
  userLocation?: GeolocationPosition | null;
}) {
  const map = useMap();
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (selectedTerreiro) {
      map.flyTo(
        [selectedTerreiro.latitude, selectedTerreiro.longitude],
        16,
        { duration: 1.5 }
      );
    }
  }, [selectedTerreiro, map]);

  useEffect(() => {
    if (userLocation && !initialFitDone.current) {
      const { latitude, longitude } = userLocation.coords;
      map.flyTo([latitude, longitude], 14, { duration: 1.5 });
      initialFitDone.current = true;
    }
  }, [userLocation, map]);

  return null;
}

// Create custom icon for terreiro marker
function createTerreiroIcon(nacao: string): DivIcon {
  const colors: Record<string, string> = {
    'ketu': '#ef4444',
    'jeje': '#3b82f6',
    'angola': '#f59e0b',
    'congo': '#a855f7',
    'ijexa': '#10b981',
    'nago': '#ef4444',
  };
  
  const color = colors[nacao.toLowerCase()] || '#f59e0b';
  
  return new DivIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">⛪</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// User location marker
function UserLocationMarker({ position }: { position: GeolocationPosition }) {
  const { latitude, longitude } = position.coords;
  const accuracy = position.coords.accuracy;

  return (
    <>
      <Circle
        center={[latitude, longitude]}
        radius={accuracy}
        pathOptions={{
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          color: '#3b82f6',
          weight: 1,
        }}
      />
      <Marker
        position={[latitude, longitude]}
        icon={new DivIcon({
          className: 'user-location-marker',
          html: `
            <div style="
              width: 16px;
              height: 16px;
              background: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })}
      />
    </>
  );
}

export function MapView({ 
  terreiros, 
  selectedTerreiro, 
  onSelectTerreiro,
  userLocation 
}: MapViewProps) {
  const handleNavigate = useCallback((lat: number, lon: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_blank');
  }, []);

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={SALVADOR_CENTER}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          selectedTerreiro={selectedTerreiro}
          userLocation={userLocation}
        />

        {/* User location */}
        {userLocation && (
          <UserLocationMarker position={userLocation} />
        )}

        {/* Terreiro markers */}
        {terreiros.map((terreiro) => (
          <Marker
            key={terreiro.id}
            position={[terreiro.latitude, terreiro.longitude]}
            icon={createTerreiroIcon(terreiro.nacao)}
            eventHandlers={{
              click: () => onSelectTerreiro(terreiro),
            }}
          >
            <Popup>
              <div className="min-w-[200px] space-y-2">
                <h3 className="font-bold text-base">{terreiro.nome}</h3>
                
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getNacaoColor(terreiro.nacao)}`}>
                  {getNacaoLabel(terreiro.nacao)}
                </span>
                
                {terreiro.endereco && (
                  <p className="text-xs text-muted-foreground">{terreiro.endereco}</p>
                )}
                
                {terreiro.descricao && (
                  <p className="text-xs line-clamp-2">{terreiro.descricao}</p>
                )}
                
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 h-8 text-xs"
                    onClick={() => onSelectTerreiro(terreiro)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Detalhes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => handleNavigate(terreiro.latitude, terreiro.longitude)}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Ir
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
