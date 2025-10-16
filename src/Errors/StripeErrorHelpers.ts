import type { StripeError } from '../types/StripeError';
import { ErrorCode } from './ErrorCodes';

function warnInvalidErrorCode(code: string): void {
  if (
    process.env.NODE_ENV === 'development' &&
    !Object.values(ErrorCode).includes(code as any)
  ) {
    console.warn(
      `Invalid error code: ${code}. Consider using a valid ErrorCode enum value.`
    );
  }
}

function extractUserInfo(
  obj: Record<string, unknown>
): Record<string, unknown> | undefined {
  return obj.userInfo &&
    typeof obj.userInfo === 'object' &&
    obj.userInfo !== null
    ? (obj.userInfo as Record<string, unknown>)
    : undefined;
}

function extractMetadata(
  obj: Record<string, unknown>,
  userInfo?: Record<string, unknown>
): Record<string, unknown> {
  const rawMetadata = obj.metadata ?? userInfo?.metadata;
  return rawMetadata && typeof rawMetadata === 'object' && rawMetadata !== null
    ? (rawMetadata as Record<string, unknown>)
    : {};
}

function createUnknownError(): StripeError {
  return createStripeError({
    code: ErrorCode.UNEXPECTED_SDK_ERROR,
    nativeErrorCode: ErrorCode.UNEXPECTED_SDK_ERROR,
    message: ErrorCode.UNEXPECTED_SDK_ERROR,
    metadata: {},
  });
}

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

export function createStripeError(
  init: Omit<StripeError, 'name' | 'stack' | 'nativeErrorCode' | 'metadata'> & {
    nativeErrorCode?: string;
    metadata?: Record<string, unknown>;
  }
): StripeError {
  warnInvalidErrorCode(init.code);

  const err = new Error(
    init.message || ErrorCode.UNEXPECTED_SDK_ERROR
  ) as StripeError;
  err.name = 'StripeError';
  err.code = init.code;
  err.nativeErrorCode = init.nativeErrorCode ?? init.code;
  err.metadata = init.metadata ?? {};

  if (init.paymentIntent) {
    err.paymentIntent = init.paymentIntent;
  }
  if (init.setupIntent) {
    err.setupIntent = init.setupIntent;
  }

  return err;
}

/**
 * Converts native platform error objects to standardized StripeError format.
 * Handles both iOS (userInfo structure) and Android (direct properties) error formats.
 */
export function convertNativeErrorToStripeError(raw: unknown): StripeError {
  if (!raw || typeof raw !== 'object') {
    return createUnknownError();
  }

  const obj = raw as Record<string, unknown>;
  const userInfo = extractUserInfo(obj);

  const code =
    (obj.code as string) ??
    (userInfo?.code as string) ??
    ErrorCode.UNEXPECTED_SDK_ERROR;
  const nativeErrorCode = (userInfo?.nativeErrorCode as string) ?? code;
  const message = (obj.message as string) ?? code;
  const metadata = extractMetadata(obj, userInfo);

  return createStripeError({
    code: code as any,
    nativeErrorCode,
    message,
    metadata,
    paymentIntent: userInfo?.paymentIntent as StripeError['paymentIntent'],
    setupIntent: userInfo?.setupIntent as StripeError['setupIntent'],
  });
}
