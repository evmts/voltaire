import { describe, test, expect } from 'bun:test';
import {
  encode,
  decode,
  encodeList,
  encodeUint,
  InputTooShort,
  LeadingZeros,
  NonCanonicalSize,
  type RlpDecoded,
} from './rlp';

/**
 * Test helpers
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function compareBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Official Ethereum RLP test vectors
 */
describe('RLP Encoding - Official Test Vectors', () => {
  test('empty string', () => {
    const input = new Uint8Array([]);
    const result = encode(input);
    expect(bytesToHex(result)).toBe('0x80');
  });

  test('single byte < 0x7f', () => {
    const input = new Uint8Array([0x00]);
    const result = encode(input);
    expect(bytesToHex(result)).toBe('0x00');
  });

  test('single byte = 0x7f', () => {
    const input = new Uint8Array([0x7f]);
    const result = encode(input);
    expect(bytesToHex(result)).toBe('0x7f');
  });

  test('single byte = 0x80', () => {
    const input = new Uint8Array([0x80]);
    const result = encode(input);
    expect(bytesToHex(result)).toBe('0x8180');
  });

  test('string "dog"', () => {
    const input = new TextEncoder().encode('dog');
    const result = encode(input);
    expect(bytesToHex(result)).toBe('0x83646f67');
  });

  test('list [ "cat", "dog" ]', () => {
    const input = [
      new TextEncoder().encode('cat'),
      new TextEncoder().encode('dog'),
    ];
    const result = encodeList(input);
    expect(bytesToHex(result)).toBe('0xc88363617483646f67');
  });

  test('empty list', () => {
    const input: RlpDecoded[] = [];
    const result = encodeList(input);
    expect(bytesToHex(result)).toBe('0xc0');
  });

  test('integer 0', () => {
    const result = encodeUint(0);
    expect(bytesToHex(result)).toBe('0x80');
  });

  test('integer 1', () => {
    const result = encodeUint(1);
    expect(bytesToHex(result)).toBe('0x01');
  });

  test('integer 127', () => {
    const result = encodeUint(127);
    expect(bytesToHex(result)).toBe('0x7f');
  });

  test('integer 128', () => {
    const result = encodeUint(128);
    expect(bytesToHex(result)).toBe('0x8180');
  });

  test('integer 256', () => {
    const result = encodeUint(256);
    expect(bytesToHex(result)).toBe('0x820100');
  });

  test('integer 1024', () => {
    const result = encodeUint(1024);
    expect(bytesToHex(result)).toBe('0x820400');
  });

  test('long string (55 bytes)', () => {
    const input = new Uint8Array(55).fill(0x61); // 'a' repeated 55 times
    const result = encode(input);
    const expected = '0xb7' + '61'.repeat(55);
    expect(bytesToHex(result)).toBe(expected);
  });

  test('long string (56 bytes)', () => {
    const input = new Uint8Array(56).fill(0x61); // 'a' repeated 56 times
    const result = encode(input);
    const expected = '0xb838' + '61'.repeat(56);
    expect(bytesToHex(result)).toBe(expected);
  });

  test('nested empty lists [ [], [[]], [ [], [[]] ] ]', () => {
    const input: RlpDecoded[] = [
      [],
      [[]],
      [[], [[]]],
    ];
    const result = encodeList(input);
    expect(bytesToHex(result)).toBe('0xc7c0c1c0c3c0c1c0');
  });

  test('list with string and number', () => {
    const input = [
      new TextEncoder().encode('zw'),
      new Uint8Array([0x04]),
      new Uint8Array([0x01]),
    ];
    const result = encodeList(input);
    expect(bytesToHex(result)).toBe('0xc6827a770401');
  });
});

