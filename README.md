# Divulguei.Online

> O guia digital da sua cidade — diretório comercial, classificados e bot WhatsApp com IA para cidades pequenas.

## 🏗 Arquitetura

```
divulguei/
├── packages/
│   ├── api/          # Backend Fastify + PostgreSQL + Redis
│   ├── web/          # Frontend React + Tailwind + Vite
│   └── bot/          # Bot WhatsApp (Baileys) + OpenAI + Cron
├── nginx/            # Configuração Nginx para produção
├── docker-compose.yml
└── .github/workflows/deploy.yml
```

### Stack Tecnológica

| Componente | Tecnologia |
|-----------|-----------|
| **Backend** | Node.js + Fastify v5 + TypeScript |
| **Banco de dados** | PostgreSQL 16 |
| **Cache/Fila** | Redis 7 |
| **Frontend** | React 18 + Vite 6 + Tailwind CSS 3 |
| **Bot WhatsApp** | Baileys (WhatsApp Web) |
| **IA** | OpenAI GPT-4.1-mini, GPT-4o (vision), Whisper |
| **Deploy** | Docker Compose + Nginx + GitHub Actions |

## 🚀 Setup Local

### Pré-requisitos

- Docker & Docker Compose
- Node.js 20+ (para dev)
- Chave API OpenAI

### 1. Clone e configure

```bash
git clone https://github.com/seu-usuario/divulguei.git
cd divulguei
cp .env.example .env
# Edite .env com suas credenciais
```

### 2. Levante os serviços

```bash
docker compose up -d postgres redis
```

### 3. Execute as migrations e seed

```bash
cd packages/api
npm install
npm run migrate
npm run seed
```

### 4. Inicie o backend

```bash
npm run dev
# API em http://localhost:3001
```

### 5. Inicie o frontend

```bash
cd ../web
npm install
npm run dev
# Frontend em http://localhost:5173
```

### 6. (Opcional) Inicie o bot

```bash
cd ../bot
npm install
npm run dev
# Escaneie o QR Code no terminal
```

## 📦 Módulos

### API (`packages/api`)

| Módulo | Rota Base | Descrição |
|--------|-----------|-----------|
| Auth | `/api/auth` | Login via WhatsApp (código 6 dígitos) + Google OAuth |
| Cities | `/api/cities` | CRUD de cidades |
| Categories | `/api/categories` | Categorias hierárquicas por tipo |
| Businesses | `/:city/businesses` | Empresas e comércios |
| Classifieds | `/:city/classifieds` | Classificados com IA |
| Professionals | `/:city/professionals` | Profissionais autônomos |
| Jobs | `/:city/jobs` | Vagas de emprego |
| Events | `/:city/events` | Eventos com aprovação |
| News | `/:city/news` | Notícias via RSS |
| Public Services | `/:city/public-services` | Telefones úteis |
| Alerts | `/:city/alerts` | Alertas por palavra-chave |
| Search | `/:city/search` | Busca inteligente com IA |
| Admin | `/:city/admin` | Painel administrativo |

### Frontend (`packages/web`)

- **Páginas públicas**: Home, Empresas, Classificados, Profissionais, Empregos, Eventos, Notícias, Utilidade Pública
- **Autenticação**: Login via WhatsApp, Perfil, Alertas
- **Admin**: Dashboard, gerenciamento de todas as entidades

### Bot WhatsApp (`packages/bot`)

- **Chat privado**: Busca, criação de classificados, alertas, áudio (Whisper), imagem (Vision)
- **Grupos**: Classificação de mensagens, respostas automáticas a perguntas
- **Cron jobs**: Expiração de classificados, fetch RSS, notificações de alertas

## 🗄 Banco de Dados

15 tabelas: `cities`, `categories`, `users`, `businesses`, `business_claims`, `classifieds`, `professionals`, `jobs`, `events`, `news_sources`, `news_articles`, `public_services`, `whatsapp_groups`, `alerts`, `interactions`, `subscriptions`

## 🔒 Autenticação

- JWT via `@fastify/jwt`
- Código de 6 dígitos enviado por WhatsApp (TTL 5 min no Redis)
- Roles: `user`, `business_owner`, `admin`

## 🚀 Deploy em Produção

```bash
# No VPS
cp .env.example .env
# Configure .env com credenciais reais

docker compose up -d --build

# Nginx
sudo cp nginx/divulguei.conf /etc/nginx/sites-available/divulguei
sudo ln -s /etc/nginx/sites-available/divulguei /etc/nginx/sites-enabled/
sudo certbot --nginx -d divulguei.online
sudo systemctl reload nginx
```

## 📄 Licença

Proprietário — Divulguei.Online © 2024