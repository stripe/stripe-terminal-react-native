import { Platform } from 'react-native';
import { API_URL } from './Config';

export const fetchCustomerId = async () => {
  const response = await fetch(`${API_URL}/get_customers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const { customers } = await response.json();

  if (customers.length === 0) {
    return { error: 'There is no any customer created yet.' };
  }
  const { id } = customers[0] as { id: string };

  return { id };
};

export const isAndroid12orHigher = () => {
  return Platform.OS === 'android' && Platform.Version >= 31;
};
