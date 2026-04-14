# Configuración en Vercel

## 📍 Pasos para Configurar Variables de Entorno en Vercel

### 1. Acceder a Vercel

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Busca tu proyecto **fondo_martinez**

### 2. Ir a Configuración del Proyecto

1. Click en el proyecto
2. Ve a la pestaña **Settings** (Configuración)
3. En el menú lateral, selecciona **Environment Variables**

### 3. Agregar las Variables

Para cada variable, haz click en **"Add New"** e ingresa:

**Variable 1:**
- Name: `VITE_FIREBASE_API_KEY`
- Value: `AIzaSyDhnAdn4L1LXK0gRdGG8_MSiolx5r87EzA`
- Environments: Marca ✓ Production, Preview, Development

**Variable 2:**
- Name: `VITE_FIREBASE_AUTH_DOMAIN`
- Value: `mb-money-3c1e1.firebaseapp.com`
- Environments: Marca ✓ Production, Preview, Development

**Variable 3:**
- Name: `VITE_FIREBASE_DATABASE_URL`
- Value: `https://mb-money-3c1e1-default-rtdb.firebaseio.com`
- Environments: Marca ✓ Production, Preview, Development

**Variable 4:**
- Name: `VITE_FIREBASE_PROJECT_ID`
- Value: `mb-money-3c1e1`
- Environments: Marca ✓ Production, Preview, Development

**Variable 5:**
- Name: `VITE_FIREBASE_STORAGE_BUCKET`
- Value: `mb-money-3c1e1.firebasestorage.app`
- Environments: Marca ✓ Production, Preview, Development

**Variable 6:**
- Name: `VITE_FIREBASE_MESSAGING_SENDER_ID`
- Value: `538290158706`
- Environments: Marca ✓ Production, Preview, Development

**Variable 7:**
- Name: `VITE_FIREBASE_APP_ID`
- Value: `1:538290158706:web:880b8f67b4e0e2aed156eb`
- Environments: Marca ✓ Production, Preview, Development

**Variable 8:**
- Name: `VITE_FIREBASE_MEASUREMENT_ID`
- Value: `G-EYQRRYDFPZ`
- Environments: Marca ✓ Production, Preview, Development

**Variable 9:**
- Name: `VITE_ENV`
- Value: `production`
- Environments: Marca ✓ Production

### 4. Redeploy del Proyecto

Después de agregar las variables:

1. Ve a la pestaña **Deployments**
2. Busca el último deployment
3. Click en los **3 puntos** → **Redeploy**
4. Selecciona **Redeploy** nuevamente

O simplemente haz un `git push` en GitHub y Vercel se redesplegará automáticamente.

### 5. Verificar que Funciona

1. Ve a tu URL en Vercel (ej: `https://fondo-martinez.vercel.app`)
2. Abre DevTools (F12)
3. Ve a **Console** y verifica que NO hay errores sobre "Variables de entorno faltantes"
4. Los datos de Firebase deben cargar correctamente

---

## 🔄 Workflow en GitHub Codespace

### Cada vez que hagas cambios:

```bash
# 1. Ver cambios
git status

# 2. Agregar cambios
git add .

# 3. Commit
git commit -m "Descripción del cambio"

# 4. Push a GitHub
git push

# 5. Vercel se desplegará automáticamente
# Monitorear en https://vercel.com/dashboard
```

### Verificar logs de Vercel:

1. Dashboard de Vercel → Tu proyecto
2. Pestaña **Deployments**
3. Click en el deployment más reciente
4. Ve a **Logs** para ver errores de build

---

## ✅ Checklist

- [ ] Variables agregadas en Vercel Environment Variables
- [ ] Marcadas para Production, Preview y Development
- [ ] Redeployment completado
- [ ] Sin errores en DevTools Console
- [ ] Datos de Firebase cargan correctamente
- [ ] PWA instala correctamente en Vercel

---

## 📞 Soporte

Si algo no funciona:

1. **Verifica los logs de build** en Deployments
2. **Limpia caché** del navegador (Ctrl+Shift+Del)
3. **Fuerza un redeploy** desde Vercel
4. **Revisa que los valores estén exactos** (sin espacios)
