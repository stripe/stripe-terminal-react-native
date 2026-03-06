import React, { useState, useContext } from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    Switch,
    SafeAreaView,
} from 'react-native';
import {
    useNavigation,
    type NavigationProp,
} from '@react-navigation/core';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Picker } from '@react-native-picker/picker';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { DarkMode, useStripeTerminal, type TapZone, type Colors } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import type { RouteParamList } from '../App';

const TAPZONE_TYPE = [
    { value: 'default', label: 'default' },
    { value: 'above', label: 'above' },
    { value: 'below', label: 'below' },
    { value: 'front', label: 'front' },
    { value: 'behind', label: 'behind' },
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
];
const DARDMODE_TYPE = [
    { value: 'dark', label: 'dark' },
    { value: 'light', label: 'light' },
    { value: 'system', label: 'system' },
]

export default function TapToPayUXScreen() {
    const { addLogs, clearLogs } = useContext(LogContext);
    const navigation = useNavigation<NavigationProp<RouteParamList>>();
    const { setTapToPayUxConfiguration } = useStripeTerminal();
    const [inputValues, setInputValues] = useState<{
        tapZoneType: string;
        bias?: string;
        xbias?: string;
        ybias?: string;
        overrideColor: boolean;
        primaryColor?: string;
        successColor?: string;
        errorColor?: string;
        darkmode?: string;
    }>({
        tapZoneType: 'default',
        overrideColor: false,
        darkmode: 'light'
    });

    function getNumber(raw: any): number | undefined {
        var n = Number(raw)
        if (Number.isNaN(n)) {
            return undefined;
        } else {
            return n;
        }
    }

    function buildTapZone(): TapZone {
        switch (inputValues.tapZoneType) {
            case 'above':
                return {
                    indicator: 'above',
                    bias: getNumber(inputValues.bias)
                };
            case 'below':
                return {
                    indicator: 'below',
                    bias: getNumber(inputValues.bias)
                };
            case 'left':
                return {
                    indicator: 'left',
                    bias: getNumber(inputValues.bias)
                };
            case 'right':
                return {
                    indicator: 'right',
                    bias: getNumber(inputValues.bias)
                };
            case 'front':
                return {
                    indicator: 'front',
                    xBias: getNumber(inputValues.bias),
                    yBias: getNumber(inputValues.bias)
                };
            case 'behind':
                return {
                    indicator: 'behind',
                    xBias: getNumber(inputValues.bias),
                    yBias: getNumber(inputValues.bias)
                };
            case 'default':
            default:
                return {
                    indicator: 'default'
                };
        }
    }

    function buildDarkMode(): DarkMode {
        switch (inputValues.darkmode) {
            case 'light':
                return DarkMode.LIGHT;
            case 'dark':
                return DarkMode.DARK;
            case 'system':
            default:
                return DarkMode.SYSTEM;
        }
    }

    function buildColors(): Colors {
        return {
            primary: inputValues.primaryColor,
            success: inputValues.successColor,
            error: inputValues.errorColor,
        }
    }

    const _setTapToPayUxConfiguration = async () => {
        var configuration;
        if (inputValues.overrideColor) {
            configuration = {
                tapZone: buildTapZone(),
                darkMode: buildDarkMode(),
                colors: buildColors(),
            }
        } else {
            configuration = {
                tapZone: buildTapZone(),
            }
        }
        clearLogs();
        navigation.navigate('LogListScreen', {});
        addLogs({
            name: 'setTapToPayUxConfiguration',
            events: [
                {
                    name: 'Sent request',
                    description: 'terminal.setTapToPayUxConfiguration',
                    metadata: {
                        request: JSON.stringify(configuration),
                    }
                },
            ],
        });
        const { error } = await setTapToPayUxConfiguration(configuration);

        if (error) {
            console.log('error', error);
            addLogs({
                name: 'setTapToPayUxConfiguration',
                events: [
                    {
                        name: 'Failed',
                        description: 'terminal.setTapToPayUxConfiguration',
                        metadata: {
                            request: JSON.stringify(error),
                        }
                    },
                ],
            });
        } else {
            console.log('setTapToPayUxConfiguration success');
            addLogs({
                name: 'setTapToPayUxConfiguration',
                events: [
                    {
                        name: 'Success',
                        description: 'terminal.setTapToPayUxConfiguration'
                    },
                ],
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="always"
            >
                <List bolded={false} topSpacing={false} title="TapZone">
                    <Picker
                        selectedValue={inputValues.tapZoneType}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                        testID="tapzone-indicator"
                        onValueChange={(value) => setInputValues((state) => ({ ...state, tapZoneType: value }))}
                    >
                        {TAPZONE_TYPE.map((a) => (
                            <Picker.Item
                                key={a.value}
                                label={a.label}
                                testID={a.value}
                                value={a.value}
                            />
                        ))}
                    </Picker>
                </List>
                <List bolded={false} topSpacing={false} title="bias" visible={['above', 'below', 'left', 'right'].includes(inputValues.tapZoneType)}>
                    <TextInput
                        testID="bias"
                        keyboardType="numeric"
                        onChangeText={(value) => setInputValues((state) => ({ ...state, bias: value }))}
                        value={inputValues.bias}
                        style={styles.input}
                    />
                </List>
                <List bolded={false} topSpacing={false} title="xBias" visible={['front', 'behind'].includes(inputValues.tapZoneType)}>
                    <TextInput
                        testID="xbias"
                        keyboardType="numeric"
                        onChangeText={(value) => setInputValues((state) => ({ ...state, xbias: value }))}
                        value={inputValues.xbias}
                        style={styles.input}
                    />
                </List>
                <List bolded={false} topSpacing={false} title="yBias" visible={['front', 'behind'].includes(inputValues.tapZoneType)}>
                    <TextInput
                        testID="ybias"
                        keyboardType="numeric"
                        onChangeText={(value) => setInputValues((state) => ({ ...state, ybias: value }))}
                        value={inputValues.ybias}
                        style={styles.input}
                    />
                </List>
                <List bolded={false} topSpacing={false} title="" >
                    <ListItem
                        title="Override Color"
                        rightElement={
                            <Switch
                                testID="override-color"
                                value={inputValues.overrideColor == true}
                                onValueChange={(value) =>
                                    setInputValues((state) => ({
                                        ...state,
                                        overrideColor: value
                                    }))}
                            />
                        }
                    />
                </List>

                <List bolded={false} topSpacing={false} title="Primary Color" visible={inputValues.overrideColor}>
                    <TextInput
                        testID="primary-color"
                        onChangeText={(value) => setInputValues((state) => ({ ...state, primaryColor: value }))}
                        value={inputValues.primaryColor}
                        style={styles.input}
                    />
                </List>
                <List bolded={false} topSpacing={false} title="Success Color" visible={inputValues.overrideColor}>
                    <TextInput
                        testID="success-color"
                        onChangeText={(value) => setInputValues((state) => ({ ...state, successColor: value }))}
                        value={inputValues.successColor}
                        style={styles.input}
                    />
                </List>
                <List bolded={false} topSpacing={false} title="Error Color" visible={inputValues.overrideColor}>
                    <TextInput
                        testID="error-color"
                        onChangeText={(value) => setInputValues((state) => ({ ...state, errorColor: value }))}
                        value={inputValues.errorColor}
                        style={styles.input}
                    />
                </List>
                <List bolded={false} topSpacing={false} title="Darkmode" visible={inputValues.overrideColor}>
                    <Picker
                        selectedValue={inputValues.darkmode}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                        testID="darkmode-indicator"
                        onValueChange={(value) => setInputValues((state) => ({ ...state, darkmode: value }))}
                    >
                        {DARDMODE_TYPE.map((a) => (
                            <Picker.Item
                                key={a.value}
                                label={a.label}
                                testID={a.value}
                                value={a.value}
                            />
                        ))}
                    </Picker>
                </List>
                <ListItem
                    testID="set-configuration-button"
                    color={colors.blue}
                    title="SetTapToPayUxConfiguration"
                    onPress={_setTapToPayUxConfiguration}
                />
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.light_gray,
        flexGrow: 1,
        paddingVertical: 22,
    },
    discoveredWrapper: {
        height: 50,
    },
    buttonWrapper: {
        marginBottom: 20,
        marginTop: 50,
    },
    buttonsContainer: {
        marginTop: 14,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 22,
    },
    input: {
        height: 44,
        backgroundColor: colors.white,
        paddingLeft: 16,
        marginBottom: 12,
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
