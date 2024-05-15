import React, { useContext } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import List from '../components/List';
import ListItem from '../components/ListItem';
import {
  CollectInputsParameters,
  SelectionButtonStyle,
  ToggleValue,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { useNavigation } from '@react-navigation/native';

export default function CollectInputsScreen() {
  const { collectInputs, cancelCollectInputs } = useStripeTerminal();
  const { addLogs, clearLogs, setCancel } = useContext(LogContext);
  const navigation = useNavigation();

  const _collectInputs = async (params: CollectInputsParameters) => {
    clearLogs();
    setCancel({
      label: 'Cancel CollectInput',
      isDisabled: false,
      action: cancelCollectInputs,
    });
    navigation.navigate('LogListScreen');
    addLogs({
      name: 'Collect Inputs',
      events: [
        {
          name: 'Initiate',
          description: 'terminal.collectInputs',
          onBack: cancelCollectInputs,
        },
      ],
    });

    const response = await collectInputs(params);

    if (response.error) {
      addLogs({
        name: 'Collect Inputs',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectInputs',
            metadata: {
              errorCode: response.error?.code,
              errorMessage: response.error?.message,
            },
          },
        ],
      });
      return;
    }

    addLogs({
      name: 'Collect Inputs',
      events: [
        {
          name: 'Succeeded',
          description: 'terminal.collectInputs',
          metadata: {
            COLLECTINPUTS: JSON.stringify(response.collectInputResults),
          },
        },
      ],
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
    >
      <List topSpacing={false}>
        <ListItem
          title="Signature and selection forms"
          testID="collect-input-button-1"
          color={colors.blue}
          onPress={async () => {
            _collectInputs({
              collectInputs: [
                {
                  inputType: 'SIGNATURE',
                  title: 'Please sign',
                  required: false,
                  description:
                    'Please sign if you agree to the terms and conditions',
                  submitButtonText: 'submit signature',
                  toggles: [
                    {
                      title: 'Opt-in for marketing emails',
                      description: '',
                      defaultValue: ToggleValue.ENABLED,
                    },
                  ],
                },
                {
                  inputType: 'SELECTION',
                  title: 'Choose an option',
                  required: false,
                  description: 'Were you happy with customer service?',
                  selectionButtons: [
                    { style: SelectionButtonStyle.PRIMARY, text: 'Yes' },
                    { style: SelectionButtonStyle.SECONDARY, text: 'No' },
                  ],
                },
              ],
            });
          }}
        />
        <ListItem
          title="Phone, email, numeric, and text forms"
          testID="collect-input-button-2"
          color={colors.blue}
          onPress={async () => {
            _collectInputs({
              collectInputs: [
                {
                  inputType: 'TEXT',
                  title: 'Enter your name',
                  required: false,
                  description: "We'll need your name to look up your account",
                  submitButtonText: 'Done',
                },
                {
                  inputType: 'NUMERIC',
                  title: 'Enter your zip code',
                  required: false,
                  description: '',
                  submitButtonText: 'Done',
                },
                {
                  inputType: 'EMAIL',
                  title: 'Enter your email address',
                  required: false,
                  description:
                    "We'll send you updates on your order and occasional deals",
                  submitButtonText: 'Done',
                  toggles: [
                    {
                      title: 'Opt-in for marketing emails',
                      defaultValue: ToggleValue.ENABLED,
                      description: '',
                    },
                  ],
                },
                {
                  inputType: 'PHONE',
                  title: 'Enter your phone number',
                  required: false,
                  description: "We'll text you when your order is ready",
                  submitButtonText: 'Done',
                },
              ],
            });
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
