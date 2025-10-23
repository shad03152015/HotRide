import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage utility using Expo SecureStore for secure token/user data storage
 * Falls back to AsyncStorage for web
 */

const TOKEN_KEY = 'hotride_auth_token';
const USER_KEY = 'hotride_user_data';

/**
 * Save JWT token securely
 */
export async function saveToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Failed to save token:', error);
    throw error;
  }
}

/**
 * Retrieve JWT token from storage
 */
export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
}

/**
 * Delete JWT token from storage
 */
export async function removeToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
}

/**
 * Save user data as JSON string
 */
export async function saveUser(user: any): Promise<void> {
  try {
    const userJson = JSON.stringify(user);
    if (Platform.OS === 'web') {
      localStorage.setItem(USER_KEY, userJson);
    } else {
      await SecureStore.setItemAsync(USER_KEY, userJson);
    }
  } catch (error) {
    console.error('Failed to save user:', error);
    throw error;
  }
}

/**
 * Retrieve and parse user data
 */
export async function getUser(): Promise<any | null> {
  try {
    let userJson: string | null;
    if (Platform.OS === 'web') {
      userJson = localStorage.getItem(USER_KEY);
    } else {
      userJson = await SecureStore.getItemAsync(USER_KEY);
    }

    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

/**
 * Delete user data from storage
 */
export async function removeUser(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.error('Failed to remove user:', error);
  }
}
