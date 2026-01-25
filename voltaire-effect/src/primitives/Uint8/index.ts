/**
 * @fileoverview Uint8 module for 8-bit unsigned integers (0-255).
 * 
 * Provides Effect-based constructors and arithmetic operations with
 * overflow/underflow checking for 8-bit unsigned integers.
 * 
 * @description
 * The Uint8 module provides:
 * - Effect-based constructors that safely handle errors
 * - Checked arithmetic operations (plus, minus, times)
 * - Schema validation for runtime type checking
 * - Conversion utilities (toNumber, toHex)
 * - Useful constants (MIN, MAX, ZERO, ONE)
 * 
 * Range: 0 to 255 (2^8 - 1)
 * 
 * @example
 * ```typescript
 * import * as Uint8 from '@voltaire-effect/primitives/Uint8'
 * import * as Effect from 'effect/Effect'
 * 
 * // Create values
 * const value = await Effect.runPromise(Uint8.from(100))
 * 
 * // Arithmetic with overflow checking
 * const sum = await Effect.runPromise(Uint8.plus(value, Uint8.ONE))
 * const diff = await Effect.runPromise(Uint8.minus(value, Uint8.ONE))
 * 
 * // Convert to primitives
 * const num = Uint8.toNumber(value) // 100
 * const hex = Uint8.toHex(value)    // '0x64'
 * 
 * // Use constants
 * console.log(Uint8.toNumber(Uint8.MAX)) // 255
 * console.log(Uint8.toNumber(Uint8.MIN)) // 0
 * ```
 * 
 * @see {@link ../Uint/index.ts | Uint} for 256-bit unsigned integers
 * @see {@link ../Uint16/index.ts | Uint16} for 16-bit unsigned integers
 * @see {@link ../Uint32/index.ts | Uint32} for 32-bit unsigned integers
 * @see {@link ../Uint64/index.ts | Uint64} for 64-bit unsigned integers
 * @see {@link ../Uint128/index.ts | Uint128} for 128-bit unsigned integers
 * 
 * @module Uint8
 * @since 0.0.1
 */
export { Schema, type Uint8Type } from './Uint8Schema.js'
export { from, plus, minus, times, toNumber, toHex, equals, Uint8Error, MAX, MIN, ZERO, ONE } from './from.js'
