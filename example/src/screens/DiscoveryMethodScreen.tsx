import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Reader } from 'stripe-terminal-react-native';
import { colors } from '../colors';
import ListItem from '../components/ListItem';

export default function DiscoveryMethodScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<any, any>>();
  const onChange = params?.onChange;

  const onSelect = (method: Reader.DiscoveryMethod) => {
    onChange(method);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ListItem
        onPress={() => onSelect('bluetoothScan')}
        title="Bluetooth scan"
      />
      <Text style={styles.info}>
        Discover a reader by scanning for Bluetooth LE devices.
      </Text>
      <ListItem
        onPress={() => onSelect('bluetoothProximity')}
        title="Bluetooth Proximity"
      />
      <Text style={styles.info}>
        Discover a reader by holding it next to the iOS device (only supported
        for the BBPOS Chipper 2X BT).
      </Text>
      <Text style={styles.info}>
        {
          'Note: the Stripe Terminal SDK can discover supported readers automatically - you should not connect to the reader in the iOS Settings > Bluetooth page.'
        }
      </Text>

      <ListItem title="Internet" onPress={() => onSelect('internet')} />
      <Text style={styles.info}>
        Discovers readers that have been registered to your account via the
        Stripe API or Dashboard.
      </Text>
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
