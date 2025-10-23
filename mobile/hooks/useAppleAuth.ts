import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useAuthStore } from '@/store/authStore';
import { appleAuth } from '@/services/auth';
import { showError } from '@/utils/toast';

/**
 * Apple Sign In authentication hook
 */

export function useAppleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // Check if Apple Sign In is available (iOS only)
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    const available = await AppleAuthentication.isAvailableAsync();
    setIsAvailable(available);
  };

  const signInWithApple = async (): Promise<void> => {
    if (!isAvailable) {
      showError('Apple Sign In is not available on this device');
      return;
    }

    setIsLoading(true);
    try {
      // Generate nonce for security
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString()
      );

      // Sign in with Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce,
      });

      // Extract identity token
      const { identityToken, email, fullName } = credential;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Prepare user data (only sent on first sign-in)
      const userData = email || fullName
        ? {
            email: email || undefined,
            full_name: fullName
              ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
              : undefined,
          }
        : undefined;

      // Send token to backend
      const response = await appleAuth(identityToken, nonce, userData);

      // Store token and user data
      await setAuth(response.access_token, response.user);

      // Navigate to ProfileSetup
      router.replace('/profile-setup');
    } catch (error: any) {
      // Handle Apple Sign In errors
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled - silent, no error
        return;
      } else if (error.response?.data?.detail) {
        showError(error.response.data.detail);
      } else {
        showError('Sign in with Apple failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithApple,
    isLoading,
    isAvailable,
  };
}
