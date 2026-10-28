import { renderHook } from '@testing-library/react-native';

let mockAddListener: jest.Mock;
let capturedNativeCallback: (event: any) => void;

jest.mock(
  '../../../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter',
  () => {
    const remove = jest.fn();
    mockAddListener = jest.fn((_, cb) => {
      capturedNativeCallback = cb;
      return { remove };
    });

    class MockNativeEventEmitter {
      addListener = mockAddListener;
      removeAllListeners = jest.fn();
      removeSubscription = jest.fn();
    }
    return {
      __esModule: true,
      default: MockNativeEventEmitter,
    };
  }
);

import { useListener } from '../useListener';
import * as errorHelpers from '../../Errors/StripeErrorHelpers';
import Logger from '../../logger';

function emitNativeEvent(event: any) {
  capturedNativeCallback(event);
}

function expectPublicStripeError(error: any) {
  expect(error).toBeInstanceOf(Error);
  for (const field of ['error_source', 'errorSource', 'stripeError']) {
    expect(error).not.toHaveProperty(field);
    expect(Object.keys(error)).not.toContain(field);
    expect({ ...error }).not.toHaveProperty(field);
    expect(JSON.parse(JSON.stringify(error))).not.toHaveProperty(field);
  }
}

describe('useListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes non-object event through unchanged', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    emitNativeEvent('string_value');
    expect(callback).toHaveBeenCalledWith('string_value');

    emitNativeEvent(null);
    expect(callback).toHaveBeenCalledWith(null);

    emitNativeEvent(42);
    expect(callback).toHaveBeenCalledWith(42);
  });

  it('passes object event without error through unchanged', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    const event = { readers: [{ id: 'rdr_1' }] };
    emitNativeEvent(event);
    expect(callback).toHaveBeenCalledWith(event);
    expect(callback.mock.calls[0][0]).toBe(event);
    expect(Object.prototype.hasOwnProperty.call(event, 'error')).toBe(false);
  });

  it('starts the reader session before the reconnect callback', () => {
    const startReaderSession = jest.spyOn(Logger, 'startReaderSession');
    const callback = jest.fn();
    renderHook(() => useListener('READER_RECONNECT_SUCCEED', callback));

    const event = { reader: { serialNumber: 'CHB2012345' } };
    emitNativeEvent(event);

    expect(startReaderSession).toHaveBeenCalledTimes(1);
    expect(startReaderSession).toHaveBeenCalledWith('CHB2012345');
    expect(startReaderSession.mock.invocationCallOrder[0]).toBeLessThan(
      callback.mock.invocationCallOrder[0]
    );
    expect(callback).toHaveBeenCalledWith(event);
  });

  it.each(['READER_RECONNECT_FAIL', 'DISCONNECT'])(
    'ends the reader session before the %s callback',
    (eventName) => {
      const endReaderSession = jest.spyOn(Logger, 'endReaderSession');
      const callback = jest.fn();
      renderHook(() => useListener(eventName, callback));

      const event = { reason: 'unknown' };
      emitNativeEvent(event);

      expect(endReaderSession).toHaveBeenCalledTimes(1);
      expect(endReaderSession.mock.invocationCallOrder[0]).toBeLessThan(
        callback.mock.invocationCallOrder[0]
      );
      expect(callback).toHaveBeenCalledWith(event);
    }
  );

  it('rehydrates top-level error into StripeError instance', () => {
    const rehydrate = jest.spyOn(errorHelpers, 'rehydrateBridgeError');
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    emitNativeEvent({
      error: {
        code: 'CANCELED',
        nativeErrorCode: 'canceled',
        message: 'The operation was canceled.',
        metadata: {},
        error_source: 'native',
      },
    });

    const received = callback.mock.calls[0][0];
    expectPublicStripeError(received.error);
    expect(received.error.name).toBe('StripeError');
    expect(received.error.code).toBe('CANCELED');
    expect(received.error.message).toBe('The operation was canceled.');
    expect(rehydrate.mock.results[0].value.errorSource).toBe('native');
    expect(received.error).toBe(rehydrate.mock.results[0].value.stripeError);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('rehydrates nested result.error into StripeError instance', () => {
    const rehydrate = jest.spyOn(errorHelpers, 'rehydrateBridgeError');
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    emitNativeEvent({
      result: {
        error: {
          code: 'BLUETOOTH_ERROR',
          nativeErrorCode: '1200',
          message: 'Bluetooth connection failed',
          metadata: {},
          error_source: 'native',
        },
      },
    });

    const received = callback.mock.calls[0][0];
    expectPublicStripeError(received.result.error);
    expect(received.result.error.name).toBe('StripeError');
    expect(received.result.error.code).toBe('BLUETOOTH_ERROR');
    expect(rehydrate.mock.results[0].value.errorSource).toBe('native');
    expect(received.result.error).toBe(
      rehydrate.mock.results[0].value.stripeError
    );
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not treat result array as nested error', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    const event = { result: ['option1', 'option2'] };
    emitNativeEvent(event);
    expect(callback).toHaveBeenCalledWith(event);
  });

  it('does not treat result without error as nested error', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    const event = { result: { update: { version: '2.0' } } };
    emitNativeEvent(event);
    expect(callback).toHaveBeenCalledWith(event);
    expect(callback.mock.calls[0][0]).toBe(event);
    expect(Object.prototype.hasOwnProperty.call(event.result, 'error')).toBe(
      false
    );
  });

  it('preserves sibling fields when rehydrating top-level error', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    emitNativeEvent({
      error: {
        code: 'CANCELED',
        message: 'Canceled',
        metadata: {},
        error_source: 'native',
      },
      someOtherField: 'preserved',
    });

    const received = callback.mock.calls[0][0];
    expectPublicStripeError(received.error);
    expect(received.someOtherField).toBe('preserved');
  });

  it('preserves sibling result fields when rehydrating nested error', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    emitNativeEvent({
      result: {
        error: {
          code: 'CANCELED',
          message: 'Canceled',
          metadata: {},
          error_source: 'native',
        },
        update: { version: '2.0' },
      },
      topLevel: 'also preserved',
    });

    const received = callback.mock.calls[0][0];
    expectPublicStripeError(received.result.error);
    expect(received.result.update).toEqual({ version: '2.0' });
    expect(received.topLevel).toBe('also preserved');
  });

  it('rehydrated error includes apiError when present', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    emitNativeEvent({
      error: {
        code: 'DECLINED_BY_STRIPE_API',
        nativeErrorCode: 'STRIPE_API_ERROR',
        message: 'Payment declined',
        metadata: {},
        error_source: 'native',
        apiError: {
          code: 'card_declined',
          message: 'Your card was declined.',
          declineCode: 'generic_decline',
          localizationResult: {
            requestedLocale: 'fr-FR',
            resolvedLocale: 'fr',
          },
        },
      },
    });

    const received = callback.mock.calls[0][0];
    expect(received.error.apiError).toEqual({
      code: 'card_declined',
      message: 'Your card was declined.',
      declineCode: 'generic_decline',
      localizationResult: {
        requestedLocale: 'fr-FR',
        resolvedLocale: 'fr',
      },
    });
  });

  it('removes listener on unmount', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useListener('TEST_EVENT', callback));

    const addListenerResult = mockAddListener.mock.results[0].value;
    unmount();
    expect(addListenerResult.remove).toHaveBeenCalled();
  });
});
