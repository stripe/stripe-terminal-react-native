import {
  checkIfObjectIsStripeError,
  createStripeError,
  rehydrateBridgeError,
} from '../StripeErrorHelpers';
import { ErrorCode } from '../ErrorCodes';

describe('StripeErrorHelpers', () => {
  describe('checkIfObjectIsStripeError', () => {
    it('should return true for valid StripeError object', () => {
      // GIVEN a valid StripeError-like object
      const validStripeError = {
        name: 'StripeError',
        message: 'Payment failed',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: '4000',
        metadata: { declineCode: 'generic_decline' },
      };

      // WHEN checking if it's a StripeError
      const result = checkIfObjectIsStripeError(validStripeError);

      // THEN it should return true
      expect(result).toBe(true);
    });

    it('should return false for null or undefined', () => {
      // GIVEN null and undefined values
      // WHEN checking if they are StripeErrors
      // THEN they should return false
      expect(checkIfObjectIsStripeError(null)).toBe(false);
      expect(checkIfObjectIsStripeError(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      // GIVEN primitive values
      // WHEN checking if they are StripeErrors
      // THEN they should return false
      expect(checkIfObjectIsStripeError('string')).toBe(false);
      expect(checkIfObjectIsStripeError(123)).toBe(false);
      expect(checkIfObjectIsStripeError(true)).toBe(false);
    });

    it('should return false for objects missing required properties', () => {
      // GIVEN objects missing required properties
      const missingName = {
        message: 'Error',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: '4000',
        metadata: {},
      };
      const missingMessage = {
        name: 'StripeError',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: '4000',
        metadata: {},
      };
      const missingCode = {
        name: 'StripeError',
        message: 'Error',
        nativeErrorCode: '4000',
        metadata: {},
      };
      const missingNativeErrorCode = {
        name: 'StripeError',
        message: 'Error',
        code: 'DECLINED_BY_STRIPE_API',
        metadata: {},
      };
      const missingMetadata = {
        name: 'StripeError',
        message: 'Error',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: '4000',
      };

      // WHEN checking if they are StripeErrors
      // THEN they should return false
      expect(checkIfObjectIsStripeError(missingName)).toBe(false);
      expect(checkIfObjectIsStripeError(missingMessage)).toBe(false);
      expect(checkIfObjectIsStripeError(missingCode)).toBe(false);
      expect(checkIfObjectIsStripeError(missingNativeErrorCode)).toBe(false);
      expect(checkIfObjectIsStripeError(missingMetadata)).toBe(false);
    });

    it('should return false for objects with wrong property types', () => {
      // GIVEN objects with incorrect property types
      const wrongNameType = {
        name: 123,
        message: 'Error',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: '4000',
        metadata: {},
      };
      const wrongMessageType = {
        name: 'StripeError',
        message: 123,
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: '4000',
        metadata: {},
      };
      const wrongCodeType = {
        name: 'StripeError',
        message: 'Error',
        code: 123,
        nativeErrorCode: '4000',
        metadata: {},
      };
      const wrongNativeErrorCodeType = {
        name: 'StripeError',
        message: 'Error',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: 123,
        metadata: {},
      };
      const wrongMetadataType = {
        name: 'StripeError',
        message: 'Error',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: '4000',
        metadata: 'not-an-object',
      };

      // WHEN checking if they are StripeErrors
      // THEN they should return false
      expect(checkIfObjectIsStripeError(wrongNameType)).toBe(false);
      expect(checkIfObjectIsStripeError(wrongMessageType)).toBe(false);
      expect(checkIfObjectIsStripeError(wrongCodeType)).toBe(false);
      expect(checkIfObjectIsStripeError(wrongNativeErrorCodeType)).toBe(false);
      expect(checkIfObjectIsStripeError(wrongMetadataType)).toBe(false);
    });

    it('should return false for wrong name value', () => {
      // GIVEN an object with wrong name value
      const wrongName = {
        name: 'NotStripeError',
        message: 'Error',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: '4000',
        metadata: {},
      };

      // WHEN checking if it's a StripeError
      const result = checkIfObjectIsStripeError(wrongName);

      // THEN it should return false
      expect(result).toBe(false);
    });
  });

  describe('createStripeError', () => {
    it('should create StripeError with all required properties', () => {
      // GIVEN error creation parameters
      const init = {
        code: ErrorCode.DECLINED_BY_STRIPE_API,
        message: 'Payment was declined',
        nativeErrorCode: '4000',
        metadata: { declineCode: 'generic_decline' },
      };

      // WHEN creating a StripeError
      const error = createStripeError(init);

      // THEN it should have all required properties
      expect(error.name).toBe('StripeError');
      expect(error.message).toBe('Payment was declined');
      expect(error.code).toBe(ErrorCode.DECLINED_BY_STRIPE_API);
      expect(error.nativeErrorCode).toBe('4000');
      expect(error.metadata).toEqual({ declineCode: 'generic_decline' });
      expect(error).toBeInstanceOf(Error);
    });

    it('should use code as nativeErrorCode when not provided', () => {
      // GIVEN parameters without nativeErrorCode
      const init = {
        code: ErrorCode.READER_BUSY,
        message: 'Reader is busy',
      };

      // WHEN creating a StripeError
      const error = createStripeError(init);

      // THEN nativeErrorCode should default to code
      expect(error.nativeErrorCode).toBe(ErrorCode.READER_BUSY);
    });

    it('should use empty object as metadata when not provided', () => {
      // GIVEN parameters without metadata
      const init = {
        code: ErrorCode.READER_BUSY,
        message: 'Reader is busy',
      };

      // WHEN creating a StripeError
      const error = createStripeError(init);

      // THEN metadata should default to empty object
      expect(error.metadata).toEqual({});
    });

    it('should NOT include paymentIntent or setupIntent (security restriction)', () => {
      // GIVEN basic error parameters
      const init = {
        code: ErrorCode.DECLINED_BY_STRIPE_API,
        message: 'Payment failed',
      };

      // WHEN creating a StripeError
      const error = createStripeError(init);

      // THEN sensitive fields should be undefined
      expect(error.paymentIntent).toBeUndefined();
      expect(error.setupIntent).toBeUndefined();
    });
  });

  describe('rehydrateBridgeError', () => {
    it('should normalize Android error structure', () => {
      // GIVEN the flat structure Android produces via mapToStripeErrorObject
      const rawAndroidError = {
        name: 'StripeError',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: 'STRIPE_API_ERROR',
        message: 'Payment was declined',
        metadata: {},
        apiError: {
          code: 'card_declined',
          message: 'Your card was declined.',
          declineCode: 'generic_decline',
        },
      };

      // WHEN normalizing the error
      const normalizedError = rehydrateBridgeError(rawAndroidError);

      // THEN it should create a proper StripeError with apiError populated
      expect(normalizedError.name).toBe('StripeError');
      expect(normalizedError.code).toBe('DECLINED_BY_STRIPE_API');
      expect(normalizedError.message).toBe('Payment was declined');
      expect(normalizedError.nativeErrorCode).toBe('STRIPE_API_ERROR');
      expect(normalizedError.metadata).toEqual({});
      expect(normalizedError.apiError).toEqual({
        code: 'card_declined',
        message: 'Your card was declined.',
        declineCode: 'generic_decline',
      });
    });

    it('should populate all ApiErrorInformation fields including v5.4.0 additions', () => {
      // GIVEN a flat bridge error with all apiError fields (Android/iOS resolved-value path)
      const rawError = {
        name: 'StripeError',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: 'STRIPE_API_ERROR',
        message: 'Card declined',
        metadata: {},
        apiError: {
          code: 'card_declined',
          message: 'Your card was declined.',
          declineCode: 'generic_decline',
          type: 'card_error',
          charge: 'ch_abc',
          docUrl: 'https://stripe.com/docs/error-codes/card-declined',
          param: 'number',
          requestLogUrl: 'https://dashboard.stripe.com/logs/req_123',
          adviceCode: '01',
          networkAdviceCode: 'Z1',
          networkDeclineCode: '05',
        },
      };

      // WHEN normalizing
      const normalizedError = rehydrateBridgeError(rawError);

      // THEN all apiError fields should be accessible on StripeError.apiError
      expect(normalizedError.apiError).toEqual({
        code: 'card_declined',
        message: 'Your card was declined.',
        declineCode: 'generic_decline',
        type: 'card_error',
        charge: 'ch_abc',
        docUrl: 'https://stripe.com/docs/error-codes/card-declined',
        param: 'number',
        requestLogUrl: 'https://dashboard.stripe.com/logs/req_123',
        adviceCode: '01',
        networkAdviceCode: 'Z1',
        networkDeclineCode: '05',
      });
    });

    it('should normalize iOS error structure', () => {
      // GIVEN the flat structure iOS produces via mapToStripeErrorObject
      const rawIOSError = {
        name: 'StripeError',
        code: 'BLUETOOTH_ERROR',
        nativeErrorCode: '1200',
        message: 'Bluetooth connection failed',
        metadata: {
          domain: 'com.stripe-terminal',
          isStripeError: true,
        },
        paymentIntent: { id: 'pi_test' },
      };

      // WHEN normalizing the error
      const normalizedError = rehydrateBridgeError(rawIOSError);

      // THEN it should create a proper StripeError
      expect(normalizedError.name).toBe('StripeError');
      expect(normalizedError.code).toBe('BLUETOOTH_ERROR');
      expect(normalizedError.message).toBe('Bluetooth connection failed');
      expect(normalizedError.nativeErrorCode).toBe('1200');
      expect(normalizedError.metadata).toEqual({
        domain: 'com.stripe-terminal',
        isStripeError: true,
      });
      expect(normalizedError.paymentIntent).toEqual({ id: 'pi_test' });
    });

    it('should handle missing properties with fallbacks', () => {
      // GIVEN error with missing properties
      const rawError = {};

      // WHEN normalizing the error
      const normalizedError = rehydrateBridgeError(rawError);

      // THEN it should use fallback values
      expect(normalizedError.name).toBe('StripeError');
      expect(normalizedError.code).toBe('UNEXPECTED_SDK_ERROR');
      expect(normalizedError.message).toBe('UNEXPECTED_SDK_ERROR');
      expect(normalizedError.nativeErrorCode).toBe('UNEXPECTED_SDK_ERROR');
      expect(normalizedError.metadata).toEqual({});
      expect(normalizedError.paymentIntent).toBeUndefined();
      expect(normalizedError.setupIntent).toBeUndefined();
    });

    it('should use code as fallback for nativeErrorCode', () => {
      // GIVEN error without nativeErrorCode
      const rawError = {
        code: 'READER_BUSY',
        message: 'Reader is busy',
      };

      // WHEN normalizing the error
      const normalizedError = rehydrateBridgeError(rawError);

      // THEN nativeErrorCode should fallback to code
      expect(normalizedError.nativeErrorCode).toBe('READER_BUSY');
    });

    it('should use code as fallback for message', () => {
      // GIVEN error without message
      const rawError = {
        code: 'READER_BUSY',
      };

      // WHEN normalizing the error
      const normalizedError = rehydrateBridgeError(rawError);

      // THEN message should fallback to code
      expect(normalizedError.message).toBe('READER_BUSY');
    });

    it('should handle setupIntent from flat bridge object', () => {
      // GIVEN a flat bridge error with setupIntent at top level
      const rawError = {
        name: 'StripeError',
        code: 'COLLECT_INPUTS_TIMED_OUT',
        nativeErrorCode: 'COLLECT_INPUTS_TIMED_OUT',
        message: 'Setup intent collection timed out',
        metadata: {},
        setupIntent: { id: 'seti_test' },
      };

      // WHEN normalizing the error
      const normalizedError = rehydrateBridgeError(rawError);

      // THEN setupIntent should be included
      expect(normalizedError.setupIntent).toEqual({ id: 'seti_test' });
    });

    it('should handle null or undefined raw error', () => {
      // GIVEN null and undefined values
      // WHEN normalizing them
      const nullResult = rehydrateBridgeError(null);
      const undefinedResult = rehydrateBridgeError(undefined);

      // THEN they should use fallback values
      expect(nullResult.code).toBe('UNEXPECTED_SDK_ERROR');
      expect(nullResult.message).toBe('UNEXPECTED_SDK_ERROR');
      expect(nullResult.nativeErrorCode).toBe('UNEXPECTED_SDK_ERROR');
      expect(nullResult.metadata).toEqual({});

      expect(undefinedResult.code).toBe('UNEXPECTED_SDK_ERROR');
      expect(undefinedResult.message).toBe('UNEXPECTED_SDK_ERROR');
      expect(undefinedResult.nativeErrorCode).toBe('UNEXPECTED_SDK_ERROR');
      expect(undefinedResult.metadata).toEqual({});
    });

    it('should handle complex nested metadata', () => {
      // GIVEN error with complex nested metadata
      const rawError = {
        code: 'STRIPE_API_ERROR',
        message: 'API error occurred',
        metadata: {
          apiError: {
            code: 'rate_limit',
            message: 'Too many requests',
            param: 'amount',
          },
          underlyingError: {
            code: 'NetworkError',
            message: 'Connection timeout',
          },
        },
      };

      // WHEN normalizing the error
      const normalizedError = rehydrateBridgeError(rawError);

      // THEN complex metadata should be preserved
      expect(normalizedError.metadata).toEqual({
        apiError: {
          code: 'rate_limit',
          message: 'Too many requests',
          param: 'amount',
        },
        underlyingError: {
          code: 'NetworkError',
          message: 'Connection timeout',
        },
      });
    });

    it('should preserve unexpected error info in underlyingError when code is invalid', () => {
      const bridgeError = {
        name: 'TypeError',
        code: 'EUNSPECIFIED',
        message: 'Network request failed',
      };

      const normalizedError = rehydrateBridgeError(bridgeError);

      expect(normalizedError).toBeInstanceOf(Error);
      expect(normalizedError.code).toBe('EUNSPECIFIED');
      expect(normalizedError.message).toBe('Network request failed');
      expect(normalizedError.underlyingError).toEqual({
        code: 'TypeError',
        message: 'Network request failed',
      });
    });

    it('should not overwrite native SDK underlyingError with bridge error info', () => {
      // GIVEN a flat bridge error where native already provided underlyingError
      const rawError = {
        code: 'SOME_UNKNOWN_CODE',
        message: 'Something went wrong',
        underlyingError: {
          code: 'NativeNetworkError',
          message: 'DNS resolution failed',
        },
      };

      const normalizedError = rehydrateBridgeError(rawError);

      // THEN native underlyingError is preserved; preserveUnexpectedErrorInfo does not overwrite it
      expect(normalizedError.underlyingError).toEqual({
        code: 'NativeNetworkError',
        message: 'DNS resolution failed',
      });
    });

    it('should handle refund from flat bridge object', () => {
      const rawError = {
        name: 'StripeError',
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: 'STRIPE_API_ERROR',
        message: 'Refund failed',
        metadata: {},
        refund: { id: 're_test', amount: 500, status: 'failed' },
      };

      const normalizedError = rehydrateBridgeError(rawError);

      expect(normalizedError.refund).toEqual({
        id: 're_test',
        amount: 500,
        status: 'failed',
      });
    });

    it('should return an instance of Error', () => {
      const rawError = {
        code: 'CANCELED',
        message: 'The operation was canceled.',
      };

      const normalizedError = rehydrateBridgeError(rawError);

      expect(normalizedError).toBeInstanceOf(Error);
    });

    it('should not add underlyingError for valid ErrorCode', () => {
      const rawError = {
        code: 'CANCELED',
        message: 'The operation was canceled.',
      };

      const normalizedError = rehydrateBridgeError(rawError);

      expect(normalizedError.code).toBe('CANCELED');
      expect(normalizedError.underlyingError).toBeUndefined();
    });
  });
});
