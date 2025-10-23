import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Button from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useLocationStore } from '@/store/locationStore';
import { useAuth } from '@/hooks/useAuth';
import { showError, showSuccess } from '@/utils/toast';
import * as Location from 'expo-location';
import { createBooking } from '@/services/booking';

// Constants
const BASE_FARE_PER_KM = 25; // 25 PESOS per km
const AVERAGE_SPEED_KMH = 30; // Average speed for time estimation

interface Destination {
  address: string;
  latitude: number;
  longitude: number;
}

export default function BookingScreen() {
  const router = useRouter();
  const { currentLocation } = useLocationStore();
  const { user } = useAuth();

  // State
  const [pickupAddress, setPickupAddress] = useState('Fetching location...');
  const [destination, setDestination] = useState<Destination | null>(null);
  const [destinationInput, setDestinationInput] = useState('');
  const [distance, setDistance] = useState(0); // in km
  const [estimatedTime, setEstimatedTime] = useState(0); // in minutes
  const [baseFare, setBaseFare] = useState(0);
  const [gratuity, setGratuity] = useState(0);
  const [gratuityPercentage, setGratuityPercentage] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Map region
  const [region, setRegion] = useState({
    latitude: currentLocation?.latitude || 37.78825,
    longitude: currentLocation?.longitude || -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    if (currentLocation) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      fetchPickupAddress(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (destination && currentLocation) {
      calculateDistanceAndTime();
    }
  }, [destination, currentLocation]);

  useEffect(() => {
    // Calculate fare based on distance
    const fare = Math.round(distance * BASE_FARE_PER_KM);
    setBaseFare(fare);
  }, [distance]);

  const fetchPickupAddress = async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results[0]) {
        const addr = results[0];
        const address = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''}`;
        setPickupAddress(address.trim());
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setPickupAddress('Current Location');
    }
  };

  const searchDestination = async () => {
    if (!destinationInput.trim()) {
      showError('Please enter a destination');
      return;
    }

    setIsSearching(true);

    try {
      // Use geocoding to search for destination
      const results = await Location.geocodeAsync(destinationInput);

      if (results.length > 0) {
        const location = results[0];
        setDestination({
          address: destinationInput,
          latitude: location.latitude,
          longitude: location.longitude,
        });

        // Update map region to show both points
        if (currentLocation) {
          const midLat = (currentLocation.latitude + location.latitude) / 2;
          const midLng = (currentLocation.longitude + location.longitude) / 2;
          const latDelta = Math.abs(currentLocation.latitude - location.latitude) * 2.5;
          const lngDelta = Math.abs(currentLocation.longitude - location.longitude) * 2.5;

          setRegion({
            latitude: midLat,
            longitude: midLng,
            latitudeDelta: Math.max(latDelta, 0.05),
            longitudeDelta: Math.max(lngDelta, 0.05),
          });
        }
      } else {
        showError('Destination not found. Please try a different address.');
      }
    } catch (error) {
      showError('Error searching for destination');
    } finally {
      setIsSearching(false);
    }
  };

  const calculateDistanceAndTime = () => {
    if (!currentLocation || !destination) return;

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = ((destination.latitude - currentLocation.latitude) * Math.PI) / 180;
    const dLon = ((destination.longitude - currentLocation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((currentLocation.latitude * Math.PI) / 180) *
        Math.cos((destination.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    setDistance(Number(distanceKm.toFixed(1)));

    // Estimate time based on distance and average speed
    const timeMinutes = Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);
    setEstimatedTime(timeMinutes);
  };

  const handleGratuityPercentage = (percentage: number) => {
    setGratuityPercentage(percentage);
    const tip = Math.round((baseFare * percentage) / 100);
    setGratuity(tip);
  };

  const handleGratuitySlider = (value: number) => {
    setGratuityPercentage(0); // Reset percentage when using slider
    setGratuity(Math.round(value));
  };

  const handleBooking = async () => {
    if (!destination) {
      showError('Please select a destination');
      return;
    }

    if (!currentLocation) {
      showError('Current location not available');
      return;
    }

    setIsBooking(true);

    try {
      // Create booking via API
      const booking = await createBooking({
        pickup_location: {
          address: pickupAddress,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        destination: {
          address: destination.address,
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        distance,
        estimated_time: estimatedTime,
        base_fare: baseFare,
        gratuity,
        total_fare: baseFare + gratuity,
        notes,
      });

      console.log('Booking created:', booking);

      showSuccess('Ride booked successfully! Finding nearby drivers...');

      // Navigate to finding driver screen with booking ID
      setTimeout(() => {
        router.push(`/finding-driver?bookingId=${booking.id}`);
      }, 1500);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to book ride');
    } finally {
      setIsBooking(false);
    }
  };

  const totalFare = baseFare + gratuity;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map View */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Pickup Location"
          >
            <View style={styles.pickupMarker}>
              <Ionicons name="location" size={24} color={Colors.primary} />
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Destination"
          >
            <View style={styles.destinationMarker}>
              <Ionicons name="location" size={24} color={Colors.error} />
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {currentLocation && destination && (
          <Polyline
            coordinates={[
              {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              },
              {
                latitude: destination.latitude,
                longitude: destination.longitude,
              },
            ]}
            strokeColor={Colors.primary}
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Pickup Location */}
          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Ionicons name="radio-button-on" size={20} color={Colors.primary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup location</Text>
              <Text style={styles.locationAddress}>{pickupAddress}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.changeButton}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Destination Search */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={Colors.placeholder}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Where to?"
              placeholderTextColor={Colors.placeholder}
              value={destinationInput}
              onChangeText={setDestinationInput}
              onSubmitEditing={searchDestination}
              returnKeyType="search"
            />
            {isSearching && <ActivityIndicator size="small" color={Colors.primary} />}
          </View>

          {/* Trip Details */}
          {destination && (
            <>
              <View style={styles.tripDetails}>
                <View style={styles.tripDetailItem}>
                  <Text style={styles.tripDetailLabel}>Distance</Text>
                  <Text style={styles.tripDetailValue}>{distance} km</Text>
                </View>
                <View style={styles.tripDetailDivider} />
                <View style={styles.tripDetailItem}>
                  <Text style={styles.tripDetailLabel}>Est. Time</Text>
                  <Text style={styles.tripDetailValue}>{estimatedTime} mins</Text>
                </View>
                <View style={styles.tripDetailDivider} />
                <View style={styles.tripDetailItem}>
                  <Text style={styles.tripDetailLabel}>Fare</Text>
                  <Text style={styles.tripDetailValue}>₱{baseFare.toFixed(2)}</Text>
                </View>
              </View>

              {/* Gratuity */}
              <View style={styles.gratuitySection}>
                <View style={styles.gratuityHeader}>
                  <Text style={styles.gratuityLabel}>Gratuity</Text>
                  <Text style={styles.gratuityAmount}>₱ {gratuity.toFixed(2)}</Text>
                </View>

                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={baseFare * 0.5} // Max 50% of base fare
                  value={gratuity}
                  onValueChange={handleGratuitySlider}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.inputBorder}
                  thumbTintColor={Colors.primary}
                />

                <View style={styles.percentageButtons}>
                  <TouchableOpacity
                    style={[
                      styles.percentageButton,
                      gratuityPercentage === 10 && styles.percentageButtonActive,
                    ]}
                    onPress={() => handleGratuityPercentage(10)}
                  >
                    <Text
                      style={[
                        styles.percentageButtonText,
                        gratuityPercentage === 10 && styles.percentageButtonTextActive,
                      ]}
                    >
                      10%
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.percentageButton,
                      gratuityPercentage === 15 && styles.percentageButtonActive,
                    ]}
                    onPress={() => handleGratuityPercentage(15)}
                  >
                    <Text
                      style={[
                        styles.percentageButtonText,
                        gratuityPercentage === 15 && styles.percentageButtonTextActive,
                      ]}
                    >
                      15%
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.percentageButton,
                      gratuityPercentage === 20 && styles.percentageButtonActive,
                    ]}
                    onPress={() => handleGratuityPercentage(20)}
                  >
                    <Text
                      style={[
                        styles.percentageButtonText,
                        gratuityPercentage === 20 && styles.percentageButtonTextActive,
                      ]}
                    >
                      20%
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total Fare */}
              <View style={styles.totalFareRow}>
                <Text style={styles.totalFareLabel}>Total Fare</Text>
                <Text style={styles.totalFareAmount}>₱{totalFare.toFixed(2)}</Text>
              </View>

              {/* Notes */}
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes for driver</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="e.g. building color, what you're wearing"
                  placeholderTextColor={Colors.placeholder}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Book Button */}
              <Button
                title={isBooking ? 'Booking...' : 'Book HotRide'}
                onPress={handleBooking}
                disabled={isBooking}
                icon={
                  isBooking ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : undefined
                }
                style={styles.bookButton}
              />
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: Colors.placeholder,
  },
  changeButton: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.secondary,
  },
  tripDetails: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tripDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  tripDetailDivider: {
    width: 1,
    backgroundColor: Colors.inputBorder,
    marginHorizontal: 8,
  },
  tripDetailLabel: {
    fontSize: 13,
    color: Colors.placeholder,
    marginBottom: 6,
  },
  tripDetailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  gratuitySection: {
    marginBottom: 20,
  },
  gratuityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gratuityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
  gratuityAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  percentageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  percentageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  percentageButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  percentageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  percentageButtonTextActive: {
    color: Colors.white,
  },
  totalFareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalFareLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
  },
  totalFareAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.secondary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bookButton: {
    width: '100%',
  },
});
