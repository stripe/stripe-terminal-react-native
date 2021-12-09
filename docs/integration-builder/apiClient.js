// {{ INTEGRATION-BUILDER START: #2d }}
export const fetchConnectionToken = async () => {
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
// {{ INTEGRATION-BUILDER END: #2d }}

// {{ INTEGRATION-BUILDER START: #4b }}
export const fetchPaymentIntent = async () => {
  // {{ INTEGRATION-BUILDER START: #5b }}
  const parameters = {
    amount: 1000,
  };
  // {{ INTEGRATION-BUILDER END: #5b }}

  const response = await fetch('http://localhost:4242/create_payment_intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parameters),
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
// {{ INTEGRATION-BUILDER END: #4b }}

// {{ INTEGRATION-BUILDER START: #4f }}
export const capturePaymentIntent = async () => {
  const parameters = {
    id: 'paymentIntentId',
  };

  const response = await fetch('http://localhost:4242/capture_payment_intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parameters),
  });

  if (response.status >= 200 && response.status < 300) {
    return true;
  } else {
    return false;
  }
};
// {{ INTEGRATION-BUILDER END: #4f }}
