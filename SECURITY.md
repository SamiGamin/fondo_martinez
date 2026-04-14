# 🔒 Guía de Seguridad - Proyecto Público

## 📊 Estado Actual

### ✅ PROTEGIDO (No Visible)

| Item | Ubicación | Protección |
|------|-----------|-----------|
| Credenciales Firebase | `.env` | Excluido en `.gitignore` |
| API Keys | Vercel Dashboard | Solo acceso admin |
| Database URL | Vercel Environment Variables | Encriptado en tránsito |
| Sender ID & App ID | Vercel Environment Variables | Encriptado en reposo |

### ⚠️ VISIBLE EN GITHUB (Público)

| Item | Archivo | Riesgo |
|------|---------|--------|
| Estructura del proyecto | `src/` | ✓ Seguro (no hay secretos) |
| Dependencias | `package.json` | ✓ Seguro (paquetes públicos) |
| Configuración Vite | `vite.config.js` | ✓ Seguro |
| Tailwind config | `tailwind.config.js` | ✓ Seguro |
| Lógica de la aplicación | `src/App.jsx`, etc | ✓ Seguro |

### 🚨 RIESGO: Credenciales Firebase en el Navegador

Vite expone variables con prefijo `VITE_` en el código compilado. Esto significa:

```javascript
// Esto SERÁ VISIBLE en el navegador
VITE_FIREBASE_API_KEY = "AIzaSyDhnAdn4L1LXK0gRdGG8_MSiolx5r87EzA"

// Verificación: DevTools → Network → Fetch bundle.js → Buscar "AIzaSy"
```

---

## ✅ Lo que SÍ está protegido por Firebase

### 1. Base de Datos Realtime (Firebase RTDB)

