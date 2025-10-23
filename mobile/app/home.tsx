import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useLocationStore } from '@/store/locationStore';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hasLocationPermission, setLocationPermission } = useLocationStore();

  useEffect(() => {
    // Check location permission status on mount
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
  };

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

        {/* Location Status */}
        {!hasLocationPermission && (
          <View style={styles.locationWarning}>
            <Text style={styles.locationWarningText}>
              📍 Location access required to book rides
            </Text>
          </View>
        )}

        <Text style={styles.message}>
          Stage 3 features (Map, Ride booking) will be implemented next.
        </Text>

        {/* Booking Button */}
        <Button
          title={hasLocationPermission ? 'Book a Ride' : 'Enable Location to Book'}
          onPress={() =>
            hasLocationPermission
              ? router.push('/booking')
              : router.push('/enable-location')
          }
          style={[
            styles.bookingButton,
            !hasLocationPermission && styles.bookingButtonDisabled,
          ]}
          disabled={false}
        />

        <Button 
          title="Ride History" 
          onPress={() => router.push('/ride-history')} 
          style={styles.historyButton} 
        />

        <Button 
          title="Edit Profile" 
          onPress={() => router.push('/edit-profile')} 
          style={styles.editButton} 
        />

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
    marginBottom: 16,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary,
    marginBottom: 8,
  },
  locationWarning: {
    backgroundColor: Colors.warning,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  locationWarningText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.placeholder,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  bookingButton: {
    width: '100%',
    marginBottom: 12,
  },
  bookingButtonDisabled: {
    backgroundColor: Colors.placeholder,
  },
  historyButton: {
    width: '100%',
    marginBottom: 12,
  },
  editButton: {
    width: '100%',
    marginBottom: 12,
  },
  logoutButton: {
    width: '100%',
  },
});
