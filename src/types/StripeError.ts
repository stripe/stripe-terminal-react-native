import type { ErrorCode } from '../Errors/ErrorCodes';
import type { PaymentIntent } from '../types/PaymentIntent';
import type { SetupIntent } from '../types/SetupIntent';
import type { Refund } from '../types/Refund';

/**
 * API-level error information
 * - Android: Complete ApiError object from TerminalException.apiError
 * - iOS: Partially available via userInfo extraction
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

  /** Charge ID (optional, iOS will add in v5.1) */
  charge?: string;
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

  /** Associated Refund (if applicable, Android will populate this) */
  refund?: Refund.Props;

  /** API-level error information (unified across platforms) */
  apiError?: ApiErrorInformation;

  /** Underlying error information (unified structure) */
  underlyingError?: UnderlyingErrorInformation;
}

