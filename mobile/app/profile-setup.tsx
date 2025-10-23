import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import Button from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileSetupScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.container}>
        <Text style={styles.title}>Profile Setup</Text>
        <Text style={styles.subtitle}>
          This screen will be implemented in Stage 2
        </Text>

        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.infoText}>Welcome, {user.full_name || user.email}!</Text>
            <Text style={styles.infoText}>Email: {user.email}</Text>
            <Text style={styles.infoText}>Provider: {user.oauth_provider}</Text>
          </View>
        )}

        <Button title="Logout" onPress={logout} style={styles.logoutButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.placeholder,
    textAlign: 'center',
    marginBottom: 40,
  },
  userInfo: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary,
    marginBottom: 8,
  },
  logoutButton: {
    width: '100%',
  },
});
