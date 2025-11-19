/**
 * DevAppError - Unified error class for dev-app
 *
 * Provides a consistent error structure for both SDK errors and app-layer errors.
 *
 * Fields:
 * - code: Error code (e.g., 'READER_BUSY', 'NO_CLIENT_SECRET')
 * - message: Human-readable error message
 * - nativeErrorCode: Platform-specific error code (iOS/Android, optional)
 * - paymentIntent: Stringified PaymentIntent (if relevant to error)
 * - setupIntent: Stringified SetupIntent (if relevant to error)
 * - refund: Stringified Refund (if relevant to error)
 * - context: Additional context data (optional)
 */

import type { StripeError } from '@stripe/stripe-terminal-react-native';

export class DevAppError extends Error {
  public readonly code: string;
  public readonly nativeErrorCode?: string;
  public readonly paymentIntent?: string;
  public readonly setupIntent?: string;
  public readonly refund?: string;
  public readonly context?: string;

  constructor(
    code: string,
    message: string,
    options?: {
      nativeErrorCode?: string;
      paymentIntent?: string;
      setupIntent?: string;
      refund?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'DevAppError';
    this.code = code;
    this.nativeErrorCode = options?.nativeErrorCode;
    this.paymentIntent = options?.paymentIntent;
    this.setupIntent = options?.setupIntent;
    this.refund = options?.refund;
    this.context = options?.context
      ? JSON.stringify(options.context)
      : undefined;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DevAppError);
    }

    if (options?.cause) {
      (this as any).cause = options.cause;
    }
  }

  /**
   * Convert to JSON for logging
   * Returns formatted metadata ready for addLogs
   */
  toJSON(): Record<string, string | null | undefined> {
    return {
      errorCode: this.code,
      errorMessage: this.message,
      nativeErrorCode: this.nativeErrorCode ?? undefined,
      pi: this.paymentIntent ?? undefined,
      si: this.setupIntent ?? undefined,
      refund: this.refund ?? undefined,
      errorContext: this.context ?? undefined,
    };
  }

  /**
   * Create DevAppError from StripeError
   *
   * Converts SDK errors to dev-app's unified error format.
   * Automatically extracts and stringifies PaymentIntent, SetupIntent, and Refund.
   *
   * @param error - StripeError from SDK
   * @param additionalContext - Optional additional context to include in logs
   */
  static fromStripeError(
    error: StripeError,
    additionalContext?: Record<string, unknown>
  ): DevAppError {
    const context: Record<string, unknown> = {};

    if (error.metadata && Object.keys(error.metadata).length > 0) {
      context.metadata = error.metadata;
    }

    if (additionalContext) {
      Object.assign(context, additionalContext);
    }

    return new DevAppError(
      error.code || 'UNKNOWN_SDK_ERROR',
      error.message || 'Unknown SDK error',
      {
        nativeErrorCode: error.nativeErrorCode,
        paymentIntent: error.paymentIntent
          ? JSON.stringify(error.paymentIntent, undefined, 2)
          : undefined,
        setupIntent: error.setupIntent
          ? JSON.stringify(error.setupIntent, undefined, 2)
          : undefined,
        refund: error.refund
          ? JSON.stringify(error.refund, undefined, 2)
          : undefined,
        context: Object.keys(context).length > 0 ? context : undefined,
        cause: error,
      }
    );
  }
}