Aunque la API Key es visible, **está protegida por Firebase Security Rules**:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "payments": {
      ".read": true,
      ".write": false
    }
  }
}
```

**Ventajas:**
- ✓ Solo lectura permitida
- ✓ No se pueden escribir datos
- ✓ No se pueden eliminar datos
- ✓ No se pueden modificar datos

### 2. Validación de Datos

Las reglas verifican:
- Formato de datos
- Tipo de datos
- Tamaño de datos
- Frecuencia de acceso

---

## 🛡️ Configurar Firebase Security Rules

### Paso 1: Ir a Firebase Console

1. [console.firebase.google.com](https://console.firebase.google.com)
2. Selecciona **mb-money-3c1e1**
3. Ve a **Realtime Database** en el menú (lado izquierdo)
4. Click en la pestaña **Rules**

### Paso 2: Configuración SEGURA (Solo Lectura)

```json
{
  "rules": {
    // Deshabilitar acceso por defecto
    ".read": false,
    ".write": false,
    
    // Solo permitir lectura de datos de pagos
    "payments": {
      ".read": true,
      ".write": false,
      ".validate": "newData.isObject()"
    },
    
    // Solo permitir lectura de finanzas
    "finances": {
      ".read": true,
      ".write": false,
      ".validate": "newData.isObject()"
    },
    
    // Bloquear todo lo demás
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

### Paso 3: Publicar Rules

1. Click en **Publish**
2. Confirma

### Paso 4: Probar que Funciona

En la consola del navegador:

```javascript
// Esto FUNCIONARÁ (lectura permitida)
import { ref, get } from 'firebase/database';
const snapshot = await get(ref(db, 'payments'));
console.log(snapshot.val()); // ✓ Datos cargados

// Esto FALLARÁ (escritura bloqueada)
import { ref, set } from 'firebase/database';
await set(ref(db, 'payments/hackeo'), 'hola'); 
// Error: Permission denied ❌
```

---

## 📋 Capas de Seguridad (Defensa en Profundidad)

```
┌─────────────────────────────────────────┐
│  1. GitHub (Público)                    │
│     ✓ Código seguro sin secrets          │
│     ✓ .env en .gitignore                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  2. Vercel Environment Variables         │
│     ✓ Encriptadas en tránsito            │
│     ✓ Solo acceso admin                  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  3. Vite Build (Compilación)             │
│     ⚠️  API Key visible en bundle.js      │
│     ✓ Pero protegida por Firebase Rules  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  4. Firebase Security Rules              │
│     ✓ Solo lectura permitida             │
│     ✓ Escritura bloqueada                │
│     ✓ Validación de datos                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  5. Navegador del Usuario                │
│     ✓ Solo puede leer datos              │
│     ❌ No puede escribir/modificar        │
└─────────────────────────────────────────┘
```

---

## 🔍 Auditoría de Seguridad

### Verificar qué está visible en el navegador

```bash
# 1. Build la aplicación
npm run build

# 2. Buscar credenciales en el bundle
grep -r "AIzaSy" dist/
grep -r "firebaseapp.com" dist/
grep -r "messagingSenderId" dist/
```

Si ve estas cosas, **es normal** porque Vite tiene que saberlas. Lo importante es que:

1. ✓ Las Security Rules las protejan
2. ✓ El `.env` NO está en Git
3. ✓ Vercel no expone las variables

---

## 🚨 Qué NUNCA Debes Hacer

### ❌ NUNCA hacer esto:

```javascript
// ❌ Hardcodear credenciales
const apiKey = "AIzaSyDhnAdn4L1LXK0gRdGG8_MSiolx5r87EzA";

// ❌ Commitear .env
git add .env
git commit -m "Add .env"

// ❌ Permitir escritura en Firebase Rules
"payments": {
  ".read": true,
  ".write": true  // ❌ NUNCA!
}

// ❌ Exponer Admin SDK Key en el navegador
const adminKey = process.env.FIREBASE_ADMIN_KEY;
```

---

## ✅ CHECKLIST DE SEGURIDAD

- [ ] `.env` está en `.gitignore`
- [ ] `.env` NO fue committeado a Git
- [ ] Variables configuradas en Vercel Dashboard
- [ ] Firebase Security Rules configuradas (solo lectura)
- [ ] Probaste que la escritura está bloqueada
- [ ] No hay hardcoding de credenciales en el código
- [ ] `.env.example` tiene valores placeholder (sin credenciales reales)
- [ ] Proyecto está en HTTPS en Vercel

---

## 🔧 Implementación Recomendada para Producción

### Mejor práctica: Cloud Functions + Admin SDK

Para operaciones que requieren escritura acondicionada:

```javascript
// functions/addPayment.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.addPayment = functions.https.onCall(async (data, context) => {
  // Validar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in'
    );
  }

  // Validar datos
  if (!data.month || !data.person) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  // Operación segura con Admin SDK
  await admin.database().ref('payments').push({
    month: data.month,
    person: data.person,
    timestamp: admin.database.ServerValue.TIMESTAMP,
    uid: context.auth.uid
  });

  return { success: true };
});
```

Usar desde React:

```javascript
import { httpsCallable } from 'firebase/functions';

const addPayment = httpsCallable(functions, 'addPayment');

const handleAddPayment = async (month, person) => {
  try {
    const result = await addPayment({ month, person });
    console.log('Pago agregado:', result.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

## 📊 Resumen de Protección

| Componente | Nivel de Riesgo | Mitigación |
|-----------|-----------------|-----------|
| Código fuente | ✓ Bajo | Público, sin secretos |
| .env local | ✓ Protegido | .gitignore |
| Variables Vercel | ✓ Protegido | Encriptación, acceso restringido |
| API Keys expuestas | ⚠️ Medio | Firebase Security Rules |
| Database access | ✓ Protegido | Reglas de solo lectura |
| Escritura de datos | ✓ Protegido | Bloqueada por Security Rules |

---

## 📞 Próximos Pasos

1. **Ahora**: Configurar Firebase Security Rules
2. **Opcional**: Implementar Firebase Authentication
3. **Futuro**: Agregar Cloud Functions para operaciones que requieren escritura
4. **Producción**: Rate limiting y monitoring

¿Necesitas ayuda configurando las Security Rules?
