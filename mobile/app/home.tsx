import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import Button from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.container}>
        <Text style={styles.title}>🏍️ HotRide</Text>
        <Text style={styles.subtitle}>Welcome Home!</Text>

        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.infoText}>Name: {user.full_name || 'Not set'}</Text>
            <Text style={styles.infoText}>Email: {user.email}</Text>
            {user.phone && <Text style={styles.infoText}>Phone: {user.phone}</Text>}
            <Text style={styles.infoText}>Provider: {user.oauth_provider}</Text>
          </View>
        )}

        <Text style={styles.message}>
          Stage 3 features (Home screen, Map, Ride booking) will be implemented next.
        </Text>

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
    fontSize: 48,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 32,
  },
  userInfo: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: Colors.placeholder,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  logoutButton: {
    width: '100%',
  },
});
