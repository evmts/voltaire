/**
 * RIPEMD160 Tests
 *
 * Test vectors from official RIPEMD160 specification
 * and Bitcoin Core implementation.
 */

import { describe, it, expect } from 'vitest';
import { Ripemd160 } from './ripemd160.js';

describe('Ripemd160', () => {
  describe('hash', () => {
    it('empty string', () => {
      const expected = new Uint8Array([
        0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54,
        0x61, 0x28, 0x08, 0x97, 0x7e, 0xe8, 0xf5, 0x48,
        0xb2, 0x25, 0x8d, 0x31,
      ]);
      const result = Ripemd160.hashString('');
      expect(result).toEqual(expected);
    });

    it('single byte "a"', () => {
      const expected = new Uint8Array([
        0x0b, 0xdc, 0x9d, 0x2d, 0x25, 0x6b, 0x3e, 0xe9,
        0xda, 0xae, 0x34, 0x7b, 0xe6, 0xf4, 0xdc, 0x83,
        0x5a, 0x46, 0x7f, 0xfe,
      ]);
      const result = Ripemd160.hashString('a');
      expect(result).toEqual(expected);
    });

    it('"abc"', () => {
      const expected = new Uint8Array([
        0x8e, 0xb2, 0x08, 0xf7, 0xe0, 0x5d, 0x98, 0x7a,
        0x9b, 0x04, 0x4a, 0x8e, 0x98, 0xc6, 0xb0, 0x87,
        0xf1, 0x5a, 0x0b, 0xfc,
      ]);
      const result = Ripemd160.hashString('abc');
      expect(result).toEqual(expected);
    });

    it('"message digest"', () => {
      const expected = new Uint8Array([
        0x5d, 0x06, 0x89, 0xef, 0x49, 0xd2, 0xfa, 0xe5,
        0x72, 0xb8, 0x81, 0xb1, 0x23, 0xa8, 0x5f, 0xfa,
        0x21, 0x59, 0x5f, 0x36,
      ]);
      const result = Ripemd160.hashString('message digest');
      expect(result).toEqual(expected);
    });

    it('lowercase alphabet', () => {
      const expected = new Uint8Array([
        0xf7, 0x1c, 0x27, 0x10, 0x9c, 0x69, 0x2c, 0x1b,
        0x56, 0xbb, 0xdc, 0xeb, 0x5b, 0x9d, 0x28, 0x65,
        0xb3, 0x70, 0x8d, 0xbc,
      ]);
      const result = Ripemd160.hashString('abcdefghijklmnopqrstuvwxyz');
      expect(result).toEqual(expected);
    });

    it('alphanumeric', () => {
      const expected = new Uint8Array([
        0x12, 0xa0, 0x53, 0x38, 0x4a, 0x9c, 0x0c, 0x88,
        0xe4, 0x05, 0xa0, 0x6c, 0x27, 0xdc, 0xf4, 0x9a,
        0xda, 0x62, 0xeb, 0x2b,
      ]);
      const result = Ripemd160.hashString('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq');
      expect(result).toEqual(expected);
    });

    it('mixed case alphanumeric', () => {
      const expected = new Uint8Array([
        0xb0, 0xe2, 0x0b, 0x6e, 0x31, 0x16, 0x64, 0x02,
        0x86, 0xed, 0x3a, 0x87, 0xa5, 0x71, 0x30, 0x79,
        0xb2, 0x1f, 0x51, 0x89,
      ]);
      const result = Ripemd160.hashString('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
      expect(result).toEqual(expected);
    });

    it('repeated digits', () => {
      const expected = new Uint8Array([
        0x9b, 0x75, 0x2e, 0x45, 0x57, 0x3d, 0x4b, 0x39,
        0xf4, 0xdb, 0xd3, 0x32, 0x3c, 0xab, 0x82, 0xbf,
        0x63, 0x32, 0x6b, 0xfb,
      ]);
      const result = Ripemd160.hashString('12345678901234567890123456789012345678901234567890123456789012345678901234567890');
      expect(result).toEqual(expected);
    });

    it('hello', () => {
      const expected = new Uint8Array([
        0x10, 0x8f, 0x07, 0xb8, 0x38, 0x24, 0x12, 0x61,
        0x2c, 0x04, 0x8d, 0x07, 0xd1, 0x3f, 0x81, 0x41,
        0x18, 0x44, 0x5a, 0xcd,
      ]);
      const result = Ripemd160.hashString('hello');
      expect(result).toEqual(expected);
    });

    it('The quick brown fox', () => {
      const expected = new Uint8Array([
        0x37, 0xf3, 0x32, 0xf6, 0x8d, 0xb7, 0x7b, 0xd9,
        0xd7, 0xed, 0xd4, 0x96, 0x95, 0x71, 0xad, 0x67,
        0x1c, 0xf9, 0xdd, 0x3b,
      ]);
      const result = Ripemd160.hashString('The quick brown fox jumps over the lazy dog');
      expect(result).toEqual(expected);
    });
  });

  describe('hash with Uint8Array input', () => {
    it('empty bytes', () => {
      const expected = new Uint8Array([
        0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54,
        0x61, 0x28, 0x08, 0x97, 0x7e, 0xe8, 0xf5, 0x48,
        0xb2, 0x25, 0x8d, 0x31,
      ]);
      const result = Ripemd160.hash(new Uint8Array([]));
      expect(result).toEqual(expected);
    });

    it('single byte 0x00', () => {
      const expected = new Uint8Array([
        0xc8, 0x1b, 0x94, 0x93, 0x34, 0x20, 0x22, 0x1a,
        0x7a, 0xc0, 0x04, 0xa9, 0x02, 0x42, 0xd8, 0xb1,
        0xd3, 0xe5, 0x07, 0x0d,
      ]);
      const result = Ripemd160.hash(new Uint8Array([0x00]));
      expect(result).toEqual(expected);
    });

    it('single byte 0xFF', () => {
      const expected = new Uint8Array([
        0x2c, 0x0c, 0x45, 0xd3, 0xec, 0xab, 0x80, 0xfe,
        0x06, 0x0e, 0x5f, 0x1d, 0x70, 0x57, 0xcd, 0x2f,
        0x8d, 0xe5, 0xe5, 0x57,
      ]);
      const result = Ripemd160.hash(new Uint8Array([0xFF]));
      expect(result).toEqual(expected);
    });

    it('binary data with all byte values', () => {
      const input = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        input[i] = i;
      }
      const result = Ripemd160.hash(input);

      // Result should be 20 bytes
      expect(result.length).toBe(20);

      // Result should be non-zero
      const allZero = result.every(byte => byte === 0);
      expect(allZero).toBe(false);

      // Deterministic
      const result2 = Ripemd160.hash(input);
      expect(result).toEqual(result2);
    });
  });

  describe('edge cases', () => {
    it('exactly 64 bytes', () => {
      const expected = new Uint8Array([
        0x9d, 0xfb, 0x7d, 0x37, 0x4a, 0xd9, 0x24, 0xf3,
        0xf8, 0x8d, 0xe9, 0x62, 0x91, 0xc3, 0x3e, 0x9a,
        0xbe, 0xd5, 0x3e, 0x32,
      ]);
      const result = Ripemd160.hashString('a'.repeat(64));
      expect(result).toEqual(expected);
    });

    it('exactly 128 bytes', () => {
      const expected = new Uint8Array([
        0x8d, 0xfd, 0xfb, 0x32, 0xb2, 0xed, 0x5c, 0xb4,
        0x1a, 0x73, 0x47, 0x8b, 0x4f, 0xd6, 0x0c, 0xc5,
        0xb4, 0x64, 0x8b, 0x15,
      ]);
      const result = Ripemd160.hashString('a'.repeat(128));
      expect(result).toEqual(expected);
    });

    it('large input', () => {
      const input = 'a'.repeat(10000);
      const result = Ripemd160.hash(input);

      // Should be 20 bytes
      expect(result.length).toBe(20);

      // Should be deterministic
      const result2 = Ripemd160.hash(input);
      expect(result).toEqual(result2);
    });
  });

  describe('Bitcoin compatibility', () => {
    it('Bitcoin address generation step', () => {
      // In Bitcoin, addresses use RIPEMD160(SHA256(pubkey))
      // This tests the RIPEMD160 part with a SHA256 hash as input

      // Example SHA256 hash (32 bytes)
      const sha256Hash = new Uint8Array([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
        0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
        0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
      ]);

      const result = Ripemd160.hash(sha256Hash);

      // Result should be 20 bytes (standard Bitcoin pubkey hash size)
      expect(result.length).toBe(20);
    });
  });

  describe('avalanche effect', () => {
    it('small input change causes large hash change', () => {
      const hash1 = Ripemd160.hashString('test message');
      const hash2 = Ripemd160.hashString('test messag3'); // One char different

      // Count differing bytes
      let differences = 0;
      for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) differences++;
      }

      // Expect significant difference (at least 50% of bytes)
      expect(differences).toBeGreaterThanOrEqual(10);
    });
  });
});
