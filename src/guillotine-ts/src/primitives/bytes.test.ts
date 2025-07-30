import { Bytes } from './bytes';

describe('Bytes', () => {
  describe('creation', () => {
    it('should create from byte array', () => {
      const data = new Uint8Array([1, 2, 3, 4]);
      const bytes = Bytes.fromBytes(data);
      expect(bytes.toBytes()).toEqual(data);
      expect(bytes.length()).toBe(4);
    });

    it('should create from hex string', () => {
      const bytes = Bytes.fromHex('0x01020304');
      expect(bytes.toBytes()).toEqual(new Uint8Array([1, 2, 3, 4]));
      expect(bytes.toHex()).toBe('0x01020304');
    });

    it('should create from hex without 0x prefix', () => {
      const bytes = Bytes.fromHex('01020304');
      expect(bytes.toHex()).toBe('0x01020304');
    });

    it('should handle odd-length hex', () => {
      const bytes = Bytes.fromHex('0x123');
      expect(bytes.toHex()).toBe('0x0123');
    });

    it('should create from string', () => {
      const bytes = Bytes.fromString('hello');
      expect(bytes.toString()).toBe('hello');
    });

    it('should create empty bytes', () => {
      const bytes = Bytes.empty();
      expect(bytes.isEmpty()).toBe(true);
      expect(bytes.length()).toBe(0);
      expect(bytes.toHex()).toBe('0x');
    });

    it('should create zeros', () => {
      const bytes = Bytes.zeros(5);
      expect(bytes.length()).toBe(5);
      expect(bytes.toBytes()).toEqual(new Uint8Array(5));
    });

    it('should create filled bytes', () => {
      const bytes = Bytes.filled(3, 42);
      expect(bytes.toBytes()).toEqual(new Uint8Array([42, 42, 42]));
    });

    it('should throw on invalid hex', () => {
      expect(() => Bytes.fromHex('0xGG')).toThrow('non-hex characters');
    });

    it('should throw on negative length', () => {
      expect(() => Bytes.zeros(-1)).toThrow('cannot be negative');
    });

    it('should throw on invalid fill value', () => {
      expect(() => Bytes.filled(3, 256)).toThrow('between 0 and 255');
      expect(() => Bytes.filled(3, -1)).toThrow('between 0 and 255');
    });
  });

  describe('methods', () => {
    const testBytes = Bytes.fromHex('0x01020304');

    it('should return correct length', () => {
      expect(testBytes.length()).toBe(4);
      expect(Bytes.empty().length()).toBe(0);
    });

    it('should check if empty', () => {
      expect(testBytes.isEmpty()).toBe(false);
      expect(Bytes.empty().isEmpty()).toBe(true);
    });

    it('should convert to hex', () => {
      expect(testBytes.toHex()).toBe('0x01020304');
      expect(Bytes.empty().toHex()).toBe('0x');
    });

    it('should compare equality', () => {
      const bytes1 = Bytes.fromHex('0x01020304');
      const bytes2 = Bytes.fromHex('0x01020304');
      const bytes3 = Bytes.fromHex('0x01020305');

      expect(bytes1.equals(bytes2)).toBe(true);
      expect(bytes1.equals(bytes3)).toBe(false);
      expect(bytes1.equals(Bytes.empty())).toBe(false);
    });

    it('should concatenate bytes', () => {
      const bytes1 = Bytes.fromHex('0x0102');
      const bytes2 = Bytes.fromHex('0x0304');
      const combined = bytes1.concat(bytes2);
      expect(combined.toHex()).toBe('0x01020304');
    });

    it('should slice bytes', () => {
      const slice = testBytes.slice(1, 3);
      expect(slice.toHex()).toBe('0x0203');

      const fromStart = testBytes.slice(0, 2);
      expect(fromStart.toHex()).toBe('0x0102');

      const toEnd = testBytes.slice(2);
      expect(toEnd.toHex()).toBe('0x0304');
    });

    it('should get byte at index', () => {
      expect(testBytes.at(0)).toBe(1);
      expect(testBytes.at(1)).toBe(2);
      expect(testBytes.at(2)).toBe(3);
      expect(testBytes.at(3)).toBe(4);
    });

    it('should set byte at index', () => {
      const modified = testBytes.setAt(1, 42);
      expect(modified.toHex()).toBe('0x012a0304');
      // Original should be unchanged
      expect(testBytes.toHex()).toBe('0x01020304');
    });

    it('should throw on invalid slice bounds', () => {
      expect(() => testBytes.slice(-1, 2)).toThrow('out of bounds');
      expect(() => testBytes.slice(0, 5)).toThrow('out of bounds');
      expect(() => testBytes.slice(2, 1)).toThrow('out of bounds');
    });

    it('should throw on invalid index', () => {
      expect(() => testBytes.at(-1)).toThrow('out of bounds');
      expect(() => testBytes.at(4)).toThrow('out of bounds');
      expect(() => testBytes.setAt(-1, 0)).toThrow('out of bounds');
      expect(() => testBytes.setAt(4, 0)).toThrow('out of bounds');
    });

    it('should throw on invalid set value', () => {
      expect(() => testBytes.setAt(0, 256)).toThrow('between 0 and 255');
      expect(() => testBytes.setAt(0, -1)).toThrow('between 0 and 255');
    });
  });

  describe('padding', () => {
    const bytes = Bytes.fromHex('0x0102');

    it('should pad start', () => {
      const padded = bytes.padStart(4);
      expect(padded.toHex()).toBe('0x00000102');
    });

    it('should pad end', () => {
      const padded = bytes.padEnd(4);
      expect(padded.toHex()).toBe('0x01020000');
    });

    it('should not pad if already long enough', () => {
      const padded = bytes.padStart(2);
      expect(padded.equals(bytes)).toBe(true);
    });
  });

  describe('searching', () => {
    const bytes = Bytes.fromBytes(new Uint8Array([1, 2, 3, 2, 4]));

    it('should find index of byte', () => {
      expect(bytes.indexOf(2)).toBe(1); // First occurrence
      expect(bytes.indexOf(5)).toBe(-1); // Not found
    });

    it('should check if includes byte', () => {
      expect(bytes.includes(3)).toBe(true);
      expect(bytes.includes(5)).toBe(false);
    });
  });

  describe('reverse', () => {
    it('should reverse bytes', () => {
      const bytes = Bytes.fromHex('0x01020304');
      const reversed = bytes.reverse();
      expect(reversed.toHex()).toBe('0x04030201');
      // Original should be unchanged
      expect(bytes.toHex()).toBe('0x01020304');
    });

    it('should handle empty bytes', () => {
      const empty = Bytes.empty();
      const reversed = empty.reverse();
      expect(reversed.isEmpty()).toBe(true);
    });
  });

  describe('JSON serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const original = Bytes.fromHex('0x01020304');
      const json = original.toJSON();
      const restored = Bytes.fromJSON(json);
      expect(restored.equals(original)).toBe(true);
    });
  });
});