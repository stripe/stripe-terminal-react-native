import React from 'react';
import { useContext } from 'react';
import { BackHandler, ScrollView, Text, StyleSheet } from 'react-native';
import { LogContext } from '../components/LogContext';
import { useNavigation } from '@react-navigation/core';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';

const LogListScreen = () => {
  const { logs } = useContext(LogContext);
  const navigation = useNavigation();

  const onBackPress = () => {
    navigation.navigate('Terminal');
    return true;
  };

  BackHandler.addEventListener('hardwareBackPress', onBackPress);

  return (
    <ScrollView contentContainerStyle={styles.container} testID="scroll-view">
      <Text style={styles.title}>EVENT LOG</Text>
      {logs.map((log) => (
        <List key={log.name} title={log.name}>
          {log.events.map((event) => (
            <ListItem
              key={event.name}
              title={event.name}
              description={event.description}
              onPress={() => {
                navigation.navigate('LogScreen', { event, log });
              }}
            />
          ))}
        </List>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    paddingBottom: 50,
    flexGrow: 1,
  },
  title: {
    marginTop: 15,
    padding: 10,
    color: colors.dark_gray,
  },
});

export default LogListScreen;
