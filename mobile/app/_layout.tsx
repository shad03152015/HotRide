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

    // Public routes that don't require authentication
    const publicRoutes = ['login', 'signup', 'verify-email', 'verify-phone', 'profile-setup-full', 'enable-location'];
    const currentRoute = segments[0];
    const isPublicRoute = publicRoutes.includes(currentRoute);

    if (!isAuthenticated && !isPublicRoute && currentRoute) {
      // User not authenticated and trying to access protected route
      router.replace('/login');
    } else if (isAuthenticated && currentRoute === 'login') {
      // User authenticated but on login screen, redirect to home
      router.replace('/home');
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
        <Stack.Screen name="signup" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="verify-phone" />
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="profile-setup-full" />
        <Stack.Screen name="enable-location" />
        <Stack.Screen name="home" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="ride-history" />
        <Stack.Screen name="ride-tracking" />
        <Stack.Screen name="chat" />
      </Stack>
      <Toast />
    </>
  );
}
