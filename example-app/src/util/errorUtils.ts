import type { StripeError } from '@stripe/stripe-terminal-react-native';
import type { Event } from '../components/LogContext';

type LogMetadata = NonNullable<Event['metadata']>;

function stringifyValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

/**
 * Extracts available information from a StripeError into a flat
 * key-value record suitable for addLogs metadata.
 * Optional fields are included only when present.
 *
 * Note: This function is tightly coupled to StripeError's structure.
 * When StripeError adds new fields, update this function accordingly.
 */
export function extractFullErrorMetadata(error: StripeError): LogMetadata {
  const meta: LogMetadata = {
    errorCode: error.code,
    errorMessage: error.message,
    nativeErrorCode: error.nativeErrorCode,
  };

  if (error.paymentIntent) {
    meta.paymentIntentId = error.paymentIntent.id;
    meta.paymentIntentStatus = error.paymentIntent.status;
  }

  if (error.setupIntent) {
    meta.setupIntentId = error.setupIntent.id;
    meta.setupIntentStatus = error.setupIntent.status;
  }

  if (error.refund) {
    meta.refundId = error.refund.id;
    meta.refundStatus = error.refund.status;
  }

  if (error.apiError) {
    meta.apiErrorCode = error.apiError.code;
    meta.apiErrorMessage = error.apiError.message;
    meta.apiErrorDeclineCode = error.apiError.declineCode;
    meta.apiErrorType = error.apiError.type;
    meta.apiErrorParam = error.apiError.param;
    meta.apiErrorDocUrl = error.apiError.docUrl;
    meta.apiErrorChargeId = error.apiError.charge;
  }

  if (error.underlyingError) {
    meta.underlyingErrorCode = error.underlyingError.code;
    meta.underlyingErrorMessage = error.underlyingError.message;
    meta.underlyingErrorIosDomain = error.underlyingError.iosDomain;
    meta.underlyingErrorIosFailureReason = error.underlyingError.iosLocalizedFailureReason;
    meta.underlyingErrorIosRecoverySuggestion = error.underlyingError.iosLocalizedRecoverySuggestion;
  }

  const platformMetadata = error.metadata;
  if (platformMetadata && Object.keys(platformMetadata).length > 0) {
    for (const [key, value] of Object.entries(platformMetadata)) {
      meta[`meta.${key}`] = stringifyValue(value);
    }
  }

  return meta;
}

/**
 * Formats a StripeError for user-facing Alert / Toast display.
 * Title is always error.code; operationName is included in the message body.
 */
export function formatErrorAlert(
  error: StripeError,
  operationName?: string
): { title: string; message: string } {
  const title = error.code;

  const parts: string[] = [];
  const operation = operationName ?? 'Unknown operation';
  parts.push(`${operation}: ${error.message}`);

  if (error.apiError?.declineCode) {
    parts.push(`Decline code: ${error.apiError.declineCode}`);
  }

  if (error.paymentIntent) {
    parts.push(`PaymentIntent: ${error.paymentIntent.id}`);
  }

  if (error.setupIntent) {
    parts.push(`SetupIntent: ${error.setupIntent.id}`);
  }

  if (error.refund) {
    parts.push(`Refund: ${error.refund.id}`);
  }

  return { title, message: parts.join('\n') };
}
