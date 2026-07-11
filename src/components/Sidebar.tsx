import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  Navigation, 
  Loader2, 
  X,
  Filter,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { listTerreiros, findNearby } from '@/services/api';
import type { Terreiro } from '@/types';
import { getNacaoColor, getNacaoLabel } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTerreiro: (terreiro: Terreiro) => void;
  onAddTerreiro: () => void;
  selectedTerreiroId?: number;
  userLocation?: GeolocationPosition | null;
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  onSelectTerreiro, 
  onAddTerreiro,
  selectedTerreiroId,
  userLocation 
}: SidebarProps) {
  const [terreiros, setTerreiros] = useState<Terreiro[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNacao, setFilterNacao] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  // Load terreiros
  useEffect(() => {
    loadTerreiros();
  }, [filterNacao]);

  const loadTerreiros = async () => {
    setLoading(true);
    try {
      const data = await listTerreiros({
        search: searchQuery || undefined,
        nacao: filterNacao || undefined,
        limit: 100,
      });
      setTerreiros(data);
    } catch (error) {
      console.error('Error loading terreiros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadTerreiros();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load nearby terreiros
  const loadNearby = async () => {
    if (!userLocation) return;
    setLoading(true);
    setShowNearby(true);
    try {
      const { latitude, longitude } = userLocation.coords;
      const data = await findNearby(latitude, longitude, 10);
      setTerreiros(data);
    } catch (error) {
      console.error('Error loading nearby:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset to all
  const showAll = () => {
    setShowNearby(false);
    setFilterNacao('');
    setSearchQuery('');
    loadTerreiros();
  };

  // Unique nações from loaded terreiros
  const nacoes = [...new Set(terreiros.map(t => t.nacao))].sort();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[1001] sm:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-[52px] bottom-0 w-80 z-[1002] bg-card border-r border-border flex flex-col"
          >
            {/* Header */}
            <div className="p-3 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar terreiros..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowNearby(false);
                  }}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      loadTerreiros();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={onAddTerreiro}
                  className="flex-1"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Mapear
                </Button>
                {userLocation && (
                  <Button
                    variant={showNearby ? 'default' : 'outline'}
                    size="sm"
                    onClick={showNearby ? showAll : loadNearby}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Filters */}
              {nacoes.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                  <button
                    onClick={showAll}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      !filterNacao && !showNearby
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    Todos
                  </button>
                  {nacoes.map((nacao) => (
                    <button
                      key={nacao}
                      onClick={() => {
                        setFilterNacao(nacao);
                        setShowNearby(false);
                      }}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        filterNacao === nacao
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {getNacaoLabel(nacao)}
                    </button>
                  ))}
                </div>
              )}

              <Separator />
            </div>

            {/* Terreiros List */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : terreiros.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Flame className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {showNearby 
                      ? 'Nenhum terreiro encontrado próximo a você'
                      : searchQuery || filterNacao
                        ? 'Nenhum terreiro encontrado'
                        : 'Nenhum terreiro mapeado ainda'
                    }
                  </p>
                  {!searchQuery && !filterNacao && !showNearby && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={onAddTerreiro}
                      className="mt-2"
                    >
                      Seja o primeiro a mapear!
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {terreiros.map((terreiro, index) => (
                    <motion.button
                      key={terreiro.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        onSelectTerreiro(terreiro);
                        onClose();
                      }}
                      className={`terreiro-card w-full text-left ${
                        selectedTerreiroId === terreiro.id 
                          ? 'border-primary bg-primary/5' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm truncate">
                            {terreiro.nome}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0 ${getNacaoColor(terreiro.nacao)}`}
                            >
                              {getNacaoLabel(terreiro.nacao)}
                            </Badge>
                            {(terreiro as Terreiro & { distance_km?: number }).distance_km !== undefined && (
                              <span className="text-[10px] text-muted-foreground">
                                {(terreiro as Terreiro & { distance_km?: number }).distance_km?.toFixed(1)}km
                              </span>
                            )}
                          </div>
                        </div>
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                      {terreiro.endereco && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          {terreiro.endereco}
                        </p>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer Stats */}
            <div className="p-3 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                {terreiros.length} terreiro{terreiros.length !== 1 ? 's' : ''} mapeado{terreiros.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
