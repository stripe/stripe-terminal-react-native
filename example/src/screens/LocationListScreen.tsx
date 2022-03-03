import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Location, useStripeTerminal } from 'stripe-terminal-react-native';
import { colors } from '../colors';
import ListItem from '../components/ListItem';

export default function LocationListScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<any, any>>();

  const { getListLocations, loading } = useStripeTerminal();
  const [list, setList] = useState<Location[]>([]);

  useEffect(() => {
    async function init() {
      const { locationsList } = await getListLocations({ limit: 20 });
      if (locationsList) {
        setList(locationsList);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    backgroundColor: colors.white,
  },
  header: {
    color: colors.dark_gray,
    fontSize: 16,
    marginVertical: 12,
    paddingLeft: 22,
  },
});
