import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Toaster, toast } from 'sonner';
import { Header } from '@/components/Header';
import { MapView } from '@/components/MapView';
import { Sidebar } from '@/components/Sidebar';
import { TerreiroDetail } from '@/components/TerreiroDetail';
import { TerreiroForm } from '@/components/TerreiroForm';
import { InstallPrompt } from '@/components/InstallPrompt';
import { listTerreiros } from '@/services/api';
import type { Terreiro } from '@/types';
import './App.css';

function App() {
  const [terreiros, setTerreiros] = useState<Terreiro[]>([]);
  const [selectedTerreiro, setSelectedTerreiro] = useState<Terreiro | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTerreiro, setEditingTerreiro] = useState<Terreiro | null>(null);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load terreiros
  const loadTerreiros = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listTerreiros({ limit: 500 });
      setTerreiros(data);
    } catch (error) {
      console.error('Error loading terreiros:', error);
      toast.error('Erro ao carregar terreiros', {
        description: 'Verifique sua conexão com a internet',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTerreiros();
  }, [loadTerreiros]);

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);
          setLocationError(null);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let message = 'Não foi possível obter sua localização';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permissão de localização negada. Ative nas configurações do navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Localização indisponível no momento.';
              break;
            case error.TIMEOUT:
              message = 'Tempo esgotado ao obter localização.';
              break;
          }
          setLocationError(message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );

      // Watch position
      const watchId = navigator.geolocation.watchPosition(
        (position) => setUserLocation(position),
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError('Geolocalização não suportada neste navegador.');
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Você está online!', { duration: 3000 });
      loadTerreiros();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Você está offline', {
        description: 'Algumas funcionalidades podem estar limitadas',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadTerreiros]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  const handleSelectTerreiro = (terreiro: Terreiro) => {
    setSelectedTerreiro(terreiro);
    setDetailOpen(true);
    setFormOpen(false);
  };

  const handleAddTerreiro = () => {
    setEditingTerreiro(null);
    setFormOpen(true);
    setDetailOpen(false);
    setSidebarOpen(false);
  };

  const handleEditTerreiro = (terreiro: Terreiro) => {
    setEditingTerreiro(terreiro);
    setFormOpen(true);
    setDetailOpen(false);
  };

  const handleSaved = () => {
    setFormOpen(false);
    setEditingTerreiro(null);
    loadTerreiros();
    toast.success('Terreiro salvo com sucesso!', {
      description: 'Obrigado por contribuir com o mapeamento!',
    });
  };

  const handleDeleted = () => {
    setDetailOpen(false);
    setSelectedTerreiro(null);
    loadTerreiros();
    toast.success('Terreiro removido');
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedTerreiro(null);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative">
      {/* Toast notifications */}
      <Toaster 
        position="top-center" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />

      {/* Offline indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            exit={{ y: -40 }}
            className="fixed top-[52px] left-0 right-0 z-[999] bg-destructive text-destructive-foreground text-center py-1 text-xs"
          >
            Você está offline. Algumas funcionalidades podem estar limitadas.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[998] bg-background flex flex-col items-center justify-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary animate-bounce" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">Axé Map</h2>
              <p className="text-sm text-muted-foreground">Carregando terreiros...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div className="absolute inset-0 pt-[52px]">
        <MapView
          terreiros={terreiros}
          selectedTerreiro={selectedTerreiro}
          onSelectTerreiro={handleSelectTerreiro}
          userLocation={userLocation}
        />
      </div>

      {/* Location error toast */}
      {locationError && !userLocation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[997]">
          <div className="glass rounded-lg px-4 py-2 text-xs text-muted-foreground max-w-xs text-center">
            {locationError}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectTerreiro={handleSelectTerreiro}
        onAddTerreiro={handleAddTerreiro}
        selectedTerreiroId={selectedTerreiro?.id}
        userLocation={userLocation}
      />

      {/* Terreiro Detail Panel */}
      <AnimatePresence>
        {detailOpen && selectedTerreiro && (
          <TerreiroDetail
            terreiro={selectedTerreiro}
            onClose={handleCloseDetail}
            onEdit={handleEditTerreiro}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>

      {/* Add/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTerreiro ? 'Editar Terreiro' : 'Mapear Novo Terreiro'}
            </DialogTitle>
          </DialogHeader>
          <TerreiroForm
            terreiro={editingTerreiro}
            onSaved={handleSaved}
            onCancel={() => {
              setFormOpen(false);
              setEditingTerreiro(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* FAB - Add Terreiro */}
      <motion.div
        className="fixed bottom-6 right-6 z-[997]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          onClick={handleAddTerreiro}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default App;
