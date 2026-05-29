import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import {
  useStripeTerminal,
  UpdateComponent,
  type Location,
  type Reader,
  type PaymentIntent,
  type PaymentOption,
  type QrCodeDisplayData,
} from '@stripe/stripe-terminal-react-native';
import type { NavigationAction } from '@react-navigation/routers';
import type {
  ConnectBluetoothReaderParams,
  ConnectBluetoothProximityReaderParams,
  ConnectAppsOnDevicesParams,
  ConnectInternetReaderParams,
  ConnectTapToPayParams,
  ConnectUsbReaderParams,
  ConnectReaderParams,
  StripeError,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/core';
import ListItem from '../components/ListItem';
import List from '../components/List';

import type { RouteParamList } from '../App';
import { AppContext } from '../AppContext';
import type { NavigationProp } from '@react-navigation/native';
import { showErrorAlert } from '../util/errorHandling';
import { useQrModal } from '../components/QrModalContext';
import {
  buildTestReaderUpdate,
  getUpdateDisplayName,
  type TestReaderUpdateTypeName,
} from './TestReaderUpdateScreen';

export default function DiscoverReadersScreen() {
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { params } =
    useRoute<RouteProp<RouteParamList, 'DiscoverReadersScreen'>>();
  const [discoveringLoading, setDiscoveringLoading] = useState(true);
  const [connectingReader, setConnectingReader] = useState<Reader.Type>();
  const {
    autoReconnectOnUnexpectedDisconnect,
    setAutoReconnectOnUnexpectedDisconnect,
  } = useContext(AppContext);
  const { showQrModal } = useQrModal();
  const {
    simulated,
    discoveryMethod,
    discoveryTimeout,
    discoveryFilter,
    setPendingUpdateInfo,
    appTransitionAnimation,
  } = params;

  const [selectedLocation, setSelectedLocation] = useState<Location>();
  const [selectedUpdateType, setSelectedUpdateType] =
    useState<TestReaderUpdateTypeName>('none');
  const [selectedComponents, setSelectedComponents] = useState<
    UpdateComponent[]
  >([UpdateComponent.CONFIG]);

  const {
    cancelDiscovering,
    discoverReaders,
    connectReader,
    discoveredReaders,
  } = useStripeTerminal({
    onFinishDiscoveringReaders: (finishError) => {
      if (finishError) {
        if (shouldShowDiscoverError(finishError)) {
          console.error(
            'Discover readers error',
            `${finishError.code}, ${finishError.message}`
          );
        }
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      } else {
        console.log('onFinishDiscoveringReaders success');
      }
      setDiscoveringLoading(false);
    },
    onDidStartInstallingUpdate: (update) => {
      navigation.navigate('UpdateReaderScreen', {
        update,
        reader: connectingReader!,
        onDidUpdate: () => {
          setPendingUpdateInfo(null);
          setTimeout(() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }, 500);
        },
        started: true,
      });
    },
    onDidReportAvailableUpdate: (update) => {
      setPendingUpdateInfo(update);
      Alert.alert('New update is available', update.deviceSoftwareVersion);
    },
    onDidAcceptTermsOfService: () => {
      Alert.alert('Accept terms of Service');
    },
  });

  const isBTReader = (reader: Reader.Type) =>
    ['stripeM2', 'chipper2X', 'chipper1X', 'wisePad3'].includes(
      reader.deviceType
    );

  const getReaderDisplayName = (reader: Reader.Type) => {
    if (reader?.simulated) {
      return `SimulatorID - ${reader.deviceType}`;
    }

    return `${reader?.label || reader?.serialNumber} - ${reader.deviceType}`;
  };

  const handleGoBack = useCallback(
    async (action: NavigationAction) => {
      await cancelDiscovering();

      if (navigation.canGoBack()) {
        navigation.dispatch(action);
      }
    },
    [cancelDiscovering, navigation]
  );

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: 'Cancel',
    });

    const listener = navigation.addListener('beforeRemove', (e) => {
      if (!discoveringLoading || !!connectingReader) {
        return;
      }

      e.preventDefault();
      handleGoBack(e.data.action);
    });

    return () => navigation.removeListener('beforeRemove', listener);
  }, [
    navigation,
    cancelDiscovering,
    discoveringLoading,
    handleGoBack,
    connectingReader,
  ]);

  const handleDiscoverReaders = useCallback(async () => {
    setDiscoveringLoading(true);
    // List of discovered readers will be available within useStripeTerminal hook
    const { error: discoverReadersError } = await discoverReaders({
      discoveryMethod,
      simulated,
      timeout: discoveryTimeout,
      discoveryFilter: discoveryFilter,
    });

    if (discoverReadersError) {
      if (shouldShowDiscoverError(discoverReadersError)) {
        showErrorAlert(discoverReadersError, 'Discover readers error');
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  }, [
    navigation,
    discoverReaders,
    discoveryFilter,
    discoveryMethod,
    discoveryTimeout,
    simulated,
  ]);

  useEffect(() => {
    handleDiscoverReaders();
  }, [handleDiscoverReaders]);

  const handleConnectReader = async (reader: Reader.Type) => {
    let error: StripeError | undefined;

    setConnectingReader(reader);
    if (discoveryMethod === 'internet') {
      error = await connectReaderWrapper(getInternetParams(reader));
    } else if (discoveryMethod === 'bluetoothScan') {
      error = await connectReaderWrapper(getBluetoothParams(reader));
    } else if (discoveryMethod === 'bluetoothProximity') {
      error = await connectReaderWrapper(getBluetoothProximityParams(reader));
    } else if (discoveryMethod === 'tapToPay') {
      error = await connectReaderWrapper(getTapToPayParams(reader));
    } else if (discoveryMethod === 'appsOnDevices') {
      error = await connectReaderWrapper(getAppsOnDevicesParams(reader));
    } else if (discoveryMethod === 'usb') {
      error = await connectReaderWrapper(getUsbParams(reader));
    }
    if (error) {
      setConnectingReader(undefined);
      showErrorAlert(error);
    } else if (selectedUpdateType !== 'required' && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handlePaymentMethodSelectionRequired = (
    _paymentIntent: PaymentIntent.Type,
    availableOptions: PaymentOption[],
    callback: {
      selectPaymentOption: (paymentOptionType: string) => Promise<{ error?: StripeError }>;
      failPaymentMethodSelection: (error?: string) => Promise<{ error?: StripeError }>;
    }
  ) => {
    const buttons = availableOptions.map((option) => ({
      text: option.label || (option.type === 'card' ? 'Card' : option.paymentMethodType || 'Unknown'),
      onPress: () => {
        const optionType = option.type === 'card' ? 'card' : option.paymentMethodType;
        if (optionType) {
          callback.selectPaymentOption(optionType);
        }
      },
    }));

    buttons.push({
      text: 'Cancel',
      onPress: () => {
        callback.failPaymentMethodSelection('User cancelled');
      },
    });

    Alert.alert(
      'Select Payment Method',
      `${availableOptions.length} options available`,
      buttons
    );
  };

  const handleQrCodeDisplayRequired = (
    _paymentIntent: PaymentIntent.Type,
    qrDisplayData: QrCodeDisplayData,
    callback: {
      confirmQrCodeDisplayed: () => Promise<{ error?: StripeError }>;
      failQrCodeDisplay: (error?: string) => Promise<{ error?: StripeError }>;
    }
  ) => {
    showQrModal(qrDisplayData, callback);
  };

  const currentTestReaderUpdate = buildTestReaderUpdate(
    selectedUpdateType,
    selectedComponents
  );

  const getBluetoothParams = (
    reader: Reader.Type
  ): ConnectBluetoothReaderParams => ({
    discoveryMethod: 'bluetoothScan',
    reader: reader,
    locationId: selectedLocation?.id || reader?.location?.id || "",
    autoReconnectOnUnexpectedDisconnect: autoReconnectOnUnexpectedDisconnect,
    onPaymentMethodSelectionRequired: handlePaymentMethodSelectionRequired,
    onQrCodeDisplayRequired: handleQrCodeDisplayRequired,
    testReaderUpdate: currentTestReaderUpdate,
  });

  const getBluetoothProximityParams = (
    reader: Reader.Type
  ): ConnectBluetoothProximityReaderParams => ({
    discoveryMethod: 'bluetoothProximity',
    reader: reader,
    locationId: selectedLocation?.id || reader?.location?.id || "",
    autoReconnectOnUnexpectedDisconnect: autoReconnectOnUnexpectedDisconnect,
    onPaymentMethodSelectionRequired: handlePaymentMethodSelectionRequired,
    onQrCodeDisplayRequired: handleQrCodeDisplayRequired,
    testReaderUpdate: currentTestReaderUpdate,
  });

  const getInternetParams = (
    reader: Reader.Type
  ): ConnectInternetReaderParams => ({
    discoveryMethod: 'internet',
    reader: reader,
  });

  const getUsbParams = (reader: Reader.Type): ConnectUsbReaderParams => ({
    discoveryMethod: 'usb',
    reader: reader,
    locationId: selectedLocation?.id || reader?.location?.id || "",
    autoReconnectOnUnexpectedDisconnect: autoReconnectOnUnexpectedDisconnect,
    onPaymentMethodSelectionRequired: handlePaymentMethodSelectionRequired,
    onQrCodeDisplayRequired: handleQrCodeDisplayRequired,
    testReaderUpdate: currentTestReaderUpdate,
  });

  const getTapToPayParams = (reader: Reader.Type): ConnectTapToPayParams => ({
    discoveryMethod: 'tapToPay',
    reader: reader,
    locationId: selectedLocation?.id || reader?.location?.id || "",
    autoReconnectOnUnexpectedDisconnect: autoReconnectOnUnexpectedDisconnect,
    ...(Platform.OS === 'ios' ? { testReaderUpdate: currentTestReaderUpdate } : {}),
  });

  const getAppsOnDevicesParams = (
    reader: Reader.Type
  ): ConnectAppsOnDevicesParams => ({
    discoveryMethod: 'appsOnDevices',
    reader: reader,
    appTransitionAnimation,
  });

  const connectReaderWrapper = async (params: ConnectReaderParams) => {
    const { error } = await connectReader(params);
    return error;
  };

  const supportsTestReaderUpdate =
    discoveryMethod !== 'internet' &&
    discoveryMethod !== 'appsOnDevices' &&
    !(discoveryMethod === 'tapToPay' && Platform.OS === 'android');

  return (
    <ScrollView
      testID="discovery-readers-screen"
      contentContainerStyle={styles.container}
    >
      {discoveryMethod != 'internet' && (
        <List title="SELECT LOCATION">
          <ListItem
            onPress={() => {
              if (!simulated) {
                navigation.navigate('LocationListScreen', {
                  onSelect: (location: Location) =>
                    setSelectedLocation(location),
                  showDummyLocation: true,
                });
              }
            }}
            disabled={simulated}
            title={
              simulated
                ? 'Mock simulated reader location'
                : selectedLocation?.displayName || 'No location selected'
            }
          />

          {simulated ? (
            <Text style={styles.infoText}>
              Simulated readers are always registered to the mock simulated
              location.
            </Text>
          ) : (
            <Text style={styles.infoText}>
              Bluetooth readers must be registered to a location during the
              connection process. If you do not select a location, the reader
              will attempt to register to the same location it was registered to
              during the previous connection.
            </Text>
          )}
        </List>
      )}

      {supportsTestReaderUpdate && (
        <List title="TEST READER UPDATE">
          <ListItem
            testID="test-reader-update-button"
            onPress={() => {
              navigation.navigate('TestReaderUpdateScreen', {
                currentType: selectedUpdateType,
                currentComponents: selectedComponents,
                discoveryMethod: discoveryMethod,
                onSelect: (type: TestReaderUpdateTypeName, components: UpdateComponent[]) => {
                  setSelectedUpdateType(type);
                  setSelectedComponents(components);
                },
              });
            }}
            title={getUpdateDisplayName(
              selectedUpdateType,
              selectedComponents
            )}
          />
        </List>
      )}

      {!simulated &&
        (discoveryMethod === 'bluetoothScan' ||
          discoveryMethod === 'usb' ||
          discoveryMethod === 'tapToPay' ||
          discoveryMethod === 'bluetoothProximity') && (
          <List
            bolded={false}
            topSpacing={false}
            title="AUTOMATIC RECONNECTION"
          >
            <ListItem
              title="Enable Auto-Reconnect"
              rightElement={
                <Switch
                  testID="enable-automatic-reconnection"
                  value={autoReconnectOnUnexpectedDisconnect}
                  onValueChange={(value) => {
                    setAutoReconnectOnUnexpectedDisconnect(value);
                  }}
                />
              }
            />

            <Text style={styles.infoText}>
              Automatic reconnection support for Bluetooth in iOS and Bluetooth
              and USB in Android, where if the reader loses connection the SDK
              will automatically attempts to reconnect to the reader.
            </Text>
          </List>
        )}

      <List
        title="NEARBY READERS"
        loading={discoveringLoading}
        description={connectingReader ? 'Connecting...' : undefined}
      >
        {discoveredReaders.map((reader, index) => (
          <ListItem
            key={reader.serialNumber}
            onPress={() => handleConnectReader(reader)}
            title={getReaderDisplayName(reader)}
            testID={`reader-${index}`}
            disabled={!isBTReader(reader) && reader.status === 'offline'}
          />
        ))}
      </List>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    alignSelf: 'stretch',
  },
  infoText: {
    paddingHorizontal: 16,
    color: colors.dark_gray,
    marginVertical: 16,
  },
});

function shouldShowDiscoverError(error: StripeError) {
  if (Platform.OS === 'android') {
    return error.code.toString() != 'USER_ERROR.CANCELED';
  } else if (Platform.OS === 'ios') {
    return error.code.toString() != 'Canceled';
  }
  return true;
}
