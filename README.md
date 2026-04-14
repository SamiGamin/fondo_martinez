# Fondo Martínez 💰

Aplicación web moderna y responsiva para la gestión integral de fondos compartidos. Permite registrar pagos mensuales, visualizar estadísticas, y mantener un control financiero en tiempo real mediante sincronización con Firebase.

## 🎯 Características Principales

- **Matriz de Pagos**: Visualización clara del estado de pagos por persona y mes
- **Dashboard Financiero**: Estadísticas agregadas y tendencias de gastos
- **Sincronización en Tiempo Real**: Actualización instantánea con Firebase Realtime Database
- **Modo Oscuro**: Interfaz adaptable al tema del sistema operativo
- **PWA Compatible**: Instalable como aplicación de escritorio nativa
- **Control de Año**: Navegación y filtrado por año fiscal
- **Responsive Design**: Funciona perfectamente en móviles, tablets y escritorio

## 🛠️ Stack Tecnológico

### Frontend
- **React** (v19.2.5) - Biblioteca UI moderna con hooks funcionales
- **Vite** (v8.0.8) - Bundler ultra rápido con HMR
- **Tailwind CSS** (v4.2.2) - Framework CSS utility-first
- **Lucide React** (v1.8.0) - Iconografía vectorial de calidad

### Backend & Base de Datos
- **Firebase** (v12.12.0) - Backend como servicio completo
  - Authentication (opcional para futuras mejoras)
  - Realtime Database para sincronización en tiempo real
  - Analytics para seguimiento de uso

### Herramientas de Desarrollo
- **PostCSS** - Procesador CSS avanzado
- **Autoprefixer** - Compatibilidad automática entre navegadores
- **Vite PWA Plugin** - Capacidades de Progressive Web App

