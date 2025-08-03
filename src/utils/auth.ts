import { env, envUtils } from '@/config/env';

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(env.AUTH_TOKEN_KEY);
  return !!token;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(env.AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(env.AUTH_TOKEN_KEY, token);
  envUtils.log('debug', 'Auth token stored');
};

export const getUserData = () => {
  const userData = localStorage.getItem(env.AUTH_USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const setUserData = (userData: any): void => {
  localStorage.setItem(env.AUTH_USER_KEY, JSON.stringify(userData));
  envUtils.log('debug', 'User data stored');
};

export const logout = () => {
  localStorage.removeItem(env.AUTH_TOKEN_KEY);
  localStorage.removeItem(env.AUTH_USER_KEY);
  envUtils.log('info', 'User logged out');
};