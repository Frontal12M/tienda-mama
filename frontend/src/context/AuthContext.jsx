import { createContext, useContext, useState, useEffect } from 'react';
import { loginAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Revisar si hay sesion guardada
    try {
      const saved = localStorage.getItem('tienda_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar que el token no haya expirado (decodificar payload)
        if (parsed.token) {
          const payload = JSON.parse(atob(parsed.token.split('.')[1]));
          const now = Date.now() / 1000;
          if (payload.exp > now) {
            setUser(parsed);
          } else {
            localStorage.removeItem('tienda_user');
          }
        }
      }
    } catch {
      localStorage.removeItem('tienda_user');
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await loginAPI(username, password);
    const userData = {
      token: data.token,
      nombre: data.nombre,
      rol: data.rol,
      username: data.username,
    };
    localStorage.setItem('tienda_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('tienda_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
