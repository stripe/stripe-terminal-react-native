import StripeTerminalSdk from './StripeTerminalSdk';
import type {
  InitParams,
  InitializeResultType,
  DiscoverReadersParams,
  DiscoverReadersResultType,
  ConnectBluetoothReaderParams,
  CancelDiscoveringResultType,
  ConnectBluetoothReaderResultType,
  DisconnectReaderResultType,
  ConnectInternetReaderParams,
  ConnectInternetResultType,
  ConnectUsbReaderParams,
  ConnectUsbReaderResultType,
  CreatePaymentIntentParams,
  CollectSetupIntentPaymentMethodParams,
  PaymentIntentResultType,
  GetLocationsParams,
  GetLocationsResultType,
  StripeError,
  Cart,
  CreateSetupIntentParams,
  ClearReaderDisplayResultType,
  SetupIntentResultType,
  Reader,
  RefundParams,
  PaymentMethodResultType,
  ReadReusableCardParamsType,
  ProcessRefundResultType,
} from './types';

export async function initialize(
  params: InitParams
): Promise<InitializeResultType> {
  try {
    const { error, reader } = await StripeTerminalSdk.initialize(params);

    if (error) {
      return {
        error: error,
        reader: undefined,
      };
    } else {
      return {
        error: undefined,
        reader,
      };
    }
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function setConnectionToken(
  token?: string,
  error?: string
): Promise<void> {
  try {
    await StripeTerminalSdk.setConnectionToken({ token, error });
  } catch (e) {
    console.warn('Unexpected error:', e);
  }
}

export async function discoverReaders(
  params: DiscoverReadersParams
): Promise<DiscoverReadersResultType> {
  try {
    const { error } = await StripeTerminalSdk.discoverReaders(params);

    return {
      error: error,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function cancelDiscovering(): Promise<CancelDiscoveringResultType> {
  try {
    const { error } = await StripeTerminalSdk.cancelDiscovering();

    return {
      error: error,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function connectBluetoothReader(
  params: ConnectBluetoothReaderParams
): Promise<ConnectBluetoothReaderResultType> {
  try {
    const { error, reader } = await StripeTerminalSdk.connectBluetoothReader(
      params
    );

    if (error) {
      return {
        error,
        reader: undefined,
      };
    }
    return {
      reader: reader!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function connectInternetReader(
  params: ConnectInternetReaderParams
): Promise<ConnectInternetResultType> {
  try {
    const { error, reader } = await StripeTerminalSdk.connectInternetReader(
      params
    );

    if (error) {
      return {
        error,
        reader: undefined,
      };
    }
    return {
      reader: reader!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function connectUsbReader(
  params: ConnectUsbReaderParams
): Promise<ConnectUsbReaderResultType> {
  try {
    const { error, reader } = await StripeTerminalSdk.connectUsbReader(params);

    if (error) {
      return {
        error,
        reader: undefined,
      };
    }
    return {
      reader: reader!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function disconnectReader(): Promise<DisconnectReaderResultType> {
  try {
    const { error } = await StripeTerminalSdk.disconnectReader();

    return {
      error: error,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResultType> {
  try {
    const { error, paymentIntent } =
      await StripeTerminalSdk.createPaymentIntent(params);

    if (error) {
      return {
        error,
        paymentIntent: undefined,
      };
    }
    return {
      paymentIntent: paymentIntent!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function createSetupIntent(
  params: CreateSetupIntentParams
): Promise<SetupIntentResultType> {
  try {
    const { error, setupIntent } = await StripeTerminalSdk.createSetupIntent(
      params
    );

    if (error) {
      return {
        error,
        setupIntent: undefined,
      };
    }
    return {
      setupIntent: setupIntent!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function collectPaymentMethod(
  paymentIntentId: string
): Promise<PaymentIntentResultType> {
  try {
    const { error, paymentIntent } =
      await StripeTerminalSdk.collectPaymentMethod(paymentIntentId);

    if (error) {
      return {
        error,
        paymentIntent: undefined,
      };
    }
    return {
      paymentIntent: paymentIntent!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function retrievePaymentIntent(
  clientSecret: string
): Promise<PaymentIntentResultType> {
  try {
    const { error, paymentIntent } =
      await StripeTerminalSdk.retrievePaymentIntent(clientSecret);

    if (error) {
      return {
        error,
        paymentIntent: undefined,
      };
    }
    return {
      paymentIntent: paymentIntent!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function getLocations(
  params: GetLocationsParams
): Promise<GetLocationsResultType> {
  try {
    const { error, locations, hasMore } = await StripeTerminalSdk.getLocations(
      params
    );

    if (error) {
      return {
        error,
        locations: undefined,
        hasMore: undefined,
      };
    }
    return {
      locations: locations!,
      hasMore: hasMore!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function processPayment(
  paymentIntentId: string
): Promise<PaymentIntentResultType> {
  try {
    const { error, paymentIntent } = await StripeTerminalSdk.processPayment(
      paymentIntentId
    );

    if (error) {
      return {
        error,
        paymentIntent: undefined,
      };
    }
    return {
      paymentIntent: paymentIntent!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<PaymentIntentResultType> {
  try {
    const { paymentIntent, error } =
      await StripeTerminalSdk.cancelPaymentIntent(paymentIntentId);

    if (error) {
      return {
        error,
        paymentIntent: undefined,
      };
    }
    return {
      paymentIntent: paymentIntent!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function installAvailableUpdate(): Promise<{
  error?: StripeError;
}> {
  try {
    await StripeTerminalSdk.installAvailableUpdate();
    return {};
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function setReaderDisplay(
  cart: Cart
): Promise<{ error?: StripeError }> {
  try {
    const { error } = await StripeTerminalSdk.setReaderDisplay(cart);

    if (error) {
      return {
        error,
      };
    }
    return {};
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function cancelInstallingUpdate(): Promise<{
  error?: StripeError;
}> {
  try {
    await StripeTerminalSdk.cancelInstallingUpdate();
    return {};
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function retrieveSetupIntent(
  clientSecret: string
): Promise<SetupIntentResultType> {
  try {
    const { error, setupIntent } = await StripeTerminalSdk.retrieveSetupIntent(
      clientSecret
    );
    if (error) {
      return {
        setupIntent: undefined,
        error,
      };
    }
    return {
      setupIntent: setupIntent!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function collectSetupIntentPaymentMethod(
  params: CollectSetupIntentPaymentMethodParams
): Promise<SetupIntentResultType> {
  try {
    const { error, setupIntent } =
      await StripeTerminalSdk.collectSetupIntentPaymentMethod(params);
    if (error) {
      return {
        setupIntent: undefined,
        error,
      };
    }
    return {
      setupIntent: setupIntent!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function clearReaderDisplay(): Promise<ClearReaderDisplayResultType> {
  try {
    const { error } = await StripeTerminalSdk.clearReaderDisplay();

    return {
      error: error,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function cancelSetupIntent(
  setupIntentId: string
): Promise<SetupIntentResultType> {
  try {
    const { setupIntent, error } = await StripeTerminalSdk.cancelSetupIntent(
      setupIntentId
    );

    if (error) {
      return {
        error,
        setupIntent: undefined,
      };
    }
    return {
      setupIntent: setupIntent!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function confirmSetupIntent(
  setupIntentId: string
): Promise<SetupIntentResultType> {
  try {
    const { setupIntent, error } = await StripeTerminalSdk.confirmSetupIntent(
      setupIntentId
    );

    if (error) {
      return {
        error,
        setupIntent: undefined,
      };
    }
    return {
      setupIntent: setupIntent!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function simulateReaderUpdate(
  update: Reader.SimulateUpdateType
): Promise<{ error?: StripeError }> {
  try {
    await StripeTerminalSdk.simulateReaderUpdate(update);

    return {};
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function collectRefundPaymentMethod(
  params: RefundParams
): Promise<{
  error?: StripeError;
}> {
  try {
    const { error } = await StripeTerminalSdk.collectRefundPaymentMethod(
      params
    );
    return {
      error,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function processRefund(): Promise<ProcessRefundResultType> {
  try {
    const { error, refund } = await StripeTerminalSdk.processRefund();
    if (error) {
      return {
        error,
        refund: undefined,
      };
    }
    return {
      refund: refund,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function clearCachedCredentials(): Promise<{
  error?: StripeError;
}> {
  try {
    await StripeTerminalSdk.clearCachedCredentials();
    return {};
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function readReusableCard(
  params: ReadReusableCardParamsType
): Promise<PaymentMethodResultType> {
  try {
    const { paymentMethod, error } = await StripeTerminalSdk.readReusableCard(
      params
    );
    if (error) {
      return {
        error,
        paymentMethod: undefined,
      };
    }
    return {
      paymentMethod: paymentMethod!,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function cancelCollectPaymentMethod(): Promise<{
  error?: StripeError;
}> {
  try {
    await StripeTerminalSdk.cancelCollectPaymentMethod();
    return {};
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function cancelCollectSetupIntent(): Promise<{
  error?: StripeError;
}> {
  try {
    await StripeTerminalSdk.cancelCollectSetupIntent();
    return {};
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function cancelReadReusableCard(): Promise<{
  error?: StripeError;
}> {
  try {
    await StripeTerminalSdk.cancelReadReusableCard();
    return {};
  } catch (error) {
    return {
      error: error as any,
    };
  }
}
