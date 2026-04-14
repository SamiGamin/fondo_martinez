# Guía de Despliegue y Variables de Entorno

## 📋 Índice

1. [Desarrollo Local](#desarrollo-local)
2. [Vercel](#vercel)
3. [Netlify](#netlify)
4. [Firebase Hosting](#firebase-hosting)
5. [Google Cloud Run](#google-cloud-run)

---

## Desarrollo Local

### Configuración Inicial

```bash
# 1. Copiar archivo de ejemplo
cp .env.example .env

# 2. Editar .env con tus credenciales de Firebase
nano .env

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:5173`

---

## Vercel

### Opción 1: Desde GitHub (Recomendado)

1. **Conectar Repositorio**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "New Project"
   - Selecciona tu repositorio de GitHub

2. **Configurar Variables de Entorno**
   - En "Environment Variables", agrega cada variable:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_DATABASE_URL`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID`

3. **Deploy**
   - Click en "Deploy"
   - Vercel construirá automáticamente desde el repositorio

### Opción 2: CLI (Desarrollo)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Setup del proyecto (primera vez)
vercel --prod

# Configurar variables en vercel.json
{
  "env": {
    "VITE_FIREBASE_API_KEY": "@firebase_api_key",
    "VITE_FIREBASE_AUTH_DOMAIN": "@firebase_auth_domain"
  }
}

# Deploy
vercel --prod
```

---

## Netlify

### Opción 1: Desde GitHub

1. **Conectar Repositorio**
   - Ve a [netlify.com](https://app.netlify.com)
   - Click en "New site from Git"
   - Selecciona tu repositorio

2. **Configurar Build**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Variables de Entorno**
   - Ve a "Site settings > Build & deploy > Environment"
   - Agrega cada variable VITE_*

4. **Deploy**
   - Netlify desplegará automáticamente con cada push

### Opción 2: CLI

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Setup del sitio
netlify init

# Configurar variables
netlify env:set VITE_FIREBASE_API_KEY "tu_valor_aqui"
netlify env:set VITE_FIREBASE_AUTH_DOMAIN "tu_valor_aqui"
# ... resto de variables

# Deploy
netlify deploy --prod
```

---

## Firebase Hosting

### Configuración

```bash
# Instalar Firebase CLI
npm i -g firebase-tools

# Login
firebase login

# Initialize Firebase en tu proyecto
firebase init hosting

# Configurar .firebaserc
{
  "projects": {
    "default": "tu_proyecto_id"
  },
  "targets": {
    "tu_proyecto_id": {
      "hosting": {
        "default": ["tu-sitio"]
      }
    }
  }
}
```

### Usando .env en Firebase Hosting

Firebase Hosting no soporta archivos `.env` directamente. Opciones:

#### Opción 1: Compilar con variables locales

```bash
# Crear .env.production
cp .env.example .env.production
# Editar .env.production con valores de producción

# Build
npm run build

# Deploy
firebase deploy
```

#### Opción 2: Usar Cloud Functions (Recomendado para secretos)

```bash
# Configurar Secret Manager
gcloud secrets create firebase-api-key --data-file=- <<< "tu_valor"

# En firebase.json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}

# Usar en Cloud Function
const functions = require('firebase-functions');
const secretary = require('@google-cloud/secret-manager');

// Obtener secret
const getSecret = async (name) => {
  const [version] = await secretary.getSecretVersion({
    parent: `projects/PROJECT_ID/secrets/${name}/versions/latest`,
  });
  return version.payload.data.toString('utf-8');
};
```

#### Opción 3: Firebase Remote Config

```bash
# Crear valores en Firebase Console
# Proyecto > Remote Config

# En App.jsx
import firebase from 'firebase/app';
import 'firebase/remote-config';

const remoteConfig = firebase.remoteConfig();
await remoteConfig.fetchAndActivate();
const apiKey = remoteConfig.getString('firebase_api_key');
```

### Deploy

```bash
# Build
npm run build

# Deploy hosting
firebase deploy --only hosting

# Deploy todo (hosting + functions + rules)
firebase deploy
```

---

## Google Cloud Run

### Configuración

1. **Crear Dockerfile**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

2. **Configurar .env en Cloud Build**

```bash
# Crear archivo substitutions.yaml en Cloud Build
# Configurar en Google Cloud Console > Cloud Build > Triggers

# Agregar variables:
_VITE_FIREBASE_API_KEY=tu_valor
_VITE_FIREBASE_AUTH_DOMAIN=tu_valor
# ... etc
```

3. **cloudbuild.yaml**

```yaml
steps:
  # Build imagen
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/$_SERVICE_NAME:$SHORT_SHA'
      - '--build-arg'
      - 'VITE_FIREBASE_API_KEY=${_VITE_FIREBASE_API_KEY}'
      - '.'

  # Push a Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/$_SERVICE_NAME:$SHORT_SHA'

  # Deploy a Cloud Run
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - run
      - --filename=.
      - --image=gcr.io/$PROJECT_ID/$_SERVICE_NAME:$SHORT_SHA
      - '--location=us-central1'

substitutions:
  _SERVICE_NAME: fondo-martinez
  _VITE_FIREBASE_API_KEY: ''  # Sobreescribir en el trigger

options:
  machineType: N1_HIGHCPU_8

images:
  - 'gcr.io/$PROJECT_ID/$_SERVICE_NAME:$SHORT_SHA'
```

4. **Deploy**

```bash
# Deploy desde CLI
gcloud run deploy fondo-martinez \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars=VITE_FIREBASE_API_KEY=tu_valor
```

---

## ✅ Checklist de Despliegue

- [ ] Archivo `.env` creado desde `.env.example`
- [ ] Todas las variables `VITE_*` completadas
- [ ] `.env` está en `.gitignore` (no committeado)
- [ ] Variables configuradas en plataforma de hosting
- [ ] Build local funciona: `npm run build`
- [ ] Preview local funciona: `npm run preview`
- [ ] HTTPS habilitado en dominio
- [ ] Firebase Security Rules configuradas
- [ ] PWA manifest actualizado con dominio correcto
- [ ] Analytics seguido en Firebase Console

---

## 🚨 Troubleshooting

### Error: "Variables de entorno faltantes"

**Solución**: Asegúrate que `.env` existe y todas las variables están definidas:

```bash
# Verificar archivo
cat .env

# Copiar desde ejemplo si falta
cp .env.example .env
```

### Credenciales Firebase no funcionan

1. Verifica en Firebase Console que el proyecto existe
2. Revisa que `databaseURL` es correcto (sin trailling slash)
3. Comprueba Firebase Security Rules permiten lectura/escritura

### PWA no instala en producción

- Verifica HTTPS está habilitado
- Revisa `manifest.json` en `public/`
- Checkea Service Worker en DevTools

### Build falla con variables indefinidas

```bash
# Verificar que variables están correctas
echo $VITE_FIREBASE_API_KEY

# En Node
import.meta.env.VITE_FIREBASE_API_KEY
```

---

## 📚 Referencias

- [Documentación Vite Env](https://vitejs.dev/guide/env-and-modes.html)
- [Firebase Environment Variables](https://firebase.google.com/docs/cli/env)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Build Environment](https://docs.netlify.com/environment-variables/overview/)
- [Firebase Hosting Env](https://firebase.google.com/docs/hosting)
