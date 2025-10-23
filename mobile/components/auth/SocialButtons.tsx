import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Colors } from '@/constants/Colors';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAppleAuth } from '@/hooks/useAppleAuth';

export default function SocialButtons() {
  const { signInWithGoogle, isLoading: googleLoading } = useGoogleAuth();
  const { signInWithApple, isAvailable: appleAvailable, isLoading: appleLoading } = useAppleAuth();

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        onPress={signInWithGoogle}
        disabled={googleLoading}
        style={styles.googleButton}
        activeOpacity={0.7}
      >
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      {appleAvailable && Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.appleButton}
          onPress={signInWithApple}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.placeholder,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondary,
  },
  appleButton: {
    height: 48,
    marginBottom: 8,
  },
});
