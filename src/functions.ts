import Logger from './logger';
import StripeTerminalSdk from './StripeTerminalSdk';
import * as PackageJson from '../package.json';
import type {
  InitParams,
  InitializeResultType,
  DiscoverReadersParams,
  DiscoverReadersResultType,
  CancelDiscoveringResultType,
  DisconnectReaderResultType,
  RebootReaderResultType,
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
  ConnectReaderResultType,
  CollectPaymentMethodParams,
  OfflineStatus,
  ICollectInputsParameters,
  ICollectInputsResults,
  PaymentStatus,
  ConnectionStatus,
  ConfirmPaymentMethodParams,
  ConfirmSetupIntentMethodParams,
  CancelSetupIntentMethodParams,
  CancelPaymentMethodParams,
  CollectDataParams,
  CollectDataResultType,
  TapToPayUxConfiguration,
  ConnectReaderParams,
} from './types';
import { CommonError } from './types';
import { Platform } from 'react-native';

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
  error?: string,
  callbackId?: string
): Promise<void> {
  try {
    await StripeTerminalSdk.setConnectionToken({ token, error, callbackId });
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

export async function connectReader(
  params: ConnectReaderParams,
  discoveryMethod: Reader.DiscoveryMethod
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams, discoveryMethod) => {
    try {
      const { error, reader } = await StripeTerminalSdk.connectReader(
        innerParams,
        discoveryMethod
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
  }, 'connectReader')(params, discoveryMethod);
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

export async function rebootReader(): Promise<RebootReaderResultType> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.rebootReader();

      return {
        error: error,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'rebootReader')();
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, paymentIntent } =
        await StripeTerminalSdk.createPaymentIntent(innerParams);

      if (error) {
        if (paymentIntent) {
          return {
            error,
            paymentIntent,
          };
        }
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
        if (paymentIntent) {
          return {
            error,
            paymentIntent,
          };
        }
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
  params: ConfirmPaymentMethodParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    try {
      const { error, paymentIntent: confirmedPaymentIntent } =
        await StripeTerminalSdk.confirmPaymentIntent(innerparams);

      if (error) {
        if (confirmedPaymentIntent) {
          return {
            error,
            paymentIntent: confirmedPaymentIntent,
          };
        }
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
  }, 'confirmPaymentIntent')(params);
}

export async function cancelPaymentIntent(
  params: CancelPaymentMethodParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    try {
      const { paymentIntent: canceledPaymentIntent, error } =
        await StripeTerminalSdk.cancelPaymentIntent(innerparams);

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
  }, 'cancelPaymentIntent')(params);
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
  params: CancelSetupIntentMethodParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { setupIntent: canceledSetupIntent, error } =
        await StripeTerminalSdk.cancelSetupIntent(innerParams);

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
  }, 'cancelSetupIntent')(params);
}

export async function confirmSetupIntent(
  params: ConfirmSetupIntentMethodParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    try {
      const { setupIntent: confirmedSetupIntent, error } =
        await StripeTerminalSdk.confirmSetupIntent(innerparams);

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
  }, 'confirmSetupIntent')(params);
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

export async function getOfflineStatus(): Promise<OfflineStatus> {
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

export async function getPaymentStatus(): Promise<PaymentStatus> {
  return Logger.traceSdkMethod(async () => {
    try {
      const paymentStatus = await StripeTerminalSdk.getPaymentStatus();
      return paymentStatus;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getPaymentStatus')();
}

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  return Logger.traceSdkMethod(async () => {
    try {
      const connectionStatus = await StripeTerminalSdk.getConnectionStatus();
      return connectionStatus;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getConnectionStatus')();
}

export async function getConnectedReader(): Promise<Reader.Type> {
  return Logger.traceSdkMethod(async () => {
    try {
      const connectedReader = await StripeTerminalSdk.getConnectedReader();
      return connectedReader;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getConnectedReader')();
}

export async function getReaderSettings(): Promise<Reader.ReaderSettings> {
  return Logger.traceSdkMethod(async () => {
    try {
      const readerSettings = await StripeTerminalSdk.getReaderSettings();
      return readerSettings;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getReaderSettings')();
}

export async function setReaderSettings(
  params: Reader.ReaderSettingsParameters
): Promise<Reader.ReaderSettings> {
  return Logger.traceSdkMethod(async () => {
    try {
      const readerSettings = await StripeTerminalSdk.setReaderSettings(params);
      return readerSettings;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'setReaderSettings')();
}

export async function collectInputs(
  params: ICollectInputsParameters
): Promise<ICollectInputsResults> {
  return Logger.traceSdkMethod(async () => {
    try {
      const response = await StripeTerminalSdk.collectInputs(params);
      return response;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'collectInputs')();
}

export async function cancelCollectInputs(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.cancelCollectInputs();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelCollectInputs')();
}

export async function collectData(
  params: CollectDataParams
): Promise<CollectDataResultType> {
  return Logger.traceSdkMethod(async () => {
    try {
      const response = await StripeTerminalSdk.collectData(params);
      return {
        collectedData: response,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'collectData')();
}

export async function cancelReaderReconnection(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.cancelReaderReconnection();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelReaderReconnection')();
}

export async function supportsReadersOfType(
  params: Reader.ReaderSupportParams
): Promise<Reader.ReaderSupportResult> {
  return Logger.traceSdkMethod(async () => {
    try {
      const supportReaderResult = await StripeTerminalSdk.supportsReadersOfType(
        params
      );
      return supportReaderResult;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'supportsReadersOfType')();
}

export async function setTapToPayUxConfiguration(
  params: TapToPayUxConfiguration
): Promise<{
  error?: StripeError;
}> {
  if (Platform.OS === 'ios') {
    return {
      error: {
        message: "'setTapToPayUxConfiguration' is unsupported on iOS",
        code: CommonError.Failed,
      },
    };
  }

  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.setTapToPayUxConfiguration(params);
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'setTapToPayUxConfiguration')();
}

export async function getNativeSdkVersion(): Promise<string> {
  return Logger.traceSdkMethod(async () => {
    try {
      return await StripeTerminalSdk.getNativeSdkVersion();
    } catch (error) {
      return '';
    }
  }, 'getNativeSdkVersion')();
}
