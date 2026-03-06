import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import {
  useStripeTerminal,
  type Reader,
  type Location,
} from '@stripe/stripe-terminal-react-native';
import type { NavigationAction } from '@react-navigation/routers';
import type { EasyConnectParams } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/core';
import { Picker } from '@react-native-picker/picker';
import ListItem from '../components/ListItem';
import List from '../components/List';

import type { RouteParamList } from '../App';
import type { NavigationProp } from '@react-navigation/native';

const DISCOVERY_FILTER = [
  { value: 'none', label: 'None' },
  { value: 'readerId', label: 'ByReaderId' },
  { value: 'serialNumber', label: 'BySerialNumber' },
];

export default function EasyConnectScreen() {
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { params } = useRoute<RouteProp<RouteParamList, 'EasyConnectScreen'>>();

  // Connection state
  const [connecting, setConnecting] = useState(false);
  const [connectedReader, setConnectedReader] = useState<Reader.Type | null>(
    null
  );

  // Configurable parameters
  const [discoveryMethod, setDiscoveryMethod] =
    useState<Reader.DiscoveryMethod>(params.discoveryMethod);
  const [simulated, setSimulated] = useState(params.simulated ?? false);
  const [timeout, setTimeoutValue] = useState(
    params.discoveryTimeout?.toString() || '0'
  );
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  // Initialize discovery filter from params
  const getInitialFilterState = () => {
    const filter = params.discoveryFilter;
    if (filter && 'readerId' in filter && filter.readerId) {
      return { type: 'readerId' as const, value: filter.readerId };
    }
    if (filter && 'serialNumber' in filter && filter.serialNumber) {
      return { type: 'serialNumber' as const, value: filter.serialNumber };
    }
    return { type: 'none' as const, value: '' };
  };

  const initialFilter = getInitialFilterState();
  const [filterType, setFilterType] = useState<
    'none' | 'readerId' | 'serialNumber'
  >(initialFilter.type);
  const [filterValue, setFilterValue] = useState(initialFilter.value);

  // Internet-specific
  const [failIfInUse, setFailIfInUse] = useState(false);

  // TapToPay-specific
  const [
    autoReconnectOnUnexpectedDisconnect,
    setAutoReconnectOnUnexpectedDisconnect,
  ] = useState(false);
  const [merchantDisplayName, setMerchantDisplayName] = useState<
    string | undefined
  >(undefined);
  const [onBehalfOf, setOnBehalfOf] = useState<string | undefined>(undefined);
  const [tosAcceptancePermitted, setTosAcceptancePermitted] = useState(false);

  const { easyConnect, cancelEasyConnect } = useStripeTerminal({});

  const handleGoBack = useCallback(
    async (action: NavigationAction) => {
      if (connecting) {
        await cancelEasyConnect();
      }

      if (navigation.canGoBack()) {
        navigation.dispatch(action);
      }
    },
    [cancelEasyConnect, navigation, connecting]
  );

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: 'Cancel',
    });

    const listener = navigation.addListener('beforeRemove', (e) => {
      if (!connecting) {
        return;
      }

      e.preventDefault();
      handleGoBack(e.data.action);
    });

    return () => navigation.removeListener('beforeRemove', listener);
  }, [navigation, handleGoBack, connecting]);

  const buildDiscoveryFilter = useCallback(() => {
    if (filterType === 'none' || !filterValue) {
      return undefined;
    }
    if (filterType === 'readerId') {
      return { readerId: filterValue };
    }
    if (filterType === 'serialNumber') {
      return { serialNumber: filterValue };
    }
    return undefined;
  }, [filterType, filterValue]);

  const handleEasyConnect = useCallback(async () => {
    setConnecting(true);
    setConnectedReader(null);

    let params: EasyConnectParams;
    const timeoutNum = parseInt(timeout, 10) || 0;
    const discoveryFilter = buildDiscoveryFilter();
    const locationId = simulated ? 'tml_simulated' : selectedLocation?.id;

    // Build params based on discovery method
    if (discoveryMethod === 'internet') {
      params = {
        discoveryMethod: 'internet',
        simulated: simulated,
        timeout: timeoutNum,
        locationId: locationId,
        discoveryFilter: discoveryFilter,
        failIfInUse: failIfInUse,
      };
    } else if (discoveryMethod === 'tapToPay') {
      params = {
        discoveryMethod: 'tapToPay',
        simulated: simulated,
        locationId: locationId ?? "",
        autoReconnectOnUnexpectedDisconnect:
          autoReconnectOnUnexpectedDisconnect,
        merchantDisplayName: merchantDisplayName,
        onBehalfOf: onBehalfOf,
        tosAcceptancePermitted: tosAcceptancePermitted,
      };
    } else if (discoveryMethod === 'appsOnDevices') {
      params = {
        discoveryMethod: 'appsOnDevices'
      };
    } else {
      Alert.alert(
        'Unsupported Discovery Method',
        `EasyConnect does not support ${discoveryMethod}. Please use Internet, Tap to Pay, or Apps on Devices.`
      );
      setConnecting(false);
      return;
    }

    console.log('EasyConnect params:', JSON.stringify(params, null, 2));

    const { reader, error: easyConnectError } = await easyConnect(params);

    setConnecting(false);

    if (easyConnectError) {
      const { code, message } = easyConnectError;
      console.error('EasyConnect error:', code, message);
      Alert.alert('EasyConnect Error', `${code}: ${message}`);
    } else if (reader) {
      console.log('Reader connected via EasyConnect:', reader);
      setConnectedReader(reader);
      Alert.alert(
        'Success!',
        `Connected to ${reader.deviceType}${reader.simulated ? ' (simulated)' : ''
        }`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    }
  }, [
    navigation,
    easyConnect,
    discoveryMethod,
    simulated,
    timeout,
    selectedLocation,
    buildDiscoveryFilter,
    failIfInUse,
    autoReconnectOnUnexpectedDisconnect,
    merchantDisplayName,
    onBehalfOf,
    tosAcceptancePermitted,
  ]);

  const mapFromDiscoveryMethod = (method: Reader.DiscoveryMethod) => {
    switch (method) {
      case 'bluetoothScan':
        return 'Bluetooth Scan';
      case 'bluetoothProximity':
        return 'Bluetooth Proximity';
      case 'internet':
        return 'Internet';
      case 'appsOnDevices':
        return 'Apps On Devices';
      case 'tapToPay':
        return 'Tap To Pay';
      case 'usb':
        return 'USB';
      default:
        return '';
    }
  };

  const validTimeoutMethod = () => {
    return (
      discoveryMethod === 'bluetoothScan' ||
      discoveryMethod === 'usb' ||
      discoveryMethod === 'internet'
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        testID="easy-connect-screen"
        contentContainerStyle={styles.container}
      >
        <ListItem
          testID="start-easy-connect-button"
          title="Start Easy Connect"
          color={colors.blue}
          onPress={handleEasyConnect}
          disabled={connecting || !!connectedReader}
          rightElement={
            connecting ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : undefined
          }
        />

        <List topSpacing={false} title="DISCOVERY METHOD">
          <ListItem
            title={mapFromDiscoveryMethod(discoveryMethod)}
            testID="discovery-method-button"
            onPress={() =>
              navigation.navigate('DiscoveryMethodScreen', {
                onChange: (value: Reader.DiscoveryMethod) => {
                  setDiscoveryMethod(value);
                },
              })
            }
            disabled={connecting}
          />
        </List>

        <List topSpacing={false} title="TIMEOUT" visible={validTimeoutMethod()}>
          <TextInput
            keyboardType="numeric"
            style={styles.input}
            value={timeout !== '0' ? timeout : ''}
            placeholderTextColor={colors.gray}
            placeholder="0 => no timeout"
            onChangeText={setTimeoutValue}
            editable={!connecting}
          />
        </List>

        <List title="SIMULATION">
          <ListItem
            title="Simulated"
            rightElement={
              <Switch
                value={simulated}
                onValueChange={setSimulated}
                disabled={connecting}
              />
            }
          />
          <Text style={styles.infoText}>
            The SDK comes with the ability to simulate behavior without using
            physical hardware. This makes it easy to quickly test your
            integration end-to-end, from connecting a reader to taking payments.
          </Text>
        </List>

        <List title="LOCATION" visible={discoveryMethod !== 'appsOnDevices'}>
          <ListItem
            onPress={() => {
              if (!simulated && !connecting) {
                navigation.navigate('LocationListScreen', {
                  onSelect: (location: Location) =>
                    setSelectedLocation(location),
                  showDummyLocation: true,
                });
              }
            }}
            disabled={simulated || connecting}
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
              Select a location for the reader connection. If you do not select
              a location, the default location will be used.
            </Text>
          )}
        </List>

        <List title="INTERNET OPTIONS" visible={discoveryMethod === 'internet'}>
          <ListItem
            title="Fail If In Use"
            rightElement={
              <Switch
                value={failIfInUse}
                onValueChange={setFailIfInUse}
                disabled={connecting}
              />
            }
          />
        </List>

        <List
          topSpacing={false}
          title="DISCOVERY FILTER"
          visible={discoveryMethod === 'internet'}
        >
          <Picker
            selectedValue={filterType}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            testID="select-discovery-filter"
            onValueChange={(value) => {
              setFilterType(value);
              if (value === 'none') {
                setFilterValue('');
              }
            }}
            enabled={!connecting}
          >
            {DISCOVERY_FILTER.map((a) => (
              <Picker.Item
                key={a.value}
                label={a.label}
                testID={a.value}
                value={a.value}
              />
            ))}
          </Picker>
          <List topSpacing={false} title="" visible={filterType !== 'none'}>
            <TextInput
              style={styles.input}
              value={filterValue}
              onChangeText={setFilterValue}
              placeholder={`Enter ${filterType === 'readerId' ? 'reader ID' : 'serial number'
                }`}
              editable={!connecting}
            />
          </List>
        </List>

        <List
          title="TAP TO PAY OPTIONS"
          visible={discoveryMethod === 'tapToPay'}
        >
          <ListItem
            title="Auto Reconnect"
            rightElement={
              <Switch
                value={autoReconnectOnUnexpectedDisconnect}
                onValueChange={setAutoReconnectOnUnexpectedDisconnect}
                disabled={connecting}
              />
            }
          />
          <ListItem
            title="Merchant Display Name"
            rightElement={
              <TextInput
                style={styles.paramInput}
                value={merchantDisplayName}
                onChangeText={setMerchantDisplayName}
                placeholder="Optional"
                editable={!connecting}
              />
            }
          />
          <ListItem
            title="On Behalf Of"
            rightElement={
              <TextInput
                style={styles.paramInput}
                value={onBehalfOf}
                onChangeText={setOnBehalfOf}
                placeholder="Optional"
                editable={!connecting}
              />
            }
          />
          <ListItem
            title="TOS Acceptance Permitted"
            rightElement={
              <Switch
                value={tosAcceptancePermitted}
                onValueChange={setTosAcceptancePermitted}
                disabled={connecting}
              />
            }
          />
        </List>

        <Text style={styles.infoText}>
          EasyConnect is a simplified API that combines discovery and connection
          into a single operation. Configure the parameters above and press
          "Start Easy Connect" to begin.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    alignSelf: 'stretch',
    paddingBottom: 30,
  },
  errorText: {
    fontSize: 14,
    color: colors.red,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  infoText: {
    paddingHorizontal: 16,
    color: colors.dark_gray,
    marginVertical: 16,
    lineHeight: 20,
  },
  paramValue: {
    color: colors.dark_gray,
    fontSize: 14,
  },
  paramInput: {
    color: colors.dark_gray,
    fontSize: 14,
    minWidth: 150,
    textAlign: 'right',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  input: {
    height: 44,
    backgroundColor: colors.white,
    color: colors.dark_gray,
    paddingLeft: 16,
    borderBottomColor: colors.gray,
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomWidth: 1,
      },
    }),
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
    color: colors.slate,
  },
});
