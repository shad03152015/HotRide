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

// Stage 2: Registration and Verification API Calls

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}

/**
 * Register new user
 */
export async function register(
  fullName: string,
  email: string,
  password: string
): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>('/auth/register', {
    full_name: fullName,
    email,
    password,
  });
  return response.data;
}

/**
 * Verify email with code
 */
export async function verifyEmail(
  email: string,
  code: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/verify-email', {
    email,
    code,
  });
  return response.data;
}

/**
 * Resend email verification code
 */
export async function resendEmailCode(email: string): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>('/auth/resend-email-code', {
    email,
    code: '', // Backend doesn't use this for resend
  });
  return response.data;
}

/**
 * Send phone verification code
 */
export async function sendPhoneCode(phone: string): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>('/auth/send-phone-code', {
    phone,
  });
  return response.data;
}

/**
 * Verify phone with code
 */
export async function verifyPhone(
  phone: string,
  code: string
): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>('/auth/verify-phone', {
    phone,
    code,
  });
  return response.data;
}

/**
 * Update profile setup
 */
export async function profileSetup(data: {
  full_name?: string;
  phone?: string;
  profile_picture_url?: string;
}): Promise<User> {
  const response = await api.post<User>('/auth/profile-setup', data);
  return response.data;
}

/**
 * Update authenticated user's profile
 * Requires Authorization header with Bearer token
 * Only updates full_name and profile_picture_url
 */
export async function updateProfile(data: {
  full_name?: string;
  profile_picture_url?: string;
}): Promise<User> {
  const response = await api.put<User>('/auth/update-profile', data);
  return response.data;
}
