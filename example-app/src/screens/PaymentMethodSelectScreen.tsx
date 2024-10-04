import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import React from 'react';
import { FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../colors';

import type { RouteParamList } from '../App';
import type { IPaymentMethodType } from '../types';
import ListItem from '../components/ListItem';

export default function PaymentMethodSelectScreen() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<RouteParamList, 'PaymentMethodSelect'>>();

  const [pendingPaymentMethodTypes, setPendingPaymentMethodTypes] =
    React.useState<IPaymentMethodType[]>(params.paymentMethodTypes);

  const doCancel = () => {
    // Revert any pending changes
    setPendingPaymentMethodTypes(params.paymentMethodTypes);
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.info}>
        Please select eligible payment methods for this payment:
      </Text>
      <ListItem
        title="Confirm"
        testID="confirm-button"
        color={colors.green}
        onPress={async () => {
          params.onChange(pendingPaymentMethodTypes);
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}
        disabled={
          pendingPaymentMethodTypes.filter((pmt) => pmt.enabled).length === 0
        }
      />
      <ListItem
        title="Cancel"
        testID="cancel-button"
        color={colors.red}
        onPress={doCancel}
      />
      <FlatList
        data={params.paymentMethodTypes}
        renderItem={({ item, index }) => (
          <ListItem
            title={item.type}
            rightElement={
              <Switch
                key={item.type}
                id={item.type}
                value={pendingPaymentMethodTypes[index].enabled}
                onChange={() => {
                  const updatedPaymentMethodTypes =
                    pendingPaymentMethodTypes.map((paymentMethodTypeToUpdate) =>
                      paymentMethodTypeToUpdate.type === item.type
                        ? {
                          ...paymentMethodTypeToUpdate,
                          enabled: !paymentMethodTypeToUpdate.enabled,
                        }
                        : paymentMethodTypeToUpdate
                    );
                  setPendingPaymentMethodTypes(updatedPaymentMethodTypes);
                }}
              />
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light_gray,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  info: {
    color: colors.dark_gray,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
});
