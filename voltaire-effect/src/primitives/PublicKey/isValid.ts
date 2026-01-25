/**
 * @fileoverview Effect-wrapped isValid for PublicKey.
 * @module isValid
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'

const HEX_REGEX = /^[0-9a-fA-F]+$/

/**
 * Checks if a value is a valid public key.
 * 
 * @param value - Value to validate (string or Uint8Array)
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const valid = Effect.runSync(PublicKey.isValid('0x...'))
 * ```
 * 
 * @since 0.0.1
 */
export const isValid = (value: string | Uint8Array): Effect.Effect<boolean> =>
  Effect.sync(() => {
    if (typeof value === 'string') {
      const hexStr = value.startsWith('0x') ? value.slice(2) : value
      return HEX_REGEX.test(hexStr) && hexStr.length === 128
    }
    return value.length === 64 || value.length === 33
  })
