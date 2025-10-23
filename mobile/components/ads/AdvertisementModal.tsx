import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ImageBackground,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface AdvertisementModalProps {
  visible: boolean;
  onClose: () => void;
  duration?: number; // Duration in seconds
}

// Mock advertisement data - In production, this would come from an ad network API
const AD_DATA = {
  imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
  title: 'Premium Motorcycles',
  description: 'Upgrade your ride with the latest models',
  ctaText: 'Learn More',
  ctaUrl: 'https://example.com/motorcycles',
};

export default function AdvertisementModal({
  visible,
  onClose,
  duration = 10,
}: AdvertisementModalProps) {
  const [countdown, setCountdown] = useState(duration);

  useEffect(() => {
    if (visible) {
      setCountdown(duration);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, duration]);

  const handleLearnMore = () => {
    // In production, open the ad URL
    Linking.openURL(AD_DATA.ctaUrl).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Background Image */}
        <ImageBackground
          source={{ uri: AD_DATA.imageUrl }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Dark Overlay */}
          <View style={styles.overlay} />

          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.findingText}>Finding your rider...</Text>

            <View style={styles.rightControls}>
              {/* Countdown Timer */}
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
                <View style={styles.countdownCircle} />
              </View>

              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={28} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ad Content at Bottom */}
          <View style={styles.bottomContent}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleLearnMore}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaText}>{AD_DATA.ctaText}</Text>
            </TouchableOpacity>

            <Text style={styles.adLabel}>Advertisement</Text>
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    zIndex: 10,
  },
  findingText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  countdownContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownCircle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.primary,
    borderStyle: 'solid',
  },
  countdownText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 10,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  adLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
