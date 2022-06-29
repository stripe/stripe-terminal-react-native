import * as StripeTerminal from '../index';

jest.mock(
  '../../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter'
);

describe('index.ts', () => {
  describe('Public API snapshot', () => {
    it('ensure there are no unexpected changes to our public exports', () => {
      expect(StripeTerminal).toMatchSnapshot();
    });
  });
});
