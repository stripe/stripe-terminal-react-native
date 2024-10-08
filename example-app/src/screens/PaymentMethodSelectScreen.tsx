import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../colors';

import type { RouteParamList } from '../App';
import ListItem from '../components/ListItem';

type PaymentMethodTypeWrapper = {
  type: string;
  enabled: boolean;
};

export default function PaymentMethodSelectScreen() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<RouteParamList, 'PaymentMethodSelect'>>();

  const [paymentMethodTypes, setPaymentMethodTypes] = React.useState<
    PaymentMethodTypeWrapper[]
  >(
    params.paymentMethodTypes.map((it) => ({
      type: it,
      enabled: params.enabledPaymentMethodTypes.includes(it),
    }))
  );

  const doCancel = () => {
    // Revert any pending changes
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
          params.onChange(
            paymentMethodTypes.filter((it) => it.enabled).map((it) => it.type)
          );
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}
        disabled={paymentMethodTypes.filter((it) => it.enabled).length === 0}
      />
      <ListItem
        title="Cancel"
        testID="cancel-button"
        color={colors.red}
        onPress={doCancel}
      />
      <ScrollView style={styles.container}>
        {paymentMethodTypes.map((item, index) => {
          return (
            <ListItem
              title={item.type}
              key={item.type}
              rightElement={
                <Switch
                  key={`${item.type}_switch`}
                  id={item.type}
                  value={paymentMethodTypes[index].enabled}
                  onChange={() => {
                    const updatedPaymentMethodTypes = [...paymentMethodTypes];
                    updatedPaymentMethodTypes[index] = {
                      ...updatedPaymentMethodTypes[index],
                      enabled: !updatedPaymentMethodTypes[index].enabled,
                    };
                    setPaymentMethodTypes(updatedPaymentMethodTypes);
                  }}
                />
              }
            />
          );
        })}
      </ScrollView>
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
