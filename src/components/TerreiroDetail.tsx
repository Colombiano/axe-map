import { 
  MapPin, 
  Navigation, 
  Phone, 
  Mail, 
  Globe, 
  User, 
  Edit, 
  Trash2,
  X,
  Clock,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { deleteTerreiro } from '@/services/api';
import type { Terreiro } from '@/types';
import { getNacaoColor, getNacaoLabel } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TerreiroDetailProps {
  terreiro: Terreiro | null;
  onClose: () => void;
  onEdit: (terreiro: Terreiro) => void;
  onDeleted: () => void;
}

export function TerreiroDetail({ terreiro, onClose, onEdit, onDeleted }: TerreiroDetailProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!terreiro) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTerreiro(terreiro.id);
      setShowDeleteDialog(false);
      onDeleted();
    } catch (error) {
      console.error('Error deleting terreiro:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${terreiro.latitude},${terreiro.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-[52px] bottom-0 w-full sm:w-96 z-[1002] bg-card border-l border-border flex flex-col"
      >
        {/* Header Image */}
        <div className="relative h-48 bg-muted">
          {terreiro.foto_url ? (
            <img
              src={`http://localhost:8000${terreiro.foto_url}`}
              alt={terreiro.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Flame className="h-16 w-16 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          
          {/* Close button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 rounded-full shadow-lg"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Nação badge */}
          <div className="absolute bottom-2 left-3">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getNacaoColor(terreiro.nacao)}`}>
              {getNacaoLabel(terreiro.nacao)}
            </span>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <h2 className="text-xl font-bold">{terreiro.nome}</h2>
              {terreiro.nome_ie && terreiro.nome_ie !== terreiro.nome && (
                <p className="text-sm text-muted-foreground">{terreiro.nome_ie}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleNavigate}
                className="flex-1"
                size="sm"
              >
                <Navigation className="h-4 w-4 mr-1" />
                Como Chegar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(terreiro)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-3">
              {/* Endereço */}
              {terreiro.endereco && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Endereço</p>
                    <p className="text-sm">{terreiro.endereco}</p>
                  </div>
                </div>
              )}

              {/* Mãe/Pai de Santo */}
              {terreiro.nome_mae_pai && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Mãe/Pai de Santo</p>
                    <p className="text-sm">{terreiro.nome_mae_pai}</p>
                  </div>
                </div>
              )}

              {/* Telefone */}
              {terreiro.telefone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Telefone</p>
                    <a 
                      href={`tel:${terreiro.telefone}`} 
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {terreiro.telefone}
                    </a>
                  </div>
                </div>
              )}

              {/* Email */}
              {terreiro.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${terreiro.email}`}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {terreiro.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Site */}
              {terreiro.site && (
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Site</p>
                    <a 
                      href={terreiro.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {terreiro.site}
                    </a>
                  </div>
                </div>
              )}

              {/* Coordinates */}
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Coordenadas</p>
                  <p className="text-sm font-mono text-xs">
                    {terreiro.latitude.toFixed(6)}, {terreiro.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              {/* Created date */}
              {terreiro.created_at && (
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Cadastrado em</p>
                    <p className="text-sm">
                      {new Date(terreiro.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {terreiro.descricao && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {terreiro.descricao}
                </p>
              </div>
            )}

            {/* History */}
            {terreiro.historia && (
              <div>
                <h3 className="text-sm font-semibold mb-2">História</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {terreiro.historia}
                </p>
              </div>
            )}

            {/* Saravá */}
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground italic">
                Saravá! 🕯️
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o terreiro "{terreiro.nome}"? 
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AnimatePresence>
  );
}
