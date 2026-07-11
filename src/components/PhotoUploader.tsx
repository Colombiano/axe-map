import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { extractGPS, uploadFoto } from '@/services/api';
import type { GPSExtractResult, UploadResult } from '@/types';

interface PhotoUploaderProps {
  onGPSExtracted: (result: GPSExtractResult) => void;
  onPhotoUploaded?: (result: UploadResult) => void;
}

type UploadState = 'idle' | 'uploading' | 'extracting' | 'success' | 'error';

export function PhotoUploader({ onGPSExtracted, onPhotoUploaded }: PhotoUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedCoords, setExtractedCoords] = useState<{ lat: number; lon: number } | null>(null);

  const processFile = useCallback(async (file: File) => {
    setUploadState('uploading');
    setProgress(30);
    setErrorMessage(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setProgress(50);
      };
      reader.readAsDataURL(file);

      // Upload photo
      const uploadResult = await uploadFoto(file);
      setProgress(70);
      
      if (onPhotoUploaded) {
        onPhotoUploaded(uploadResult);
      }

      // Extract GPS
      setUploadState('extracting');
      setProgress(80);
      
      const gpsResult = await extractGPS(file);
      setProgress(100);
      
      if (gpsResult.success) {
        setUploadState('success');
        setExtractedCoords({ 
          lat: gpsResult.latitude, 
          lon: gpsResult.longitude 
        });
        onGPSExtracted(gpsResult);
      } else {
        setUploadState('error');
        setErrorMessage(gpsResult.message);
        onGPSExtracted(gpsResult);
      }
    } catch (error) {
      setUploadState('error');
      setProgress(100);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao processar foto');
      onGPSExtracted({
        latitude: 0,
        longitude: 0,
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao processar foto',
      });
    }
  }, [onGPSExtracted, onPhotoUploaded]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type.startsWith('image/')) {
        processFile(file);
      } else {
        setErrorMessage('Por favor, envie apenas arquivos de imagem (JPG, PNG)');
        setUploadState('error');
      }
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.heif'],
    },
    multiple: false,
    noClick: uploadState === 'uploading' || uploadState === 'extracting',
  });

  const handleReset = () => {
    setUploadState('idle');
    setProgress(0);
    setPreview(null);
    setErrorMessage(null);
    setExtractedCoords(null);
  };

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      {uploadState === 'idle' && (
        <div
          {...getRootProps()}
          className={`
            dropzone p-6 text-center cursor-pointer
            ${isDragActive ? 'active border-primary bg-primary/5' : ''}
          `}
        >
          <input {...getInputProps()} capture="environment" />
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? 'Solte a foto aqui' : 'Tire uma foto ou arraste aqui'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG ou HEIC • Máx 10MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              <Upload className="h-4 w-4 mr-1" />
              Selecionar foto
            </Button>
          </div>
        </div>
      )}

      {/* Uploading / Extracting */}
      {(uploadState === 'uploading' || uploadState === 'extracting') && (
        <div className="space-y-3 p-4 border rounded-xl">
          {preview && (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {uploadState === 'uploading' ? 'Enviando foto...' : 'Extraindo GPS...'}
              </span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      )}

      {/* Success */}
      {uploadState === 'success' && extractedCoords && (
        <div className="space-y-3 p-4 border border-green-500/30 rounded-xl bg-green-500/5">
          {preview && (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-400">
                Coordenadas extraídas!
              </p>
              <p className="text-xs text-muted-foreground">
                Lat: {extractedCoords.lat.toFixed(6)}, Lon: {extractedCoords.lon.toFixed(6)}
              </p>
            </div>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="w-full"
          >
            Usar outra foto
          </Button>
        </div>
      )}

      {/* Error */}
      {uploadState === 'error' && (
        <div className="space-y-3 p-4 border border-red-500/30 rounded-xl bg-red-500/5">
          {preview && (
            <div className="relative aspect-video rounded-lg overflow-hidden opacity-50">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">
                GPS não encontrado
              </p>
              <p className="text-xs text-muted-foreground">
                {errorMessage || 'A imagem não contém dados de localização.'}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
            <strong>Dica:</strong> Ative o GPS na câmera do celular antes de tirar a foto. 
            Ajustes &gt; Privacidade &gt; Localização &gt; Câmera &gt; "Ao usar o App"
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="w-full"
          >
            Tentar outra foto
          </Button>
        </div>
      )}
    </div>
  );
}
