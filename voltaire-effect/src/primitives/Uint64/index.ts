/**
 * @fileoverview Uint64 module for 64-bit unsigned integers (0 to 2^64-1).
 * 
 * Provides Effect-based constructors and arithmetic operations with
 * overflow/underflow checking for 64-bit unsigned integers.
 * 
 * @description
 * The Uint64 module provides:
 * - Effect-based constructors that safely handle errors
 * - Checked arithmetic operations (plus, minus, times)
 * - Schema validation for runtime type checking
 * - Conversion utilities (toBigInt, toNumber, toHex)
 * - Useful constants (MIN, MAX, ZERO, ONE)
 * 
 * Range: 0 to 18446744073709551615 (2^64 - 1)
 * 
 * Note: Values exceeding Number.MAX_SAFE_INTEGER (2^53-1) should use
 * toBigInt for lossless conversion.
 * 
 * @example
 * ```typescript
 * import * as Uint64 from '@voltaire-effect/primitives/Uint64'
 * import * as Effect from 'effect/Effect'
 * 
 * // Create values
 * const value = await Effect.runPromise(Uint64.from(10000000000000000000n))
 * 
 * // Arithmetic with overflow checking
 * const sum = await Effect.runPromise(Uint64.plus(value, Uint64.ONE))
 * const diff = await Effect.runPromise(Uint64.minus(value, Uint64.ONE))
 * 
 * // Convert to primitives
 * const bigint = Uint64.toBigInt(value) // 10000000000000000000n
 * const hex = Uint64.toHex(value)       // '0x8ac7230489e80000'
 * 
 * // Use constants
 * console.log(Uint64.toBigInt(Uint64.MAX)) // 18446744073709551615n
 * console.log(Uint64.toBigInt(Uint64.MIN)) // 0n
 * ```
 * 
 * @see {@link ../Uint8/index.ts | Uint8} for 8-bit unsigned integers
 * @see {@link ../Uint16/index.ts | Uint16} for 16-bit unsigned integers
 * @see {@link ../Uint32/index.ts | Uint32} for 32-bit unsigned integers
 * @see {@link ../Uint128/index.ts | Uint128} for 128-bit unsigned integers
 * @see {@link ../Uint/index.ts | Uint} for 256-bit unsigned integers
 * 
 * @module Uint64
 * @since 0.0.1
 */
export { Schema, type Uint64Type } from './Uint64Schema.js'
export { from, plus, minus, times, toBigInt, toNumber, toHex, equals, Uint64Error, MAX, MIN, ZERO, ONE } from './from.js'
