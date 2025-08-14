import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/core';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import {
  type Location,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import ListItem from '../components/ListItem';
import List from '../components/List';

import type { RouteParamList } from '../App';
import { AppContext } from '../AppContext';

export default function LocationListScreen() {
  const { cachedLocations, setCachedLocations } = useContext(AppContext);

  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<RouteParamList, 'LocationListScreen'>>();

  const { getLocations, loading } = useStripeTerminal();
  const [list, setList] = useState<Location[]>(cachedLocations);
  const dummyLocations: Location[] = [
    { id: 'ABCD', displayName: 'Bad Location', livemode: false },
    {
      id: 'tml_AbC2def4GhIjkL',
      displayName: 'Wrong User Location',
      livemode: false,
    },
  ];

  useEffect(() => {
    if (list != null && list.length !== 0) {
      setCachedLocations(list);
    }
  }, [list, setCachedLocations]);

  useEffect(() => {
    async function init() {
      const { locations } = await getLocations({ limit: 20 });
      if (locations) {
        setList(locations);
      }
    }
    init();
  }, [getLocations]);

  const renderItem = (item: Location) => (
    <ListItem
      description={item.id}
      title={item.displayName || ''}
      key={item.id}
      onPress={() => {
        params?.onSelect(item);
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }}
    />
  );
  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      {params?.showDummyLocation === true && (
        <List title="INTERNAL: DUMMY LOCATIONS">
          {dummyLocations.map((location) => renderItem(location))}
        </List>
      )}
      <List title={list.length + ' LOCATIONS FOUND'}>
        <>
          {list.map((location) => renderItem(location))}
          {loading && list.length === 0 && <ActivityIndicator />}
        </>
      </List>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  header: {
    color: colors.dark_gray,
    fontSize: 16,
    marginVertical: 12,
    paddingLeft: 22,
  },
});
