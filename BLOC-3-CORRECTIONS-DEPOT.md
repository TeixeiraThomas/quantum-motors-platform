# BLOC 3 — Corrections dépôt finales

**Audit :** 2026-04-13  
**Cible :** 7 fichiers à corriger dans clo5-backend et clo5-front + env local  
**Durée estimée :** 30 min total

---

## Vue d'ensemble

Ce bloc détaille les corrections **à appliquer dans le dépôt Git** (Quantum-Motors) avant de lancer la CI/CD.

**Flux :**
1. Backend : Corriger 4 fichiers TypeScript
2. Frontend : Corriger 2 fichiers NextJS
3. Environnement local : .env pour dév
4. Git : Commit + push
5. CI/CD automatique

**Dépendance :** Nécessite completion de BLOC 2 (sinon registry endpoint invalid)

---

## Backend (clo5-backend-master) — 4 corrections

### Correction 1 : src/index.ts — Port dynamique

**Problème :** Port hardcodé, incompatible avec Docker vars d'env

**Fichier :** [clo5-backend-master/src/index.ts](clo5-backend-master/src/index.ts)

**Avant :**
```typescript
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Après :**
```typescript
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
```

**Commit :** `fix: support NODE_PORT from environment`

---

### Correction 2 : src/Controller/index.ts — Route racine

**Problème :** Pas de route GET `/` pour health checks

**Fichier :** [clo5-backend-master/src/Controller/index.ts](clo5-backend-master/src/Controller/index.ts)

**Avant :**
```typescript
// Supposons AUCUNE route / définie

import { Router } from "express";

const router = Router();

// Suit avec les routes métier
router.get("/models", ...);
router.get("/cars", ...);

export default router;
```

**Après :**
```typescript
import { Router } from "express";
import { Request, Response } from "express";

const router = Router();

// Health check
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    service: "quantum-motors-api",
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || "1.0.0"
  });
});

// Routes métier
router.get("/models", ...);
router.get("/cars", ...);

export default router;
```

**Commit :** `feat: add health check endpoint`

---

### Correction 3 : src/Utils/DatabaseConfig.ts — URL de connexion

**Problème :** Hardcoded localhost, ne switch pas entre env preprod/prod

**Fichier :** [clo5-backend-master/src/Utils/DatabaseConfig.ts](clo5-backend-master/src/Utils/DatabaseConfig.ts)

**Avant :**
```typescript
const DATABASE_URL = 
  "mysql://user:password@localhost:3306/quantum_motors?schema=public";

export default DATABASE_URL;
```

**Après :**
```typescript
const {
  DB_HOST = "mariadb",
  DB_PORT = "3306",
  DB_USER = "quantum_user",
  DB_PASSWORD = "changeme",
  DB_NAME = "quantum_motors",
  NODE_ENV = "development"
} = process.env;

const DATABASE_URL =
  `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;

console.log(`[DatabaseConfig] Connecting to ${DB_HOST}:${DB_PORT}/${DB_NAME} (env: ${NODE_ENV})`);

export default DATABASE_URL;
```

**Commit :** `fix: database config from environment variables`

---

### Correction 4 : prisma/schema.prisma — Generator

**Problème :** Si Client pas en output dir correct pour Swarm

**Fichier :** [clo5-backend-master/prisma/schema.prisma](clo5-backend-master/prisma/schema.prisma)

**Avant :**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Models...
```

**Après :**
```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "./generated/prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Models...
```

**Commit :** `fix: prisma client binary targets for Alpine Docker image`

---

## Frontend (clo5-front-main) — 2 corrections

### Correction 5 : next.config.js — API endpoint

**Problème :** Hardcoded localhost:3000, doit pointer sur Traefik

**Fichier :** [clo5-front-main/next.config.js](clo5-front-main/next.config.js)

**Avant :**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
```

**Après :**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  publicRuntimeConfig: {
    // Accessible côté client
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    environment: process.env.NODE_ENV || "development"
  },
  serverRuntimeConfig: {
    // Côté serveur seulement
    apiUrl: process.env.API_URL || "http://localhost:3000"
  },
  // Rewrite pour /api/*
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.API_URL || "http://localhost:3000"}/api/:path*`
        }
      ]
    };
  }
};

module.exports = nextConfig;
```

**Commit :** `config: API endpoint from environment variables`

---

### Correction 6 : lib/api.ts — Client API

**Problème :** Client API hardcodé, doit utiliser config

**Fichier :** [clo5-front-main/lib/api.ts](clo5-front-main/lib/api.ts)

**Avant :**
```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export default apiClient;
```

**Après :**
```typescript
import axios from 'axios';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig() || {};

const API_BASE_URL = publicRuntimeConfig?.apiUrl || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Intercepteur
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Commit :** `fix: API client configuration from environment`

---

## Fichier .env local — 7 variables

### Correction 7 : .env.local (création)

**Fichier :** [clo5-front-main/.env.local](clo5-front-main/.env.local) (Créer si n'existe pas)

**Contenu :**
```env
# API URL pour développement local
NEXT_PUBLIC_API_URL=http://localhost:3001
API_URL=http://localhost:3001

# Port frontend
PORT=3000

# Environment
NODE_ENV=development

# GitHub OAuth (optionnel pour session)
NEXTAUTH_SECRET=dev-secret-change-in-prod
NEXTAUTH_URL=http://localhost:3000

