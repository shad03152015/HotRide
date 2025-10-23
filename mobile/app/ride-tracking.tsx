import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Linking,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLocationStore } from '@/store/locationStore';
import { getBooking, cancelBooking } from '@/services/booking';
import type { Booking } from '@/services/booking';
import { showError, showSuccess } from '@/utils/toast';

// Mock driver data - In production, this would come from API
const MOCK_DRIVER = {
  id: '1',
  name: 'Alex',
  rating: 4.9,
  vehicle: 'Honda Click 125i',
  licensePlate: 'ABC 1234',
  phone: '+1234567890',
};

// Average speed for ETA calculation (km/h)
const AVERAGE_SPEED_KMH = 30;

export default function RideTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const { currentLocation } = useLocationStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [eta, setEta] = useState(5); // minutes
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  useEffect(() => {
    if (booking && currentLocation) {
      // Initialize driver location near pickup
      const initialDriverLocation = {
        latitude: booking.pickup_location.latitude + 0.01,
        longitude: booking.pickup_location.longitude + 0.01,
      };
      setDriverLocation(initialDriverLocation);

      // Start simulating driver movement
      const interval = setInterval(() => {
        updateDriverLocation();
      }, 3000); // Update every 3 seconds

      return () => clearInterval(interval);
    }
  }, [booking, currentLocation]);

  useEffect(() => {
    if (driverLocation && currentLocation) {
      calculateETA();
    }
  }, [driverLocation, currentLocation]);

  const fetchBooking = async () => {
    try {
      const bookingData = await getBooking(bookingId);
      setBooking(bookingData);
    } catch (error: any) {
      showError('Failed to load booking details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const updateDriverLocation = () => {
    if (!driverLocation || !currentLocation) return;

    // Simulate driver moving towards user location
    const latDiff = currentLocation.latitude - driverLocation.latitude;
    const lngDiff = currentLocation.longitude - driverLocation.longitude;

    // Move 10% closer to user location
    const newLocation = {
      latitude: driverLocation.latitude + latDiff * 0.1,
      longitude: driverLocation.longitude + lngDiff * 0.1,
    };

    setDriverLocation(newLocation);

    // Fit map to show both markers
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [newLocation, currentLocation],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );
    }
  };

  const calculateETA = () => {
    if (!driverLocation || !currentLocation) return;

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = ((currentLocation.latitude - driverLocation.latitude) * Math.PI) / 180;
    const dLon = ((currentLocation.longitude - driverLocation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((driverLocation.latitude * Math.PI) / 180) *
        Math.cos((currentLocation.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Calculate ETA in minutes
    const timeMinutes = Math.max(1, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60));
    setEta(timeMinutes);
  };

  const handleCall = () => {
    const phoneNumber = Platform.OS === 'ios' ? `telprompt:${MOCK_DRIVER.phone}` : `tel:${MOCK_DRIVER.phone}`;
    Linking.openURL(phoneNumber).catch(() => {
      showError('Unable to make call');
    });
  };

  const handleChat = () => {
    router.push(`/chat?bookingId=${bookingId}&driverName=${MOCK_DRIVER.name}`);
  };

  const handleShare = async () => {
    try {
      const message = `I'm on a HotRide! Driver: ${MOCK_DRIVER.name}, Vehicle: ${MOCK_DRIVER.vehicle}, ETA: ${eta} min`;
      await Share.share({
        message,
        title: 'Share my ride',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleGoLive = () => {
    router.push(`/livestream?bookingId=${bookingId}`);
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? The driver will be notified.',
      [
        {
          text: 'No, Keep Ride',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: confirmCancelRide,
        },
      ]
    );
  };

  const confirmCancelRide = async () => {
    try {
      await cancelBooking(bookingId);

      // TODO: In production, notify driver via WebSocket/Push notification

      showSuccess('Ride cancelled. Driver has been notified.');

      // Navigate back to booking screen
      setTimeout(() => {
        router.replace('/booking');
      }, 1500);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to cancel ride');
    }
  };

  if (isLoading || !booking || !currentLocation || !driverLocation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: (currentLocation.latitude + driverLocation.latitude) / 2,
          longitude: (currentLocation.longitude + driverLocation.longitude) / 2,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
      >
        {/* User Location Marker */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Your Location"
        >
          <View style={styles.userMarker}>
            <Ionicons name="location" size={32} color={Colors.primary} />
          </View>
        </Marker>

        {/* Driver Location Marker */}
        <Marker
          coordinate={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          title={`${MOCK_DRIVER.name} - Driver`}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.driverMarker}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={24} color={Colors.white} />
            </View>
          </View>
        </Marker>

        {/* Route Line */}
        <Polyline
          coordinates={[
            {
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            },
            {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            },
          ]}
          strokeColor={Colors.primary}
          strokeWidth={4}
          lineDashPattern={[1]}
        />
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => {
            if (mapRef.current && driverLocation && currentLocation) {
              mapRef.current.fitToCoordinates(
                [driverLocation, currentLocation],
                {
                  edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                  animated: true,
                }
              );
            }
          }}
        >
          <Ionicons name="locate" size={24} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />

        {/* Status Header */}
        <View style={styles.statusHeader}>
          <Text style={styles.statusText}>Your rider is on the way</Text>
          <Text style={styles.etaText}>Arriving in {eta} min</Text>
        </View>

        {/* Driver Info */}
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatarLarge}>
            <Ionicons name="person" size={40} color={Colors.white} />
          </View>

          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{MOCK_DRIVER.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>{MOCK_DRIVER.rating}</Text>
              <Ionicons name="star" size={16} color="#FFD700" />
            </View>
          </View>

          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleModel}>{MOCK_DRIVER.vehicle}</Text>
            <View style={styles.licensePlate}>
              <Text style={styles.licensePlateText}>{MOCK_DRIVER.licensePlate}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <View style={[styles.actionIconContainer, styles.callButton]}>
              <Ionicons name="call" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleChat}>
            <View style={[styles.actionIconContainer, styles.chatButton]}>
              <Ionicons name="chatbubble" size={24} color={Colors.success} />
            </View>
            <Text style={styles.actionButtonText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleGoLive}>
            <View style={[styles.actionIconContainer, styles.liveButton]}>
              <Ionicons name="videocam" size={24} color="#FF0000" />
            </View>
            <Text style={styles.actionButtonText}>Go Live</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <View style={[styles.actionIconContainer, styles.shareButton]}>
              <Ionicons name="share-social" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  userMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
    gap: 12,
  },
  mapButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.white,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: Colors.inputBorder,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 16,
    color: Colors.secondary,
    marginBottom: 8,
  },
  etaText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputBorder,
  },
  driverAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
  vehicleInfo: {
    alignItems: 'flex-end',
  },
  vehicleModel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 6,
  },
  licensePlate: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  licensePlateText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  callButton: {
    backgroundColor: '#E3F2FD',
  },
  chatButton: {
    backgroundColor: '#E8F5E9',
  },
  shareButton: {
    backgroundColor: Colors.background,
  },
  liveButton: {
    backgroundColor: '#FFE8E8',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
});
