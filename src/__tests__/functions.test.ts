import * as functions from '../functions';

jest.mock('../logger', () => ({
  traceSdkMethod: jest.fn(),
}));

jest.mock('../StripeTerminalSdk', () => ({
  setConnectionToken: jest.fn().mockReturnValue('_token'),
  discoverReaders: jest.fn().mockReturnValue({}),
}));

describe('functions.test.ts', () => {
  describe('Functions snapshot', () => {
    it('ensure there are no unexpected changes to the functions exports', () => {
      expect(functions).toMatchSnapshot();
    });
  });

  describe('Functions results', () => {
    it('setConnectionToken returns a proper value', async () => {
      await expect(functions.setConnectionToken()).resolves.toEqual(undefined);
    });

    it('discoverReaders returns a proper value', async () => {
      await expect(functions.discoverReaders({} as any)).resolves.toEqual({
        error: undefined,
      });
    });
  });
});
