import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  type Reader,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { colors } from '../colors';
import { getErrorMessage, showErrorAlert } from '../util/errorHandling';

type BuzzerVolumeLevel = Reader.BuzzerVolumeParameters['level'];
type ReaderOperation = 'get' | 'setBuzzer' | 'setAccessibility';

const BUZZER_VOLUME_OPTIONS: Array<{
  label: string;
  value: BuzzerVolumeLevel;
}> = [
  { label: 'Low', value: 'low' },
  { label: 'High', value: 'high' },
  { label: 'Custom', value: 'custom' },
];

export default function ReaderSettingsScreen() {
  const { getReaderSettings, setReaderSettings } = useStripeTerminal();
  const [selectedLevel, setSelectedLevel] =
    useState<BuzzerVolumeLevel>('low');
  const [customVolume, setCustomVolume] = useState('');
  const [currentVolume, setCurrentVolume] = useState<number>();
  const [maxVolume, setMaxVolume] = useState<number>();
  const [getError, setGetError] = useState<string>();
  const [textToSpeechStatus, setTextToSpeechStatus] =
    useState<Reader.ReaderTextToSpeechStatus>();
  const [accessibilityError, setAccessibilityError] = useState<string>();
  const [textToSpeechViaSpeakers, setTextToSpeechViaSpeakers] =
    useState(false);
  const [activeOperation, setActiveOperation] =
    useState<ReaderOperation>();

  const isBusy = activeOperation !== undefined;
  const hasBuzzerVolume =
    currentVolume !== undefined && maxVolume !== undefined;

  const getSettings = useCallback(async () => {
    setActiveOperation('get');
    setGetError(undefined);
    setAccessibilityError(undefined);

    try {
      const response = await getReaderSettings();

      if (!response) {
        const message = 'The SDK did not return reader settings.';
        setGetError(message);
        setAccessibilityError(message);
      } else if (response.error) {
        const message = getErrorMessage(response.error);
        setGetError(message);
        setAccessibilityError(message);
      } else {
        if (response.buzzerVolume.error) {
          setGetError(getErrorMessage(response.buzzerVolume.error));
        } else {
          setCurrentVolume(response.buzzerVolume.currentVolume);
          setMaxVolume(response.buzzerVolume.maxVolume);
        }

        if (response.accessibility.error) {
          setAccessibilityError(
            getErrorMessage(response.accessibility.error)
          );
        } else {
          setTextToSpeechStatus(response.accessibility.textToSpeechStatus);
          setTextToSpeechViaSpeakers(
            response.accessibility.textToSpeechStatus === 'speakers'
          );
        }
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setGetError(message);
      setAccessibilityError(message);
    } finally {
      setActiveOperation(undefined);
    }
  }, [getReaderSettings]);

  const setBuzzerVolume = async () => {
    const parsedCustomVolume = Number(customVolume);

    if (
      selectedLevel === 'custom' &&
      (customVolume.trim() === '' ||
        !Number.isSafeInteger(parsedCustomVolume))
    ) {
      Alert.alert(
        'Invalid custom volume',
        'Enter a whole number. Out-of-range values are allowed for SDK error testing.'
      );
      return;
    }

    Keyboard.dismiss();
    setActiveOperation('setBuzzer');

    try {
      const buzzerVolume: Reader.BuzzerVolumeParameters =
        selectedLevel === 'custom'
          ? { level: 'custom', volume: parsedCustomVolume }
          : { level: selectedLevel };
      const response = await setReaderSettings({ buzzerVolume });

      if (!response) {
        showErrorAlert(
          new Error('The SDK did not return reader settings.'),
          'Couldn’t set buzzer volume'
        );
      } else if (response.error) {
        showErrorAlert(response.error, 'Couldn’t set buzzer volume');
      } else if (response.buzzerVolume.error) {
        showErrorAlert(
          response.buzzerVolume.error,
          'Couldn’t set buzzer volume'
        );
      } else {
        setGetError(undefined);
        setCurrentVolume(response.buzzerVolume.currentVolume);
        setMaxVolume(response.buzzerVolume.maxVolume);
      }
    } catch (error) {
      showErrorAlert(error, 'Couldn’t set buzzer volume');
    } finally {
      setActiveOperation(undefined);
    }
  };

  const setAccessibility = async () => {
    setActiveOperation('setAccessibility');

    try {
      const response = await setReaderSettings({
        textToSpeechViaSpeakers,
      });

      if (!response) {
        showErrorAlert(
          new Error('The SDK did not return reader settings.'),
          'Couldn’t set accessibility'
        );
      } else if (response.error) {
        showErrorAlert(response.error, 'Couldn’t set accessibility');
      } else if (response.accessibility.error) {
        showErrorAlert(
          response.accessibility.error,
          'Couldn’t set accessibility'
        );
      } else {
        setAccessibilityError(undefined);
        setTextToSpeechStatus(response.accessibility.textToSpeechStatus);
        setTextToSpeechViaSpeakers(
          response.accessibility.textToSpeechStatus === 'speakers'
        );
      }
    } catch (error) {
      showErrorAlert(error, 'Couldn’t set accessibility');
    } finally {
      setActiveOperation(undefined);
    }
  };

  useEffect(() => {
    getSettings();
  }, [getSettings]);

  const customVolumeIsValid =
    customVolume.trim() !== '' &&
    Number.isSafeInteger(Number(customVolume));
  const canSetBuzzerVolume =
    selectedLevel !== 'custom' || customVolumeIsValid;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.container}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <List topSpacing={false} title="GET READER SETTINGS">
          <>
            <ListItem
              description={getError}
              title="Current / maximum"
              rightElement={
                <View style={styles.valueRow}>
                  {getError && hasBuzzerVolume && (
                    <Text style={styles.lastKnown}>Last known: </Text>
                  )}
                  {getError && !hasBuzzerVolume ? (
                    <Text style={styles.value}>Error</Text>
                  ) : (
                    <>
                      <Text testID="current-buzzer-volume" style={styles.value}>
                        {currentVolume ?? '—'}
                      </Text>
                      <Text style={styles.value}> / </Text>
                      <Text testID="max-buzzer-volume" style={styles.value}>
                        {maxVolume ?? '—'}
                      </Text>
                    </>
                  )}
                </View>
              }
            />
            <ListItem
              description={accessibilityError}
              title="Text-to-speech status"
              rightElement={
                <Text
                  testID="text-to-speech-status"
                  style={[styles.value, styles.accessibilityValue]}
                >
                  {accessibilityError
                    ? textToSpeechStatus !== undefined
                      ? `Last known: ${textToSpeechStatus}`
                      : 'Error'
                    : textToSpeechStatus ?? '—'}
                </Text>
              }
            />
            <ListItem
              color={colors.blue}
              description={
                activeOperation === 'get'
                  ? 'Waiting for reader response…'
                  : undefined
              }
              disabled={isBusy}
              onPress={isBusy ? undefined : getSettings}
              rightElement={
                activeOperation === 'get' ? (
                  <ActivityIndicator size="small" color={colors.blue} />
                ) : undefined
              }
              testID="get-reader-settings-button"
              title={
                activeOperation === 'get'
                  ? 'Getting reader settings…'
                  : 'Get settings from reader'
              }
            />
          </>
        </List>

        <List title="SET BUZZER VOLUME">
          <>
            <View testID="select-buzzer-volume-level">
              {BUZZER_VOLUME_OPTIONS.map(({ label, value }) => {
                const selected = selectedLevel === value;
                return (
                  <ListItem
                    disabled={isBusy}
                    key={value}
                    onPress={isBusy ? undefined : () => setSelectedLevel(value)}
                    rightElement={
                      selected ? (
                        <Text style={styles.checkmark}>✓</Text>
                      ) : undefined
                    }
                    testID={`buzzer-volume-${value}`}
                    title={label}
                  />
                );
              })}
            </View>

            {selectedLevel === 'custom' && (
              <>
                <Text style={styles.fieldLabel}>Custom volume</Text>
                <TextInput
                  clearButtonMode="while-editing"
                  editable={!isBusy}
                  keyboardType={
                    Platform.OS === 'ios'
                      ? 'numbers-and-punctuation'
                      : 'number-pad'
                  }
                  onChangeText={setCustomVolume}
                  placeholder={
                    maxVolume === undefined
                      ? 'Enter any whole number'
                      : `Reader range: 1-${maxVolume}`
                  }
                  selectTextOnFocus
                  style={styles.input}
                  testID="custom-buzzer-volume-input"
                  value={customVolume}
                />
                <Text style={styles.helperText}>
                  {maxVolume === undefined
                    ? 'Out-of-range values are sent to the SDK for error testing.'
                    : `Reader range: 1-${maxVolume}. Out-of-range values are allowed for error testing.`}
                </Text>
              </>
            )}

            <ListItem
              color={colors.blue}
              description={
                activeOperation === 'setBuzzer'
                  ? 'Waiting for reader response…'
                  : undefined
              }
              disabled={isBusy || !canSetBuzzerVolume}
              onPress={
                isBusy || !canSetBuzzerVolume ? undefined : setBuzzerVolume
              }
              rightElement={
                activeOperation === 'setBuzzer' ? (
                  <ActivityIndicator size="small" color={colors.blue} />
                ) : undefined
              }
              testID="set-buzzer-volume-button"
              title={
                activeOperation === 'setBuzzer'
                  ? 'Setting buzzer volume…'
                  : 'Set buzzer volume on reader'
              }
            />
          </>
        </List>

        <List title="SET ACCESSIBILITY">
          <>
            <ListItem
              title="Text-to-speech through speakers"
              rightElement={
                <Switch
                  disabled={isBusy}
                  onValueChange={setTextToSpeechViaSpeakers}
                  testID="enable-text-to-speech-via-speakers"
                  value={textToSpeechViaSpeakers}
                />
              }
            />
            <ListItem
              color={colors.blue}
              description={
                activeOperation === 'setAccessibility'
                  ? 'Waiting for reader response…'
                  : undefined
              }
              disabled={isBusy}
              onPress={isBusy ? undefined : setAccessibility}
              rightElement={
                activeOperation === 'setAccessibility' ? (
                  <ActivityIndicator size="small" color={colors.blue} />
                ) : undefined
              }
              testID="set-accessibility-button"
              title={
                activeOperation === 'setAccessibility'
                  ? 'Setting accessibility…'
                  : 'Set accessibility on reader'
              }
            />
          </>
        </List>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.light_gray,
    flex: 1,
  },
  container: {
    backgroundColor: colors.light_gray,
    flexGrow: 1,
    paddingBottom: 48,
  },
  fieldLabel: {
    backgroundColor: colors.white,
    color: colors.slate,
    fontSize: 14,
    fontWeight: '600',
    paddingBottom: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  helperText: {
    backgroundColor: colors.white,
    color: colors.dark_gray,
    fontSize: 13,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderBottomColor: colors.gray,
    color: colors.dark_gray,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomColor: `${colors.gray}66`,
        borderBottomWidth: 1,
      },
    }),
  },
  value: {
    color: colors.dark_gray,
    fontSize: 14,
    textAlign: 'right',
  },
  valueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    paddingLeft: 12,
  },
  lastKnown: {
    color: colors.dark_gray,
    fontSize: 14,
  },
  accessibilityValue: {
    flexShrink: 1,
    marginLeft: 12,
    textTransform: 'capitalize',
  },
  checkmark: {
    color: colors.blue,
    fontSize: 18,
    fontWeight: '600',
  },
});
