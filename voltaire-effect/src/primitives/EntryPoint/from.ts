/**
 * @fileoverview EntryPoint functions for ERC-4337 account abstraction.
 * 
 * This module provides Effect-based functions for creating and working with
 * EntryPoint addresses.
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337#entrypoint-definition
 * @module EntryPoint/from
 * @since 0.0.1
 */
import { Address } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { EntryPointType } from './EntryPointSchema.js'

/**
 * Error thrown when EntryPoint operations fail.
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as EntryPoint from 'voltaire-effect/primitives/EntryPoint'
 * 
 * Effect.runSync(
 *   Effect.catchTag(EntryPoint.from('invalid'), 'EntryPointError', (e) => {
 *     console.error('Invalid EntryPoint:', e.message)
 *   })
 * )
 * ```
 * 
 * @since 0.0.1
 */
export class EntryPointError extends Error {
  readonly _tag = 'EntryPointError'
  constructor(message: string) {
    super(message)
    this.name = 'EntryPointError'
  }
}

/**
 * Creates an EntryPoint from address string or bytes.
 *
 * @description
 * Accepts a hex string or 20-byte Uint8Array and returns a branded
 * EntryPointType. Validates that the input is a valid 20-byte address.
 *
 * @param value - Address as hex string or 20-byte Uint8Array
 * @returns Effect yielding EntryPointType or failing with EntryPointError
 * 
 * @example
 * ```typescript
 * import * as EntryPoint from 'voltaire-effect/primitives/EntryPoint'
 * import * as Effect from 'effect/Effect'
 *
 * // Using v0.7 EntryPoint constant
 * const entryPoint = Effect.runSync(EntryPoint.from(EntryPoint.ENTRYPOINT_V07))
 * 
 * // Using v0.6 EntryPoint
 * const v06 = Effect.runSync(EntryPoint.from(EntryPoint.ENTRYPOINT_V06))
 * ```
 * 
 * @throws EntryPointError - When address is invalid or not 20 bytes
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<EntryPointType, EntryPointError> =>
  Effect.try({
    try: () => {
      if (typeof value === 'string') {
        return Address(value) as unknown as EntryPointType
      }
      if (value.length !== 20) {
        throw new Error('EntryPoint must be exactly 20 bytes')
      }
      return value as unknown as EntryPointType
    },
    catch: (e) => new EntryPointError((e as Error).message)
  })

/**
 * Converts an EntryPoint to hex string.
 *
 * @param entryPoint - The entry point address
 * @returns Effect yielding checksummed hex string (0x-prefixed)
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as EntryPoint from 'voltaire-effect/primitives/EntryPoint'
 * 
 * const hex = Effect.runSync(
 *   Effect.flatMap(EntryPoint.from(EntryPoint.V07), EntryPoint.toHex)
 * )
 * // '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (entryPoint: EntryPointType): Effect.Effect<string, never> =>
  Effect.succeed(Address.toHex(entryPoint as any))

/**
 * Compares two EntryPoints for equality.
 *
 * @description
 * Performs byte-by-byte comparison of the two EntryPoint addresses.
 *
 * @param a - First entry point
 * @param b - Second entry point
 * @returns Effect yielding true if addresses are identical
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as EntryPoint from 'voltaire-effect/primitives/EntryPoint'
 * 
 * const areEqual = Effect.runSync(Effect.gen(function* () {
 *   const ep1 = yield* EntryPoint.from(EntryPoint.V07)
 *   const ep2 = yield* EntryPoint.from(EntryPoint.V07)
 *   return yield* EntryPoint.equals(ep1, ep2)
 * }))
 * // true
 * ```
 * 
 * @since 0.0.1
 */
export const equals = (a: EntryPointType, b: EntryPointType): Effect.Effect<boolean, never> => {
  if (a.length !== b.length) return Effect.succeed(false)
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}

/**
 * ERC-4337 EntryPoint v0.6 address.
 * @since 0.0.1
 */
export const ENTRYPOINT_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'

/**
 * ERC-4337 EntryPoint v0.7 address.
 * @since 0.0.1
 */
export const ENTRYPOINT_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
