/**
 * Compatibility layer between Uint256 (branded type) and U256 (C API interface)
 *
 * The existing U256 interface is designed for FFI/C API interop with a bytes field.
 * The new Uint256 type is a branded hex string for ergonomic TypeScript usage.
 * This module provides conversion utilities between the two.
 */

import type { U256 } from '../../types';
import { createU256 } from '../../types';
import * as Uint256Util from './uint256';

/**
 * Convert Uint256 (branded hex string) to U256 (C API interface)
 * @param value - Uint256 hex string
 * @returns U256 object with 32-byte big-endian bytes field
 */
export function toU256(value: Uint256Util.Uint256): U256 {
  const bytes = Uint256Util.toBytes(value);
  return createU256(bytes);
}

/**
 * Convert U256 (C API interface) to Uint256 (branded hex string)
 * @param value - U256 object with bytes field
 * @returns Uint256 hex string
 */
export function fromU256(value: U256): Uint256Util.Uint256 {
  return Uint256Util.fromBytes(value.bytes);
}

/**
 * Convert bigint directly to U256
 * @param value - BigInt value (0 to 2^256-1)
 * @returns U256 object
 * @throws Error if value out of range
 */
export function bigIntToU256(value: bigint): U256 {
  const uint256 = Uint256Util.fromBigInt(value);
  return toU256(uint256);
}

/**
 * Convert U256 directly to bigint
 * @param value - U256 object
 * @returns BigInt value
 */
export function u256ToBigInt(value: U256): bigint {
  const uint256 = fromU256(value);
  return Uint256Util.toBigInt(uint256);
}

/**
 * Convert hex string directly to U256
 * @param hex - Hex string (with or without 0x prefix)
 * @returns U256 object
 * @throws Error if invalid hex or out of range
 */
export function hexToU256(hex: string): U256 {
  const uint256 = Uint256Util.fromHex(hex);
  return toU256(uint256);
}

/**
 * Convert U256 directly to hex string
 * @param value - U256 object
 * @returns Hex string with 0x prefix
 */
export function u256ToHex(value: U256): string {
  const uint256 = fromU256(value);
  return Uint256Util.toHex(uint256);
}
