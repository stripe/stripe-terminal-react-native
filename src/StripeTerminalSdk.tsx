import { NativeModules } from 'react-native';
import type {
  InitParams,
  StripeError,
  DiscoverReadersParams,
  DiscoverReadersResultType,
  CancelDiscoveringResultType,
  ConnectBluetoothReaderResultType,
  ConnectBluetoothReaderParams,
  DisconnectReaderResultType,
  Reader,
  ConnectInternetResultType,
  ConnectInternetReaderParams,
  CreatePaymentIntentParams,
  CollectSetupIntentPaymentMethodParams,
  PaymentIntentResultType,
  Cart,
  SetupIntentResultType,
  CreateSetupIntentParams,
  ClearReaderDisplayResultType,
  ListLocationsParams,
  ListLocationsResultType,
  RefundParams,
  CollectRefundPaymentMethodType,
  ProcessRefundResultType,
  ReadReusableCardParamsType,
  PaymentMethodResultType,
} from './types';

const { StripeTerminalReactNative } = NativeModules;

type InitializeResultNativeType = Promise<{
  error?: StripeError;
  reader?: Reader.Type;
}>;

type StripeTerminalSdkType = {
  // Initialize StripeTerminalSdk native module
  initialize(params: InitParams): InitializeResultNativeType;
  // Set connection token
  setConnectionToken(token: string): Promise<void>;
  // Discover readers by connection type
  discoverReaders(params: DiscoverReadersParams): DiscoverReadersResultType;
  // Cancel discovering readers
  cancelDiscovering(): CancelDiscoveringResultType;
  // Connect to reader via bluetooth
  connectBluetoothReader(
    params: ConnectBluetoothReaderParams
  ): Promise<ConnectBluetoothReaderResultType>;
  // Connect to reader via internet
  connectInternetReader(
    params: ConnectInternetReaderParams
  ): Promise<ConnectInternetResultType>;
  // Disconnect reader
  disconnectReader(): Promise<DisconnectReaderResultType>;
  // Create a payment intent
  createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResultType>;
  // Collect Payment Method
  collectPaymentMethod(
    paymentIntentId: string
  ): Promise<PaymentIntentResultType>;
  // Retrieve Payment Intent
  retrievePaymentIntent(clientSecret: string): Promise<PaymentIntentResultType>;
  // Process a payment
  processPayment(paymentIntentId: string): Promise<PaymentIntentResultType>;
  // Create Setup Intent
  createSetupIntent(
    params: CreateSetupIntentParams
  ): Promise<SetupIntentResultType>;
  // Cancel Payment Intent
  cancelPaymentIntent(
    paymentIntentId: string
  ): Promise<PaymentIntentResultType>;
  // Collect Setup Intent payment method
  collectSetupIntentPaymentMethod(
    params: CollectSetupIntentPaymentMethodParams
  ): Promise<SetupIntentResultType>;
  // Install available update
  installAvailableUpdate(): Promise<void>;
  // Cancel installing software update
  cancelInstallingUpdate(): Promise<void>;
  // Set text on a reader display
  setReaderDisplay(card: Cart): Promise<{
    error?: StripeError;
  }>;
  // Clear reader display
  clearReaderDisplay(): Promise<ClearReaderDisplayResultType>;
  retrieveSetupIntent(clientSecret: string): Promise<SetupIntentResultType>;
  // Cancel Setup Intent
  cancelSetupIntent(paymentIntentId: string): Promise<SetupIntentResultType>;
  // List of locations belonging to the merchant
  getListLocations(
    params: ListLocationsParams
  ): Promise<ListLocationsResultType>;
  // Confirm Setup Intent
  confirmSetupIntent(paymentIntentId: string): Promise<SetupIntentResultType>;
  simulateReaderUpdate(update: Reader.SimulateUpdateType): Promise<void>;
  collectRefundPaymentMethod(
    params: RefundParams
  ): Promise<CollectRefundPaymentMethodType>;
  processRefund(): Promise<ProcessRefundResultType>;
  clearCachedCredentials(): Promise<{
    error?: StripeError;
  }>;
  readReusableCard(
    params: ReadReusableCardParamsType
  ): Promise<PaymentMethodResultType>;
  cancelCollectPaymentMethod(): Promise<{
    error?: StripeError;
  }>;
  cancelCollectSetupIntent(): Promise<{
    error?: StripeError;
  }>;
  cancelReadReusableCard(): Promise<{
    error?: StripeError;
  }>;
};

export default StripeTerminalReactNative as StripeTerminalSdkType;
