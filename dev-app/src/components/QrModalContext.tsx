import React, { createContext, useState, useContext, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useStripeTerminal, type QrCodeDisplayData, type StripeError } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';

type QrCallback = {
  confirmQrCodeDisplayed: () => Promise<{ error?: StripeError }>;
  failQrCodeDisplay: (error?: string) => Promise<{ error?: StripeError }>;
};

type QrModalContextType = {
  showQrModal: (qrData: QrCodeDisplayData, callback: QrCallback) => void;
  hideQrModal: () => void;
};

const QrModalContext = createContext<QrModalContextType | null>(null);

export function useQrModal() {
  const context = useContext(QrModalContext);
  if (!context) {
    throw new Error('useQrModal must be used within QrModalProvider');
  }
  return context;
}

export function QrModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [qrData, setQrData] = useState<QrCodeDisplayData | null>(null);
  const callbackRef = useRef<QrCallback | null>(null);

  useStripeTerminal({
    onDidChangePaymentStatus: (status) => {
      if (visible && (status === 'processing' || status === 'ready')) {
        setVisible(false);
        setQrData(null);
        callbackRef.current = null;
      }
    },
  });

const showQrModal = useCallback(async (data: QrCodeDisplayData, callback: QrCallback) => {
    setQrData(data);
    callbackRef.current = callback;
    setVisible(true);

    try {
      await callback.confirmQrCodeDisplayed();
    } catch (err) {
      console.error('[QrModal] Error confirming QR displayed:', err);
    }
  }, []);

  const hideQrModal = useCallback(() => {
    setVisible(false);
    setQrData(null);
    callbackRef.current = null;
  }, []);

  const handleClose = () => {
    hideQrModal();
  };

  const handleCancelPayment = async () => {
    if (callbackRef.current) {
      await callbackRef.current.failQrCodeDisplay('User cancelled');
    }
    hideQrModal();
  };

  return (
    <QrModalContext.Provider value={{ showQrModal, hideQrModal }}>
      {children}
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.content}>
            <Text style={styles.title}>Scan QR Code to Pay</Text>
            <Text style={styles.subtitle}>
              {qrData?.paymentMethodType || 'Payment'}
            </Text>
            {qrData?.imageUrlPng ? (
              <Image
                source={{ uri: qrData.imageUrlPng }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator size="large" color={colors.blurple} />
            )}
            {qrData?.expiresAtMs && (
              <Text style={styles.expiry}>
                Expires: {new Date(qrData.expiresAtMs).toLocaleTimeString()}
              </Text>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelPayment}>
                <Text style={styles.cancelText}>Cancel Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleClose}>
                <Text style={styles.confirmText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </QrModalContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  qrImage: {
    width: 240,
    height: 240,
    marginVertical: 16,
  },
  expiry: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.blurple,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});

