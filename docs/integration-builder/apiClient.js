export const fechTokenProvider = async () => {
  const response = await fetch('http://localhost:4242/connection_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();

  if (!data) {
    throw Error('No data in response from ConnectionToken endpoint');
  }

  if (!data.secret) {
    throw Error('Missing `secret` in ConnectionToken JSON response');
  }
  return data.secret;
};

export const fetchPaymentIntent = async () => {
  const response = await fetch('http://localhost:4242/create_payment_intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: 2000,
    }),
  });
  const data = await response.json();

  if (!data) {
    throw Error('No data in response from PaymentIntent endpoint');
  }

  if (!data.client_secret) {
    throw Error('Missing `client_secret` in ConnectionToken JSON response');
  }
  return data.client_secret;
};

export const capturePaymentIntent = async () => {
  const response = await fetch('http://localhost:4242/capture_payment_intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'paymentIntentId',
    }),
  });

  if (response.status >= 200 && response.status < 300) {
    return true;
  } else {
    return false;
  }
};