## 📋 Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x o **yarn** >= 3.x
- Cuenta y proyecto configurado en [Firebase Console](https://console.firebase.google.com)

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/SamiGamin/fondo_martinez.git
cd fondo_martinez
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Las credenciales de Firebase se cargan desde un archivo `.env` para evitar exponer datos sensibles:

#### Paso 1: Copiar el archivo de ejemplo

```bash
cp .env.example .env
```

#### Paso 2: Obtener credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Proyecto > Configuración > SDK setup**
4. Copia la configuración web

#### Paso 3: Completar el archivo `.env`

```env
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://tu_project-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id

VITE_ENV=development
```

> ⚠️ **Importante**: El archivo `.env` NO debe ser committeado a Git. Ya está incluido en `.gitignore`.

## 📦 Estructura del Proyecto

```
fondo_martinez/
├── public/                 # Archivos estáticos y manifest PWA
├── src/
│   ├── api/
│   │   └── firebase.js     # Configuración e inicialización de Firebase
│   ├── hooks/
│   │   └── usePayments.js  # Hook personalizado para gestión de pagos
│   ├── services/
│   │   └── paymentService.js # Servicios de acceso a datos (Firebase)
│   ├── utils/
│   │   ├── dataTransformers.js    # Transformación de datos brutos
│   │   └── financeTransformers.js # Cálculos y transformaciones financieras
│   ├── App.jsx             # Componente raíz de la aplicación
│   ├── index.css           # Estilos globales
│   ├── main.jsx            # Punto de entrada de React
├── index.html              # Archivo HTML principal
├── vite.config.js          # Configuración de Vite
├── tailwind.config.js      # Configuración de Tailwind CSS
├── postcss.config.js       # Configuración de PostCSS
├── package.json            # Dependencias y scripts
└── README.md               # Este archivo
```

## 🎮 Scripts Disponibles

### Desarrollo
```bash
npm run dev
```
Inicia el servidor de desarrollo con HMR en `http://localhost:5173`

### Producción
```bash
npm run build
```
Genera la compilación optimizada para producción en la carpeta `dist/`

### Vista Previa
```bash
npm run preview
```
Sirve la compilación de producción localmente para verificar antes de desplegar

## 🏗️ Arquitectura

### Flujo de Datos

```
Firebase Realtime Database
           ↓
    paymentService.js (subscribeToPayments)
           ↓
    usePayments Hook (gestión de estado)
           ↓
    App.jsx (consumidor)
           ↓
    Componentes de UI (render)
```

### Componentes Principales

- **`App.jsx`**: Componente raíz que maneja el estado global, tema y lógica PWA
- **`usePayments`**: Hook personalizado que:
  - Suscribe a cambios en Firebase
  - Transforma datos brutos en matriz usable
  - Calcula estadísticas financieras
  
- **`paymentService.js`**: Capa de abstracción para operaciones con Firebase

## 📊 Funcionalidades en Detalle

### Matriz de Pagos
Visualiza quién ha pagado en cada mes del año seleccionado:
- Indicadores visuales (checkmark para pagado, círculo para no pagado)
- Ordenamiento automático por cantidad de pagos realizados
- Navegación entre años

### Panel Financiero
Muestra estadísticas agregadas:
- Total de fondos recolectados
- Desglose por persona
- Tendencias de pagos

### Modo PWA
La aplicación puede instalarse como app nativa:
- Botón "Instalar" visible cuando la plataforma lo soporta
- Funciona sin conexión con datos en caché
- Icono personalizado en el escritorio

## 🔐 Consideraciones de Seguridad

### Variables de Entorno

Las credenciales sensibles se deben mantener en variables de entorno, **nunca en el código**:

- Archivos `.env` están excluidos de Git via `.gitignore`
- Usa `.env.example` como plantilla
- Las variables con prefijo `VITE_` están disponibles en el navegador (no guardes secrets aquí)
- En producción, configura variables en:
  - **Vercel/Netlify**: Environment Variables en la dashboard
  - **Firebase Hosting**: `firebase deploy --only functions` con `.env` en build
  - **Cloud Run**: Secret Manager o variables de entorno del contenedor

### Validación de Configuración

Si falta alguna variable de entorno, la consola mostrará un error:

```
Variables de entorno faltantes: VITE_FIREBASE_API_KEY, ...
Por favor, copia .env.example a .env y completa los valores.
```

### Firebase Security Rules

1. **Restricción por Autenticación**: Implementar Firebase Authentication
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```

2. **Validación de Estructura**: Validar que solo se escriban datos válidos

3. **Rate Limiting**: Considerar usar Cloud Functions con tasa de limitación

### HTTPS en Producción

Las PWA requieren HTTPS. Todos los hosting recomendados lo proporcionan automáticamente.

## 🚀 Despliegue

### Opción 1: Google Cloud Run (Recomendado)
```bash
npm run build
# Usar el archivo docker/Dockerfile si existe
# Deployar a Cloud Run
```

### Opción 2: Vercel / Netlify
```bash
npm run build
# Conectar repositorio y seguir las instrucciones del servicio
```

### Opción 3: Firebase Hosting
```bash
npm run build
firebase deploy
```

## 🐛 Troubleshooting

### Firebase no carga datos
- Verificar configuración en `src/api/firebase.js`
- Revisar Firebase Security Rules
- Comprobar estructura de datos en Firebase Console

### PWA no se instala
- Solo funciona en HTTPS (excepto localhost)
- Verificar archivo `public/manifest.json`
- Revisar console para errores de service worker

### Estilos Tailwind no aplican
- Ejecutar `npm install` nuevamente
- Limpiar caché: `rm -rf node_modules/.cache`
- Reiniciar servidor dev

## 📈 Roadmap Futuro

- [ ] Autenticación de usuarios
- [ ] Reportes y exportación de datos (PDF/Excel)
- [ ] Notificaciones de pagos pendientes
- [ ] Editor de pagos (agregar, editar, eliminar)
- [ ] Suporte multimoneda
- [ ] Historial de cambios y auditoría
- [ ] Integración con pasarelas de pago

## 🤝 Contribución

Las contribuciones son bienvenidas. Para cambios significativos:

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

Por favor, asegúrate de:
- Mantener consistencia de código
- Agregar comentarios en funciones complejas
- Probar cambios antes de commit
- Actualizar documentación

## 📄 Licencia

Este proyecto está bajo la licencia ISC. Ver el archivo LICENSE para detalles.

## 👨‍💻 Autor

**SamiGamin** - [GitHub Profile](https://github.com/SamiGamin)

## 📧 Soporte

Para reportar bugs o sugerir features, abre un [issue en GitHub](https://github.com/SamiGamin/fondo_martinez/issues)

---

**Última actualización**: Abril 2026