/**
 * Uint8 module for 8-bit unsigned integers (0-255).
 * 
 * Provides arithmetic operations with overflow/underflow checking.
 * 
 * @example
 * ```typescript
 * import * as Uint8 from './index.js'
 * import * as Effect from 'effect/Effect'
 * 
 * const value = await Effect.runPromise(Uint8.from(100))
 * const sum = await Effect.runPromise(Uint8.plus(value, Uint8.ONE))
 * ```
 * 
 * @module Uint8
 * @since 0.0.1
 */
export { Schema, type Uint8Type } from './Uint8Schema.js'
export { from, plus, minus, times, toNumber, toHex, equals, Uint8Error, MAX, MIN, ZERO, ONE } from './from.js'
