/**
 * @fileoverview Uint32 module for 32-bit unsigned integers (0-4294967295).
 * 
 * Provides Effect-based constructors and arithmetic operations with
 * overflow/underflow checking for 32-bit unsigned integers.
 * 
 * @description
 * The Uint32 module provides:
 * - Effect-based constructors that safely handle errors
 * - Checked arithmetic operations (plus, minus, times)
 * - Schema validation for runtime type checking
 * - Conversion utilities (toNumber, toHex)
 * - Useful constants (MIN, MAX, ZERO, ONE)
 * 
 * Range: 0 to 4294967295 (2^32 - 1)
 * 
 * @example
 * ```typescript
 * import * as Uint32 from '@voltaire-effect/primitives/Uint32'
 * import * as Effect from 'effect/Effect'
 * 
 * // Create values
 * const value = await Effect.runPromise(Uint32.from(3000000000))
 * 
 * // Arithmetic with overflow checking
 * const sum = await Effect.runPromise(Uint32.plus(value, Uint32.ONE))
 * const diff = await Effect.runPromise(Uint32.minus(value, Uint32.ONE))
 * 
 * // Convert to primitives
 * const num = Uint32.toNumber(value) // 3000000000
 * const hex = Uint32.toHex(value)    // '0xb2d05e00'
 * 
 * // Use constants
 * console.log(Uint32.toNumber(Uint32.MAX)) // 4294967295
 * console.log(Uint32.toNumber(Uint32.MIN)) // 0
 * ```
 * 
 * @see {@link ../Uint8/index.ts | Uint8} for 8-bit unsigned integers
 * @see {@link ../Uint16/index.ts | Uint16} for 16-bit unsigned integers
 * @see {@link ../Uint64/index.ts | Uint64} for 64-bit unsigned integers
 * @see {@link ../Uint128/index.ts | Uint128} for 128-bit unsigned integers
 * @see {@link ../Uint/index.ts | Uint} for 256-bit unsigned integers
 * 
 * @module Uint32
 * @since 0.0.1
 */
export { Schema, type Uint32Type } from './Uint32Schema.js'
export { from, plus, minus, times, toNumber, toHex, equals, Uint32Error, MAX, MIN, ZERO, ONE } from './from.js'
