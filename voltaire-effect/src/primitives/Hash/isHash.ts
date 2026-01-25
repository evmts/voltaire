/**
 * @fileoverview Type guard for Hash values.
 *
 * @module Hash/isHash
 * @since 0.0.1
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'
import * as Effect from 'effect/Effect'

/**
 * Check if a value is a valid Hash.
 *
 * @description Type guard that checks if the value is a 32-byte Uint8Array.
 * This is a pure synchronous function that never fails.
 *
 * @param {unknown} value - Value to check
 * @returns {Effect.Effect<boolean>} Effect containing true if value is a Hash
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const isValid = Effect.runSync(Hash.isHash(someValue))
 * ```
 *
 * @since 0.0.1
 */
export const isHash = (value: unknown): Effect.Effect<boolean> =>
  Effect.sync(() => Hash.isHash(value))

/**
 * Type guard version that can be used directly (non-Effect).
 *
 * @param {unknown} value - Value to check
 * @returns {value is HashType} True if value is a Hash
 */
export const isHashSync = (value: unknown): value is HashType => Hash.isHash(value)
