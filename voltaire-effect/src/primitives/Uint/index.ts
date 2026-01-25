/**
 * Uint module for 256-bit unsigned integers (Uint256).
 * 
 * Uint256 is the primary integer type in Ethereum, supporting values from 0 to 2^256-1.
 * 
 * @example
 * ```typescript
 * import * as Uint from './index.js'
 * import * as Effect from 'effect/Effect'
 * 
 * const value = await Effect.runPromise(Uint.from(1000n))
 * const hex = await Effect.runPromise(Uint.fromHex('0x3e8'))
 * ```
 * 
 * @module Uint
 * @since 0.0.1
 */
export { UintSchema, UintFromHexSchema, UintFromBytesSchema } from './UintSchema.js'
export { from, fromHex, fromBytes, fromNumber, fromBigInt, type UintError } from './from.js'
