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
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import type { RouteParamList } from '../App';
import { Picker } from '@react-native-picker/picker';

const SKIP_BEHAVIOR = [
  { value: 'all', label: 'all' },
  { value: 'none', label: 'none' },
];

export default function CollectInputsScreen() {
  const { params } = useRoute<RouteProp<RouteParamList, 'CollectInputsScreen'>>();
  const { simulated } = params;

  const { collectInputs, cancelCollectInputs, setSimulatedCollectInputsResult } = useStripeTerminal();
  const { addLogs, clearLogs, setCancel } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const [simulatedCollectInputsSkipBehavior, setSimulatedCollectInputsSkipBehavior] = useState<string>("none");

  const _collectInputs = async (params: ICollectInputsParameters) => {
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

    if (simulated && Platform.OS === 'android') { // only android support it now
      const simulateResultResponse = await setSimulatedCollectInputsResult(simulatedCollectInputsSkipBehavior);
      if (simulateResultResponse.error) {
        addLogs({
          name: 'Simulate Collect Inputs Result',
          events: [
            {
              name: 'Failed',
              description: 'terminal.simulateCollectInputs',
              metadata: {
                errorCode: simulateResultResponse.error?.code,
                errorMessage: simulateResultResponse.error?.message,
              },
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
                      defaultValue: ToggleValue.DISABLED,
                    },
                  ],
                },
                {
                  formType: FormType.SELECTION,
                  title: 'Choose an option',
                  required: false,
                  description: 'Were you happy with customer service?',
                  selectionButtons: [
                    { style: SelectionButtonStyle.PRIMARY, text: 'Yes', id: "1" },
                    { style: SelectionButtonStyle.SECONDARY, text: 'No', id: "2" },
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
      {/* only android support it now */}
      {(simulated && Platform.OS === 'android') ? 
        <List bolded={false} topSpacing={false} title="SIMULATED COLLECT INPUTS SKIP BEHAVIOR">
          <Picker
            selectedValue={simulatedCollectInputsSkipBehavior}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            testID="select-skip-behavior"
            onValueChange={(value) =>
              setSimulatedCollectInputsSkipBehavior(value)
            }
          >
            {SKIP_BEHAVIOR.map((a) => (
              <Picker.Item
                key={a.value}
                label={a.label}
                testID={a.value}
                value={a.value}
              />
            ))}
          </Picker>
        </List> : <></>
      }
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
