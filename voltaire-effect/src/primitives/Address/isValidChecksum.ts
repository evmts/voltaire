/**
 * @fileoverview Effect-based EIP-55 checksum validation.
 * @module isValidChecksum
 * @since 0.0.1
 */

import { Address } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Checks if a string has valid EIP-55 checksum.
 * 
 * @param value - Hex string to validate
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const valid = Effect.runSync(Address.isValidChecksum('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'))
 * // true - valid checksum
 * ```
 * 
 * @since 0.0.1
 */
export const isValidChecksum = (value: string): Effect.Effect<boolean> =>
  Effect.sync(() => Address.isValidChecksum(value))
