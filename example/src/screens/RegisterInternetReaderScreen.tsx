import React, { useState } from 'react';
import type { Location } from 'stripe-terminal-react-native';

import { useNavigation } from '@react-navigation/core';
import {
  Text,
  ScrollView,
  TextInput,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { API_URL } from '../Config';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';

type InputValuesType = {
  registration_code: string;
  label: string;
};

export default function RegisterInternetReaderScreen() {
  const navigation = useNavigation();
  const [selectedLocation, setSelectedLocation] = useState<Location>();
  const [status, setStatus] = useState<string>('');
  const [inputValues, setInputValues] = useState<InputValuesType>({
    registration_code: '',
    label: '',
  });

  const registerReader = async () => {
    setStatus('Registering...');
    try {
      const response = await fetch(`${API_URL}/register_reader`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_code: inputValues.registration_code,
          label: inputValues.label || undefined,
          location: selectedLocation?.id,
        }),
      });
      const { reader, error } = await response.json();
      if (error) {
        console.log(error);
        setStatus('Could not register reader.');
      } else {
        console.log(reader);
        setStatus('Registered');
      }
    } catch (error) {
      console.error(error);
      setStatus('Could not register reader.');
    }
  };

  const handleRegisterReader = () => {
    if (!inputValues.registration_code) {
      setStatus('Please fill out registration code.');
    } else if (!selectedLocation) {
      setStatus('Please select a location.');
    } else {
      registerReader();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <List bolded={false} topSpacing={false} title="REGISTRATION CODE">
        <TextInput
          style={styles.input}
          value={inputValues.registration_code}
          onChangeText={(value: string) =>
            setInputValues({ ...inputValues, registration_code: value })
          }
          placeholder="banana-apple-pear"
        />
      </List>
      <List bolded={false} topSpacing={false} title="LABEL (OPTIONAL)">
        <TextInput
          style={styles.input}
          value={inputValues.label}
          onChangeText={(value: string) =>
            setInputValues({ ...inputValues, label: value })
          }
          placeholder="Front Desk"
        />
      </List>

      <List bolded={false} topSpacing={false} title="LOCATION">
        <ListItem
          onPress={() => {
            navigation.navigate('LocationListScreen', {
              onSelect: (location: Location) => setSelectedLocation(location),
            });
          }}
          title={selectedLocation?.displayName || 'No location selected'}
        />
      </List>

      {status ? (
        <View style={styles.buttonWrapper}>
          <ListItem title={status} />
        </View>
      ) : null}

      <View style={styles.buttonWrapper}>
        <ListItem
          color={colors.blue}
          title="Register Reader"
          onPress={handleRegisterReader}
        />
      </View>

      <Text style={styles.info}>
        Internet-connected readers like the WisePOS E must be registered to your
        account and associated to a location before they can be discovered.
      </Text>
      <Text style={styles.info}>
        Press 0-7-1-3-9 on your reader to display a registration code.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    flex: 1,
    paddingVertical: 22,
  },
  input: {
    height: 44,
    backgroundColor: colors.white,
    paddingLeft: 16,
    marginBottom: 12,
    borderBottomColor: colors.gray,
    color: colors.dark_gray,
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomWidth: 1,
        borderBottomColor: `${colors.gray}66`,
      },
    }),
  },
  info: {
    color: colors.dark_gray,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  buttonWrapper: {
    marginTop: 35,
  },
});
