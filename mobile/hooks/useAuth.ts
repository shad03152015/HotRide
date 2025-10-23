import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { login as apiLogin } from '@/services/auth';
import { User } from '@/services/auth';

/**
 * Authentication hook for email/phone login
 */

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setAuth, logout: storeLogout, user, isAuthenticated } = useAuthStore();

  const login = async (identifier: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiLogin(identifier, password);
      await setAuth(response.access_token, response.user);
      router.replace('/profile-setup');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await storeLogout();
    router.replace('/login');
  };

  return {
    login,
    logout,
    isLoading,
    user,
    isAuthenticated,
  };
}
