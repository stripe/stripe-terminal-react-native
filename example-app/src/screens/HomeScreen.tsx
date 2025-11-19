import React, { useEffect, useState } from 'react';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import Toast from 'react-native-root-toast';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
  Switch,
} from 'react-native';
import { colors } from '../colors';
import icon from '../assets/icon.png';
import ListItem from '../components/ListItem';
import List from '../components/List';
import {
  getDiscoveryMethod,
  setDiscoveryMethod as setStoredDiscoveryMethod,
} from '../util/merchantStorage';
import { showErrorToast } from '../util/errorHandling';
import {
  OfflineStatus,
  Reader,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';
import type { RouteParamList } from '../App';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const [simulated, setSimulated] = useState<boolean>(true);
  const [online, setOnline] = useState<boolean>(false);
  const [discoveryMethod, setDiscoveryMethod] =
    useState<Reader.DiscoveryMethod>('bluetoothScan');
  const { disconnectReader, connectedReader } = useStripeTerminal({
    onDidChangeOfflineStatus(status: OfflineStatus) {
      console.log(status);
      setOnline(status.sdk.networkStatus === 'online' ? true : false);
    },
    onDidForwardingFailure(error) {
      console.log('onDidForwardingFailure ' + error?.message);
      showErrorToast(error);
    },
    onDidForwardPaymentIntent(paymentIntent, error) {
      let toastMsg =
        'Payment Intent ' +
        paymentIntent.id +
        ' forwarded. ErrorCode' +
        error?.code +
        '. ErrorMsg = ' +
        error?.message;
      const toast = Toast.show(toastMsg, {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
      });

      setTimeout(function () {
        Toast.hide(toast);
      }, 3000);
    },
  });
  const batteryPercentage =
    (connectedReader?.batteryLevel ? connectedReader?.batteryLevel : 0) * 100;
  const batteryStatus = batteryPercentage
    ? '🔋' + batteryPercentage.toFixed(0) + '%'
    : '';
  const chargingStatus = connectedReader?.isCharging ? '🔌' : '';

  useEffect(() => {
    const loadDiscSettings = async () => {
      const savedDisc = await getDiscoveryMethod();

      if (!savedDisc) {
        return;
      }

      setDiscoveryMethod(savedDisc.method);
      setSimulated(savedDisc.isSimulated);
    };

    loadDiscSettings();
  }, []);

  const renderConnectedContent = (
    <>
      <List topSpacing={false} title="READER CONNECTION">
        <ListItem
          title="Disconnect"
          testID="disconnect-button"
          color={colors.red}
          onPress={async () => {
            await disconnectReader();
          }}
        />
      </List>

      <List title="COMMON WORKFLOWS">
        <ListItem
          title="Collect card payment"
          onPress={() => {
            navigation.navigate('CollectCardPaymentScreen', {
              simulated,
              discoveryMethod,
            });
          }}
        />
        <ListItem
          title="Set reader display"
          onPress={() => {
            navigation.navigate('ReaderDisplayScreen', {});
          }}
        />
        <ListItem
          title="Store card via Setup Intents"
          onPress={() => {
            navigation.navigate('SetupIntentScreen', { discoveryMethod });
          }}
        />
        <ListItem
          title="In-Person Refund"
          onPress={() => {
            navigation.navigate('RefundPaymentScreen', {
              simulated,
              discoveryMethod,
            });
          }}
        />
      </List>
      <List title="DATABASE">
        <ListItem
          title="Database"
          onPress={async () => {
            navigation.navigate('DatabaseScreen', {});
          }}
        />
      </List>
    </>
  );

  return (
    <ScrollView testID="home-screen" style={styles.container}>
      <View style={styles.accountContainer}>
        <View
          style={[
            styles.indicator,
            { backgroundColor: online ? colors.green : colors.red },
          ]}
        />
      </View>
      {connectedReader ? (
        <View style={styles.connectedReaderContainer}>
          <View style={styles.imageContainer}>
            <Image source={icon} style={styles.image} />
          </View>

          <Text style={styles.readerName}>{connectedReader.deviceType}</Text>
          <Text style={styles.connectionStatus}>
            Connected{simulated && <Text>, simulated</Text>}
          </Text>
          <Text style={styles.connectionStatus}>
            {batteryStatus} {chargingStatus}
          </Text>
        </View>
      ) : (
        <View style={styles.imageContainer}>
          <Image source={icon} style={styles.image} />
        </View>
      )}

      {connectedReader ? (
        renderConnectedContent
      ) : (
        <>
          <List topSpacing={false} title="READER">
            <ListItem
              title="Discover Readers"
              color={colors.blue}
              onPress={() => {
                navigation.navigate('DiscoverReadersScreen', {
                  simulated,
                  discoveryMethod,
                });
              }}
            />

            <ListItem
              title="Register Internet Reader"
              color={colors.blue}
              onPress={() => {
                navigation.navigate('RegisterInternetReaderScreen', {});
              }}
            />
          </List>

          <List topSpacing={false} title="DATABASE">
            <ListItem
              title="Database"
              testID="database"
              color={colors.blue}
              onPress={async () => {
                navigation.navigate('DatabaseScreen', {});
              }}
            />
          </List>

          <List title="DISCOVERY METHOD">
            <ListItem
              title={mapFromDiscoveryMethod(discoveryMethod)}
              testID="discovery-method-button"
              onPress={() =>
                navigation.navigate('DiscoveryMethodScreen', {
                  onChange: async (value: Reader.DiscoveryMethod) => {
                    await setStoredDiscoveryMethod({
                      method: value,
                      isSimulated: simulated,
                    });
                    setDiscoveryMethod(value);
                  },
                })
              }
            />
          </List>

          <List>
            <ListItem
              title="Simulated"
              rightElement={
                <Switch
                  value={simulated}
                  onValueChange={async (value) => {
                    await setStoredDiscoveryMethod({
                      method: discoveryMethod,
                      isSimulated: value,
                    });
                    setSimulated(value);
                  }}
                />
              }
            />

            <Text style={styles.infoText}>
              The SDK comes with the ability to simulate behavior without using
              physical hardware. This makes it easy to quickly test your
              integration end-to-end, from connecting a reader to taking
              payments.
            </Text>
          </List>
        </>
      )}
    </ScrollView>
  );
}

function mapFromDiscoveryMethod(method: Reader.DiscoveryMethod) {
  switch (method) {
    case 'bluetoothScan':
      return 'Bluetooth Scan';
    case 'bluetoothProximity':
      return 'Bluetooth Proximity';
    case 'internet':
      return 'Internet';
    case 'handoff':
      return 'Handoff';
    case 'tapToPay':
      return 'Tap to Pay';
    case 'usb':
      return 'USB';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
  },
  groupTitle: {
    color: colors.dark_gray,
    fontWeight: '600',
    paddingLeft: 16,
    marginVertical: 12,
  },
  group: {
    marginTop: 22,
    marginBottom: 20,
  },
  image: {
    width: 40,
    height: 24,
  },
  imageContainer: {
    borderRadius: 6,
    width: 60,
    height: 50,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray,
    marginVertical: 20,
  },
  infoText: {
    paddingHorizontal: 16,
    color: colors.dark_gray,
    marginVertical: 16,
  },
  connectedReaderContainer: {
    alignItems: 'center',
  },
  accountContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  readerName: {
    width: '60%',
    textAlign: 'center',
    fontWeight: '600',
    color: colors.dark_gray,
  },
  connectionStatus: {
    color: colors.dark_gray,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 20,
    backgroundColor: colors.red,
  },
});
