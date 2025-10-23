import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import LoginForm from '@/components/auth/LoginForm';
import SocialButtons from '@/components/auth/SocialButtons';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>🏍️</Text>
            </View>
            <Text style={styles.logoTitle}>HotRide</Text>
          </View>

          {/* Welcome Text */}
          <Text style={styles.welcomeText}>Welcome Back!</Text>

          {/* Login Form */}
          <LoginForm />

          {/* Social Auth Buttons */}
          <SocialButtons />

          {/* Create Account Link */}
          <TouchableOpacity
            onPress={() => router.push('/signup')}
            style={styles.createAccountContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.createAccountText}>
              New here? <Text style={styles.createAccountLink}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 50,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.secondary,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  createAccountContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  createAccountText: {
    fontSize: 14,
    color: Colors.secondary,
  },
  createAccountLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
