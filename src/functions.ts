import Logger from './logger';
import StripeTerminalSdk from './StripeTerminalSdk';
import * as PackageJson from '../package.json';
import type {
  InitParams,
  InitializeResultType,
  DiscoverReadersParams,
  DiscoverReadersResultType,
  ConnectBluetoothReaderParams,
  CancelDiscoveringResultType,
  DisconnectReaderResultType,
  ConnectInternetReaderParams,
  ConnectUsbReaderParams,
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
  ConnectLocalMobileParams,
  ConnectReaderResultType,
  ConnectHandoffParams,
  ConnectEmbeddedParams,
  CollectPaymentMethodParams,
} from './types';

export async function initialize(
  params: InitParams
): Promise<InitializeResultType> {
  try {
    const { error, reader } = await StripeTerminalSdk.initialize({
      reactNativeVersion: PackageJson.version,
      ...params,
    });

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
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error } = await StripeTerminalSdk.discoverReaders(innerParams);

      return {
        error: error,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'discoverReaders')(params);
}

export async function cancelDiscovering(): Promise<CancelDiscoveringResultType> {
  return Logger.traceSdkMethod(async () => {
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
  }, 'cancelDiscoverReaders')();
}

export async function connectBluetoothReader(
  params: ConnectBluetoothReaderParams
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, reader } = await StripeTerminalSdk.connectBluetoothReader(
        innerParams
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
  }, 'connectBluetoothReader')(params);
}

export async function connectHandoffReader(
  params: ConnectHandoffParams
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, reader } = await StripeTerminalSdk.connectHandoffReader(
        innerParams
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
  }, 'connectHandoffReader')(params);
}

export async function connectEmbeddedReader(
  params: ConnectEmbeddedParams
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, reader } = await StripeTerminalSdk.connectEmbeddedReader(
        innerParams
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
  }, 'connectEmbeddedReader')(params);
}

export async function connectLocalMobileReader(
  params: ConnectLocalMobileParams
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, reader } =
        await StripeTerminalSdk.connectLocalMobileReader(innerParams);

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
  }, 'connectLocalMobileReader')(params);
}

export async function connectInternetReader(
  params: ConnectInternetReaderParams
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, reader } = await StripeTerminalSdk.connectInternetReader(
        innerParams
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
  }, 'connectInternetReader')(params);
}

export async function connectUsbReader(
  params: ConnectUsbReaderParams
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, reader } = await StripeTerminalSdk.connectUsbReader(
        innerParams
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
  }, 'connectUsbReader')(params);
}

export async function disconnectReader(): Promise<DisconnectReaderResultType> {
  return Logger.traceSdkMethod(async () => {
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
  }, 'disconnectReader')();
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, paymentIntent } =
        await StripeTerminalSdk.createPaymentIntent(innerParams);

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
  }, 'createPaymentIntent')(params);
}

export async function createSetupIntent(
  params: CreateSetupIntentParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, setupIntent } = await StripeTerminalSdk.createSetupIntent(
        innerParams
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
  }, 'createSetupIntent')(params);
}

export async function collectPaymentMethod(
  params: CollectPaymentMethodParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, paymentIntent } =
        await StripeTerminalSdk.collectPaymentMethod(innerParams);

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
  }, 'collectPaymentMethod')(params);
}

export async function retrievePaymentIntent(
  clientSecret: string
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerClientSecret) => {
    try {
      const { error, paymentIntent } =
        await StripeTerminalSdk.retrievePaymentIntent(innerClientSecret);

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
  }, 'retrievePaymentIntent')(clientSecret);
}

export async function getLocations(
  params: GetLocationsParams
): Promise<GetLocationsResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, locations, hasMore } =
        await StripeTerminalSdk.getLocations(innerParams);

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
  }, 'getLocations')(params);
}

export async function processPayment(
  paymentIntentId: string
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerPaymentIntentId) => {
    try {
      const { error, paymentIntent } = await StripeTerminalSdk.processPayment(
        innerPaymentIntentId
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
  }, 'processPayment')(paymentIntentId);
}

export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerPaymentIntentId) => {
    try {
      const { paymentIntent, error } =
        await StripeTerminalSdk.cancelPaymentIntent(innerPaymentIntentId);

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
  }, 'cancelPaymentIntent')(paymentIntentId);
}

export async function installAvailableUpdate(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.installAvailableUpdate();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'installAvailableUpdate')();
}

export async function setReaderDisplay(
  cart: Cart
): Promise<{ error?: StripeError }> {
  return Logger.traceSdkMethod(async (innerCart) => {
    try {
      const { error } = await StripeTerminalSdk.setReaderDisplay(innerCart);

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
  }, 'setReaderDisplay')(cart);
}

export async function cancelInstallingUpdate(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.cancelInstallingUpdate();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelInstallingUpdate')();
}

export async function retrieveSetupIntent(
  clientSecret: string
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerClientSecret) => {
    try {
      const { error, setupIntent } =
        await StripeTerminalSdk.retrieveSetupIntent(innerClientSecret);
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
  }, 'retrieveSetupIntent')(clientSecret);
}

export async function collectSetupIntentPaymentMethod(
  params: CollectSetupIntentPaymentMethodParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, setupIntent } =
        await StripeTerminalSdk.collectSetupIntentPaymentMethod(innerParams);
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
  }, 'collectSetupIntentPaymentMethod')(params);
}

export async function clearReaderDisplay(): Promise<ClearReaderDisplayResultType> {
  return Logger.traceSdkMethod(async () => {
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
  }, 'clearReaderDisplay')();
}

export async function cancelSetupIntent(
  setupIntentId: string
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerSetupIntentId) => {
    try {
      const { setupIntent, error } = await StripeTerminalSdk.cancelSetupIntent(
        innerSetupIntentId
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
  }, 'cancelSetupIntent')(setupIntentId);
}

export async function confirmSetupIntent(
  setupIntentId: string
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerSetupIntentId) => {
    try {
      const { setupIntent, error } = await StripeTerminalSdk.confirmSetupIntent(
        innerSetupIntentId
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
  }, 'confirmSetupIntent')(setupIntentId);
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

export async function setSimulatedCard(
  cardNumber: string
): Promise<{ error?: StripeError }> {
  return Logger.traceSdkMethod(async (innerCardNumber) => {
    try {
      await StripeTerminalSdk.setSimulatedCard(innerCardNumber);

      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'setSimulatedCard')(cardNumber);
}

export async function collectRefundPaymentMethod(
  params: RefundParams
): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error } = await StripeTerminalSdk.collectRefundPaymentMethod(
        innerParams
      );
      return {
        error,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'collectRefundPaymentMethod')(params);
}

export async function processRefund(): Promise<ProcessRefundResultType> {
  return Logger.traceSdkMethod(async () => {
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
  }, 'processRefund')();
}

export async function clearCachedCredentials(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.clearCachedCredentials();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'clearCachedCredentials')();
}

export async function readReusableCard(
  params: ReadReusableCardParamsType
): Promise<PaymentMethodResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { paymentMethod, error } = await StripeTerminalSdk.readReusableCard(
        innerParams
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
  }, 'readReusableCard')(params);
}

export async function cancelCollectPaymentMethod(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.cancelCollectPaymentMethod();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelCollectPaymentMethod')();
}

export async function cancelCollectRefundPaymentMethod(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.cancelCollectRefundPaymentMethod();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelCollectRefundPaymentMethod')();
}

export async function cancelCollectSetupIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.cancelCollectSetupIntent();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelCollectSetupIntent')();
}

export async function cancelReadReusableCard(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.cancelReadReusableCard();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelReadReusableCard')();
}
