import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/core';
import { UpdateComponent } from '@stripe/stripe-terminal-react-native';
import type { TestReaderUpdate } from '@stripe/stripe-terminal-react-native';
import ListItem from '../components/ListItem';
import List from '../components/List';
import { colors } from '../colors';
import type { RouteParamList } from '../App';

export type TestReaderUpdateTypeName =
  | 'none'
  | 'available'
  | 'required'
  | 'requiredOffline'
  | 'lowBattery'
  | 'lowBatterySucceedConnect'
  | 'random';

const ALL_UPDATE_TYPES: { key: TestReaderUpdateTypeName; label: string }[] = [
  { key: 'none', label: 'No Update' },
  { key: 'available', label: 'Available' },
  { key: 'required', label: 'Required' },
  { key: 'requiredOffline', label: 'Required for Offline' },
  { key: 'lowBattery', label: 'Low Battery (connection fails)' },
  { key: 'lowBatterySucceedConnect', label: 'Low Battery (connection succeeds)' },
  { key: 'random', label: 'Random' },
];

const TAP_TO_PAY_UPDATE_TYPES: TestReaderUpdateTypeName[] = [
  'none', 'required', 'random',
];

const COMPONENT_OPTIONS: { label: string; value: UpdateComponent }[] = [
  { label: 'Firmware', value: UpdateComponent.FIRMWARE },
  { label: 'Config', value: UpdateComponent.CONFIG },
  { label: 'Keys', value: UpdateComponent.KEYS },
  { label: 'Incremental', value: UpdateComponent.INCREMENTAL },
];

function typeHasComponents(type: TestReaderUpdateTypeName): boolean {
  return type === 'available' || type === 'required' || type === 'requiredOffline';
}

export function buildTestReaderUpdate(
  type: TestReaderUpdateTypeName,
  components: UpdateComponent[]
): TestReaderUpdate | undefined {
  if (type === 'none') return undefined;
  switch (type) {
    case 'available':
      return { type: 'available', components };
    case 'required':
      return { type: 'required', components };
    case 'requiredOffline':
      return { type: 'requiredOffline', components };
    case 'lowBattery':
      return { type: 'lowBattery' };
    case 'lowBatterySucceedConnect':
      return { type: 'lowBatterySucceedConnect' };
    case 'random':
      return { type: 'random' };
  }
}

export function getUpdateDisplayName(
  type: TestReaderUpdateTypeName,
  components: UpdateComponent[]
): string {
  const label = ALL_UPDATE_TYPES.find((t) => t.key === type)?.label ?? 'No Update';
  if (type === 'none') return label;
  if (!typeHasComponents(type)) return label;
  if (components.length === 0) return label;
  const compNames = components.map((c) =>
    COMPONENT_OPTIONS.find((o) => o.value === c)?.label ?? c
  );
  return `${label} (${compNames.join(', ')})`;
}

export default function TestReaderUpdateScreen() {
  const { params } =
    useRoute<RouteProp<RouteParamList, 'TestReaderUpdateScreen'>>();
  const { onSelect, currentType, currentComponents, discoveryMethod } = params;

  const updateTypes = discoveryMethod === 'tapToPay'
    ? ALL_UPDATE_TYPES.filter((t) => TAP_TO_PAY_UPDATE_TYPES.includes(t.key))
    : ALL_UPDATE_TYPES;

  const [selectedType, setSelectedType] =
    useState<TestReaderUpdateTypeName>(currentType);
  const [selectedComponents, setSelectedComponents] =
    useState<UpdateComponent[]>(currentComponents);

  const selectType = (type: TestReaderUpdateTypeName) => {
    setSelectedType(type);
    onSelect(type, selectedComponents);
  };

  const toggleComponent = (component: UpdateComponent) => {
    setSelectedComponents((prev) => {
      const next = prev.includes(component)
        ? prev.filter((c) => c !== component)
        : [...prev, component];
      onSelect(selectedType, next);
      return next;
    });
  };

  return (
    <ScrollView
      testID="test-reader-update-screen"
      contentContainerStyle={styles.container}
    >
      <List title="UPDATE TYPE">
        {updateTypes.map(({ key, label }) => (
          <ListItem
            key={key}
            testID={`update-type-${key}`}
            onPress={() => selectType(key)}
            title={
              <View style={styles.radioRow}>
                <Text style={styles.radioIndicator}>
                  {selectedType === key ? '●' : '○'}
                </Text>
                <Text style={styles.radioLabel}>{label}</Text>
              </View>
            }
          />
        ))}
      </List>

      {typeHasComponents(selectedType) && (
        <>
          <List title="COMPONENTS">
            {COMPONENT_OPTIONS.map(({ label, value }) => (
              <ListItem
                key={value}
                testID={`component-${value}`}
                title={label}
                rightElement={
                  <Switch
                    testID={`component-switch-${value}`}
                    value={selectedComponents.includes(value)}
                    onValueChange={() => toggleComponent(value)}
                  />
                }
              />
            ))}
          </List>
          <Text style={styles.infoText}>
            Select which update components to include in the simulated update.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioIndicator: {
    fontSize: 16,
    marginRight: 12,
    color: colors.blurple,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.slate,
  },
  infoText: {
    paddingHorizontal: 16,
    color: colors.dark_gray,
    marginVertical: 16,
  },
});
