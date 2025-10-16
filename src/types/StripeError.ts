import type { ErrorCode } from '../Errors/ErrorCodes';
import type { PaymentIntent } from '../types/PaymentIntent';
import type { SetupIntent } from '../types/SetupIntent';

export interface StripeError extends Error {
  name: 'StripeError';
  message: string;
  code: ErrorCode;
  nativeErrorCode: string;
  metadata: Record<string, unknown>;
  paymentIntent?: PaymentIntent.Type;
  setupIntent?: SetupIntent.Type;
}
