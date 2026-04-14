import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Importamos los estilos globales y Tailwind

// 1. IMPORTAMOS EL REGISTRO DEL PWA
import { registerSW } from 'virtual:pwa-register'

// 2. LO ENCENDEMOS AUTOMÁTICAMENTE
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)