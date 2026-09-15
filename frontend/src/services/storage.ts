/**
 * Almacenamiento local de la sesión (token JWT + usuario).
 * Claves compartidas por el interceptor de axios y el AuthContext.
 */

export const TOKEN_KEY = 'infraapart_token';
export const USER_KEY = 'infraapart_user';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getStoredUser = <T>(): T | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setStoredUser = <T>(user: T): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/** Elimina token + usuario (logout o respuesta 401). */
export const clearAuthStorage = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};