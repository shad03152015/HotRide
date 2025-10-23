import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/services/auth';
import { showError, showSuccess } from '@/utils/toast';
import { saveUser } from '@/utils/storage';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileImage, setProfileImage] = useState(user?.profile_picture_url || '');
  const [isLoading, setIsLoading] = useState(false);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showError('Permission to access photos is required');
        }
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        // In production, upload to cloud storage and get URL
        // For now, use base64 or local URI
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      showError('Failed to pick image');
    }
  };

  const handleSaveChanges = async () => {
    // Validate full name
    if (!fullName.trim()) {
      showError('Please enter your full name');
      return;
    }

    setIsLoading(true);

    try {
      // Call update profile API
      const updatedUser = await updateProfile({
        full_name: fullName,
        profile_picture_url: profileImage,
      });

      // Update local user state
      setUser(updatedUser);
      await saveUser(updatedUser);

      showSuccess('Profile updated successfully');

      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update profile';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <View style={styles.avatar}>
                {/* In production, use <Image source={{ uri: profileImage }} /> */}
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={60} color={Colors.white} />
                </View>
              </View>
            ) : (
              <View style={styles.avatar}>
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={60} color={Colors.white} />
                </View>
              </View>
            )}

            {/* Edit Icon Overlay */}
            <TouchableOpacity style={styles.editIconButton} onPress={handlePickImage}>
              <Ionicons name="pencil" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{fullName || user?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          <TouchableOpacity onPress={handlePickImage}>
            <Text style={styles.changePhotoButton}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <Input
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>

          {/* Email Address (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <Input
              value={user?.email || ''}
              editable={false}
              style={styles.disabledInput}
              placeholder="Email"
            />
          </View>

          {/* Phone Number (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <Input
              value={user?.phone || ''}
              editable={false}
              style={styles.disabledInput}
              placeholder="Phone number"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? 'Saving...' : 'Save Changes'}
          onPress={handleSaveChanges}
          disabled={isLoading}
          icon={isLoading ? <ActivityIndicator color={Colors.white} size="small" /> : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
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
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.background,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.placeholder,
    marginBottom: 16,
  },
  changePhotoButton: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: 8,
  },
  disabledInput: {
    backgroundColor: Colors.background,
    color: Colors.placeholder,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.inputBorder,
  },
});
