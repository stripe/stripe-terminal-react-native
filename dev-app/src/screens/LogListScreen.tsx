import React, { useEffect } from 'react';
import { useContext } from 'react';
import { BackHandler, ScrollView, Text, StyleSheet } from 'react-native';
import { LogContext } from '../components/LogContext';
import { useNavigation } from '@react-navigation/core';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { HeaderBackButton } from '@react-navigation/elements';
import type { NavigationProp } from '@react-navigation/native';
import type { RouteParamList } from '../App';

const LogListScreen = () => {
  const { logs, cancel, setCancel } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton onPress={onBackPress} tintColor={colors.white} />
      ),
    });
  });

  const onBackPress = () => {
    const latestLog = logs[logs.length - 1];
    const latestEvent = latestLog.events[latestLog.events.length - 1];

    if (latestEvent.onBack) {
      latestEvent.onBack();
    }
    setCancel(null);
    navigation.navigate('HomeScreen', {});
    return true;
  };

  BackHandler.addEventListener('hardwareBackPress', onBackPress);

  return (
    <ScrollView contentContainerStyle={styles.container} testID="scroll-view">
      <Text style={styles.title}>EVENT LOG</Text>
      {cancel && (
        <ListItem
          color={colors.blue}
          title={cancel?.label || 'no label'}
          onPress={cancel?.action}
          disabled={cancel?.isDisabled}
        />
      )}
      {logs.map((log, lidx) => (
        <List key={`${log.name}-${lidx}`} title={log.name}>
          {log.events.map((event, idx) => (
            <ListItem
              testID={`${event.name}`}
              key={`${event.name}-${idx}`}
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
