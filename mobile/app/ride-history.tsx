import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getMyBookings } from '@/services/booking';
import type { Booking } from '@/services/booking';
import { showError } from '@/utils/toast';

export default function RideHistoryScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async (refresh: boolean = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await getMyBookings(20, 0);
      setBookings(response.bookings);
      setTotal(response.total);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to load ride history');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchBookings(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'accepted':
      case 'in_progress':
        return Colors.primary;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.placeholder;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'in_progress':
        return 'In Progress';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <TouchableOpacity style={styles.bookingCard} activeOpacity={0.7}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingDateContainer}>
          <Text style={styles.bookingDate}>{formatDate(item.created_at)}</Text>
          <Text style={styles.bookingTime}>{formatTime(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.bookingRoute}>
        <View style={styles.routeItem}>
          <View style={styles.routeIconContainer}>
            <Ionicons name="radio-button-on" size={16} color={Colors.primary} />
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {item.pickup_location.address}
            </Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routeItem}>
          <View style={styles.routeIconContainer}>
            <Ionicons name="location" size={16} color={Colors.error} />
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>Destination</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {item.destination.address}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <View style={styles.bookingStats}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={16} color={Colors.placeholder} />
            <Text style={styles.statText}>{item.distance} km</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color={Colors.placeholder} />
            <Text style={styles.statText}>{item.estimated_time} mins</Text>
          </View>
        </View>
        <Text style={styles.bookingFare}>₱{item.total_fare.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="car-outline" size={80} color={Colors.placeholder} />
      <Text style={styles.emptyStateTitle}>No rides yet</Text>
      <Text style={styles.emptyStateMessage}>
        Your ride history will appear here once you book your first ride.
      </Text>
      <TouchableOpacity
        style={styles.bookRideButton}
        onPress={() => router.push('/booking')}
      >
        <Text style={styles.bookRideButtonText}>Book a Ride</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
        <View style={styles.headerRight}>
          {total > 0 && (
            <Text style={styles.totalCount}>{total} ride{total !== 1 ? 's' : ''}</Text>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading ride history...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            bookings.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
    width: 80,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary,
  },
  headerRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  totalCount: {
    fontSize: 13,
    color: Colors.placeholder,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.placeholder,
  },
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flex: 1,
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingDateContainer: {
    flex: 1,
  },
  bookingDate: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 2,
  },
  bookingTime: {
    fontSize: 13,
    color: Colors.placeholder,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  bookingRoute: {
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIconContainer: {
    width: 24,
    alignItems: 'center',
    paddingTop: 2,
  },
  routeDetails: {
    flex: 1,
    marginLeft: 8,
  },
  routeLabel: {
    fontSize: 12,
    color: Colors.placeholder,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.inputBorder,
    marginLeft: 11,
    marginVertical: 4,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.inputBorder,
  },
  bookingStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.placeholder,
  },
  bookingFare: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 15,
    color: Colors.placeholder,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  bookRideButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  bookRideButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
