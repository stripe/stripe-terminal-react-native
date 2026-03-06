/**
 * This is a test/verification screen for "Apps on Devices" (AoD) mode - a Stripe Terminal
 * feature where the payment reader runs directly on the device itself (serverless).
 *
 * The screen automatically runs 3 verification checks:
 *   1. Discover a reader with AppsOnDevicesConnectionTokenProvider
 *   2. Connect to the reader with AppsOnDevicesConnectionTokenProvider
 *   3. Verify online mode works (not in offline-only mode)
 */

import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import {
  useStripeTerminal,
  type Reader,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import ListItem from '../components/ListItem';
import List from '../components/List';
import { clearServerlessAoDTestPending } from '../util/merchantStorage';
import RNRestart from 'react-native-restart';

interface VerificationStep {
  title: string;
  status: VerificationStep.StatusType;
  detail?: string;
}

namespace VerificationStep {
  export const Steps = {
    STEP_1_DISCOVERY: 'Reader Discovery',
    STEP_2_CONNECTION: 'Reader Connection',
    STEP_3_ONLINE_MODE: 'Online Mode Verification',
  } as const;

  export const Status = {
    pending: { icon: '○', color: colors.gray },
    success: { icon: '✓', color: colors.green },
    failure: { icon: '✗', color: colors.red },
  } as const;

  export type StatusType = typeof Status[keyof typeof Status];
}

export default function AppsOnDevicesTestScreen() {

  // initial state (all steps pending)
  const [steps, setSteps] = useState<VerificationStep[]>([
    { title: VerificationStep.Steps.STEP_1_DISCOVERY, status: VerificationStep.Status.pending },
    { title: VerificationStep.Steps.STEP_2_CONNECTION, status: VerificationStep.Status.pending },
    { title: VerificationStep.Steps.STEP_3_ONLINE_MODE, status: VerificationStep.Status.pending },
  ]);

  const initStarted = useRef(false);

  const updateStep = useCallback((title: string, status: VerificationStep.StatusType, detail?: string) => {
    setSteps(prev => prev.map(step =>
      step.title === title ? { ...step, status, detail } : step
    ));
  }, []);

  const hasError = steps.some(s => s.status === VerificationStep.Status.failure);

  const {
    initialize,
    discoverReaders,
    connectReader,
    discoveredReaders,
    cancelDiscovering,
    createPaymentIntent,
  } = useStripeTerminal({
    onFinishDiscoveringReaders: (error) => {
      if (error) updateStep(VerificationStep.Steps.STEP_1_DISCOVERY, VerificationStep.Status.failure, error.message);
    },
  });

  // Verifies STEP_3_ONLINE_MODE: tries an online-only operation to verify we're not in offline mode.
  const verifyOnlineMode = useCallback(async () => {
    const { paymentIntent, error } = await createPaymentIntent({
      amount: 100,
      currency: 'usd',
      offlineBehavior: 'require_online',
    });

    if (error) {
      updateStep(VerificationStep.Steps.STEP_3_ONLINE_MODE, VerificationStep.Status.failure, `${error.code}: ${error.message}`);
    } else if (paymentIntent) {
      updateStep(VerificationStep.Steps.STEP_3_ONLINE_MODE, VerificationStep.Status.success, 'Online mode verified');
    }
  }, [createPaymentIntent, updateStep]);

  // Verifies STEP_2_CONNECTION: listens for successful connection to AppsOnDevices reader.
  const handleConnectReader = useCallback(async (reader: Reader.Type) => {
    const { reader: result, error } = await connectReader({
      discoveryMethod: 'appsOnDevices',
      reader,
    });
    if (error) {
      updateStep(VerificationStep.Steps.STEP_2_CONNECTION, VerificationStep.Status.failure, error.message);
    } else if (result) {
      updateStep(VerificationStep.Steps.STEP_2_CONNECTION, VerificationStep.Status.success, `${result.deviceType} (${result.serialNumber})`);
      // After successful connection, verify we're in online mode
      await verifyOnlineMode();
    }
  }, [connectReader, updateStep, verifyOnlineMode]);

  // Initialize Terminal with Terminal.init(...) and Discover readers.
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    (async () => {
      const { error } = await initialize();
      if (error) {
        updateStep(VerificationStep.Steps.STEP_1_DISCOVERY, VerificationStep.Status.failure, `Init failed: ${error.message}`);
        return;
      }

      const { error: discoverError } = await discoverReaders({ discoveryMethod: 'appsOnDevices' });
      if (discoverError) {
        updateStep(VerificationStep.Steps.STEP_1_DISCOVERY, VerificationStep.Status.failure, discoverError.message);
      }
    })();

    return () => { cancelDiscovering(); };
  }, [initialize, discoverReaders, cancelDiscovering, updateStep]);

  // Verifies STEP_1_DISCOVERY once an AppsOnDevices reader is found with AppsOnDevicesConnectionTokenProvider
  useEffect(() => {
    const discoveryPending = steps.find(s => s.title === VerificationStep.Steps.STEP_1_DISCOVERY)?.status === VerificationStep.Status.pending;
    const connectionPending = steps.find(s => s.title === VerificationStep.Steps.STEP_2_CONNECTION)?.status === VerificationStep.Status.pending;
    const reader = discoveredReaders[0];

    if (reader && discoveryPending && connectionPending) {
      updateStep(VerificationStep.Steps.STEP_1_DISCOVERY, VerificationStep.Status.success, `Found ${reader.deviceType}`);
      handleConnectReader(reader);
    }
  }, [discoveredReaders, steps, handleConnectReader, updateStep]);

  // Reset button to exit Serverless AoD test mode
  const handleReturnToNormalMode = useCallback(async () => {
    await clearServerlessAoDTestPending();
    RNRestart.restart();
  }, []);

  return (
    <ScrollView
      testID="apps-on-devices-test-screen"
      contentContainerStyle={styles.container}
    >
      <List title="VERIFICATION STEPS">
        {steps.map((step) => (
          <View key={step.title} style={styles.stepRow}>
            <Text style={[styles.stepIcon, { color: step.status.color }]}>
              {step.status.icon}
            </Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: step.status.color }]}>
                {step.title}
              </Text>
              {step.detail && (
                <Text style={styles.stepDetail}>{step.detail}</Text>
              )}
              {step.status === VerificationStep.Status.pending && (
                <Text style={styles.stepDetail}>Waiting...</Text>
              )}
            </View>
          </View>
        ))}
      </List>

      <View style={styles.buttonContainer}>
        <ListItem
          title="Return to Normal Mode"
          color={hasError ? colors.red : colors.blue}
          onPress={handleReturnToNormalMode}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    flexGrow: 1,
    paddingBottom: 30,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray,
  },
  stepIcon: {
    fontSize: 18,
    fontWeight: '600',
    width: 24,
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  stepDetail: {
    fontSize: 13,
    color: colors.dark_gray,
    marginTop: 2,
  },
  buttonContainer: {
    marginTop: 20,
  },
});
