import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import AdvertisementModal from '@/components/ads/AdvertisementModal';
import { cancelBooking } from '@/services/booking';
import { showError, showSuccess } from '@/utils/toast';

const AD_INTERVAL_MS = 120000; // 2 minutes
const AD_DURATION_SECONDS = 10;

export default function FindingDriverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const [showAd, setShowAd] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [nextAdTime, setNextAdTime] = useState(AD_INTERVAL_MS / 1000); // seconds

  useEffect(() => {
    // Simulate finding driver
    // In production, this would listen to WebSocket/API for driver acceptance

    // Timer for elapsed time
    const elapsedInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Check for ads every second
    const adCheckInterval = setInterval(() => {
      checkAndShowAd();
    }, 1000);

    // Simulate driver found after 15 seconds (for demo)
    const driverFoundTimeout = setTimeout(() => {
      handleDriverFound();
    }, 15000);

    return () => {
      clearInterval(elapsedInterval);
      clearInterval(adCheckInterval);
      clearTimeout(driverFoundTimeout);
    };
  }, []);

  const checkAndShowAd = () => {
    // Show ad every 2 minutes (120 seconds)
    if (elapsedTime > 0 && elapsedTime % (AD_INTERVAL_MS / 1000) === 0) {
      setShowAd(true);
      setNextAdTime(elapsedTime + (AD_INTERVAL_MS / 1000));
    }
  };

  const handleAdClose = () => {
    setShowAd(false);
  };

  const handleDriverFound = () => {
    showSuccess('Driver found! Getting ride details...');

    // Navigate to ride tracking
    setTimeout(() => {
      router.replace(`/ride-tracking?bookingId=${bookingId}`);
    }, 1500);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel? We are still finding a driver for you.',
      [
        {
          text: 'No, Continue',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: confirmCancel,
        },
      ]
    );
  };

  const confirmCancel = async () => {
    try {
      await cancelBooking(bookingId);
      showSuccess('Booking cancelled');

      setTimeout(() => {
        router.replace('/booking');
      }, 1000);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.secondary} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Finding Driver</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Loading Animation */}
          <View style={styles.loadingContainer}>
            <View style={styles.pulsingCircle}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <Ionicons
              name="car-sport"
              size={48}
              color={Colors.primary}
              style={styles.carIcon}
            />
          </View>

          {/* Status Text */}
          <Text style={styles.statusTitle}>Finding your rider...</Text>
          <Text style={styles.statusSubtitle}>
            We're matching you with the nearest available driver
          </Text>

          {/* Time Info */}
          <View style={styles.timeCard}>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Searching for</Text>
              <Text style={styles.timeValue}>{formatTime(elapsedTime)}</Text>
            </View>

            {nextAdTime > elapsedTime && (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Next update</Text>
                <Text style={styles.timeValue}>
                  {formatTime(nextAdTime - elapsedTime)}
                </Text>
              </View>
            )}
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>While you wait:</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.tipText}>Your ride details are confirmed</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.tipText}>Payment method is ready</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.tipText}>You'll be notified when driver accepts</Text>
            </View>
          </View>
        </View>

        {/* Cancel Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Advertisement Modal */}
      <AdvertisementModal
        visible={showAd}
        onClose={handleAdClose}
        duration={AD_DURATION_SECONDS}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  headerRight: {
    width: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  loadingContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  pulsingCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 87, 51, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIcon: {
    position: 'absolute',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  timeCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  tipsContainer: {
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tipText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
