import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { colors } from './colors';
import { LogContext, Log } from './components/LogContext';
import DiscoverReadersScreen from './screens/DiscoverReadersScreen';
import { StripeTerminalProvider } from 'stripe-terminal-react-native';
import { API_URL } from './Config';
import ReaderDisplayScreen from './screens/ReaderDisplayScreen';
import LocationListScreen from './screens/LocationListScreen';
import UpdateReaderScreen from './screens/UpdateReaderScreen';
import RefundPaymentScreen from './screens/RefundPaymentScreen';
import DiscoveryMethodScreen from './screens/DiscoveryMethodScreen';
import CollectCardPaymentScreen from './screens/CollectCardPaymentScreen';
import SetupIntentScreen from './screens/SetupIntentScreen';
import ReadReusableCardScreen from './screens/ReadReusableCardScreen';
import LogScreen from './screens/LogScreen';
import RegisterInternetReaderScreen from './screens/RegisterInternetReaderScreen';

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
  const [logs, setlogs] = useState<Log[]>([]);
  const clearLogs = () => setlogs([]);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const fetchTokenProvider = async () => {
    const response = await fetch(`${API_URL}/connection_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const { secret } = await response.json();
    return secret;
  };

  useEffect(() => {
    async function init() {
      try {
        const granted = await PermissionsAndroid.request(
          'android.permission.ACCESS_FINE_LOCATION',
          {
            title: 'Location Permission Permission',
            message: 'App needs access to your Location ',
            buttonPositive: 'Agree',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the Location');
          setPermissionsGranted(true);
        } else {
          Alert.alert(
            'Location services are required in order to connect to a reader.'
          );
        }
      } catch {
        Alert.alert(
          'Location services are required in order to connect to a reader.'
        );
      }
    }

    if (Platform.OS === 'android') {
      init();
    } else {
      setPermissionsGranted(true);
    }
  }, []);

  const addLogs = (newLog: Log) => {
    const updateLog = (log: Log) =>
      log.name === newLog.name
        ? { name: log.name, events: [...log.events, ...newLog.events] }
        : log;
    setlogs((prev) =>
      prev.map((e) => e.name).includes(newLog.name)
        ? prev.map(updateLog)
        : [...prev, newLog]
    );
  };

  return (
    <>
      {permissionsGranted && (
        <StripeTerminalProvider
          logLevel="verbose"
          tokenProvider={fetchTokenProvider}
        >
          <LogContext.Provider
            value={{
              logs,
              addLogs,
              clearLogs,
            }}
          >
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
                    name="LogScreen"
                    options={{
                      headerTitle: 'Logs',
                      headerBackAccessibilityLabel: 'logs-back',
                    }}
                    component={LogScreen}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </>
          </LogContext.Provider>
        </StripeTerminalProvider>
      )}
    </>
  );
}
