import * as functions from '../functions';

describe('functions.test.ts', () => {
  describe('Functions snapshot', () => {
    it('ensure there are no unexpected changes to the functions exports', () => {
      expect(functions).toMatchSnapshot();
    });
  });
});
