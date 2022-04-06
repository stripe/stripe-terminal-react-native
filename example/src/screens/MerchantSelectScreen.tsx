import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Stripe } from 'stripe';

import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  Modal,
  View,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import type { RouteParamList } from '../App';

export default function DiscoverReadersScreen() {
  const [accounts, setAccounts] = useState<
    Array<Stripe.Account & { secretKey: string }>
  >([]);
  const { params } = useRoute<RouteProp<RouteParamList, 'MerchantSelect'>>();

  const navigation = useNavigation();

  // on init load all stored accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@merchant_keys');
        const parsedValue = jsonValue != null ? JSON.parse(jsonValue) : null;
        setAccounts(parsedValue.accounts);
      } catch (e) {
        // error reading value
      }
    };

    fetchAccounts();
  }, []);
}
