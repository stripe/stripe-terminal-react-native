import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  Modal,
  View,
  TouchableWithoutFeedback,
  Platform,
  Switch,
} from 'react-native';
import {
  useStripeTerminal,
  Location,
  Reader,
} from '@stripe/stripe-terminal-react-native';
import type { NavigationAction } from '@react-navigation/routers';
import type { StripeError } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import { Picker } from '@react-native-picker/picker';
import ListItem from '../components/ListItem';
import List from '../components/List';

import type { RouteParamList } from '../App';
import { AppContext } from '../AppContext';

const SIMULATED_UPDATE_PLANS = [
  'random',
  'available',
  'none',
  'required',
  'lowBattery',
];

export default function DiscoverReadersScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RouteParamList, 'DiscoverReaders'>>();
  const [discoveringLoading, setDiscoveringLoading] = useState(true);
  const [connectingReader, setConnectingReader] = useState<Reader.Type>();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<Picker<string>>();
  const {
    autoReconnectOnUnexpectedDisconnect,
    setAutoReconnectOnUnexpectedDisconnect,
  } = useContext(AppContext);
  const { simulated, discoveryMethod, discoveryTimeout, setPendingUpdateInfo } =
    params;

  const {
    cancelDiscovering,
    discoverReaders,
    connectBluetoothReader,
    discoveredReaders,
    connectInternetReader,
    connectUsbReader,
    simulateReaderUpdate,
    connectLocalMobileReader,
    connectHandoffReader,
  } = useStripeTerminal({
    onFinishDiscoveringReaders: (finishError) => {
      if (finishError) {
        console.error(
          'Discover readers error',
          `${finishError.code}, ${finishError.message}`
        );
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
        reader: connectingReader,
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

  const [selectedLocation, setSelectedLocation] = useState<Location>();
  const [selectedUpdatePlan, setSelectedUpdatePlan] =
    useState<Reader.SimulateUpdateType>('none');

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
    });

    if (discoverReadersError) {
      const { code, message } = discoverReadersError;
      Alert.alert('Discover readers error: ', `${code}, ${message}`);
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  }, [
    navigation,
    discoverReaders,
    discoveryMethod,
    discoveryTimeout,
    simulated,
  ]);

  useEffect(() => {
    simulateReaderUpdate('none');
    handleDiscoverReaders();
  }, [handleDiscoverReaders, simulateReaderUpdate]);

  const handleConnectReader = async (reader: Reader.Type) => {
    let error: StripeError | undefined;
    if (discoveryMethod === 'internet') {
      const result = await handleConnectInternetReader(reader);
      error = result.error;
    } else if (
      discoveryMethod === 'bluetoothScan' ||
      discoveryMethod === 'bluetoothProximity'
    ) {
      const result = await handleConnectBluetoothReader(reader);
      error = result.error;
    } else if (discoveryMethod === 'localMobile') {
      const result = await handleConnectLocalMobileReader(reader);
      error = result.error;
    } else if (discoveryMethod === 'handoff') {
      const result = await handleConnectHandoffReader(reader);
      error = result.error;
    } else if (discoveryMethod === 'usb') {
      const result = await handleConnectUsbReader(reader);
      error = result.error;
    }
    if (error) {
      setConnectingReader(undefined);
      Alert.alert(error.code, error.message);
    } else if (selectedUpdatePlan !== 'required' && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleConnectHandoffReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectHandoffReader({
      reader,
      locationId: selectedLocation?.id,
    });

    if (error) {
      console.log('connectHandoffReader error:', error);
    } else {
      console.log('Reader connected successfully', connectedReader);
    }
    return { error };
  };

  const handleConnectLocalMobileReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectLocalMobileReader({
      reader,
      locationId: selectedLocation?.id,
      autoReconnectOnUnexpectedDisconnect: autoReconnectOnUnexpectedDisconnect,
    });

    if (error) {
      console.log('connectLocalMobileReader error:', error);
    } else {
      console.log('Reader connected successfully', connectedReader);
    }
    return { error };
  };

  const handleConnectBluetoothReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectBluetoothReader({
      reader,
      locationId: selectedLocation?.id || reader?.location?.id,
      autoReconnectOnUnexpectedDisconnect: autoReconnectOnUnexpectedDisconnect,
    });

    if (error) {
      console.log('connectBluetoothReader error:', error);
    } else {
      console.log('Reader connected successfully', connectedReader);
    }
    return { error };
  };

  const handleConnectInternetReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectInternetReader({
      reader,
    });

    if (error) {
      console.log('connectInternetReader error:', error);
    } else {
      console.log('Reader connected successfully', connectedReader);
    }
    return { error };
  };

  const handleConnectUsbReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectUsbReader({
      reader,
      locationId: selectedLocation?.id || reader?.location?.id,
      autoReconnectOnUnexpectedDisconnect: autoReconnectOnUnexpectedDisconnect,
    });

    if (error) {
      console.log('connectUsbReader error:', error);
    } else {
      console.log('Reader connected successfully', connectedReader);
    }
    return { error };
  };

  const handleChangeUpdatePlan = async (plan: Reader.SimulateUpdateType) => {
    await simulateReaderUpdate(plan);
    setSelectedUpdatePlan(plan);
  };

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

      {simulated && discoveryMethod !== 'internet' && (
        <List title="SIMULATED UPDATE PLAN">
          <ListItem
            testID="update-plan-picker"
            onPress={() => {
              setShowPicker(true);

              // Android workaround for instant diplaying options list
              setTimeout(() => {
                pickerRef.current?.focus();
              }, 100);
            }}
            title={mapToPlanDisplayName(selectedUpdatePlan)}
          />
        </List>
      )}

      {!simulated &&
        (discoveryMethod === 'bluetoothScan' ||
          discoveryMethod === 'usb' ||
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
        {discoveredReaders.map((reader) => (
          <ListItem
            key={reader.serialNumber}
            onPress={() => handleConnectReader(reader)}
            title={getReaderDisplayName(reader)}
            disabled={!isBTReader(reader) && reader.status === 'offline'}
          />
        ))}
      </List>

      <Modal visible={showPicker} transparent>
        <TouchableWithoutFeedback
          testID="close-picker"
          onPress={() => {
            setShowPicker(false);
          }}
        >
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.pickerContainer} testID="picker-container">
          <Picker
            selectedValue={selectedUpdatePlan}
            ref={pickerRef as any}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            onValueChange={(itemValue) => {
              handleChangeUpdatePlan(itemValue);
              if (Platform.OS === 'android') {
                setShowPicker(false);
              }
            }}
          >
            {SIMULATED_UPDATE_PLANS.map((plan) => (
              <Picker.Item
                key={plan}
                label={mapToPlanDisplayName(plan)}
                testID={plan}
                value={plan}
              />
            ))}
          </Picker>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    alignSelf: 'stretch',
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.white,
    left: 0,
    width: '100%',
    ...Platform.select({
      ios: {
        height: 200,
      },
    }),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  discoveredWrapper: {
    height: 50,
  },
  buttonWrapper: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    width: '100%',
  },
  locationListTitle: {
    fontWeight: '700',
  },
  picker: {
    width: '100%',
    ...Platform.select({
      android: {
        color: colors.slate,
        fontSize: 13,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
      },
    }),
  },
  pickerItem: {
    fontSize: 16,
  },
  text: {
    paddingHorizontal: 12,
    color: colors.white,
  },
  info: {
    fontWeight: '700',
    marginVertical: 10,
  },
  serialNumber: {
    maxWidth: '70%',
  },
  cancelButton: {
    color: colors.white,
    marginLeft: 22,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  infoText: {
    paddingHorizontal: 16,
    color: colors.dark_gray,
    marginVertical: 16,
  },
});

function mapToPlanDisplayName(plan: string) {
  switch (plan) {
    case 'random':
      return 'Random';
    case 'available':
      return 'Update Available';
    case 'none':
      return 'No Update';
    case 'required':
      return 'Update required';
    case 'lowBattery':
      return 'Update required; reader has low battery';
    default:
      return '';
  }
}
