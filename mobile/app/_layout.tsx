import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import Toast from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { getToken, getUser } from '@/utils/storage';

/**
 * Root layout with navigation and authentication check
 */

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, setAuth } = useAuthStore();

  useEffect(() => {
    // Check for stored token on app load
    checkStoredAuth();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      // User not authenticated, redirect to login
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User authenticated but on login screen, redirect to profile-setup
      router.replace('/profile-setup');
    }
  }, [isAuthenticated, segments, isReady]);

  const checkStoredAuth = async () => {
    try {
      const token = await getToken();
      const user = await getUser();

      if (token && user) {
        // Restore authentication state
        await setAuth(token, user);
      }
    } catch (error) {
      console.error('Failed to restore auth:', error);
    } finally {
      setIsReady(true);
    }
  };

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="profile-setup" />
      </Stack>
      <Toast />
    </>
  );
}
