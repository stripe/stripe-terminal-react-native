import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import {
  OfflineStatus,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';

export default function DatabaseScreen() {
  const [offlinePaymentStatus, setOfflinePaymentStatus] =
    useState<OfflineStatus | null>(null);
  const currencySymbols = [
    { value: 'usd', label: '$' },
    { value: 'aed', label: 'AED' },
    { value: 'aud', label: 'A$' },
    { value: 'bgn', label: 'BGN'},
    { value: 'cad', label: 'CA$' },
    { value: 'chf', label: 'CHF' },
    { value: 'czk', label: 'CZK' },
    { value: 'dkk', label: 'DKK' },
    { value: 'eur', label: '€' },
    { value: 'gbp', label: '£' },
    { value: 'gip', label: 'GIP' },
    { value: 'hkd', label: 'HK$' },
    { value: 'huf', label: 'HUF' },
    { value: 'myr', label: 'MYR' },
    { value: 'nok', label: 'NOK' },
    { value: 'nzd', label: 'NZ$' },
    { value: 'pln', label: 'PLN' },
    { value: 'ron', label: 'RON' },
    { value: 'sek', label: 'SEK' },
    { value: 'sgd', label: 'SGD' },
  ];
  const { getOfflineStatus } = useStripeTerminal();
  function getCurrencySymbols(currency: string): string {
    let currencySymbol = '$';
    currencySymbols.map((a) => {
      if (currency === a.value) {
        currencySymbol = a.label;
      }
    });
    return currencySymbol;
  }

  useEffect(() => {
    async function getOfflinePaymentStatus() {
      const status = await getOfflineStatus();
      setOfflinePaymentStatus(status);
    }
    getOfflinePaymentStatus();
  }, [getOfflineStatus]);

  return (
    <ScrollView style={styles.container}>
      <List bolded={false} topSpacing={false} title="PUBLIC INTERFACE SUMMARY">
        {offlinePaymentStatus &&
        offlinePaymentStatus.sdk.offlinePaymentsCount > 0 ? (
          Object.keys(
            offlinePaymentStatus.sdk.offlinePaymentAmountsByCurrency
          ).map((key) => (
            <ListItem
              title={
                getCurrencySymbols(key) +
                ' ' +
                (
                  Number(
                    offlinePaymentStatus.sdk.offlinePaymentAmountsByCurrency[
                      key
                    ]
                  ) / 100
                ).toFixed(2)
              }
            />
          ))
        ) : (
          <></>
        )}
      </List>
      <Text style={styles.infoText}>
        {' '}
        {String(
          offlinePaymentStatus
            ? offlinePaymentStatus.sdk.offlinePaymentsCount
            : 0
        ) + ' payment intent(s)'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    height: '100%',
    paddingVertical: 22,
  },
  infoText: {
    color: colors.dark_gray,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
});
