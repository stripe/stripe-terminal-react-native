import { b64EncodeUnicode, b64DecodeUnicode } from '../b64EncodeDecode';

describe('b64EncodeDecode.ts', () => {
  describe('Base64 encode/decode', () => {
    it('encodes unicode properly', () => {
      expect(b64EncodeUnicode('test-encode-1')).toEqual('dGVzdC1lbmNvZGUtMQ==');

      expect(b64EncodeUnicode('🍩 – doughnut')).toEqual(
        '8J+NqSDigJMgZG91Z2hudXQ='
      );

      expect(b64EncodeUnicode('🍫 – chocolate')).toEqual(
        '8J+NqyDigJMgY2hvY29sYXRl'
      );

      expect(b64EncodeUnicode('🍿 – popcorn')).toEqual(
        '8J+NvyDigJMgcG9wY29ybg=='
      );

      expect(b64EncodeUnicode('🍪 🥧 🍬 🍪')).toEqual(
        '8J+NqiDwn6WnIPCfjawg8J+Nqg=='
      );
    });

    it('decodes unicode properly', () => {
      expect(b64DecodeUnicode('dGVzdC1lbmNvZGUtMQ==')).toEqual('test-encode-1');

      expect(b64DecodeUnicode('8J+NqSDigJMgZG91Z2hudXQ=')).toEqual(
        '🍩 – doughnut'
      );

      expect(b64DecodeUnicode('8J+NqyDigJMgY2hvY29sYXRl')).toEqual(
        '🍫 – chocolate'
      );

      expect(b64DecodeUnicode('8J+NvyDigJMgcG9wY29ybg==')).toEqual(
        '🍿 – popcorn'
      );

      expect(b64DecodeUnicode('8J+NqiDwn6WnIPCfjawg8J+Nqg==')).toEqual(
        '🍪 🥧 🍬 🍪'
      );
    });
  });
});
