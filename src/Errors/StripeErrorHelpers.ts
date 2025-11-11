/**
 * @module StripeErrorHelpers
 *
 * Internal utilities for creating and converting StripeError objects.
 *
 * Security: Only `convertNativeErrorToStripeError` can set sensitive fields
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

/** Extracts userInfo from iOS native error objects */
function extractUserInfo(
  obj: Record<string, unknown>
): Record<string, unknown> | undefined {
  return obj.userInfo &&
    typeof obj.userInfo === 'object' &&
    obj.userInfo !== null
    ? (obj.userInfo as Record<string, unknown>)
    : undefined;
}

/** Extracts metadata from error object or userInfo */
function extractMetadata(
  obj: Record<string, unknown>,
  userInfo?: Record<string, unknown>
): Record<string, unknown> {
  const rawMetadata = obj.metadata ?? userInfo?.metadata;
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
 * Use `convertNativeErrorToStripeError` to populate those from native sources.
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
 * Converts native platform errors to standardized StripeError format.
 *
 * Handles both iOS (userInfo) and Android (direct properties) error formats.
 * Only this function can populate sensitive fields from trusted native sources.
 *
 * @internal
 */
export function convertNativeErrorToStripeError(raw: unknown): StripeError {
  if (!raw || typeof raw !== 'object') {
    return createStripeError({
      code: ErrorCode.UNEXPECTED_SDK_ERROR,
      message: ErrorCode.UNEXPECTED_SDK_ERROR,
    });
  }

  const obj = raw as Record<string, unknown>;
  const userInfo = extractUserInfo(obj);

  const code = getStringOrFallback(
    obj.code ?? userInfo?.code,
    ErrorCode.UNEXPECTED_SDK_ERROR
  );
  const nativeErrorCode = getStringOrFallback(userInfo?.nativeErrorCode, code);
  const message = getStringOrFallback(obj.message, code);
  const metadata = extractMetadata(obj, userInfo);

  // Don't validate code - it may be from a newer SDK version not in our enum
  const error = createStripeError({
    code: code as ErrorCode,
    nativeErrorCode,
    message,
    metadata,
  });

  // Only native SDK errors can populate sensitive fields
  if (userInfo?.paymentIntent) {
    error.paymentIntent =
      userInfo.paymentIntent as StripeError['paymentIntent'];
  }
  if (userInfo?.setupIntent) {
    error.setupIntent = userInfo.setupIntent as StripeError['setupIntent'];
  }
  if (userInfo?.refund) {
    error.refund = userInfo.refund as StripeError['refund'];
  }
  if (userInfo?.apiError) {
    error.apiError = userInfo.apiError as StripeError['apiError'];
  }
  if (userInfo?.underlyingError) {
    error.underlyingError =
      userInfo.underlyingError as StripeError['underlyingError'];
  }

  return error;
}
