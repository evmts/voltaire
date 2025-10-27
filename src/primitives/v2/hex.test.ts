import { describe, it, expect } from 'vitest';
import { Hex, InvalidHexFormatError, InvalidHexCharacterError, OddLengthHexError } from './hex';

describe('Hex', () => {
  describe('isHex', () => {
    it('validates correct hex strings', () => {
      expect(Hex.isHex('0x0')).toBe(true);
      expect(Hex.isHex('0x00')).toBe(true);
      expect(Hex.isHex('0x1234')).toBe(true);
      expect(Hex.isHex('0xabcdef')).toBe(true);
      expect(Hex.isHex('0xABCDEF')).toBe(true);
      expect(Hex.isHex('0xdeadbeef')).toBe(true);
    });

    it('rejects invalid hex strings', () => {
      expect(Hex.isHex('')).toBe(false);
      expect(Hex.isHex('0x')).toBe(false);
      expect(Hex.isHex('1234')).toBe(false);
      expect(Hex.isHex('0xg')).toBe(false);
      expect(Hex.isHex('0x ')).toBe(false);
      expect(Hex.isHex(' 0x00')).toBe(false);
    });
  });

  describe('Hex factory', () => {
    it('creates branded hex from valid string', () => {
      const hex = Hex('0x1234');
      expect(hex).toBe('0x1234');
    });

    it('throws on invalid hex', () => {
      expect(() => Hex('1234')).toThrow(InvalidHexFormatError);
      expect(() => Hex('0xg')).toThrow(InvalidHexCharacterError);
    });
  });

  describe('fromBytes', () => {
    it('converts empty bytes', () => {
      expect(Hex.fromBytes(new Uint8Array([]))).toBe('0x');
    });

    it('converts single byte', () => {
      expect(Hex.fromBytes(new Uint8Array([0x61]))).toBe('0x61');
    });

    it('converts multiple bytes', () => {
      expect(Hex.fromBytes(new Uint8Array([0x12, 0x34, 0xab, 0xcd]))).toBe('0x1234abcd');
    });

    it('converts text to hex', () => {
      const encoder = new TextEncoder();
      expect(Hex.fromBytes(encoder.encode('Hello World!'))).toBe('0x48656c6c6f20576f726c6421');
    });
  });

  describe('toBytes', () => {
    it('converts empty hex', () => {
      const bytes = Hex.toBytes(Hex('0x'));
      expect(bytes.length).toBe(0);
    });

    it('converts single byte', () => {
      const bytes = Hex.toBytes(Hex('0x61'));
      expect(Array.from(bytes)).toEqual([0x61]);
    });

    it('converts multiple bytes', () => {
      const bytes = Hex.toBytes(Hex('0x616263'));
      expect(Array.from(bytes)).toEqual([0x61, 0x62, 0x63]);
    });

    it('handles mixed case', () => {
      const bytes = Hex.toBytes(Hex('0xDeAdBeEf'));
      expect(Array.from(bytes)).toEqual([0xde, 0xad, 0xbe, 0xef]);
    });

    it('throws on odd length', () => {
      expect(() => Hex.toBytes('0x1' as Hex)).toThrow(OddLengthHexError);
      expect(() => Hex.toBytes('0x123' as Hex)).toThrow(OddLengthHexError);
    });

    it('throws on invalid character', () => {
      expect(() => Hex.toBytes('0xdeadbeeg' as Hex)).toThrow(InvalidHexCharacterError);
    });
  });

  describe('concat', () => {
    it('concatenates hex strings', () => {
      const hex1 = Hex('0x1234');
      const hex2 = Hex('0xabcd');
      expect(Hex.concat(hex1, hex2)).toBe('0x1234abcd');
    });

    it('concatenates multiple hex strings', () => {
      const hex1 = Hex('0x12');
      const hex2 = Hex('0x34');
      const hex3 = Hex('0xab');
      expect(Hex.concat(hex1, hex2, hex3)).toBe('0x1234ab');
    });

    it('concatenates empty hex strings', () => {
      const hex1 = Hex('0x');
      const hex2 = Hex('0x1234');
      expect(Hex.concat(hex1, hex2)).toBe('0x1234');
    });
  });

  describe('slice', () => {
    it('slices hex string', () => {
      const hex = Hex('0x1234abcd');
      expect(Hex.slice(hex, 0, 2)).toBe('0x1234');
      expect(Hex.slice(hex, 1, 3)).toBe('0x34ab');
    });

    it('slices from start to end', () => {
      const hex = Hex('0x1234abcd');
      expect(Hex.slice(hex, 2)).toBe('0xabcd');
    });

    it('handles empty slice', () => {
      const hex = Hex('0x1234');
      expect(Hex.slice(hex, 2, 2)).toBe('0x');
    });
  });

  describe('size', () => {
    it('returns byte size', () => {
      expect(Hex.size(Hex('0x'))).toBe(0);
      expect(Hex.size(Hex('0x12'))).toBe(1);
      expect(Hex.size(Hex('0x1234'))).toBe(2);
      expect(Hex.size(Hex('0x1234abcd'))).toBe(4);
    });
  });

  describe('pad', () => {
    it('pads hex to target size', () => {
      const hex = Hex('0x1234');
      expect(Hex.pad(hex, 4)).toBe('0x00001234');
    });

    it('does not pad if already at target size', () => {
      const hex = Hex('0x1234');
      expect(Hex.pad(hex, 2)).toBe('0x1234');
    });

    it('does not pad if larger than target size', () => {
      const hex = Hex('0x1234abcd');
      expect(Hex.pad(hex, 2)).toBe('0x1234abcd');
    });
  });

  describe('trim', () => {
    it('removes leading zeros', () => {
      expect(Hex.trim(Hex('0x00001234'))).toBe('0x1234');
    });

    it('removes all leading zeros', () => {
      expect(Hex.trim(Hex('0x0000'))).toBe('0x');
    });

    it('does not trim non-zero values', () => {
      expect(Hex.trim(Hex('0x1234'))).toBe('0x1234');
    });
  });

  describe('round-trip conversions', () => {
    it('maintains data integrity', () => {
      const original = new Uint8Array([0x12, 0x34, 0xab, 0xcd]);
      const hex = Hex.fromBytes(original);
      const result = Hex.toBytes(hex);
      expect(Array.from(result)).toEqual(Array.from(original));
    });
  });
});
