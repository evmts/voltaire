/**
 * TypeScript type definitions for Ethereum primitives
 *
 * Maps C API types to TypeScript types
 * Based on primitives.h struct definitions
 *
 * This module re-exports all primitive types from their individual modules.
 * Each type is colocated with its Zig implementation in src/primitives/
 */

// Address types and utilities
// TODO: Restore after refactoring to namespace exports
// export type {
//   Address,
//   AddressHex,
// } from '../primitives/address.js';
// export {
//   ADDRESS_SIZE,
//   ADDRESS_HEX_LENGTH,
//   isAddressHex,
//   isAddress,
//   createAddress,
//   ZERO_ADDRESS,
//   isZeroAddress,
//   addressEquals,
//   addressToHex,
// } from '../primitives/address.js';

// Hash types and utilities
// TODO: Restore after refactoring to namespace exports
// export type {
//   Hash,
//   HashHex,
// } from '../primitives/hash.js';
// export {
//   HASH_SIZE,
//   HASH_HEX_LENGTH,
//   isHashHex,
//   isHash,
//   createHash,
//   ZERO_HASH,
//   isZeroHash,
//   hashEquals,
//   hashToHex,
// } from '../primitives/hash.js';

// U256 types and utilities
// TODO: Restore after refactoring - u256.js renamed to uint.ts
// export type {
//   U256,
//   U256Hex,
// } from '../primitives/u256.js';
// export {
//   U256_SIZE,
//   U256_HEX_MAX_LENGTH,
//   isU256,
//   createU256,
//   ZERO_U256,
//   u256Equals,
//   u256ToHex,
// } from '../primitives/u256.js';

// Hex string utilities
// TODO: Restore after refactoring to namespace exports
// export type {
//   HexString,
// } from '../primitives/hex.js';
// export {
//   isHexString,
//   bytesToHex,
// } from '../primitives/hex.js';

// Size constants
export {
  SIZES,
} from '../primitives/sizes.js';
