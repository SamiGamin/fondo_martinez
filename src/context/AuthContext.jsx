import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../api/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      let mensaje = 'Error al iniciar sesión';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        mensaje = 'Correo electrónico o contraseña incorrectos.';
      } else if (err.code === 'auth/invalid-email') {
        mensaje = 'El formato del correo electrónico no es válido.';
      } else if (err.code === 'auth/too-many-requests') {
        mensaje = 'Demasiados intentos fallidos. Intenta más tarde.';
      } else {
        mensaje = err.message || mensaje;
      }
      setAuthError(mensaje);
      throw new Error(mensaje);
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err) {
      let mensaje = 'Error al iniciar sesión con Google';
      if (err.code === 'auth/popup-closed-by-user') {
        mensaje = 'Inicio de sesión con Google cancelado.';
      } else if (err.code === 'auth/popup-blocked') {
        mensaje = 'La ventana emergente fue bloqueada por el navegador. Por favor permite las ventanas emergentes.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        mensaje = 'Solicitud de ventana emergente cancelada.';
      } else {
        mensaje = err.message || mensaje;
      }
      setAuthError(mensaje);
      throw new Error(mensaje);
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin: !!currentUser,
        loading,
        authError,
        setAuthError,
        login,
        loginWithGoogle,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