describe('RLP Decoding - Official Test Vectors', () => {
  test('decode empty string', () => {
    const input = hexToBytes('0x80');
    const result = decode(input);
    expect(result).toBeInstanceOf(Uint8Array);
    expect((result as Uint8Array).length).toBe(0);
  });

  test('decode single byte < 0x7f', () => {
    const input = hexToBytes('0x00');
    const result = decode(input);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(compareBytes(result as Uint8Array, new Uint8Array([0x00]))).toBe(true);
  });

  test('decode string "dog"', () => {
    const input = hexToBytes('0x83646f67');
    const result = decode(input);
    expect(result).toBeInstanceOf(Uint8Array);
    const text = new TextDecoder().decode(result as Uint8Array);
    expect(text).toBe('dog');
  });

  test('decode list [ "cat", "dog" ]', () => {
    const input = hexToBytes('0xc88363617483646f67');
    const result = decode(input) as RlpDecoded[];
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(new TextDecoder().decode(result[0] as Uint8Array)).toBe('cat');
    expect(new TextDecoder().decode(result[1] as Uint8Array)).toBe('dog');
  });

  test('decode empty list', () => {
    const input = hexToBytes('0xc0');
    const result = decode(input) as RlpDecoded[];
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('decode nested list', () => {
    const input = hexToBytes('0xc7c0c1c0c3c0c1c0');
    const result = decode(input) as RlpDecoded[];
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(Array.isArray(result[0])).toBe(true);
    expect((result[0] as RlpDecoded[]).length).toBe(0);
  });

  test('decode integer 0', () => {
    const input = hexToBytes('0x80');
    const result = decode(input) as Uint8Array;
    expect(result.length).toBe(0);
  });

  test('decode integer 1', () => {
    const input = hexToBytes('0x01');
    const result = decode(input) as Uint8Array;
    expect(compareBytes(result, new Uint8Array([0x01]))).toBe(true);
  });

  test('decode integer 1024', () => {
    const input = hexToBytes('0x820400');
    const result = decode(input) as Uint8Array;
    expect(compareBytes(result, new Uint8Array([0x04, 0x00]))).toBe(true);
  });
});

describe('RLP Error Handling', () => {
  test('decode - input too short', () => {
    const input = hexToBytes('0x83646f'); // Says 3 bytes but only provides 2
    expect(() => decode(input)).toThrow(InputTooShort);
  });

  test('decode - leading zeros in length', () => {
    const input = hexToBytes('0xb8006161'); // Length encoded with leading zero
    expect(() => decode(input)).toThrow(LeadingZeros);
  });

  test('decode - non-canonical size', () => {
    const input = hexToBytes('0x8161'); // Single byte encoded as short string
    expect(() => decode(input)).toThrow(NonCanonicalSize);
  });

  test('encode - roundtrip consistency', () => {
    const original = [
      new TextEncoder().encode('hello'),
      new TextEncoder().encode('world'),
      [new Uint8Array([0x01, 0x02, 0x03])],
    ];
    const encoded = encodeList(original);
    const decoded = decode(encoded);

    expect(Array.isArray(decoded)).toBe(true);
    const decodedList = decoded as RlpDecoded[];
    expect(decodedList.length).toBe(3);
  });
});

describe('RLP Edge Cases', () => {
  test('encode very large integer', () => {
    const largeNum = BigInt('0xffffffffffffffff');
    const result = encodeUint(largeNum);
    expect(result.length).toBeGreaterThan(0);
  });

  test('encode string with max single-byte length', () => {
    const input = new Uint8Array(55).fill(0x41);
    const result = encode(input);
    expect(result[0]).toBe(0xb7); // 0x80 + 55
  });

  test('encode string requiring length-of-length', () => {
    const input = new Uint8Array(56).fill(0x41);
    const result = encode(input);
    expect(result[0]).toBe(0xb8); // 0xb7 + 1 (length byte count)
    expect(result[1]).toBe(56); // actual length
  });

  test('deeply nested lists', () => {
    const nested: RlpDecoded = [[[[[new Uint8Array([0x01])]]]]];
    const result = encodeList(nested as RlpDecoded[]);
    const decoded = decode(result);
    expect(Array.isArray(decoded)).toBe(true);
  });
});
