import { formatErrorAlert, extractFullErrorMetadata } from '../../util/errorUtils';
import type { StripeError } from '@stripe/stripe-terminal-react-native';

const baseError: StripeError = {
  code: 'STRIPE_API_ERROR',
  message: 'Something went wrong',
  nativeErrorCode: '100',
  name: 'StripeError',
  metadata: {},
};

describe('formatErrorAlert', () => {
  it('uses error.code as title', () => {
    const result = formatErrorAlert(baseError);
    expect(result.title).toBe('STRIPE_API_ERROR');
  });

  it('includes operation name and message in body', () => {
    const result = formatErrorAlert(baseError, 'CollectPayment');
    expect(result.message).toContain('CollectPayment');
    expect(result.message).toContain('Something went wrong');
  });

  it('defaults operation name to Unknown operation', () => {
    const result = formatErrorAlert(baseError);
    expect(result.message).toContain('Unknown operation');
  });

  it('appends decline code when present', () => {
    const error: StripeError = {
      ...baseError,
      apiError: { code: 'card_declined', message: 'Card declined', declineCode: 'insufficient_funds' },
    };
    const result = formatErrorAlert(error);
    expect(result.message).toContain('insufficient_funds');
  });

  it('appends paymentIntent id when present', () => {
    const error: StripeError = {
      ...baseError,
      paymentIntent: { id: 'pi_123', status: 'requires_payment_method' } as any,
    };
    const result = formatErrorAlert(error);
    expect(result.message).toContain('pi_123');
  });
});

describe('extractFullErrorMetadata', () => {
  it('includes base error fields', () => {
    const meta = extractFullErrorMetadata(baseError);
    expect(meta.errorCode).toBe('STRIPE_API_ERROR');
    expect(meta.errorMessage).toBe('Something went wrong');
    expect(meta.nativeErrorCode).toBe('100');
  });

  it('does not include paymentIntentId when not present', () => {
    const meta = extractFullErrorMetadata(baseError);
    expect(meta.paymentIntentId).toBeUndefined();
  });

  it('includes paymentIntent fields when present', () => {
    const error: StripeError = {
      ...baseError,
      paymentIntent: { id: 'pi_456', status: 'canceled' } as any,
    };
    const meta = extractFullErrorMetadata(error);
    expect(meta.paymentIntentId).toBe('pi_456');
    expect(meta.paymentIntentStatus).toBe('canceled');
  });

  it('includes apiError fields when present', () => {
    const error: StripeError = {
      ...baseError,
      apiError: {
        code: 'card_declined',
        message: 'Card was declined',
        declineCode: 'do_not_honor',
        type: 'card_error',
      },
    };
    const meta = extractFullErrorMetadata(error);
    expect(meta.apiErrorCode).toBe('card_declined');
    expect(meta.apiErrorDeclineCode).toBe('do_not_honor');
    expect(meta.apiErrorType).toBe('card_error');
  });

  it('flattens metadata entries with meta. prefix', () => {
    const error: StripeError = {
      ...baseError,
      metadata: { customKey: 'customValue', numericKey: 42 } as any,
    };
    const result = extractFullErrorMetadata(error);
    expect(result['meta.customKey']).toBe('customValue');
    expect(result['meta.numericKey']).toBe('42');
  });
});