# Database (optionnel, vu que MariaDB est sur Docker)
DATABASE_URL=mysql://neural_user:neural_pass@localhost:3306/quantum_motors
```

**Commit :** `.env.local (development)`

---

## Fichier env Backend — Variables Swarm

### Correction 8 : .env (création pour backend)

**Fichier :** [clo5-backend-master/.env.local](clo5-backend-master/.env.local) (Créer si n'existe pas)

**Contenu :**
```env
# Backend environment
NODE_ENV=development
PORT=3001

# Database (développement local = localhost)
DB_HOST=localhost
DB_PORT=3306
DB_USER=quantum_user
DB_PASSWORD=changeme
DB_NAME=quantum_motors

# API metadata
API_VERSION=1.0.0
API_ENVIRONMENT=local

# Logging
LOG_LEVEL=debug

# CORS (pour dev)
CORS_ORIGIN=http://localhost:3000
```

**Note pour Swarm :** Surcharger avec Secrets Docker, voir BLOC 4

**Commit :** `.env (backend local development)`

---

## Procédure applica GIT

### ✅ 1. Brancher

```bash
cd /path/to/Quantum-Motors

# Crée une branche dédiée aux corrections
git checkout -b fix/env-configuration develop

# Ou sync depuis develop si branch existe
git pull origin develop
```

### ✅ 2. Appliquer les corrections backend

```bash
# Depuis racine du backend
cd clo5-backend-master

# 1. Corriger src/index.ts
nano src/index.ts
# Appliquer Correction 1

# 2. Corriger src/Controller/index.ts
nano src/Controller/index.ts
# Appliquer Correction 2

# 3. Corriger src/Utils/DatabaseConfig.ts
nano src/Utils/DatabaseConfig.ts
# Appliquer Correction 3

# 4. Corriger prisma/schema.prisma
nano prisma/schema.prisma
# Appliquer Correction 4

# Stage
git add src/ prisma/
git commit -m "fix: backend environment configuration"
```

### ✅ 3. Appliquer les corrections frontend

```bash
cd ../clo5-front-main

# 5. Corriger next.config.js
nano next.config.js
# Appliquer Correction 5

# 6. Corriger lib/api.ts
nano lib/api.ts
# Appliquer Correction 6

# 7. Créer .env.local
cat > .env.local << 'EOF'
# Colle le contenu de Correction 7
EOF

# Stage
git add next.config.js lib/api.ts .env.local
git commit -m "config: frontend environment configuration"
```

### ✅ 4. Backend .env.local

```bash
cd ../clo5-backend-master

# 8. Créer .env.local
cat > .env.local << 'EOF'
# Colle le contenu de Correction 8
EOF

git add .env.local
git commit -m "env: backend local development configuration"

cd ..
```

### ✅ 5. Push et Merge Request

```bash
# Push
git push origin fix/env-configuration

# OU direct merge (si confiance)
git checkout develop
git merge fix/env-configuration
git push origin develop
```

---

## Validation locale avant push

### Test Backend

```bash
cd clo5-backend-master

# Install deps
npm install

# Test syntax
npm run build

# Run local dev
PORT=3001 DB_HOST=localhost npm run dev

# Expect
# Server running on port 3001
# [DatabaseConfig] Connecting to localhost:3306/quantum_motors (env: development)
# ✅
```

### Test Frontend

```bash
cd clo5-front-main

# Install deps
npm install

# Test build
npm run build

# Run local dev
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev

# Expect
# ready - started server on 0.0.0.0:3000, url: http://localhost:3000
# ✅
```

### Test API endpoint

```bash
# Terminal 1 : Backend
cd clo5-backend-master
PORT=3001 npm run dev

# Terminal 2 : Frontend
cd clo5-front-main
npm run dev

# Terminal 3 : Test
curl http://localhost:3001/
# Output : {"status":"OK","service":"quantum-motors-api",...}

# Browser
# Open http://localhost:3000
# Should load without CORS errors
```

---

## Intégration CI/CD (après push)

```
Après push → develop → GitLab CI trigger

Pipeline exécution :
1. build_backend
   ✅ npm install + npm run build
   
2. build_frontend
   ✅ npm install + npm run build
   
3. push_images
   ✅ Tag et push registry

4. deploy_preprod
   ✅ Update Docker services preprod_*
   
5. test_preprod  
   ✅ Smoke tests
   
6. Review merging → main pour production

Voir PROC-05-cicd-validation.md pour détails
```

---

## Checklist validation

```
✅ Corrections appliquées

☑ Backend
  ☑ src/index.ts — PORT env variable
  ☑ src/Controller/index.ts — GET / endpoint
  ☑ src/Utils/DatabaseConfig.ts — DB env variables
  ☑ prisma/schema.prisma — Binary targets
  ☑ .env.local créé

☑ Frontend
  ☑ next.config.js — API URL env
  ☑ lib/api.ts — apiClient utilise config
  ☑ .env.local créé

✅ Git ready
  ☑ Branch fix/env-configuration (ou develop)
  ☑ 8 commits cohérents
  ☑ Push effectué

✅ Local validation
  ☑ Backend build ✅
  ☑ Frontend build ✅
  ☑ GET / response OK
  ☑ Frontend → API pas de CORS error

✅ Prochaine étape
  ☑ Suivre BLOC 4 (Documentation 0-bis)
  ☑ Puis BLOC 5 (Soutenance args)
```

---

## Signature

**Date :** 2026-04-13  
**Bloc :** 3/5  
**Complétude :** 100% (8 corrections fichiers)  
**Prochaine étape :** Bloc 4 (Doc technique complète)
