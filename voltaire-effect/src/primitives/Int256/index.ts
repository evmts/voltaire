/**
 * @fileoverview Int256 module for working with signed 256-bit integers in Effect.
 *
 * @description
 * Provides type-safe operations for Solidity's int256 type. This is the native
 * signed integer type used in Ethereum smart contracts.
 *
 * Range: -2^255 to 2^255-1 (the full range of Solidity's int256)
 *
 * Key features:
 * - Type-safe branded Int256 values (backed by BigInt)
 * - Effect-based error handling for invalid inputs
 * - Schema validation for parsing from various input types
 * - Hex string parsing for EVM-encoded data
 *
 * @example
 * ```typescript
 * import * as Int256 from 'voltaire-effect/Int256'
 * import * as Effect from 'effect/Effect'
 *
 * // Create Int256 values
 * const value = Effect.runSync(Int256.from(12345678901234567890123456789n))
 *
 * // From hex string (EVM-encoded)
 * const fromHex = Effect.runSync(Int256.fromHex('0x7fffffff'))
 *
 * // Negative values (two's complement)
 * const negative = Effect.runSync(Int256.from(-1n))
 * ```
 *
 * @since 0.0.1
 * @module Int256
 * @see {@link Int128} for 128-bit signed integers
 * @see {@link Uint256} for unsigned 256-bit integers
 */
export { Int256Schema, Int256FromHexSchema, type Int256Type } from './Int256Schema.js'
export {
  from,
  fromHex,
  fromBigInt,
  fromBytes,
  plus,
  add,
  minus,
  sub,
  times,
  mul,
  div,
  neg,
  abs,
  toNumber,
  toBigInt,
  toHex,
  toBytes,
  equals,
  compare,
  isNegative,
  isZero,
  Int256Error,
  MAX,
  MIN,
  ZERO,
  ONE,
  NEG_ONE
} from './from.js'
