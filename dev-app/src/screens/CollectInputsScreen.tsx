import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet, Platform } from 'react-native';
import List from '../components/List';
import ListItem from '../components/ListItem';
import {
  FormType,
  type ICollectInputsParameters,
  SelectionButtonStyle,
  ToggleValue,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { DevAppError } from '../errors/DevAppError';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import type { RouteParamList } from '../App';
import { Picker } from '@react-native-picker/picker';

const COLLECT_PAYMENT_INPUT_BEHAVIOR = [
  { value: 'all', label: 'Success with skipping' },
  { value: 'none', label: 'Success without skipping' },
  { value: 'timeout', label: 'Timeout' },
];

export default function CollectInputsScreen() {
  const { params } =
    useRoute<RouteProp<RouteParamList, 'CollectInputsScreen'>>();
  const { simulated } = params;

  const {
    collectInputs,
    cancelCollectInputs,
    setSimulatedCollectInputsResult,
  } = useStripeTerminal();
  const { addLogs, clearLogs, setCancel } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const [simulatedCollectInputsBehavior, setSimulatedCollectInputsBehavior] =
    useState<string>(COLLECT_PAYMENT_INPUT_BEHAVIOR[0].value);

  const _collectInputs = async (
    collectInputsParams: ICollectInputsParameters
  ) => {
    clearLogs();
    setCancel({
      label: 'Cancel CollectInput',
      isDisabled: false,
      action: cancelCollectInputs,
    });
    navigation.navigate('LogListScreen', {});
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

    if (simulated) {
      const simulateResultResponse = await setSimulatedCollectInputsResult(
        simulatedCollectInputsBehavior
      );
      if (simulateResultResponse.error) {
        const devError = DevAppError.fromStripeError(
          simulateResultResponse.error
        );
        addLogs({
          name: 'Simulate Collect Inputs Result',
          events: [
            {
              name: 'Failed',
              description: 'terminal.simulateCollectInputs',
              metadata: devError.toJSON(),
            },
          ],
        });
        return;
      } else {
        addLogs({
          name: 'Simulate Collect Inputs Result',
          events: [
            {
              name: 'Succeeded',
              description: 'terminal.simulateCollectInputs',
            },
          ],
        });
      }
    }
    const response = await collectInputs(collectInputsParams);

    if (response.error) {
      const devError = DevAppError.fromStripeError(response.error);
      addLogs({
        name: 'Collect Inputs',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectInputs',
            metadata: devError.toJSON(),
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
          title="Signature and selection forms with toggles"
          testID="collect-input-button-1"
          color={colors.blue}
          onPress={async () => {
            _collectInputs({
              inputs: [
                {
                  formType: FormType.SIGNATURE,
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
                  formType: FormType.SELECTION,
                  title: 'Choose an option',
                  required: true,
                  description: 'Were you happy with customer service?',
                  selectionButtons: [
                    {
                      style: SelectionButtonStyle.PRIMARY,
                      text: 'Yes',
                      id: 'yes_id',
                    },
                    {
                      style: SelectionButtonStyle.SECONDARY,
                      text: 'No',
                      id: 'no_id',
                    },
                  ],
                  toggles: [
                    {
                      title: 'Include fee',
                      description: '',
                      defaultValue: ToggleValue.DISABLED,
                    },
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
              inputs: [
                {
                  formType: FormType.TEXT,
                  title: 'Enter your name',
                  required: false,
                  description: "We'll need your name to look up your account",
                  submitButtonText: 'Done',
                },
                {
                  formType: FormType.NUMERIC,
                  title: 'Enter your zip code',
                  required: false,
                  description: '',
                  submitButtonText: 'Done',
                },
                {
                  formType: FormType.EMAIL,
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
                  formType: FormType.PHONE,
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

      {simulated ? (
        <List
          bolded={false}
          topSpacing={false}
          title="SIMULATED COLLECT INPUTS BEHAVIOR"
        >
          <Picker
            selectedValue={simulatedCollectInputsBehavior}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            testID="select-behavior"
            onValueChange={(value) => setSimulatedCollectInputsBehavior(value)}
          >
            {COLLECT_PAYMENT_INPUT_BEHAVIOR.map((a) => (
              <Picker.Item
                key={a.value}
                label={a.label}
                testID={a.value}
                value={a.value}
              />
            ))}
          </Picker>
        </List>
      ) : (
        <></>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    flex: 1,
    paddingVertical: 22,
  },
  picker: {
    width: '100%',
    ...Platform.select({
      android: {
        color: colors.slate,
        fontSize: 13,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
      },
    }),
  },
  pickerItem: {
    fontSize: 16,
    color: colors.slate,
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.white,
    left: 0,
    width: '100%',
    ...Platform.select({
      ios: {
        height: 200,
      },
    }),
  },
});
