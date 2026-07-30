import type { ErrorCode } from '../Errors/ErrorCodes';
import type { PaymentIntent } from '../types/PaymentIntent';
import type { PaymentMethod } from './';
import type { SetupIntent } from '../types/SetupIntent';
import type { Refund } from '../types/Refund';

/**
 * API-level error information, unified across platforms.
 *
 * Sources:
 * - TerminalException.apiError (both platforms)
 * - PaymentIntent.lastPaymentError (both platforms, ApiError / SCPApiError)
 * - SetupIntent.lastSetupError (both platforms, ApiError / SCPApiError)
 * - SetupAttempt.setupError (Android: SetupError, iOS: SCPApiError)
 *
 * Android's SetupError is a distinct type from ApiError — it adds paymentMethod
 * and paymentMethodType but lacks charge and requestLogUrl.
 */
export interface ApiErrorInformation {
  /** API error code */
  code: string;

  /** API error message */
  message: string;

  /** Decline code (payment-specific) */
  declineCode: string;

  /** Documentation URL (optional) */
  docUrl?: string;

  /** Related parameter name (optional) */
  param?: string;

  /** Error type (optional) */
  type?: string;

  /** Charge ID (optional) */
  charge?: string;

  /** URL to the Stripe request log entry for this API call (optional) */
  requestLogUrl?: string;

  /** Advice code providing additional context about the error (optional) */
  adviceCode?: string;

  /** Network-level advice code (optional) */
  networkAdviceCode?: string;

  /** Network-level decline code (optional) */
  networkDeclineCode?: string;

  /** Reports the outcome of localizing the error message (optional) */
  localizationResult?: LocalizationResult;

  /** Payment method associated with this error (Android SetupError only) */
  paymentMethod?: PaymentMethod.Type;

  /** Payment method type string (Android SetupError only) */
  paymentMethodType?: string;
}

/**
 * Reports the outcome of localizing an API error message.
 *
 * Present when a locale was requested via LocaleConfig and the server processed
 * the request. The two locales may differ when the requested locale is not supported.
 */
export interface LocalizationResult {
  /** The locale sent in the Accept-Language request header. */
  requestedLocale: string;
  /** The locale the message was actually localized to. */
  resolvedLocale: string;
}

/**
 * Underlying error information
 * - Android: From TerminalException.cause
 * - iOS: From NSError.userInfo[NSUnderlyingErrorKey] + localized info
 */
export interface UnderlyingErrorInformation {
  /** Underlying error code (Android: exception class, iOS: NSError.code) */
  code: string;

  /** Underlying error message */
  message: string;

  /** iOS error domain (iOS only) */
  iosDomain?: string;

  /** iOS localized failure reason (iOS only) */
  iosLocalizedFailureReason?: string;

  /** iOS localized recovery suggestion (iOS only) */
  iosLocalizedRecoverySuggestion?: string;
}

export interface StripeError extends Error {
  name: 'StripeError';
  message: string;
  code: ErrorCode;
  nativeErrorCode: string;

  /** Platform-specific metadata (flexible map structure) */
  metadata: Record<string, unknown>;

  /** Associated PaymentIntent (if applicable) */
  paymentIntent?: PaymentIntent.Type;

  /** Associated SetupIntent (if applicable) */
  setupIntent?: SetupIntent.Type;

  /** Associated Refund (if applicable) */
  refund?: Refund.Props;

  /** API-level error information (unified across platforms) */
  apiError?: ApiErrorInformation;

  /** Underlying error information (unified structure) */
  underlyingError?: UnderlyingErrorInformation;
}

