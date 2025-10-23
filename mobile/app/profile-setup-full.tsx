import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { showError, showSuccess } from '@/utils/toast';
import { profileSetup, sendPhoneCode } from '@/services/auth';
import { validatePhone } from '@/utils/validators';
import { useAuthStore } from '@/store/authStore';

export default function ProfileSetupFullScreen() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const router = useRouter();
  const { user } = useAuthStore();

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload a photo.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      showError('Failed to pick image');
    }
  };

  const handleSendVerificationCode = async () => {
    if (!phone.trim()) {
      showError('Please enter your phone number');
      return;
    }

    if (!validatePhone(phone)) {
      showError('Please enter a valid phone number');
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await sendPhoneCode(phone.trim());
      showSuccess(response.message);

      // Navigate to phone verification screen
      router.push({
        pathname: '/verify-phone',
        params: { phone: phone.trim() },
      });
    } catch (error: any) {
      if (error.response?.data?.detail) {
        showError(error.response.data.detail);
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleCompleteSetup = async () => {
    // Phone verification is optional, but if entered must be verified
    if (phone.trim() && !isPhoneVerified) {
      showError('Please verify your phone number first');
      return;
    }

    setIsLoading(true);
    try {
      const setupData: any = {};

      if (phone.trim()) {
        setupData.phone = phone.trim();
      }

      if (profileImage) {
        // In production, upload image to cloud storage and get URL
        // For now, just use the local URI
        setupData.profile_picture_url = profileImage;
      }

      if (user?.full_name) {
        setupData.full_name = user.full_name;
      }

      await profileSetup(setupData);

      showSuccess('Profile setup complete!');

      // Navigate to home/dashboard
      router.replace('/home');
    } catch (error: any) {
      if (error.response?.data?.detail) {
        showError(error.response.data.detail);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* Title */}
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Add your information to get started
          </Text>

          {/* Profile Photo */}
          <TouchableOpacity
            onPress={pickImage}
            style={styles.photoContainer}
            activeOpacity={0.7}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={60} color={Colors.placeholder} />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={20} color={Colors.white} />
            </View>
          </TouchableOpacity>

          <Text style={styles.photoLabel}>Add Profile Photo</Text>

          {/* User Info */}
          {user?.full_name && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user.full_name}</Text>
            </View>
          )}

          {user?.email && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
              {user.is_email_verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.success}
                  style={styles.verifiedIcon}
                />
              )}
            </View>
          )}

          {/* Phone Number */}
          <View style={styles.phoneSection}>
            <Input
              label="Phone Number (Optional)"
              placeholder="+1234567890"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              containerStyle={styles.phoneInput}
            />

            {phone.trim() && !isPhoneVerified && (
              <Button
                title="Verify"
                onPress={handleSendVerificationCode}
                loading={isSendingCode}
                variant="outline"
                style={styles.verifyButton}
              />
            )}

            {isPhoneVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Complete Button */}
          <Button
            title="Complete Setup"
            onPress={handleCompleteSetup}
            loading={isLoading}
            style={styles.completeButton}
          />

          {/* Skip Button */}
          <TouchableOpacity
            onPress={() => router.replace('/home')}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.placeholder,
    textAlign: 'center',
    marginBottom: 40,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    borderStyle: 'dashed',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  photoLabel: {
    fontSize: 14,
    color: Colors.placeholder,
    textAlign: 'center',
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.placeholder,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: Colors.secondary,
    fontWeight: '500',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  phoneSection: {
    marginBottom: 32,
  },
  phoneInput: {
    marginBottom: 12,
  },
  verifyButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 32,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  completeButton: {
    width: '100%',
    marginBottom: 16,
  },
  skipButton: {
    alignSelf: 'center',
  },
  skipText: {
    fontSize: 14,
    color: Colors.placeholder,
    textDecorationLine: 'underline',
  },
});
