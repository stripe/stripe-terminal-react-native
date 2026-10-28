import type { StripeError } from '../types/StripeError';

export type ErrorSource = 'rn' | 'native';

/** Keeps error provenance separate from the public error object. @internal */
export class InternalStripeError {
  constructor(
    readonly stripeError: StripeError,
    readonly errorSource: ErrorSource
  ) {}
}
