import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SdkInfo, useStripeTerminal } from 'stripe-terminal-react-native';
import { colors } from '../colors';

export default function SdkInfoContent() {
  const [sdkInformation, setSdkInfo] = useState<SdkInfo>();
  const { getSdkInfo, isInitialized } = useStripeTerminal();

  useEffect(() => {
    async function init() {
      const { sdkInfo } = await getSdkInfo();
      if (sdkInfo) {
        setSdkInfo(sdkInfo);
      }
    }
    if (isInitialized === true) {
      init();
    }
  }, [getSdkInfo, isInitialized]);

  return (
    <>
      {sdkInformation ? (
        <View style={styles.container}>
          {sdkInformation?.terminalAndroidVersion ? (
            <Text
              style={styles.text}
            >{`Android SDK: v${sdkInformation.terminalAndroidVersion}`}</Text>
          ) : sdkInformation.terminalIosVersion ? (
            <Text
              style={styles.text}
            >{`iOS SDK: v${sdkInformation.terminalIosVersion}`}</Text>
          ) : (
            <></>
          )}
          <Text
            style={styles.text}
          >{`RN SDK: v${sdkInformation?.terminalReactNativeVersion}`}</Text>
        </View>
      ) : (
        <>
          <ActivityIndicator style={styles.container} />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingEnd: 12,
  },
  text: {
    color: colors.white,
    fontSize: 13,
    textAlign: 'right',
  },
});
