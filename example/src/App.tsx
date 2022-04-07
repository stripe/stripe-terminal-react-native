import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  HeaderBackButton,
  TransitionPresets,
} from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import { /* Alert , */ Platform, StatusBar, StyleSheet } from 'react-native';
import { colors } from './colors';
import { LogContext, Log, Event } from './components/LogContext';
import DiscoverReadersScreen from './screens/DiscoverReadersScreen';
import ReaderDisplayScreen from './screens/ReaderDisplayScreen';
import LocationListScreen from './screens/LocationListScreen';
import UpdateReaderScreen from './screens/UpdateReaderScreen';
import RefundPaymentScreen from './screens/RefundPaymentScreen';
import DiscoveryMethodScreen from './screens/DiscoveryMethodScreen';
import CollectCardPaymentScreen from './screens/CollectCardPaymentScreen';
import SetupIntentScreen from './screens/SetupIntentScreen';
import MerchantSelectScreen from './screens/MerchantSelectScreen';
import ReadReusableCardScreen from './screens/ReadReusableCardScreen';
import LogListScreen from './screens/LogListScreen';
import LogScreen from './screens/LogScreen';
import RegisterInternetReaderScreen from './screens/RegisterInternetReaderScreen';
import {
  Reader,
  Location,
  // useStripeTerminal,
  requestNeededAndroidPermissions,
} from 'stripe-terminal-react-native';
import { LogBox } from 'react-native';

import { AppContext } from './AppContext';
import type { IAccount, Api } from './types';
import { ClientApi } from './api/client-api';
import { setSelectedAccount } from './util/merchantStorage';

export type RouteParamList = {
  UpdateReader: {
    update: Reader.SoftwareUpdate;
    reader: Reader.Type;
    onDidUpdate: () => void;
  };
  LocationList: {
    onSelect: (location: Location) => void;
  };
  DiscoveryMethod: {
    onChange: (method: Reader.DiscoveryMethod) => void;
  };
  SetupIntent: {
    discoveryMethod: Reader.DiscoveryMethod;
  };
  DiscoverReaders: {
    simulated: boolean;
    discoveryMethod: Reader.DiscoveryMethod;
  };
  MerchantSelect: {
    onSelectMerchant: ({
      selectedAccountKey,
    }: {
      selectedAccountKey: string;
    }) => void;
  };
  CollectCardPayment: {
    simulated: boolean;
    discoveryMethod: Reader.DiscoveryMethod;
  };
  Log: {
    event: Event;
    log: Log;
  };
};

LogBox.ignoreLogs([
  // https://reactnavigation.org/docs/5.x/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state
  'Non-serializable values were found in the navigation state',
  // https://github.com/software-mansion/react-native-gesture-handler/issues/722
  'RCTBridge required dispatch_sync to load RNGestureHandlerModule. This may lead to deadlocks',
  // https://github.com/react-native-netinfo/react-native-netinfo/issues/486
  'new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.',
  'new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.',
]);

const Stack = createStackNavigator();

const screenOptions = {
  headerTintColor: colors.white,
  headerStyle: {
    shadowOpacity: 0,
    backgroundColor: colors.blurple,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.slate,
  },
  headerTitleStyle: {
    color: colors.white,
  },
  headerBackTitleStyle: {
    color: colors.white,
  },
  cardOverlayEnabled: true,
  gesturesEnabled: true,
  ...Platform.select({
    ios: {
      ...TransitionPresets.ModalPresentationIOS,
    },
  }),
};

