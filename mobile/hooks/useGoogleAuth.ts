import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Config } from '@/constants/Config';
import { useAuthStore } from '@/store/authStore';
import { googleAuth } from '@/services/auth';
import { showError } from '@/utils/toast';

/**
 * Google OAuth authentication hook
 */

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // Configure Google Sign In
    GoogleSignin.configure({
      webClientId: Config.GOOGLE_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      // Get ID token
      const idToken = userInfo.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Send token to backend
      const response = await googleAuth(idToken);

      // Store token and user data
      await setAuth(response.access_token, response.user);

      // Navigate to ProfileSetup
      router.replace('/profile-setup');
    } catch (error: any) {
      // Handle specific Google Sign In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled - silent, no error
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        showError('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showError('Google Play Services not available');
      } else if (error.response?.data?.detail) {
        showError(error.response.data.detail);
      } else {
        showError('Sign in with Google failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    isLoading,
  };
}
