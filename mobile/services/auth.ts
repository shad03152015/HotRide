import api from './api';

/**
 * Authentication API calls
 */

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface GoogleAuthRequest {
  id_token: string;
}

export interface AppleAuthRequest {
  identity_token: string;
  nonce: string;
  user_data?: {
    email?: string;
    full_name?: string;
  };
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  profile_picture_url?: string;
  oauth_provider: 'email' | 'google' | 'apple';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * Email/Phone + Password login
 */
export async function login(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', {
    identifier,
    password,
  });
  return response.data;
}

/**
 * Google OAuth authentication
 */
export async function googleAuth(idToken: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/google', {
    id_token: idToken,
  });
  return response.data;
}

/**
 * Apple Sign In authentication
 */
export async function appleAuth(
  identityToken: string,
  nonce: string,
  userData?: any
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/apple', {
    identity_token: identityToken,
    nonce,
    user_data: userData,
  });
  return response.data;
}
