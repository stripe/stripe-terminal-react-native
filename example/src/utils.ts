import { API_URL } from './Config';

export const fetchCustomerId = async () => {
  const response = await fetch(`${API_URL}/fetch_customer`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const { id } = await response.json();
  return id;
};
