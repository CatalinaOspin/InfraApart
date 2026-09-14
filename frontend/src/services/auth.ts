import apiClient from './api';
import { User, ApiResponse } from '../types';

// TODO: Implementar los servicios de autenticación

/**
 * Iniciar sesión
 */
export const login = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
    email,
    password,
  });
  return response.data.data!;
};

/**
 * Registrar un nuevo usuario
 */
export const register = async (userData: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<User> => {
  const response = await apiClient.post<ApiResponse<User>>('/auth/register', userData);
  return response.data.data!;
};

/**
 * Obtener el perfil del usuario actual
 */
export const getProfile = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
  return response.data.data!;
};

/**
 * Cerrar sesión
 */
export const logout = (): void => {
  localStorage.removeItem('infraapart_token');
};