export default function App() {
  const [account, setAccount] = useState<IAccount | null>(null);
  const [api, setApi] = useState<Api | null>(null);
  const [logs, setlogs] = useState<Log[]>([]);
  const [hasPerms, setHasPerms] = useState<boolean>(false);
  const clearLogs = useCallback(() => setlogs([]), []);
  // const { initialize: initStripe } = useStripeTerminal();

  const onSelectMerchant = useCallback(
    async ({ selectedAccountKey }: { selectedAccountKey: string }) => {
      const selectedAccount = await ClientApi.getAccount(selectedAccountKey);

      if ('error' in selectedAccount) {
        console.log(selectedAccount.error);
        return;
      }

      console.log('home select!', selectedAccountKey);
      // update account state in context
      setAccount(selectedAccount);

      // init api
      setApi(new ClientApi({ secretKey: selectedAccount.secretKey }));

      // persist to storage
      setSelectedAccount(selectedAccount.secretKey);
    },
    []
  );

  const handlePermissionsSuccess = useCallback(async () => {
    setHasPerms(true);
    // const { error, reader } = await initStripe();

    // if (error) {
    //   Alert.alert('StripeTerminal init failed', error.message);
    // } else if (reader) {
    //   console.log(
    //     'StripeTerminal has been initialized properly and connected to the reader',
    //     reader
    //   );
    // } else {
    //   console.log('StripeTerminal has been initialized properly');
    // }
  }, []);

  useEffect(() => {
    async function handlePermissions() {
      try {
        const { error } = await requestNeededAndroidPermissions({
          accessFineLocation: {
            title: 'Location Permission',
            message: 'Stripe Terminal needs access to your location',
            buttonPositive: 'Accept',
          },
        });
        if (!error) {
          handlePermissionsSuccess();
        } else {
          console.error(
            'Location and BT services are required in order to connect to a reader.'
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (Platform.OS === 'android') {
      handlePermissions();
    } else {
      handlePermissionsSuccess();
    }
  }, [handlePermissionsSuccess]);

  const addLogs = useCallback((newLog: Log) => {
    const updateLog = (log: Log) =>
      log.name === newLog.name
        ? { name: log.name, events: [...log.events, ...newLog.events] }
        : log;
    setlogs((prev) =>
      prev.map((e) => e.name).includes(newLog.name)
        ? prev.map(updateLog)
        : [...prev, newLog]
    );
  }, []);

  const value = useMemo(
    () => ({ logs, addLogs, clearLogs }),
    [logs, addLogs, clearLogs]
  );

  return (
    <AppContext.Provider
      value={{
        api,
        account,
        setAccount: onSelectMerchant,
      }}
    >
      <LogContext.Provider value={value}>
        <>
          <StatusBar
            backgroundColor={colors.blurple_dark}
            barStyle="light-content"
            translucent
          />

          <NavigationContainer>
            <Stack.Navigator screenOptions={screenOptions} mode="modal">
              <Stack.Screen name="Terminal" component={HomeScreen} />
              <Stack.Screen
                name="MerchantSelectScreen"
                options={{ headerTitle: 'Merchant Select' }}
                component={MerchantSelectScreen}
              />
              <Stack.Screen
                name="DiscoverReadersScreen"
                options={{ headerTitle: 'Discovery' }}
                component={DiscoverReadersScreen}
              />
              <Stack.Screen
                name="RegisterInternetReader"
                options={{
                  headerTitle: 'Register Reader',
                }}
                component={RegisterInternetReaderScreen}
              />
              <Stack.Screen
                name="ReaderDisplayScreen"
                component={ReaderDisplayScreen}
              />
              <Stack.Screen
                name="LocationListScreen"
                options={{ headerTitle: 'Locations' }}
                component={LocationListScreen}
              />
              <Stack.Screen
                name="UpdateReaderScreen"
                options={{ headerTitle: 'Update Reader' }}
                component={UpdateReaderScreen}
              />
              <Stack.Screen
                name="RefundPaymentScreen"
                options={{
                  headerTitle: 'Collect refund',
                  headerBackAccessibilityLabel: 'payment-back',
                }}
                component={RefundPaymentScreen}
              />
              <Stack.Screen
                name="DiscoveryMethodScreen"
                component={DiscoveryMethodScreen}
              />
              <Stack.Screen
                name="CollectCardPaymentScreen"
                options={{
                  headerTitle: 'Collect card payment',
                  headerBackAccessibilityLabel: 'payment-back',
                }}
                component={CollectCardPaymentScreen}
              />
              <Stack.Screen
                name="SetupIntentScreen"
                options={{
                  headerTitle: 'SetupIntent',
                  headerBackAccessibilityLabel: 'payment-back',
                }}
                component={SetupIntentScreen}
              />
              <Stack.Screen
                name="ReadReusableCardScreen"
                options={{
                  headerTitle: 'Read reusable card',
                  headerBackAccessibilityLabel: 'payment-back',
                }}
                component={ReadReusableCardScreen}
              />
              <Stack.Screen
                name="LogListScreen"
                options={({ navigation }) => ({
                  headerTitle: 'Logs',
                  headerBackAccessibilityLabel: 'logs-back',
                  headerLeft: () => (
                    <HeaderBackButton
                      onPress={() => navigation.navigate('Terminal')}
                    />
                  ),
                })}
                component={LogListScreen}
              />
              <Stack.Screen
                name="LogScreen"
                options={{
                  headerTitle: 'Event',
                  headerBackAccessibilityLabel: 'log-back',
                }}
                component={LogScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </>
      </LogContext.Provider>
    </AppContext.Provider>
  );
}
