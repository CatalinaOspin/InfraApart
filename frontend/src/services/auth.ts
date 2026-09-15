import apiClient from './api';
import { ApiResponse, LoginResponse, RegisterInput, User } from '../types';
import { clearAuthStorage } from './storage';

/**
 * Servicios de autenticación conectados al backend (/api/auth/*).
 */

/** POST /auth/login → { token, user } */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
  return data.data!;
};

/** POST /auth/register → user (el rol "citizen" lo fuerza el servidor) */
export const register = async (userData: RegisterInput): Promise<User> => {
  const { data } = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', userData);
  return data.data!.user;
};

/** GET /auth/profile → usuario del token (restauración de sesión) */
export const getProfile = async (): Promise<User> => {
  const { data } = await apiClient.get<ApiResponse<User>>('/auth/profile');
  return data.data!;
};

/** Cerrar sesión: elimina el token y el usuario de localStorage */
export const logout = (): void => {
  clearAuthStorage();
};