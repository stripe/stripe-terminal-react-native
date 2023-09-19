import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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
import {
  Reader,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [simulated, setSimulated] = useState<boolean>(true);
  const [discoveryMethod, setDiscoveryMethod] =
    useState<Reader.DiscoveryMethod>('bluetoothScan');
  const { disconnectReader, connectedReader } = useStripeTerminal();
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
      <List title="READER CONNECTION">
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
            navigation.navigate('ReaderDisplayScreen');
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
            });
          }}
        />
      </List>
    </>
  );

  return (
    <ScrollView testID="home-screen" style={styles.container}>
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
          <List title="READER">
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
                navigation.navigate('RegisterInternetReader');
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
    case 'localMobile':
      return 'Local mobile';
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
    marginVertical: 30,
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
});
