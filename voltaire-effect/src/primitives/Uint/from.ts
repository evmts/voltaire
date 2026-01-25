import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Error type for Uint256 operations.
 * @since 0.0.1
 */
export type UintError = Error

/**
 * Creates a Uint256 from a bigint, number, or string.
 * 
 * @param value - Value to convert
 * @returns Effect containing the Uint256 or UintError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from './from.js'
 * 
 * const uint = await Effect.runPromise(from('1000000000000000000'))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.from(value),
    catch: (e) => e as UintError
  })

/**
 * Creates a Uint256 from a hex string.
 * 
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Effect containing the Uint256 or UintError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromHex } from './from.js'
 * 
 * const uint = await Effect.runPromise(fromHex('0xde0b6b3a7640000'))
 * ```
 * 
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.fromHex(hex),
    catch: (e) => e as UintError
  })

/**
 * Creates a Uint256 from raw bytes.
 * 
 * @param bytes - Uint8Array (up to 32 bytes)
 * @returns Effect containing the Uint256 or UintError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromBytes } from './from.js'
 * 
 * const uint = await Effect.runPromise(fromBytes(bytes))
 * ```
 * 
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.fromBytes(bytes),
    catch: (e) => e as UintError
  })

/**
 * Creates a Uint256 from a JavaScript number.
 * 
 * @param value - Number value (must be safe integer)
 * @returns Effect containing the Uint256 or UintError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromNumber } from './from.js'
 * 
 * const uint = await Effect.runPromise(fromNumber(1000))
 * ```
 * 
 * @since 0.0.1
 */
export const fromNumber = (value: number): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.fromNumber(value),
    catch: (e) => e as UintError
  })

/**
 * Creates a Uint256 from a bigint.
 * 
 * @param value - BigInt value (0 to 2^256-1)
 * @returns Effect containing the Uint256 or UintError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromBigInt } from './from.js'
 * 
 * const uint = await Effect.runPromise(fromBigInt(1000000000000000000n))
 * ```
 * 
 * @since 0.0.1
 */
export const fromBigInt = (value: bigint): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.fromBigInt(value),
    catch: (e) => e as UintError
  })
