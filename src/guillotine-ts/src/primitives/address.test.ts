import { Address } from './address';

describe('Address', () => {
  describe('creation', () => {
    it('should create address from valid hex string', () => {
      const hex = '0x1234567890123456789012345678901234567890';
      const address = Address.fromHex(hex);
      expect(address.toHex()).toBe(hex);
    });

    it('should create address from hex without 0x prefix', () => {
      const address = Address.fromHex('1234567890123456789012345678901234567890');
      expect(address.toHex()).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should pad short hex addresses', () => {
      const address = Address.fromHex('0x1234');
      expect(address.toHex()).toBe('0x0000000000000000000000000000000000001234');
    });

    it('should create address from bytes', () => {
      const bytes = new Uint8Array(20);
      bytes[19] = 42;
      const address = Address.fromBytes(bytes);
      expect(address.toHex()).toBe('0x000000000000000000000000000000000000002a');
    });

    it('should create zero address', () => {
      const address = Address.zero();
      expect(address.isZero()).toBe(true);
      expect(address.toHex()).toBe('0x0000000000000000000000000000000000000000');
    });

    it('should throw on invalid hex length', () => {
      expect(() => Address.fromHex('0x123')).not.toThrow(); // Should pad
      expect(() => Address.fromHex('0x' + '1'.repeat(41))).toThrow('Invalid hex address length');
    });

    it('should throw on invalid hex characters', () => {
      expect(() => Address.fromHex('0x123g567890123456789012345678901234567890')).toThrow('Invalid hex address');
    });

    it('should throw on invalid bytes length', () => {
      expect(() => Address.fromBytes(new Uint8Array(19))).toThrow('Invalid address length');
      expect(() => Address.fromBytes(new Uint8Array(21))).toThrow('Invalid address length');
    });
  });

  describe('methods', () => {
    const testAddress = Address.fromHex('0x1234567890123456789012345678901234567890');

    it('should return correct bytes', () => {
      const bytes = testAddress.toBytes();
      expect(bytes).toHaveLength(20);
      expect(bytes[0]).toBe(0x12);
      expect(bytes[1]).toBe(0x34);
    });

    it('should return correct hex string', () => {
      expect(testAddress.toHex()).toBe('0x1234567890123456789012345678901234567890');
      expect(testAddress.toString()).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should detect zero address', () => {
      expect(Address.zero().isZero()).toBe(true);
      expect(testAddress.isZero()).toBe(false);
    });

    it('should compare addresses correctly', () => {
      const address1 = Address.fromHex('0x1234567890123456789012345678901234567890');
      const address2 = Address.fromHex('0x1234567890123456789012345678901234567890');
      const address3 = Address.fromHex('0x0987654321098765432109876543210987654321');

      expect(address1.equals(address2)).toBe(true);
      expect(address1.equals(address3)).toBe(false);
    });

    it('should handle JSON serialization', () => {
      const json = testAddress.toJSON();
      const restored = Address.fromJSON(json);
      expect(restored.equals(testAddress)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(() => Address.fromHex('')).toThrow();
    });

    it('should handle all zeros', () => {
      const address = Address.fromHex('0x0000000000000000000000000000000000000000');
      expect(address.isZero()).toBe(true);
      expect(address.equals(Address.zero())).toBe(true);
    });

    it('should handle all ones', () => {
      const address = Address.fromHex('0xffffffffffffffffffffffffffffffffffffffff');
      expect(address.isZero()).toBe(false);
    });
  });
});