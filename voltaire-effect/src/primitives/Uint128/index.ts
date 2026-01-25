/**
 * @fileoverview Uint128 module for 128-bit unsigned integers (0 to 2^128-1).
 * 
 * Provides Effect-based constructors and arithmetic operations with
 * overflow/underflow checking for 128-bit unsigned integers.
 * 
 * @description
 * The Uint128 module provides:
 * - Effect-based constructors that safely handle errors
 * - Checked arithmetic operations (plus, minus, times)
 * - Schema validation for runtime type checking
 * - Conversion utilities (toBigInt, toNumber, toHex)
 * - Useful constants (MIN, MAX, ZERO, ONE)
 * 
 * Range: 0 to 340282366920938463463374607431768211455 (2^128 - 1)
 * 
 * Note: Uint128 values always exceed Number.MAX_SAFE_INTEGER. Use toBigInt
 * for lossless conversion.
 * 
 * @example
 * ```typescript
 * import * as Uint128 from '@voltaire-effect/primitives/Uint128'
 * import * as Effect from 'effect/Effect'
 * 
 * // Create values
 * const value = await Effect.runPromise(Uint128.from(2n ** 100n))
 * 
 * // Arithmetic with overflow checking
 * const sum = await Effect.runPromise(Uint128.plus(value, Uint128.ONE))
 * const diff = await Effect.runPromise(Uint128.minus(value, Uint128.ONE))
 * 
 * // Convert to primitives (use toBigInt for large values)
 * const bigint = Uint128.toBigInt(value)
 * const hex = Uint128.toHex(value)
 * 
 * // Use constants
 * console.log(Uint128.toBigInt(Uint128.MAX)) // 340282366920938463463374607431768211455n
 * console.log(Uint128.toBigInt(Uint128.MIN)) // 0n
 * ```
 * 
 * @see {@link ../Uint8/index.ts | Uint8} for 8-bit unsigned integers
 * @see {@link ../Uint16/index.ts | Uint16} for 16-bit unsigned integers
 * @see {@link ../Uint32/index.ts | Uint32} for 32-bit unsigned integers
 * @see {@link ../Uint64/index.ts | Uint64} for 64-bit unsigned integers
 * @see {@link ../Uint/index.ts | Uint} for 256-bit unsigned integers
 * 
 * @module Uint128
 * @since 0.0.1
 */
export { Schema, type Uint128Type } from './Uint128Schema.js'
export { from, plus, minus, times, toBigInt, toNumber, toHex, equals, Uint128Error, MAX, MIN, ZERO, ONE } from './from.js'
