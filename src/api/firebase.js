// src/api/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; // Añadido para Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyDhnAdn4L1LXK0gRdGG8_MSiolx5r87EzA",
  authDomain: "mb-money-3c1e1.firebaseapp.com",
  databaseURL: "https://mb-money-3c1e1-default-rtdb.firebaseio.com",
  projectId: "mb-money-3c1e1",
  storageBucket: "mb-money-3c1e1.firebasestorage.app",
  messagingSenderId: "538290158706",
  appId: "1:538290158706:web:880b8f67b4e0e2aed156eb",
  measurementId: "G-EYQRRYDFPZ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app); 

// Inicializar y exportar la Base de Datos para usarla en los servicios
export const db = getDatabase(app);