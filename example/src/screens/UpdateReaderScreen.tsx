import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Reader, useStripeTerminal } from 'stripe-terminal-react-native';
import { colors } from '../colors';
import icon from '../assets/icon.png';
import List from '../components/List';
import ListItem from '../components/ListItem';

export default function UpdateReaderScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<any, any>>();
  const updateInfo = params?.update as Reader.SoftwareUpdate;
  const reader = params?.reader as Reader.Type;
  const [currentProgress, setCurrentProgress] = useState<string>();
  const { cancelInstallingUpdate } = useStripeTerminal({
    onDidReportReaderSoftwareUpdateProgress: (progress) => {
      setCurrentProgress((Number(progress) * 100).toFixed(0).toString());
    },
    onDidFinishInstallingUpdate: (_update) => {
      params?.onDidUpdate();
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
  });

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: 'Cancel',
    });

    navigation.addListener('beforeRemove', async (e) => {
      e.preventDefault();
      await cancelInstallingUpdate();
      navigation.dispatch(e.data.action);
    });
  }, [navigation, cancelInstallingUpdate]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.connectedReaderContainer}>
        <View style={styles.imageContainer}>
          <Image source={icon} style={styles.image} />
        </View>
        <Text style={styles.readerName}>{reader.serialNumber}</Text>
        <Text style={styles.connecting}>Connecting...</Text>
      </View>

      <List title="CURRENT VERSION">
        <ListItem title={updateInfo.deviceSoftwareVersion} />
      </List>

      <List title="TARGET VERSION">
        <ListItem title={updateInfo.deviceSoftwareVersion} />
      </List>

      <List>
        <ListItem title="Required update in progress" />
      </List>
      <View style={styles.row}>
        <Text style={styles.info}>Update progress: {currentProgress}%</Text>
        <Text style={styles.info}>
          The reader will temporarily become unresponsive. Do not leave this
          page, and keep the reader in range and powered on until the update is
          complete.
        </Text>

        <Text style={styles.info}>
          This update is required for this reader to be used. Canceling the
          update will cancel the connection to the
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    paddingBottom: 22,
  },
  row: {
    paddingHorizontal: 16,
  },
  header: {
    color: colors.dark_gray,
    fontSize: 16,
    marginVertical: 12,
    paddingLeft: 22,
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
  connectedReaderContainer: {
    alignItems: 'center',
    textAlign: 'center',
    flex: 1,
  },
  readerName: {
    fontSize: 16,
    width: '60%',
    textAlign: 'center',
  },
  connecting: {
    fontSize: 14,
    color: colors.dark_gray,
  },
  info: {
    color: colors.dark_gray,
    paddingVertical: 16,
  },
});
