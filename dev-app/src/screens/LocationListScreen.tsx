import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Location,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import ListItem from '../components/ListItem';

import type { RouteParamList } from '../App';

export default function LocationListScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RouteParamList, 'LocationList'>>();

  const { getLocations, loading } = useStripeTerminal();
  const [list, setList] = useState<Location[]>([]);
  const dummyLocations: Location[] = [
    { id: 'ABCD', displayName: 'Bad Location', livemode: false },
    {
      id: 'tml_AbC2def4GhIjkL',
      displayName: 'Wrong User Location',
      livemode: false,
    },
  ];

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
    <View style={styles.container}>
      {params?.showDummyLocation === true && (
        <FlatList
          style={{ marginBottom: 30 }}
          data={dummyLocations}
          ListHeaderComponent={() => (
            <Text style={styles.header}>INTERNAL: DUMMY LOCATIONS</Text>
          )}
          renderItem={({ item }) => renderItem(item)}
        />
      )}
      <FlatList
        data={list}
        ListHeaderComponent={() => (
          <Text style={styles.header}>{list.length} LOCATIONS FOUND</Text>
        )}
        ListEmptyComponent={() => <>{loading && <ActivityIndicator />}</>}
        renderItem={({ item }) => renderItem(item)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.white,
  },
  header: {
    color: colors.dark_gray,
    fontSize: 16,
    marginVertical: 12,
    paddingLeft: 22,
  },
});
