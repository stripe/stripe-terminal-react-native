import React, {
  useCallback,
  useMemo,
  useEffect,
  useState,
  useContext,
} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  TransitionPresets,
  type StackNavigationOptions,
} from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import HomeScreen from './screens/HomeScreen';
import { Platform, StatusBar, StyleSheet } from 'react-native';
import { colors } from './colors';
import {
  LogContext,
  type Log,
  type Event,
  type CancelType,
} from './components/LogContext';
import DiscoverReadersScreen from './screens/DiscoverReadersScreen';
import ReaderDisplayScreen from './screens/ReaderDisplayScreen';
import LocationListScreen from './screens/LocationListScreen';
import UpdateReaderScreen from './screens/UpdateReaderScreen';
import RefundPaymentScreen from './screens/RefundPaymentScreen';
import DiscoveryMethodScreen from './screens/DiscoveryMethodScreen';
import CollectCardPaymentScreen from './screens/CollectCardPaymentScreen';
import SetupIntentScreen from './screens/SetupIntentScreen';
import MerchantSelectScreen from './screens/MerchantSelectScreen';
import LogListScreen from './screens/LogListScreen';
import LogScreen from './screens/LogScreen';
import RegisterInternetReaderScreen from './screens/RegisterInternetReaderScreen';
import DatabaseScreen from './screens/DatabaseScreen';
import ReaderSettingsScreen from './screens/ReaderSettingsScreen';
import CollectDataScreen from './screens/CollectDataScreen';
import CollectInputsScreen from './screens/CollectInputsScreen';
import PaymentMethodSelectScreen from './screens/PaymentMethodSelectScreen';
import PrintContentScreen from './screens/PrintContentScreen';
import {
  type Reader,
  type Location,
  useStripeTerminal,
  requestNeededAndroidPermissions,
} from '@stripe/stripe-terminal-react-native';
import { Alert, LogBox } from 'react-native';

import { AppContext } from './AppContext';

