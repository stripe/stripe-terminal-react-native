import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  Modal,
  View,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {
  useStripeTerminal,
  Location,
  Reader,
} from '@stripe/stripe-terminal-react-native';
import type { NavigationAction } from '@react-navigation/routers';
import type { StripeError } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { useNavigation, useRoute, RouteProp, type NavigationProp } from '@react-navigation/core';
import { Picker } from '@react-native-picker/picker';
import ListItem from '../components/ListItem';
import List from '../components/List';

import type { RouteParamList } from '../App';
import { showErrorAlert } from '../util/errorHandling';

const SIMULATED_UPDATE_PLANS = [
  'random',
  'available',
  'none',
  'required',
  'lowBattery',
];

export default function DiscoverReadersScreen() {
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { params } =
    useRoute<RouteProp<RouteParamList, 'DiscoverReadersScreen'>>();
  const [discoveringLoading, setDiscoveringLoading] = useState(true);
  const [connectingReader, setConnectingReader] = useState<Reader.Type>();
  const [showPicker, setShowPicker] = useState(false);

  const { simulated, discoveryMethod } = params;

  const {
    cancelDiscovering,
    discoverReaders,
    connectReader,
    discoveredReaders,
    simulateReaderUpdate,
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
          setTimeout(() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }, 500);
        },
      });
    },
    onDidReportAvailableUpdate: (update) => {
      Alert.alert('New update is available', update.deviceSoftwareVersion);
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

    navigation.addListener('beforeRemove', (e) => {
      if (!discoveringLoading) {
        return;
      }
      e.preventDefault();
      handleGoBack(e.data.action);
    });
  }, [navigation, cancelDiscovering, discoveringLoading, handleGoBack]);

  const handleDiscoverReaders = useCallback(async () => {
    setDiscoveringLoading(true);
    // List of discovered readers will be available within useStripeTerminal hook
    const { error: discoverReadersError } = await discoverReaders({
      discoveryMethod,
      simulated,
    });

    if (discoverReadersError) {
      showErrorAlert(discoverReadersError, 'Discover readers error');
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  }, [navigation, discoverReaders, discoveryMethod, simulated]);

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
    } else if (discoveryMethod === 'tapToPay') {
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
      showErrorAlert(error);
    } else if (selectedUpdatePlan !== 'required' && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleConnectHandoffReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectReader(
      {
        reader,
        locationId: selectedLocation?.id,
      },
      'handoff'
    );

    if (error) {
      console.log('connectHandoffReader error:', error);
    } else {
      console.log('Reader connected successfully', connectedReader);
    }
    return { error };
  };

  const handleConnectLocalMobileReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectReader(
      {
        reader,
        locationId: selectedLocation?.id,
      },
      'tapToPay'
    );

    if (error) {
      console.log('connectLocalMobileReader error:', error);
    } else {
      console.log('Reader connected successfully', connectedReader);
    }
    return { error };
  };

  const handleConnectBluetoothReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectReader(
      {
        reader,
        locationId: selectedLocation?.id || reader?.location?.id,
        autoReconnectOnUnexpectedDisconnect: false,
      },
      'bluetoothScan'
    );

    if (error) {
      console.log('connectBluetoothReader error:', error);
    } else {
      console.log('Reader connected successfully', connectedReader);
    }
    return { error };
  };

  const handleConnectInternetReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectReader(
      {
        reader,
      },
      'internet'
    );

    if (error) {
      console.log('connectInternetReader error:', error);
    } else {
      console.log('Reader connected successfully', connectedReader);
    }
    return { error };
  };

  const handleConnectUsbReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectReader(
      {
        reader,
        locationId: selectedLocation?.id || reader?.location?.id,
        autoReconnectOnUnexpectedDisconnect: false,
      },
      'usb'
    );

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
      <List title="SELECT LOCATION">
        <ListItem
          onPress={() => {
            if (!simulated) {
              navigation.navigate('LocationListScreen', {
                onSelect: (location: Location) => setSelectedLocation(location),
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
            connection process. If you do not select a location, the reader will
            attempt to register to the same location it was registered to during
            the previous connection.
          </Text>
        )}
      </List>

      {simulated && discoveryMethod !== 'internet' && (
        <List title="SIMULATED UPDATE PLAN">
          {Platform.OS !== 'ios' ? (
            <Picker
              selectedValue={selectedUpdatePlan}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              testID="update-plan-picker"
              onValueChange={(itemValue) => handleChangeUpdatePlan(itemValue)}
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
          ) : (
            <ListItem
              testID="update-plan-picker"
              onPress={() => setShowPicker(true)}
              title={mapToPlanDisplayName(selectedUpdatePlan)}
            />
          )}
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
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.pickerContainer} testID="picker-container">
          <Picker
            selectedValue={selectedUpdatePlan}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            onValueChange={(itemValue) => handleChangeUpdatePlan(itemValue)}
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
    height: '100%',
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
