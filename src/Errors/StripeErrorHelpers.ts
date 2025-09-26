import type { StripeError } from '../types/StripeError';
import type { ErrorCode } from './ErrorCodes';

export function isStripeError(e: unknown): e is StripeError {
  return (
    !!e &&
    typeof e === 'object' &&
    (e as any).name === 'StripeError' &&
    typeof (e as any).message === 'string' &&
    typeof (e as any).code === 'string' &&
    typeof (e as any).nativeErrorCode === 'string' &&
    typeof (e as any).metadata === 'object'
  );
}

export function createStripeError(
  init: Omit<StripeError, 'name' | 'stack' | 'nativeErrorCode' | 'metadata'> & {
    nativeErrorCode?: string;
    metadata?: Record<string, unknown>;
  }
): StripeError {
  const err = new Error(init.message, { cause: (init as any).cause }) as StripeError;
  err.name = 'StripeError';
  const nativeErrorCode = init.nativeErrorCode ?? (init as any).code;
  const metadata = init.metadata ?? {};
  Object.assign(err, { ...init, nativeErrorCode, metadata });
  return err;
}

export function normalizeNativeError(raw: any): StripeError {
  const codeStr = raw?.code ?? raw?.userInfo?.code ?? 'UNKNOWN';
  const nativeErrorCode = raw?.userInfo?.nativeErrorCode ?? codeStr;
  const metadata = (raw?.metadata ?? raw?.userInfo?.metadata ?? {}) as Record<string, unknown>;
  const paymentIntent = raw?.userInfo?.paymentIntent;
  const setupIntent = raw?.userInfo?.setupIntent;

  const message = raw?.message ?? codeStr;
  return createStripeError({
    code: codeStr as ErrorCode,
    nativeErrorCode,
    message,
    metadata,
    paymentIntent,
    setupIntent,
  });
}
