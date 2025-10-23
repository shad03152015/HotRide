import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { showError, showSuccess } from '@/utils/toast';

export default function AddGCashScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // Limit to 11 digits (Philippine mobile format)
    const limited = cleaned.slice(0, 11);

    setPhoneNumber(limited);
  };

  const validatePhoneNumber = () => {
    // Philippine mobile numbers start with 09 and have 11 digits
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSave = async () => {
    if (!phoneNumber) {
      showError('Please enter your GCash mobile number');
      return;
    }

    if (!validatePhoneNumber()) {
      showError('Please enter a valid Philippine mobile number (09XXXXXXXXX)');
      return;
    }

    setIsSaving(true);

    try {
      // In production, this would save the GCash number to the backend
      // await saveGCashPaymentMethod(phoneNumber);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      showSuccess('GCash payment method added successfully');

      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to add GCash payment method');
    } finally {
      setIsSaving(false);
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
        <Text style={styles.headerTitle}>Add GCash Payment</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* GCash Logo/Info */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="wallet" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.infoTitle}>GCash Mobile Number</Text>
            <Text style={styles.infoText}>
              Enter your GCash-registered mobile number. Payment will be processed when your trip reaches the destination.
            </Text>
          </View>

          {/* Phone Number Field */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputContainer}>
              <View style={styles.prefixContainer}>
                <Text style={styles.prefixText}>+63</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="9XX XXX XXXX"
                placeholderTextColor={Colors.placeholder}
                value={phoneNumber}
                onChangeText={formatPhoneNumber}
                keyboardType="phone-pad"
                maxLength={11}
                autoFocus
              />
            </View>
            {phoneNumber.length > 0 && !validatePhoneNumber() && (
              <Text style={styles.errorText}>
                Please enter a valid Philippine mobile number starting with 09
              </Text>
            )}
            {phoneNumber.length > 0 && validatePhoneNumber() && (
              <View style={styles.validContainer}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.validText}>Valid mobile number</Text>
              </View>
            )}
          </View>

          {/* How it works */}
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>How it works</Text>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="bicycle" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.infoItemText}>Complete your ride to destination</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="card" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.infoItemText}>
                GCash payment request will be sent to your number
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="checkmark-done" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.infoItemText}>Approve payment in your GCash app</Text>
            </View>
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={18} color={Colors.error} />
            <Text style={styles.securityText}>
              Your payment details are encrypted and secure.
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save Payment Method'}
            onPress={handleSave}
            disabled={isSaving || !validatePhoneNumber()}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.placeholder,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    overflow: 'hidden',
  },
  prefixContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.inputBorder,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginTop: 8,
    marginLeft: 4,
  },
  validContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
    gap: 6,
  },
  validText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.secondary,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.inputBorder,
  },
  saveButton: {
    width: '100%',
  },
});
