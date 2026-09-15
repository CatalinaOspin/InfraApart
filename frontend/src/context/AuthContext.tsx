import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { RegisterInput, User } from '../types';
import {
  getProfile,
  login as loginService,
  logout as logoutService,
  register as registerService,
} from '../services/auth';
import {
  clearAuthStorage,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '../services/storage';

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  /** true mientras se valida un token existente al recargar la app */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Sesión persistida: se restaura el usuario guardado de inmediato y luego se
  // valida contra GET /auth/profile (si el token venció/no es válido, se limpia).
  const [user, setUser] = useState<User | null>(() => getStoredUser<User>());
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) {
      setIsLoading(false);
      return;
    }
    let active = true;
    getProfile()
      .then((profile) => {
        if (!active) return;
        setStoredUser(profile);
        setUser(profile);
      })
      .catch(() => {
        if (!active) return;
        clearAuthStorage();
        setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedUser } = await loginService(email, password);
    setToken(token);
    setStoredUser(loggedUser);
    setUser(loggedUser);
  }, []);

  const register = useCallback(
    async (userData: RegisterInput) => {
      await registerService(userData);
      // Tras registrarse se inicia sesión automáticamente (obtiene el JWT).
      await login(userData.email, userData.password);
    },
    [login]
  );

  const logout = useCallback(() => {
    logoutService();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextProps>(
    () => ({ user, isAuthenticated: !!user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};