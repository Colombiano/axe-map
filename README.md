# 🕯️ Axé Map — Mapeamento dos Terreiros de Candomblé de Salvador

Aplicativo web (PWA) para mapeamento colaborativo dos terreiros de Candomblé de Salvador, Bahia. A experiência principal permite que o usuário tire uma foto da entrada do terreiro e o sistema extrai automaticamente as coordenadas GPS dos metadados EXIF da imagem.

## ✨ Funcionalidades

- **📸 Mapeamento por foto**: Tire uma foto com o celular (com GPS ativado) e o sistema extrai a localização automaticamente
- **🗺️ Mapa interativo**: OpenStreetMap com marcadores personalizados para cada terreiro
- **📋 Detalhes culturais**: Registro de nação (Ketu, Jeje, Angola, etc.), descrição e história
- **📍 Geolocalização reversa**: Endereço obtido automaticamente via Nominatim (OpenStreetMap)
- **🔍 Busca por proximidade**: Encontre terreiros próximos a sua localização
- **📱 PWA**: Instale no celular Android/iOS como app nativo (ícone na tela inicial, offline, splash screen)
- **🔎 Busca e filtros**: Busque por nome ou filtre por nação (Ketu, Jeje, Angola, etc.)

## 📱 Instalação no Celular (PWA)

### Android (Chrome)
1. Acesse o site pelo Chrome
2. Toque no menu (⋮) → "Adicionar à tela inicial"
3. Confirme → O app aparece como ícone nativo

### iOS (Safari)
1. Acesse pelo Safari
2. Toque em Compartilhar → "Adicionar à Tela de Início"
3. O app funciona em tela cheia, sem barra de endereço

### Recursos PWA
- ✅ Splash screen personalizada
- ✅ Ícone na tela inicial
- ✅ Funciona offline (cache de assets)
- ✅ Tela cheia (sem navegador)
- ✅ Status bar temática
- ✅ Background sync para uploads pendentes

## 🏗️ Arquitetura

```
/
├── dist/                    # Build do frontend (deploy)
│   ├── index.html
│   ├── manifest.json        # Configuração PWA
│   ├── service-worker.js    # Cache offline + background sync
│   ├── icons/               # Ícones em 8 tamanhos
│   └── assets/              # JS/CSS bundles
├── backend/                 # Python + FastAPI + SQLAlchemy
│   ├── main.py              # API principal
│   ├── database.py          # Configuração do banco
│   ├── models.py            # Modelos SQLAlchemy
│   ├── schemas.py           # Schemas Pydantic
│   ├── requirements.txt     # Dependências Python
│   ├── utils/
│   │   ├── gps.py           # Extração de EXIF/GPS
│   │   └── geocode.py       # Geocoding reverso (Nominatim)
│   └── tests/
│       └── test_main.py     # Testes automatizados
├── src/                     # Frontend React
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── MapView.tsx
│   │   ├── PhotoUploader.tsx
│   │   ├── TerreiroForm.tsx
│   │   ├── TerreiroDetail.tsx
│   │   ├── Sidebar.tsx
│   │   └── InstallPrompt.tsx
│   ├── services/
│   │   └── api.ts           # Cliente da API
│   ├── types/
│   │   └── index.ts         # Tipos TypeScript
│   ├── App.tsx
│   └── main.tsx
├── deploy_github.py         # Script de deploy automático para GitHub
└── README.md
```

## 🚀 Como executar

### Pré-requisitos
- Node.js 18+ (frontend)
- Python 3.11+ (backend)

### Backend (Python)

```bash
cd backend
python -m venv venv

# Linux/Mac:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Acesse a documentação interativa em: http://localhost:8000/docs

### Frontend (React)

```bash
# Na raiz do projeto:
npm install
npm run dev
```

Acesse em: http://localhost:3000

### Build para produção

```bash
npm run build
```

Os arquivos estáticos serão gerados em `dist/`.

### Testes

**Backend:**
```bash
cd backend
pytest tests/ -v
```

**Frontend:**
```bash
npm run check    # TypeScript type check
```

## 📱 Fluxo de uso

1. O usuário clica em **"Mapear Terreiro"** (botão + no canto inferior direito)
2. Seleciona ou arrasta uma foto tirada na entrada do terreiro
3. O sistema extrai os metadados GPS (EXIF) automaticamente
4. O endereço é obtido via reverse geocoding (Nominatim/OpenStreetMap)
5. O usuário preenche o nome, nação (Ketu, Jeje, Angola...) e descrição
6. O terreiro aparece no mapa instantaneamente!

## ⚠️ Importante sobre o GPS

Para que a extração de coordenadas funcione, a foto **deve conter metadados EXIF com GPS**.

No celular:
- **iPhone**: Ajustes > Privacidade > Serviços de Localização > Câmera > "Ao usar o App"
- **Android**: Configurações > Localização > Permissões do app > Câmera > "Permitir"

**Atenção**: Redes sociais (WhatsApp, Instagram) **removem** metadados EXIF. Use a **câmera nativa** do celular.

## 🗺️ Tecnologias

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (componentes)
- Leaflet + React-Leaflet (mapas OpenStreetMap)
- Framer Motion (animações)
- react-dropzone (upload de fotos)
- exifreader (extração de EXIF)
- lucide-react (ícones)

### Backend
- Python 3.11+
- FastAPI (framework web)
- SQLAlchemy 2.0 (ORM)
- Pydantic (validação)
- Pillow + exifread + piexif (processamento de imagens)
- httpx (requisições HTTP para Nominatim)

### Mapas
- OpenStreetMap (tiles + Nominatim geocoding)

### PWA
- Web App Manifest
- Service Worker (cache + background sync)
- IndexedDB (dados offline)

### Banco de dados
- SQLite (desenvolvimento)
- PostgreSQL (produção recomendada)

## 🧪 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Status da API |
| GET | `/api/terreiros` | Listar terreiros (com filtros) |
| POST | `/api/terreiros` | Criar terreiro |
| GET | `/api/terreiros/{id}` | Obter terreiro |
| PUT | `/api/terreiros/{id}` | Atualizar terreiro |
| DELETE | `/api/terreiros/{id}` | Remover terreiro |
| GET | `/api/terreiros/nearby` | Terreiros próximos |
| POST | `/api/extract-gps` | Extrair GPS de foto |
| GET | `/api/reverse-geocode` | Geocoding reverso |
| POST | `/api/upload-foto` | Upload de foto |
| GET | `/api/nacoes` | Listar nações |
| GET | `/api/stats` | Estatísticas |

## 📦 Deploy

### Deploy no GitHub Pages

```bash
python deploy_github.py
```

### Deploy manual (frontend)

```bash
npm run build
# Copie a pasta dist/ para seu servidor web
```

### Deploy backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Recomendado usar **Docker** ou plataformas como **Railway**, **Render** ou **Heroku** para o backend.

## 🤝 Contribuição

Este projeto busca preservar e valorizar a memória dos terreiros de Candomblé de Salvador. Contribuições são bem-vindas, especialmente no respeito e na precisão das informações culturais.

### Como contribuir
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

*Saravá!* 🕯️

**Axé Map** — Feito com amor para preservar a memória dos terreiros de Candomblé de Salvador, Bahia.
