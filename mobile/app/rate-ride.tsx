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
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { showError, showSuccess } from '@/utils/toast';
import { getBooking } from '@/services/booking';
import type { Booking } from '@/services/booking';

// Mock driver data - would come from booking in production
const MOCK_DRIVER = {
  name: 'Alex',
  profileImage: 'https://i.pravatar.cc/150?img=12',
};

export default function RateRideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }

    // Handle back button/close - auto-submit default rating
    return () => {
      if (rating === 0) {
        // User is leaving without rating, submit default 4-5 stars
        submitDefaultRating();
      }
    };
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const bookingData = await getBooking(bookingId);
      setBooking(bookingData);
    } catch (error) {
      console.error('Failed to load booking:', error);
    }
  };

  const submitDefaultRating = async () => {
    // Randomly choose between 4 and 5 stars
    const defaultRating = Math.random() > 0.5 ? 5 : 4;

    try {
      // In production: await submitRideRating(bookingId, defaultRating, '');
      console.log('Auto-submitted rating:', defaultRating);
    } catch (error) {
      console.error('Failed to submit default rating:', error);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Skip Rating?',
      'Your rider will receive a default 4-5 star rating. Are you sure you want to skip?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            await submitDefaultRating();
            router.replace('/home');
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showError('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      // In production: await submitRideRating(bookingId, rating, comment);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      showSuccess('Thank you for your feedback!');

      setTimeout(() => {
        router.replace('/home');
      }, 1000);
    } catch (error: any) {
      showError('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStar = (index: number) => {
    const isFilled = index <= rating;
    return (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index)}
        style={styles.starButton}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFilled ? 'star' : 'star-outline'}
          size={56}
          color={isFilled ? Colors.primary : Colors.inputBorder}
        />
      </TouchableOpacity>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How was your ride?</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Driver Info */}
        <View style={styles.driverSection}>
          <Image
            source={{ uri: MOCK_DRIVER.profileImage }}
            style={styles.driverImage}
          />
          <View style={styles.driverInfo}>
            <Text style={styles.driverLabel}>Your ride with {MOCK_DRIVER.name}</Text>
            {booking && (
              <Text style={styles.rideDate}>
                {formatDate(booking.created_at)}, {formatTime(booking.created_at)}
              </Text>
            )}
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>Rate your experience</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
            </Text>
          )}
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Add a comment</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Tell us more about your experience... (optional)"
            placeholderTextColor={Colors.placeholder}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{comment.length}/500</Text>
          <Text style={styles.commentHint}>
            Use this space to report any incidents or share feedback about your trip
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Button
          title={isSubmitting ? 'Submitting...' : 'Submit Rating'}
          onPress={handleSubmit}
          disabled={isSubmitting || rating === 0}
          style={styles.submitButton}
        />
      </View>
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
  closeButton: {
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  driverImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.inputBorder,
    marginRight: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  rideDate: {
    fontSize: 14,
    color: Colors.primary,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 16,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: 16,
    fontSize: 15,
    color: Colors.secondary,
    minHeight: 150,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.placeholder,
    textAlign: 'right',
    marginTop: 8,
  },
  commentHint: {
    fontSize: 13,
    color: Colors.placeholder,
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.inputBorder,
  },
  submitButton: {
    width: '100%',
  },
});
