import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { showSuccess } from '@/utils/toast';

type PaymentMethod = 'cash' | 'gcash';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
}

const PAYMENT_METHODS: PaymentOption[] = [
  {
    id: 'cash',
    name: 'Cash',
    icon: 'cash-outline',
    description: 'Pay with cash at the end of your ride',
  },
  {
    id: 'gcash',
    name: 'GCash',
    icon: 'wallet-outline',
    description: 'Pay digitally with your GCash account',
  },
];

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    showSuccess(`${method === 'cash' ? 'Cash' : 'GCash'} selected as payment method`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity style={styles.lockButton}>
          <Ionicons name="lock-closed" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Saved Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Methods</Text>

          {/* Payment Methods List */}
          <View style={styles.methodsList}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.methodCard}
                onPress={() => handleSelectMethod(method.id)}
                activeOpacity={0.7}
              >
                <View style={styles.methodContent}>
                  {/* Icon */}
                  <View style={styles.methodIcon}>
                    <Ionicons
                      name={method.icon}
                      size={28}
                      color={selectedMethod === method.id ? Colors.primary : Colors.white}
                    />
                  </View>

                  {/* Method Info */}
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    {method.description && (
                      <Text style={styles.methodDescription}>{method.description}</Text>
                    )}
                    {selectedMethod === method.id && (
                      <Text style={styles.defaultLabel}>Default</Text>
                    )}
                  </View>

                  {/* Selection Indicator */}
                  <View style={styles.selectionIndicator}>
                    {selectedMethod === method.id ? (
                      <View style={styles.radioSelected}>
                        <View style={styles.radioInner} />
                      </View>
                    ) : (
                      <View style={styles.radioUnselected} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
            <Text style={styles.infoText}>
              Your payment information is secure and encrypted
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    padding: 8,
    width: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
  },
  lockButton: {
    padding: 8,
    width: 60,
    alignItems: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 16,
  },
  methodsList: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  defaultLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
});
