import React from 'react';
import { ScrollView, Text, StyleSheet, Dimensions } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/core';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import type { RouteParamList } from '../App';

const LogScreen = () => {
  const { params } = useRoute<RouteProp<RouteParamList, 'LogScreen'>>();
  const { event, log } = params;
  const { metadata } = event;

  return (
    <ScrollView contentContainerStyle={styles.container} testID="scroll-view">
      <Text style={styles.title}>LOG NAME</Text>
      <Text style={styles.description}>{log.name}</Text>
      <Text style={styles.title}>EVENT NAME</Text>
      <Text style={styles.description}>{event.name}</Text>
      <Text style={styles.title}>EVENT DESCRIPTION</Text>
      <Text style={styles.description}>{event.description}</Text>
      {metadata && (
        <List key="metadata" title="EVENT METADATA" bolded={false}>
          {Object.keys(metadata).map((key, index) => (
            <ListItem
              key={key + index}
              title={key}
              description={metadata[key] || 'no description'}
            />
          ))}
        </List>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    paddingBottom: 50,
    flexGrow: 1,
    minHeight: Dimensions.get('window').height,
  },
  description: {
    padding: 10,
    backgroundColor: colors.white,
    color: colors.dark_gray,
  },
  title: {
    marginTop: 15,
    padding: 10,
    color: colors.dark_gray,
  },
});

export default LogScreen;
