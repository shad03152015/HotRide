import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PasswordInput from './PasswordInput';
import { Colors } from '@/constants/Colors';
import { validateEmail, validatePhone, validatePassword, isEmail } from '@/utils/validators';
import { showError } from '@/utils/toast';
import { login } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';

export default function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    // Frontend validation
    if (!identifier.trim()) {
      showError('Please enter your email or phone number');
      return;
    }

    if (!password) {
      showError('Please enter your password');
      return;
    }

    // Validate identifier format
    if (isEmail(identifier)) {
      if (!validateEmail(identifier)) {
        showError('Please enter a valid email address');
        return;
      }
    } else if (!validatePhone(identifier)) {
      showError('Please enter a valid phone number');
      return;
    }

    // Validate password length
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showError(passwordValidation.error!);
      return;
    }

    // Call login API
    setIsLoading(true);
    try {
      const response = await login(identifier.trim(), password);

      // Store token and user data
      await setAuth(response.access_token, response.user);

      // Navigate to ProfileSetup
      router.replace('/profile-setup');
    } catch (error: any) {
      // Error already handled by API interceptor
      // But show specific error message if available
      if (error.response?.data?.detail) {
        showError(error.response.data.detail);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input
        label="Email or Phone Number"
        placeholder="Enter your email or phone"
        value={identifier}
        onChangeText={setIdentifier}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <PasswordInput
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        autoComplete="password"
      />

      <TouchableOpacity
        onPress={() => showError('Feature coming in next stage')}
        style={styles.forgotPassword}
        activeOpacity={0.7}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <Button
        title="Log In"
        onPress={handleLogin}
        loading={isLoading}
        style={styles.loginButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
  },
});
