import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { cancelBooking } from '@/services/booking';
import { showError, showSuccess } from '@/utils/toast';

interface RiderOffer {
  id: string;
  name: string;
  rating: number;
  etaMinutes: number;
  vehicle: string;
  profileImage: string;
  distance: number; // in km for sorting
}

export default function FindingDriverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const [offers, setOffers] = useState<RiderOffer[]>([]);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    // Simulate receiving offers from riders
    // In production, this would be real-time via WebSocket/API
    generateMockOffers();
  }, []);

  const generateMockOffers = () => {
    const mockOffers: RiderOffer[] = [
      {
        id: 'rider-1',
        name: 'Miguel S.',
        rating: 4.9,
        etaMinutes: 2,
        vehicle: 'Yamaha NMAX',
        profileImage: 'https://i.pravatar.cc/150?img=12',
        distance: 0.5,
      },
      {
        id: 'rider-2',
        name: 'John D.',
        rating: 4.8,
        etaMinutes: 3,
        vehicle: 'Honda Click 125',
        profileImage: 'https://i.pravatar.cc/150?img=33',
        distance: 0.8,
      },
      {
        id: 'rider-3',
        name: 'Rico P.',
        rating: 4.7,
        etaMinutes: 5,
        vehicle: 'Suzuki Burgman',
        profileImage: 'https://i.pravatar.cc/150?img=15',
        distance: 1.2,
      },
    ];

    // Sort by distance (closest first)
    const sortedOffers = mockOffers.sort((a, b) => a.distance - b.distance);
    setOffers(sortedOffers);
  };

  const handleAcceptOffer = async (offer: RiderOffer) => {
    setIsAccepting(offer.id);

    try {
      // In production, this would call API to accept the offer and notify rider
      // await acceptRiderOffer(bookingId, offer.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      showSuccess(`${offer.name} accepted! Preparing your ride...`);

      // Navigate to ride tracking with booking ID
      setTimeout(() => {
        router.replace(`/ride-tracking?bookingId=${bookingId}&driverId=${offer.id}`);
      }, 1500);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to accept offer');
      setIsAccepting(null);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel? You have pending offers from riders.',
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

  const renderOfferItem = ({ item }: { item: RiderOffer }) => (
    <View style={styles.offerCard}>
      <View style={styles.offerContent}>
        {/* Profile Image */}
        <Image
          source={{ uri: item.profileImage }}
          style={styles.profileImage}
        />

        {/* Rider Info */}
        <View style={styles.riderInfo}>
          <Text style={styles.riderName}>{item.name}</Text>
          <View style={styles.riderDetails}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>{item.rating}</Text>
              <Ionicons name="star" size={14} color={Colors.primary} />
            </View>
            <Text style={styles.detailSeparator}>•</Text>
            <Text style={styles.etaText}>{item.etaMinutes} min away</Text>
          </View>
          <Text style={styles.vehicleText}>{item.vehicle}</Text>
        </View>

        {/* Accept Button */}
        <TouchableOpacity
          style={[
            styles.acceptButton,
            isAccepting === item.id && styles.acceptButtonDisabled,
          ]}
          onPress={() => handleAcceptOffer(item)}
          disabled={isAccepting !== null}
        >
          {isAccepting === item.id ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Finding Your Ride</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            {offers.length} {offers.length === 1 ? 'offer' : 'offers'} received. Closest riders are shown first.
          </Text>
        </View>

        {/* Offers List */}
        <FlatList
          data={offers}
          renderItem={renderOfferItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Cancel Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
            disabled={isAccepting !== null}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputBorder,
  },
  backButton: {
    padding: 8,
    width: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary,
  },
  headerRight: {
    width: 60,
  },
  subtitleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.placeholder,
    lineHeight: 22,
  },
  listContent: {
    padding: 16,
  },
  offerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.inputBorder,
  },
  riderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  riderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  detailSeparator: {
    fontSize: 15,
    color: Colors.placeholder,
    marginHorizontal: 8,
  },
  etaText: {
    fontSize: 15,
    color: Colors.placeholder,
  },
  vehicleText: {
    fontSize: 14,
    color: Colors.placeholder,
    marginTop: 2,
  },
  acceptButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.inputBorder,
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
