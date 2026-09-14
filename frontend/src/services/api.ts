import axios, { AxiosInstance } from 'axios';

/**
 * Instancia de Axios configurada para la API de InfraApart
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones: agrega el token JWT si existe
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('infraapart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuestas: manejo centralizado de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('infraapart_token');
      // TODO: Redirigir a login
    }
    return Promise.reject(error);
  }
);

export default apiClient;