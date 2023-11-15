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
  ConfirmRefundResultType,
  ConnectLocalMobileParams,
  ConnectReaderResultType,
  ConnectHandoffParams,
  CollectPaymentMethodParams,
  PaymentIntent,
  SetupIntent,
  OfflinePaymentStatus,
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
        hasMore: hasMore || false,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getLocations')(params);
}

export async function confirmPaymentIntent(
  paymentIntent: PaymentIntent.Type
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerPaymentIntent) => {
    try {
      const { error, paymentIntent: confirmedPaymentIntent } =
        await StripeTerminalSdk.confirmPaymentIntent(innerPaymentIntent);

      if (error) {
        return {
          error,
          paymentIntent: undefined,
        };
      }
      return {
        paymentIntent: confirmedPaymentIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'confirmPaymentIntent')(paymentIntent);
}

export async function cancelPaymentIntent(
  paymentIntent: PaymentIntent.Type
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerPaymentIntent) => {
    try {
      const { paymentIntent: canceledPaymentIntent, error } =
        await StripeTerminalSdk.cancelPaymentIntent(innerPaymentIntent);

      if (error) {
        return {
          error,
          paymentIntent: undefined,
        };
      }
      return {
        paymentIntent: canceledPaymentIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelPaymentIntent')(paymentIntent);
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
  setupIntent: SetupIntent.Type
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerSetupIntent) => {
    try {
      const { setupIntent: canceledSetupIntent, error } =
        await StripeTerminalSdk.cancelSetupIntent(innerSetupIntent);

      if (error) {
        return {
          error,
          setupIntent: undefined,
        };
      }
      return {
        setupIntent: canceledSetupIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelSetupIntent')(setupIntent);
}

export async function confirmSetupIntent(
  setupIntent: SetupIntent.Type
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerSetupIntent) => {
    try {
      const { setupIntent: confirmedSetupIntent, error } =
        await StripeTerminalSdk.confirmSetupIntent(innerSetupIntent);

      if (error) {
        return {
          error,
          setupIntent: undefined,
        };
      }
      return {
        setupIntent: confirmedSetupIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'confirmSetupIntent')(setupIntent);
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

export async function confirmRefund(): Promise<ConfirmRefundResultType> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error, refund } = await StripeTerminalSdk.confirmRefund();
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
  }, 'confirmRefund')();
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

export async function getOfflineStatus(): Promise<OfflinePaymentStatus> {
  return Logger.traceSdkMethod(async () => {
    try {
      const offlineStatus = await StripeTerminalSdk.getOfflineStatus();
      return offlineStatus;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getOfflineStatus')();
}
