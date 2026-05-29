/**
 * @module StripeErrorHelpers
 *
 * Internal utilities for creating and converting StripeError objects.
 *
 * Security: Only `rehydrateBridgeError` can set sensitive fields
 * (paymentIntent, setupIntent, refund, apiError) from trusted native sources.
 *
 * @internal
 */

import type { StripeError } from '../types/StripeError';
import { ErrorCode } from './ErrorCodes';

const VALID_ERROR_CODES = new Set<string>(Object.values(ErrorCode));

/** Extracts non-empty string or returns fallback */
function getStringOrFallback(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : fallback;
}

/** Extracts metadata from error object */
function extractMetadata(obj: Record<string, unknown>): Record<string, unknown> {
  const rawMetadata = obj.metadata;
  return rawMetadata && typeof rawMetadata === 'object' && rawMetadata !== null
    ? (rawMetadata as Record<string, unknown>)
    : {};
}

function isValidErrorCode(code: string): code is ErrorCode {
  return VALID_ERROR_CODES.has(code);
}

function warnInvalidErrorCode(code: string): void {
  if (process.env.NODE_ENV === 'development' && !isValidErrorCode(code)) {
    console.warn(
      `Invalid error code: ${code}. Consider using a valid ErrorCode enum value.`
    );
  }
}

function preserveUnexpectedErrorInfo(
  error: StripeError,
  obj: Record<string, unknown>
): void {
  if (error.underlyingError) return;

  const sourceCode = obj.code;
  const hasRecognizedCode =
    typeof sourceCode === 'string' && isValidErrorCode(sourceCode);

  if (!hasRecognizedCode) {
    error.underlyingError = {
      code: obj.name ? String(obj.name) : error.code,
      message: error.message,
    };
  }
}

/**
 * Runtime type guard to check if an object is a StripeError
 */
export function checkIfObjectIsStripeError(e: unknown): e is StripeError {
  if (!e || typeof e !== 'object') {
    return false;
  }

  const obj = e as Record<string, unknown>;
  return (
    obj.name === 'StripeError' &&
    typeof obj.message === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.nativeErrorCode === 'string' &&
    typeof obj.metadata === 'object' &&
    obj.metadata !== null
  );
}

/**
 * Creates a StripeError for internal SDK use only.
 *
 * Security: Cannot set sensitive fields (paymentIntent, setupIntent, refund, etc).
 * Use `rehydrateBridgeError` to populate those from native bridge data.
 *
 * @internal
 */
export function createStripeError(
  init: Omit<
    StripeError,
    | 'name'
    | 'stack'
    | 'nativeErrorCode'
    | 'metadata'
    | 'paymentIntent'
    | 'setupIntent'
    | 'refund'
    | 'apiError'
    | 'underlyingError'
  > & {
    nativeErrorCode?: string;
    metadata?: Record<string, unknown>;
  }
): StripeError {
  warnInvalidErrorCode(init.code);

  const err = new Error(init.message || ErrorCode.UNEXPECTED_SDK_ERROR);

  // Explicitly construct StripeError object using Object.assign
  // This is safer than type assertion and makes the intent clear
  const stripeError: StripeError = Object.assign(err, {
    name: 'StripeError' as const,
    code: init.code,
    nativeErrorCode: init.nativeErrorCode ?? init.code,
    metadata: init.metadata ?? {},
  });

  return stripeError;
}

/**
 * Rehydrates a plain object from the React Native bridge into a proper
 * StripeError instance (with Error.prototype in its prototype chain).
 *
 * The RN bridge serializes native errors (iOS NSDictionary / Android WritableMap)
 * into plain JS objects, losing the Error prototype. This function reconstructs
 * a real Error instance so that `error instanceof Error` returns true.
 *
 * Both iOS and Android produce a flat dictionary — no userInfo wrapper.
 * Only this function can populate sensitive fields (paymentIntent, setupIntent, etc.)
 * from bridge data.
 *
 * @internal
 */
export function rehydrateBridgeError(raw: unknown): StripeError {
  if (!raw || typeof raw !== 'object') {
    return createStripeError({
      code: ErrorCode.UNEXPECTED_SDK_ERROR,
      message: ErrorCode.UNEXPECTED_SDK_ERROR,
    });
  }

  const obj = raw as Record<string, unknown>;

  const code = getStringOrFallback(obj.code, ErrorCode.UNEXPECTED_SDK_ERROR);
  const nativeErrorCode = getStringOrFallback(obj.nativeErrorCode, code);
  const message = getStringOrFallback(obj.message, code);
  const metadata = extractMetadata(obj);

  // Don't validate code - it may be from a newer SDK version not in our enum
  const error = createStripeError({
    code: code as ErrorCode,
    nativeErrorCode,
    message,
    metadata,
  });

  if (obj.paymentIntent) {
    error.paymentIntent = obj.paymentIntent as StripeError['paymentIntent'];
  }
  if (obj.setupIntent) {
    error.setupIntent = obj.setupIntent as StripeError['setupIntent'];
  }
  if (obj.refund) {
    error.refund = obj.refund as StripeError['refund'];
  }
  if (obj.apiError) {
    error.apiError = obj.apiError as StripeError['apiError'];
  }
  if (obj.underlyingError) {
    error.underlyingError = obj.underlyingError as StripeError['underlyingError'];
  }

  preserveUnexpectedErrorInfo(error, obj);

  return error;
}
