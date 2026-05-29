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

function emitNativeEvent(event: any) {
  capturedNativeCallback(event);
}

describe('useListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it('rehydrates top-level error into StripeError instance', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    emitNativeEvent({
      error: {
        code: 'CANCELED',
        nativeErrorCode: 'canceled',
        message: 'The operation was canceled.',
        metadata: {},
      },
    });

    const received = callback.mock.calls[0][0];
    expect(received.error).toBeInstanceOf(Error);
    expect(received.error.name).toBe('StripeError');
    expect(received.error.code).toBe('CANCELED');
    expect(received.error.message).toBe('The operation was canceled.');
  });

  it('rehydrates nested result.error into StripeError instance', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    emitNativeEvent({
      result: {
        error: {
          code: 'BLUETOOTH_ERROR',
          nativeErrorCode: '1200',
          message: 'Bluetooth connection failed',
          metadata: {},
        },
      },
    });

    const received = callback.mock.calls[0][0];
    expect(received.result.error).toBeInstanceOf(Error);
    expect(received.result.error.name).toBe('StripeError');
    expect(received.result.error.code).toBe('BLUETOOTH_ERROR');
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
  });

  it('preserves sibling fields when rehydrating top-level error', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    emitNativeEvent({
      error: { code: 'CANCELED', message: 'Canceled', metadata: {} },
      someOtherField: 'preserved',
    });

    const received = callback.mock.calls[0][0];
    expect(received.error).toBeInstanceOf(Error);
    expect(received.someOtherField).toBe('preserved');
  });

  it('preserves sibling result fields when rehydrating nested error', () => {
    const callback = jest.fn();
    renderHook(() => useListener('TEST_EVENT', callback));

    emitNativeEvent({
      result: {
        error: { code: 'CANCELED', message: 'Canceled', metadata: {} },
        update: { version: '2.0' },
      },
      topLevel: 'also preserved',
    });

    const received = callback.mock.calls[0][0];
    expect(received.result.error).toBeInstanceOf(Error);
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
        apiError: {
          code: 'card_declined',
          message: 'Your card was declined.',
          declineCode: 'generic_decline',
        },
      },
    });

    const received = callback.mock.calls[0][0];
    expect(received.error.apiError).toEqual({
      code: 'card_declined',
      message: 'Your card was declined.',
      declineCode: 'generic_decline',
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
