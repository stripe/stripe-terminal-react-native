import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch } from 'react-native';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { showErrorAlert } from '../util/errorHandling';

export default function ReaderSettingsScreen() {
  const { setReaderSettings, getReaderSettings } = useStripeTerminal();
  const [enableTextToSpeechViaSpeakers, setEnableTextToSpeechViaSpeakers] =
    useState(false);

  const _setReaderSettings = async () => {
    const response = await setReaderSettings({
      textToSpeechViaSpeakers: enableTextToSpeechViaSpeakers,
    });

    if (!response) {
      console.log('error', response);
      return;
    }

    if (response.error) {
      console.log('error', response.error.code);
      showErrorAlert(response.error, 'setReaderSettings error');
      return;
    }

    if ('accessibility' in response && response.accessibility?.error) {
      console.log('error', response.accessibility.error);
      showErrorAlert(response.accessibility.error, 'setReaderSettings error');
      return;
    }
  };

  useEffect(() => {
    async function init() {
      const response = await getReaderSettings();

      if (!response) {
        console.log('error', response);
        return;
      }

      if (response.error) {
        console.log('error', response.error.code);
        showErrorAlert(response.error, 'getReaderSettings error');
        return;
      }

      if ('accessibility' in response && response.accessibility?.error) {
        console.log('error', response.accessibility.error);
        showErrorAlert(response.accessibility.error, 'getReaderSettings error');
        return;
      }

      if (
        'accessibility' in response &&
        response.accessibility?.textToSpeechStatus === 'speakers'
      ) {
        setEnableTextToSpeechViaSpeakers(true);
      } else {
        setEnableTextToSpeechViaSpeakers(false);
      }
    }
    init();
  }, [getReaderSettings]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
    >
      <List bolded={false} topSpacing={false} title="ACCESSIBILITY">
        <ListItem
          title="Enable text-to-speech via speakers"
          rightElement={
            <Switch
              testID="enable-connect"
              value={enableTextToSpeechViaSpeakers}
              onValueChange={(value) => setEnableTextToSpeechViaSpeakers(value)}
            />
          }
        />
        <ListItem
          title="Save accessibility settings"
          testID="save-reader-settings-button"
          color={colors.blue}
          onPress={async () => {
            _setReaderSettings();
          }}
        />
      </List>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    flex: 1,
    paddingVertical: 22,
  },
});
