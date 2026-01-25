/**
 * @fileoverview Uint16 module for 16-bit unsigned integers (0-65535).
 * 
 * Provides Effect-based constructors and arithmetic operations with
 * overflow/underflow checking for 16-bit unsigned integers.
 * 
 * @description
 * The Uint16 module provides:
 * - Effect-based constructors that safely handle errors
 * - Checked arithmetic operations (plus, minus, times)
 * - Schema validation for runtime type checking
 * - Conversion utilities (toNumber, toHex)
 * - Useful constants (MIN, MAX, ZERO, ONE)
 * 
 * Range: 0 to 65535 (2^16 - 1)
 * 
 * @example
 * ```typescript
 * import * as Uint16 from '@voltaire-effect/primitives/Uint16'
 * import * as Effect from 'effect/Effect'
 * 
 * // Create values
 * const value = await Effect.runPromise(Uint16.from(50000))
 * 
 * // Arithmetic with overflow checking
 * const sum = await Effect.runPromise(Uint16.plus(value, Uint16.ONE))
 * const diff = await Effect.runPromise(Uint16.minus(value, Uint16.ONE))
 * 
 * // Convert to primitives
 * const num = Uint16.toNumber(value) // 50000
 * const hex = Uint16.toHex(value)    // '0xc350'
 * 
 * // Use constants
 * console.log(Uint16.toNumber(Uint16.MAX)) // 65535
 * console.log(Uint16.toNumber(Uint16.MIN)) // 0
 * ```
 * 
 * @see {@link ../Uint8/index.ts | Uint8} for 8-bit unsigned integers
 * @see {@link ../Uint32/index.ts | Uint32} for 32-bit unsigned integers
 * @see {@link ../Uint64/index.ts | Uint64} for 64-bit unsigned integers
 * @see {@link ../Uint128/index.ts | Uint128} for 128-bit unsigned integers
 * @see {@link ../Uint/index.ts | Uint} for 256-bit unsigned integers
 * 
 * @module Uint16
 * @since 0.0.1
 */
export { Schema, type Uint16Type } from './Uint16Schema.js'
export { from, plus, minus, times, toNumber, toHex, equals, Uint16Error, MAX, MIN, ZERO, ONE } from './from.js'
