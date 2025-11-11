import React, { useEffect, useState, useContext } from 'react';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import Toast from 'react-native-root-toast';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Platform,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { colors } from '../colors';
import { AppContext } from '../AppContext';
import { showErrorToast } from '../util/errorHandling';
import icon from '../assets/icon.png';
import ListItem from '../components/ListItem';
import List from '../components/List';
import {
  getDiscoveryMethod,
  setDiscoveryMethod as setStoredDiscoveryMethod,
} from '../util/merchantStorage';
import {
  type OfflineStatus,
  type Reader,
  useStripeTerminal,
  getSdkVersion,
} from '@stripe/stripe-terminal-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AlertDialog from '../components/AlertDialog';
import type { RouteParamList } from '../App';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { account } = useContext(AppContext);
  const [simulated, setSimulated] = useState<boolean>(true);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [online, setOnline] = useState<boolean>(true);
  const [showDisconnectAlert, setShowDisconnectAlert] = useState<{
    visible: boolean;
    reason?: string;
  }>({ visible: false });
  const [pendingUpdate, setPendingUpdate] =
    useState<Reader.SoftwareUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [discoveryMethod, setDiscoveryMethod] =
    useState<Reader.DiscoveryMethod>('bluetoothScan');
  const [discoveryTimeout, setDiscoveryTimeout] = useState<number>(0);
  const [innerSdkVersion, setInnerSdkVersion] = useState<string>('');

  const {
    disconnectReader,
    connectedReader,
    rebootReader,
    cancelReaderReconnection,
    getNativeSdkVersion,
    setSimulatedOfflineMode,
  } = useStripeTerminal({
    onDidChangeConnectionStatus(status) {
      setConnectionStatus(status);
      if (status === 'notConnected') {
        setPendingUpdate(null);
      }
    },
    onDidChangeOfflineStatus(status: OfflineStatus) {
      console.log(status);
      setOnline(status.sdk.networkStatus === 'online' ? true : false);
    },
    onDidForwardingFailure(error) {
      console.log('onDidForwardingFailure', {
        code: error?.code,
        message: error?.message,
        nativeErrorCode: error?.nativeErrorCode,
        metadata: error?.metadata,
      });
      showErrorToast(error);
    },
    onDidForwardPaymentIntent(paymentIntent, error) {
      let toastMsg = 'Payment Intent ' + paymentIntent.id + ' forwarded. ';
      if (error) {
        toastMsg +=
          'ErrorCode = ' + error.code + '. ErrorMsg = ' + error.message;
      }
      console.log(toastMsg);
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
    onDidDisconnect(reason) {
      setPendingUpdate(null);
      if (reason === 'disconnectRequested' || reason === 'rebootRequested') {
        return;
      }
      setShowDisconnectAlert({
        visible: true,
        reason: 'Reader disconnected with reason ' + reason,
      });
    },
    onDidStartReaderReconnect(reason) {
      console.log('onDidStartReaderReconnect ' + reason);
      Alert.alert(
        'Reconnecting...',
        'Reader has disconnected.',
        [
          {
            text: 'Stop Reconnecting',
            onPress: async () => {
              await cancelReaderReconnection();
            },
          },
          {
            text: 'Continue in Background',
          },
        ],
        { cancelable: false }
      );
    },
    onDidSucceedReaderReconnect() {
      console.log('onDidSucceedReaderReconnect');
      Alert.alert('Reconnected!', 'We were able to reconnect to the reader.', [
        {
          text: 'OK',
        },
      ]);
    },
    onDidFailReaderReconnect() {
      Alert.alert('Reader Disconnected', 'Reader reconnection failed!', [
        {
          text: 'OK',
        },
      ]);
    },
  });
  useEffect(() => {
    const getVersion = async () => {
      const version = await getNativeSdkVersion();
      setInnerSdkVersion(version);
    };
    getVersion();
  }, [getNativeSdkVersion]);
  const batteryPercentage =
    (connectedReader?.batteryLevel ? connectedReader?.batteryLevel : 0) * 100;
  const batteryStatus = batteryPercentage
    ? '🔋' + batteryPercentage.toFixed(0) + '%'
    : '';
  const chargingStatus = connectedReader?.isCharging ? '🔌' : '';
  const deviceType = connectedReader?.deviceType;

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

  const validTimeoutMethod = () => {
    return discoveryMethod === 'bluetoothScan' || discoveryMethod === 'usb';
  };

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
        <ListItem
          title="Reboot Reader"
          testID="reboot-reader-button"
          color={colors.blue}
          onPress={async () => {
            await rebootReader();
          }}
          visible={
            discoveryMethod === 'bluetoothScan' ||
            discoveryMethod === 'bluetoothProximity' ||
            discoveryMethod === 'usb'
          }
        />
      </List>

      <List title="COMMON WORKFLOWS">
        <ListItem
          testID="collect-payment-method-button"
          title="Collect card payment"
          onPress={() => {
            navigation.navigate('CollectCardPaymentScreen', {
              simulated,
              discoveryMethod,
              deviceType: deviceType,
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
          title="Reader settings"
          onPress={() => {
            navigation.navigate('ReaderSettingsScreen', {});
          }}
        />
        <ListItem
          title="Update reader software"
          visible={pendingUpdate != null}
          onPress={() => {
            navigation.navigate('UpdateReaderScreen', {
              update: pendingUpdate,
              reader: connectedReader,
              onDidUpdate: () => {
                setPendingUpdate(null);
              },
              started: false,
            });
          }}
        />
        <ListItem
          testID="setup-intent-button"
          title="Store card via Setup Intents"
          onPress={() => {
            navigation.navigate('SetupIntentScreen', {
              discoveryMethod,
              deviceType: deviceType,
            });
          }}
        />
        <ListItem
          testID="in-person-refund-button"
          title="In-Person Refund"
          onPress={() => {
            navigation.navigate('RefundPaymentScreen', {
              simulated,
              discoveryMethod,
            });
          }}
        />
        <ListItem
          title="Collect Inputs"
          onPress={() => {
            navigation.navigate('CollectInputsScreen', {
              simulated,
              discoveryMethod,
            });
          }}
        />
      </List>
      <ListItem
        title="Collect Data"
        onPress={() => {
          navigation.navigate('CollectDataScreen', {});
        }}
      />
      <ListItem
        title="Print Content"
        onPress={() => {
          navigation.navigate('PrintContentScreen', {});
        }}
      />
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
    <React.Fragment>
      <KeyboardAwareScrollView
        testID="home-screen"
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.accountContainer}>
          <Text style={styles.readerName}>
            {account?.settings?.dashboard?.display_name} ({account?.id})
          </Text>
          {account && (
            <View
              testID="online-indicator"
              style={[
                styles.indicator,
                { backgroundColor: online ? colors.green : colors.red },
              ]}
            />
          )}
        </View>
        {connectedReader ? (
          <View style={styles.connectedReaderContainer}>
            <View style={styles.imageContainer}>
              <Image source={icon} style={styles.image} />
            </View>

            <Text style={styles.readerName}>{deviceType}</Text>
            <Text style={styles.connectionStatus}>
              {connectionStatus} {simulated && <Text>, simulated</Text>}
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
            <List topSpacing={false} title="MERCHANT SELECTION">
              <ListItem
                title="Set Merchant"
                color={colors.blue}
                onPress={() => {
                  navigation.navigate('MerchantSelectScreen', {});
                }}
              />
              <ListItem
                testID="discover-readers-button"
                title="Discover Readers"
                color={colors.blue}
                disabled={!account}
                onPress={() => {
                  const timeout = validTimeoutMethod() ? discoveryTimeout : 0;
                  navigation.navigate('DiscoverReadersScreen', {
                    simulated,
                    discoveryMethod,
                    discoveryTimeout: timeout,
                    setPendingUpdateInfo: (
                      update: Reader.SoftwareUpdate | null
                    ) => {
                      setPendingUpdate(update);
                    },
                  });
                }}
              />

              <ListItem
                title="Register Internet Reader"
                disabled={!account}
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

            <List topSpacing={false} title="DISCOVERY METHOD">
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

            <List
              topSpacing={false}
              title="TIMEOUT"
              visible={validTimeoutMethod()}
            >
              <TextInput
                keyboardType="numeric"
                style={styles.input}
                value={
                  discoveryTimeout !== 0 ? discoveryTimeout.toString() : ''
                }
                placeholderTextColor={colors.gray}
                placeholder="0 => no timeout"
                onChangeText={(value) => {
                  const data = parseInt(value, 10) || 0;
                  setDiscoveryTimeout(data);
                }}
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

              {simulated ? (
                <ListItem
                  title="Simulate Offline Mode"
                  rightElement={
                    <Switch
                      value={simulatedOffline}
                      onValueChange={async (value) => {
                        setSimulatedOffline(value);
                        await setSimulatedOfflineMode(value);
                      }}
                    />
                  }
                />
              ) : (
                <></>
              )}

              <Text style={styles.infoText}>
                The SDK comes with the ability to simulate behavior without
                using physical hardware. This makes it easy to quickly test your
                integration end-to-end, from connecting a reader to taking
                payments.
              </Text>
            </List>
            <List title="Version">
              <ListItem
                title="SDK Version"
                rightElement={
                  <Text style={styles.versionText}>{getSdkVersion()}</Text>
                }
              />
              <ListItem
                title="Native SDK Version"
                rightElement={
                  <Text style={styles.versionText}>{innerSdkVersion}</Text>
                }
              />
            </List>
          </>
        )}
      </KeyboardAwareScrollView>

      <AlertDialog
        visible={showDisconnectAlert.visible}
        title="Reader disconnected!"
        message={`${showDisconnectAlert.reason}`}
        onDismiss={() => setShowDisconnectAlert({ visible: false })}
        buttons={[
          {
            text: 'Dismiss',
            onPress: () => setShowDisconnectAlert({ visible: false }),
          },
        ]}
      />
    </React.Fragment>
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
      return 'Tap To Pay';
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
    marginVertical: 10,
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
        borderBottomColor: `${colors.gray}66`,
        color: colors.dark_gray,
      },
    }),
  },
  versionText: {
    color: colors.dark_gray,
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
    marginTop: 10,
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
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
