/**
 * ExampleAppError - Custom error class for example-app specific errors
 *
 * This error class is used for errors that occur in the example-app layer,
 * such as API communication errors, validation errors, etc.
 *
 * DO NOT use this to create StripeErrors - those should only come from the SDK.
 */
export class ExampleAppError extends Error {
  public readonly context?: Record<string, unknown>;
  public readonly step?: string;

  constructor(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      step?: string;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'ExampleAppError';
    this.context = options?.context;
    this.step = options?.step;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExampleAppError);
    }

    // Set the cause if provided (ES2022 feature)
    if (options?.cause) {
      (this as any).cause = options.cause;
    }
  }

  /**
   * Convert the error to a JSON-serializable object for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      step: this.step,
      context: this.context,
      stack: this.stack,
    };
  }
}

