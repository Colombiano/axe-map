import { useState } from 'react';
import { MapPin, CandlestickChart, Menu, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] glass border-b border-border">
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="shrink-0"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <MapPin className="h-6 w-6 text-primary" />
              <CandlestickChart className="h-3 w-3 text-accent absolute -top-0.5 -right-0.5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight">
                Axé Map
              </h1>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Terreiros de Candomblé — Salvador
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Info className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Sobre o Axé Map
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p>
                  O <strong>Axé Map</strong> é um projeto colaborativo de mapeamento dos terreiros 
                  de Candomblé de Salvador, Bahia. Nosso objetivo é preservar e valorizar a memória 
                  dos espaços sagrados das religiões de matriz africana.
                </p>
                
                <div className="rounded-lg bg-muted p-3">
                  <h3 className="font-semibold mb-2">Como usar:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Acesse a entrada de um terreiro</li>
                    <li>Tire uma foto com o GPS ativado</li>
                    <li>Clique em "Mapear Terreiro"</li>
                    <li>Envie a foto — o sistema extrai a localização</li>
                    <li>Preencha as informações culturais</li>
                    <li>O terreiro aparece no mapa!</li>
                  </ol>
                </div>
                
                <div className="rounded-lg bg-muted p-3">
                  <h3 className="font-semibold mb-2">Importante sobre GPS:</h3>
                  <p className="text-muted-foreground">
                    Para que a extração de coordenadas funcione, a foto deve conter metadados EXIF 
                    com GPS. Use a <strong>câmera nativa</strong> do celular — apps como WhatsApp 
                    e Instagram removem esses metadados.
                  </p>
                </div>
                
                <p className="text-center text-muted-foreground italic">
                  Saravá! 🕯️
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
