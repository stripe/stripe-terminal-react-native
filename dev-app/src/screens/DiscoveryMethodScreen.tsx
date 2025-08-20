import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/core';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { Reader } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import ListItem from '../components/ListItem';

import type { RouteParamList } from '../App';

export default function DiscoveryMethodScreen() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<RouteParamList, 'DiscoveryMethodScreen'>>();
  const onChange = params?.onChange;

  const onSelect = (method: Reader.DiscoveryMethod) => {
    onChange(method);
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <ListItem
        onPress={() => onSelect('bluetoothScan')}
        title="Bluetooth Scan"
        testID="bt-scn-btn"
      />
      <Text style={styles.info}>
        Discover a reader by scanning for Bluetooth or Bluetooth LE devices.
      </Text>

      <Text style={styles.info}>
        {
          'Note: the Stripe Terminal SDK can discover supported readers automatically - you should not connect to the reader in the iOS Settings > Bluetooth page.'
        }
      </Text>

      <ListItem
        title="Internet"
        testID="internet-btn"
        onPress={() => onSelect('internet')}
      />
      <Text style={styles.info}>
        Discovers readers that have been registered to your account via the
        Stripe API or Dashboard.
      </Text>
      <ListItem testID="usb-btn" title="USB" onPress={() => onSelect('usb')} />
      <Text style={styles.info}>
        Discover a reader connected to this device via USB.
      </Text>

      <ListItem onPress={() => onSelect('tapToPay')} title="Tap to Pay" />

      {Platform.OS === 'android' && (
        <ListItem onPress={() => onSelect('handoff')} title="Handoff" />
      )}

      {Platform.OS === 'ios' && (
        <>
          <ListItem
            onPress={() => onSelect('bluetoothProximity')}
            title="Bluetooth Proximity"
            testID="bt-prox-btn"
          />
          <Text style={styles.info}>
            Discover a reader by holding it next to the iOS device (only
            supported for the BBPOS Chipper 2X BT).
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light_gray,
  },
  header: {
    color: colors.dark_gray,
    fontSize: 16,
    marginVertical: 12,
    paddingLeft: 22,
  },
  info: {
    color: colors.dark_gray,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
});
