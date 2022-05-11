import { decode as b64decode, encode as b64encode } from 'base-64';

const b64EncodeUnicode = (str: string) => {
  // First we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa.
  return b64encode(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
      String.fromCharCode(<any>'0x' + p1)
    )
  );
};

const b64DecodeUnicode = (str: string) => {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(
    b64decode(str)
      .split('')
      .map((c: string) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );
};

export { b64EncodeUnicode, b64DecodeUnicode };
