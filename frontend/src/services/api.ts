import axios, { AxiosError, AxiosInstance } from 'axios';
import { clearAuthStorage, getToken } from './storage';

/** Formato del cuerpo de error del backend (utils/responses.ts). */
export interface ApiErrorPayload {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Instancia de Axios para la API de InfraApart.
 * - baseURL: VITE_API_URL o el backend local (http://localhost:3001/api).
 * - Interceptor de peticiones: inyecta `Authorization: Bearer <token>`.
 * - Interceptor de respuestas: ante 401 limpia la sesión local.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
    }
    return Promise.reject(error);
  }
);

/** Extrae el mensaje legible de un error de Axios (usa los mensajes del backend). */
export const getApiErrorMessage = (error: unknown, fallback = 'Ocurrió un error inesperado'): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (data?.error && typeof data.error === 'string') return data.error;
    if (!error.response) return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.';
    return `Error ${error.response.status}: ${error.response.statusText || 'respuesta del servidor'}`;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

export default apiClient;