/**
 * @fileoverview Effect-based address validation.
 * @module isValid
 * @since 0.0.1
 */

import { Address } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Checks if a value is a valid address.
 * 
 * @param value - Value to validate (string or Uint8Array)
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const valid = Effect.runSync(Address.isValid('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'))
 * ```
 * 
 * @since 0.0.1
 */
export const isValid = (value: string | Uint8Array): Effect.Effect<boolean> =>
  Effect.sync(() => Address.isValid(value))
