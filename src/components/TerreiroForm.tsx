import { useState, useEffect } from 'react';
import { MapPin, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhotoUploader } from './PhotoUploader';
import { createTerreiro, updateTerreiro, reverseGeocode } from '@/services/api';
import type { Terreiro, TerreiroCreate, GPSExtractResult, UploadResult } from '@/types';
import { NACOES } from '@/types';

interface TerreiroFormProps {
  terreiro?: Terreiro | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function TerreiroForm({ terreiro, onSaved, onCancel }: TerreiroFormProps) {
  const isEditing = !!terreiro;
  
  const [formData, setFormData] = useState<TerreiroCreate>({
    nome: '',
    nacao: 'Ketu',
    descricao: '',
    historia: '',
    endereco: '',
    latitude: -12.9714,
    longitude: -38.5014,
    foto_url: '',
    nome_ie: '',
    nome_mae_pai: '',
    telefone: '',
    email: '',
    site: '',
  });
  
  const [gpsExtracted, setGpsExtracted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load terreiro data if editing
  useEffect(() => {
    if (terreiro) {
      setFormData({
        nome: terreiro.nome,
        nacao: terreiro.nacao,
        descricao: terreiro.descricao || '',
        historia: terreiro.historia || '',
        endereco: terreiro.endereco || '',
        latitude: terreiro.latitude,
        longitude: terreiro.longitude,
        foto_url: terreiro.foto_url || '',
        nome_ie: terreiro.nome_ie || '',
        nome_mae_pai: terreiro.nome_mae_pai || '',
        telefone: terreiro.telefone || '',
        email: terreiro.email || '',
        site: terreiro.site || '',
      });
      setGpsExtracted(true);
    }
  }, [terreiro]);

  const handleGPSExtracted = async (result: GPSExtractResult) => {
    if (result.success) {
      setGpsExtracted(true);
      setFormData(prev => ({
        ...prev,
        latitude: result.latitude,
        longitude: result.longitude,
        endereco: result.endereco || prev.endereco,
      }));
      
      // Try to get more detailed address
      try {
        const geoResult = await reverseGeocode(result.latitude, result.longitude);
        if (geoResult.success) {
          setFormData(prev => ({
            ...prev,
            endereco: geoResult.endereco,
          }));
        }
      } catch {
        // Silent fail - we already have basic address from GPS extract
      }
    }
  };

  const handlePhotoUploaded = (result: UploadResult) => {
    setFormData(prev => ({
      ...prev,
      foto_url: result.url,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do terreiro é obrigatório';
    }
    if (!formData.nacao) {
      newErrors.nacao = 'Nação é obrigatória';
    }
    if (!gpsExtracted && !isEditing) {
      newErrors.gps = 'É necessário extrair o GPS da foto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      if (isEditing && terreiro) {
        await updateTerreiro(terreiro.id, formData);
      } else {
        await createTerreiro(formData);
      }
      onSaved();
    } catch (error) {
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Erro ao salvar terreiro' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof TerreiroCreate, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo Uploader */}
      {!isEditing && (
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Foto do Terreiro <span className="text-destructive">*</span>
          </Label>
          <PhotoUploader 
            onGPSExtracted={handleGPSExtracted}
            onPhotoUploaded={handlePhotoUploaded}
          />
          {errors.gps && (
            <p className="text-xs text-destructive mt-1">{errors.gps}</p>
          )}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="nome" className="text-sm font-medium">
            Nome do Terreiro <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => updateField('nome', e.target.value)}
            placeholder="Ex: Ilê Axé Opô Afonjá"
            className={errors.nome ? 'border-destructive' : ''}
          />
          {errors.nome && (
            <p className="text-xs text-destructive mt-1">{errors.nome}</p>
          )}
        </div>

        <div>
          <Label htmlFor="nacao" className="text-sm font-medium">
            Nação <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.nacao}
            onValueChange={(value) => updateField('nacao', value)}
          >
            <SelectTrigger className={errors.nacao ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione a nação" />
            </SelectTrigger>
            <SelectContent>
              {NACOES.map((nacao) => (
                <SelectItem key={nacao.value} value={nacao.value}>
                  {nacao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="nome_ie" className="text-sm font-medium">
            Nome Completo do Ilê
          </Label>
          <Input
            id="nome_ie"
            value={formData.nome_ie}
            onChange={(e) => updateField('nome_ie', e.target.value)}
            placeholder="Ex: Ilê Axé Opô Afonjá - Casa de Xangô"
          />
        </div>

        <div>
          <Label htmlFor="nome_mae_pai" className="text-sm font-medium">
            Mãe/Pai de Santo
          </Label>
          <Input
            id="nome_mae_pai"
            value={formData.nome_mae_pai}
            onChange={(e) => updateField('nome_mae_pai', e.target.value)}
            placeholder="Ex: Mãe Stella de Oxóssi"
          />
        </div>

        {/* Coordinates display */}
        {gpsExtracted && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div className="text-xs">
              <p className="font-medium">Coordenadas GPS</p>
              <p className="text-muted-foreground">
                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="endereco" className="text-sm font-medium">
            Endereço
          </Label>
          <Textarea
            id="endereco"
            value={formData.endereco}
            onChange={(e) => updateField('endereco', e.target.value)}
            placeholder="Endereço completo do terreiro"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="descricao" className="text-sm font-medium">
            Descrição
          </Label>
          <Textarea
            id="descricao"
            value={formData.descricao}
            onChange={(e) => updateField('descricao', e.target.value)}
            placeholder="Descreva o terreiro, suas características..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="historia" className="text-sm font-medium">
            História
          </Label>
          <Textarea
            id="historia"
            value={formData.historia}
            onChange={(e) => updateField('historia', e.target.value)}
            placeholder="História e fundação do terreiro..."
            rows={3}
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="telefone" className="text-sm font-medium">
              Telefone
            </Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => updateField('telefone', e.target.value)}
              placeholder="(71) 99999-9999"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="contato@terreiro.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="site" className="text-sm font-medium">
            Site / Rede Social
          </Label>
          <Input
            id="site"
            value={formData.site}
            onChange={(e) => updateField('site', e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <p className="text-sm text-destructive">{errors.submit}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Atualizar' : 'Salvar'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
