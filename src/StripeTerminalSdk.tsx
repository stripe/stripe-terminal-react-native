import { NativeModules } from 'react-native';
import type {
  InitParams,
  DiscoverReadersParams,
  DiscoverReadersResultType,
  CancelDiscoveringResultType,
  DisconnectReaderResultType,
  RebootReaderResultType,
  Reader,
  CreatePaymentIntentParams,
  CollectSetupIntentPaymentMethodParams,
  PaymentIntentResultType,
  Cart,
  SetupIntentResultType,
  CreateSetupIntentParams,
  ClearReaderDisplayResultType,
  GetLocationsParams,
  GetLocationsResultType,
  RefundParams,
  CollectRefundPaymentMethodType,
  ConfirmRefundResultType,
  SetConnectionTokenParams,
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
  PrintContent,
} from './types';
import type { StripeError } from './types/StripeError';

const { StripeTerminalReactNative } = NativeModules;

type InitializeResultNativeType = Promise<{
  error?: StripeError;
  reader?: Reader.Type;
}>;

interface InternalInitParams extends InitParams {
  reactNativeVersion: string;
}

export interface StripeTerminalSdkType {
  // Initialize StripeTerminalSdk native module
  initialize(params: InternalInitParams): InitializeResultNativeType;
  // Set connection token
  setConnectionToken(params: SetConnectionTokenParams): Promise<void>;
  // Discover readers by connection type
  discoverReaders(params: DiscoverReadersParams): DiscoverReadersResultType;
  // Cancel discovering readers
  cancelDiscovering(): CancelDiscoveringResultType;
  // Connect to reader via bluetooth
  connectReader(
    params: ConnectReaderParams,
    discoveryMethod: Reader.DiscoveryMethod
  ): Promise<ConnectReaderResultType>;
  // Disconnect reader
  disconnectReader(): Promise<DisconnectReaderResultType>;
  // Reboot reader
  rebootReader(): Promise<RebootReaderResultType>;
  // Create a payment intent
  createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResultType>;
  // Collect Payment Method
  collectPaymentMethod(
    params: CollectPaymentMethodParams
  ): Promise<PaymentIntentResultType>;
  // Retrieve Payment Intent
  retrievePaymentIntent(clientSecret: string): Promise<PaymentIntentResultType>;
  // Confirm Payment Intent
  confirmPaymentIntent(
    params: ConfirmPaymentMethodParams
  ): Promise<PaymentIntentResultType>;
  // Create Setup Intent
  createSetupIntent(
    params: CreateSetupIntentParams
  ): Promise<SetupIntentResultType>;
  // Cancel Payment Intent
  cancelPaymentIntent(
    params: CancelPaymentMethodParams
  ): Promise<PaymentIntentResultType>;
  // Collect Setup Intent payment method
  collectSetupIntentPaymentMethod(
    params: CollectSetupIntentPaymentMethodParams
  ): Promise<SetupIntentResultType>;
  // Install available update
  installAvailableUpdate(): Promise<void>;
  // Cancel installing software update
  cancelInstallingUpdate(): Promise<{
    error?: StripeError;
  }>;
  // Set text on a reader display
  setReaderDisplay(cart: Cart): Promise<{
    error?: StripeError;
  }>;
  // Clear reader display
  clearReaderDisplay(): Promise<ClearReaderDisplayResultType>;
  retrieveSetupIntent(clientSecret: string): Promise<SetupIntentResultType>;
  // Cancel Setup Intent
  cancelSetupIntent(
    params: CancelSetupIntentMethodParams
  ): Promise<SetupIntentResultType>;
  // List of locations belonging to the merchant
  getLocations(params: GetLocationsParams): Promise<GetLocationsResultType>;
  // Confirm Setup Intent
  confirmSetupIntent(
    params: ConfirmSetupIntentMethodParams
  ): Promise<SetupIntentResultType>;
  simulateReaderUpdate(update: Reader.SimulateUpdateType): Promise<void>;
  collectRefundPaymentMethod(
    params: RefundParams
  ): Promise<CollectRefundPaymentMethodType>;
  cancelCollectRefundPaymentMethod(): Promise<{
    error?: StripeError;
  }>;
  confirmRefund(): Promise<ConfirmRefundResultType>;
  clearCachedCredentials(): Promise<{
    error?: StripeError;
  }>;
  cancelCollectPaymentMethod(): Promise<{
    error?: StripeError;
  }>;
  cancelCollectSetupIntent(): Promise<{
    error?: StripeError;
  }>;
  cancelConfirmPaymentIntent(): Promise<{
    error?: StripeError;
  }>;
  cancelConfirmSetupIntent(): Promise<{
    error?: StripeError;
  }>;
  cancelConfirmRefund(): Promise<{
    error?: StripeError;
  }>;
  setSimulatedCard(cardNumber: string): Promise<{
    error?: StripeError;
  }>;
  setSimulatedOfflineMode(simulatedOffline: boolean): Promise<{
    error?: StripeError;
  }>;
  setSimulatedCollectInputsResult(
    simulatedCollectInputsBehavior: string
  ): Promise<{
    error?: StripeError;
  }>;
  getOfflineStatus(): Promise<OfflineStatus>;
  getPaymentStatus(): Promise<PaymentStatus>;
  getConnectionStatus(): Promise<ConnectionStatus>;
  getConnectedReader(): Promise<Reader.Type>;
  getReaderSettings(): Promise<Reader.ReaderSettings>;
  setReaderSettings(
    params: Reader.ReaderSettingsParameters
  ): Promise<Reader.ReaderSettings>;
  collectInputs(
    params: ICollectInputsParameters
  ): Promise<ICollectInputsResults>;
  cancelCollectInputs(): Promise<{
    error?: StripeError;
  }>;
  collectData(params: CollectDataParams): Promise<CollectDataResultType>;
  cancelCollectData(): Promise<{
    error?: StripeError;
  }>;
  /**
   * Prints the specified content to the connected reader's printer, if available.
   * @param content The content to print. Must be an image (JPEG/PNG) encoded as a base64 string or 'data:' URI scheme.
   * @returns A promise that resolves to an empty object if the print succeeds, or an object containing a `StripeError` if the print fails.
   */
  print(content: PrintContent): Promise<{
    error?: StripeError;
  }>;
  cancelReaderReconnection(): Promise<{
    error?: StripeError;
  }>;
  supportsReadersOfType(
    params: Reader.ReaderSupportParams
  ): Promise<Reader.ReaderSupportResult>;
  setTapToPayUxConfiguration(params: TapToPayUxConfiguration): Promise<{
    error?: StripeError;
  }>;
  getNativeSdkVersion(): Promise<string>;
}

export default StripeTerminalReactNative as StripeTerminalSdkType;