export type RouteParamList = {
  UpdateReaderScreen: {
    update: Reader.SoftwareUpdate | null;
    reader: Reader.Type | null | undefined;
    onDidUpdate: () => void;
    started: boolean;
  };
  LocationListScreen: {
    onSelect: (location: Location) => void;
    showDummyLocation: boolean;
  };
  DiscoveryMethodScreen: {
    onChange: (method: Reader.DiscoveryMethod) => void;
  };
  SetupIntentScreen: {
    discoveryMethod: Reader.DiscoveryMethod;
    deviceType: Reader.DeviceType | undefined;
  };
  DiscoverReadersScreen: {
    simulated: boolean;
    discoveryMethod: Reader.DiscoveryMethod;
    discoveryTimeout: number;
    setPendingUpdateInfo: (update: Reader.SoftwareUpdate | null) => void;
  };
  MerchantSelectScreen: {
    onSelectMerchant?: ({
      selectedAccountKey,
    }: {
      selectedAccountKey: string;
    }) => void;
  };
  CollectCardPaymentScreen: {
    simulated: boolean;
    discoveryMethod: Reader.DiscoveryMethod;
    deviceType: Reader.DeviceType | undefined;
  };
  RefundPaymentScreen: {
    simulated: boolean;
    discoveryMethod: Reader.DiscoveryMethod;
  };
  LogScreen: {
    event: Event;
    log: Log;
  };
  PaymentMethodSelectScreen: {
    paymentMethodTypes: string[];
    enabledPaymentMethodTypes: string[];
    onChange: (paymentMethodTypes: string[]) => void;
  };
  CollectInputsScreen: {
    simulated: boolean;
    discoveryMethod: Reader.DiscoveryMethod;
  };
  LogListScreen: {};
  DatabaseScreen: {};
  RegisterInternetReaderScreen: {};
  CollectDataScreen: {};
  ReaderSettingsScreen: {};
  ReaderDisplayScreen: {};
  PrintContentScreen: {};
  HomeScreen: {};
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

const screenOptions: StackNavigationOptions = {
  presentation: 'modal',
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
  ...Platform.select({
    ios: {
      ...TransitionPresets.ModalPresentationIOS,
    },
  }),
};

export default function App() {
  const [logs, setlogs] = useState<Log[]>([]);
  const [cancel, setCancel] = useState<CancelType | null>(null);
  const [hasPerms, setHasPerms] = useState<boolean>(false);
  const clearLogs = useCallback(() => setlogs([]), []);
  const { initialize: initStripeTerminal, clearCachedCredentials } =
    useStripeTerminal();
  const { account } = useContext(AppContext);
  const { refreshToken } = useContext(AppContext);
  useEffect(() => {
    const initAndClear = async () => {
      const { error, reader } = await initStripeTerminal();

      if (error) {
        Alert.alert('StripeTerminal init failed', error.message);
        return;
      }

      await clearCachedCredentials();

      if (reader) {
        console.log(
          'StripeTerminal has been initialized properly and connected to the reader',
          reader
        );
        return;
      }

      console.log('StripeTerminal has been initialized properly');
    };
    if (account?.secretKey && hasPerms) {
      initAndClear();
    }
  }, [
    account,
    initStripeTerminal,
    clearCachedCredentials,
    hasPerms,
    refreshToken,
  ]);

  const handlePermissionsSuccess = useCallback(async () => {
    setHasPerms(true);
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
      setTimeout(() => {
        handlePermissions();
      }, 1000); // delay of 1 second
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
      prev.length > 0 && prev[prev.length - 1].name === newLog.name
        ? prev.map(updateLog)
        : [...prev, newLog]
    );
  }, []);

  const value = useMemo(
    () => ({ logs, addLogs, clearLogs, cancel, setCancel }),
    [logs, addLogs, clearLogs, cancel, setCancel]
  );

  return (
    <LogContext.Provider value={value}>
      <>
        <StatusBar
          backgroundColor={colors.blurple_dark}
          barStyle="light-content"
          translucent
        />

        <NavigationContainer>
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen
              name="MerchantSelectScreen"
              options={{ headerTitle: 'Merchant Select' }}
              component={MerchantSelectScreen}
            />
            <Stack.Screen
              name="DatabaseScreen"
              options={{ headerTitle: 'DatabaseScreen' }}
              component={DatabaseScreen}
            />
            <Stack.Screen
              name="DiscoverReadersScreen"
              options={{ headerTitle: 'Discovery' }}
              component={DiscoverReadersScreen}
            />
            <Stack.Screen
              name="RegisterInternetReaderScreen"
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
              name="ReaderSettingsScreen"
              options={{ headerTitle: 'Reader Settings' }}
              component={ReaderSettingsScreen}
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
              name="PaymentMethodSelectScreen"
              options={{
                headerTitle: 'Select Payment Methods',
                headerBackAccessibilityLabel: 'payment-back',
              }}
              component={PaymentMethodSelectScreen}
            />
            <Stack.Screen
              name="SetupIntentScreen"
              options={{
                headerTitle: 'Collect SetupIntent',
                headerBackAccessibilityLabel: 'payment-back',
              }}
              component={SetupIntentScreen}
            />
            <Stack.Screen
              name="CollectInputsScreen"
              options={{
                headerTitle: 'Collect Inputs',
              }}
              component={CollectInputsScreen}
            />
            <Stack.Screen
              name="CollectDataScreen"
              options={{
                headerTitle: 'Collect Data',
              }}
              component={CollectDataScreen}
            />
            <Stack.Screen
              name="PrintContentScreen"
              options={{
                headerTitle: 'Print Content',
              }}
              component={PrintContentScreen}
            />
            <Stack.Screen
              name="LogListScreen"
              options={({ navigation }) => ({
                headerTitle: 'Logs',
                headerBackAccessibilityLabel: 'logs-back',
                headerLeft: () => (
                  <HeaderBackButton
                    onPress={() => navigation.navigate('HomeScreen')}
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
  );
}
