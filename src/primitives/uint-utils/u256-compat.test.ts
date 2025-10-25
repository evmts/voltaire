/**
 * Tests for U256 compatibility layer
 */

import { describe, test, expect } from 'bun:test';
import { ZERO_U256, createU256 } from '../../types';
import * as Uint256 from './uint256';
import * as Compat from './u256-compat';

describe('U256 Compatibility', () => {
  test('toU256 converts Uint256 to U256', () => {
    const uint256 = Uint256.fromBigInt(42n);
    const u256 = Compat.toU256(uint256);

    expect(u256.bytes).toBeInstanceOf(Uint8Array);
    expect(u256.bytes.length).toBe(32);
    expect(u256.bytes[31]).toBe(42);
  });

  test('fromU256 converts U256 to Uint256', () => {
    const bytes = new Uint8Array(32);
    bytes[31] = 42;
    const u256 = createU256(bytes);
    const uint256 = Compat.fromU256(u256);

    expect(Uint256.toBigInt(uint256)).toBe(42n);
  });

  test('round-trip conversion (Uint256 -> U256 -> Uint256)', () => {
    const original = Uint256.fromBigInt(0xdeadbeefn);
    const u256 = Compat.toU256(original);
    const result = Compat.fromU256(u256);

    expect(Uint256.toBigInt(result)).toBe(0xdeadbeefn);
  });

  test('round-trip conversion (U256 -> Uint256 -> U256)', () => {
    const bytes = new Uint8Array(32);
    bytes[28] = 0xde;
    bytes[29] = 0xad;
    bytes[30] = 0xbe;
    bytes[31] = 0xef;
    const original = createU256(bytes);
    const uint256 = Compat.fromU256(original);
    const result = Compat.toU256(uint256);

    expect(result.bytes).toEqual(original.bytes);
  });

  test('bigIntToU256 converts bigint directly', () => {
    const u256 = Compat.bigIntToU256(42n);
    expect(u256.bytes.length).toBe(32);
    expect(u256.bytes[31]).toBe(42);
  });

  test('u256ToBigInt converts U256 directly', () => {
    const bytes = new Uint8Array(32);
    bytes[31] = 42;
    const u256 = createU256(bytes);
    const bigInt = Compat.u256ToBigInt(u256);

    expect(bigInt).toBe(42n);
  });

  test('hexToU256 converts hex string directly', () => {
    const u256 = Compat.hexToU256('0x2a');
    expect(u256.bytes.length).toBe(32);
    expect(u256.bytes[31]).toBe(42);
  });

  test('hexToU256 accepts hex without 0x prefix', () => {
    const u256 = Compat.hexToU256('2a');
    expect(u256.bytes.length).toBe(32);
    expect(u256.bytes[31]).toBe(42);
  });

  test('u256ToHex converts U256 directly', () => {
    const bytes = new Uint8Array(32);
    bytes[31] = 0x2a;
    const u256 = createU256(bytes);
    const hex = Compat.u256ToHex(u256);

    expect(hex).toBe('0x2a');
  });

  test('converts ZERO_U256', () => {
    const uint256 = Compat.fromU256(ZERO_U256);
    expect(Uint256.toBigInt(uint256)).toBe(0n);
    expect(uint256).toBe('0x0');
  });

  test('converts large values', () => {
    const large = (1n << 128n) + 42n;
    const uint256 = Uint256.fromBigInt(large);
    const u256 = Compat.toU256(uint256);
    const result = Compat.fromU256(u256);

    expect(Uint256.toBigInt(result)).toBe(large);
  });

  test('converts MAX_UINT256', () => {
    const uint256 = Uint256.MAX_UINT256;
    const u256 = Compat.toU256(uint256);
    const result = Compat.fromU256(u256);

    expect(result).toBe(Uint256.MAX_UINT256);
    expect(u256.bytes.every((b) => b === 0xff)).toBe(true);
  });

  test('throws on invalid bigint range', () => {
    expect(() => Compat.bigIntToU256(-1n)).toThrow('below minimum');
    expect(() => Compat.bigIntToU256((1n << 256n))).toThrow('exceeds maximum');
  });

  test('throws on invalid hex', () => {
    expect(() => Compat.hexToU256('0xGG')).toThrow('Invalid hex format');
  });
});
